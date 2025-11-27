import express from "express";
import { body, param, validationResult } from "express-validator";
import { authenticateJWT } from "../middleware/auth.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const router = express.Router();

// Helper function to calculate subtotal and tax
const calculateCartTotals = (cart) => {
  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variantDetails?.price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  // Calculate discount if coupon applied
  const discount = cart.appliedCoupon?.discountAmount || 0;
  const discountedSubtotal = subtotal - discount;

  const taxRate = 0.1; // 10% tax
  const tax = discountedSubtotal * taxRate;
  const total = discountedSubtotal + tax;

  return { subtotal, discount, tax, total };
};

// Get current user's cart
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.json({ items: [], subtotal: 0, tax: 0, total: 0 });
    }

    const totals = calculateCartTotals(cart);
    res.json({
      ...cart.toObject(),
      ...totals,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Add item to cart
router.post(
  "/add",
  authenticateJWT,
  body("productId").isMongoId().withMessage("Invalid product ID format"),
  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("variantId")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid variant ID format"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors
        .array()
        .map((err) => err.msg)
        .join(", ");
      return res.status(400).json({ error: errorMessages });
    }
    const { productId, quantity = 1, variantId } = req.body;
    try {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: "Product not found" });

      // Validate variant if provided
      let variantDetails = undefined; // Use undefined instead of null to avoid Mongoose cast error
      if (variantId) {
        const variant = product.variants.id(variantId);
        if (!variant)
          return res.status(404).json({ error: "Variant not found" });
        if (!variant.isActive)
          return res.status(400).json({ error: "Variant is not active" });
        if (variant.stock < quantity)
          return res.status(400).json({ error: "Insufficient variant stock" });

        // Store variant details
        variantDetails = {
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          material: variant.material,
          style: variant.style,
          price: variant.price || product.price,
        };
      } else if (product.hasVariants) {
        return res
          .status(400)
          .json({ error: "Please select a variant for this product" });
      }

      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
      }

      // Check if same product + variant combo exists
      const itemIndex = cart.items.findIndex(
        (item) =>
          item.product.equals(productId) &&
          (!variantId || (item.variantId && item.variantId.equals(variantId)))
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({
          product: productId,
          quantity,
          variantId,
          variantDetails,
        });
      }
      await cart.save();
      await cart.populate("items.product");

      const totals = calculateCartTotals(cart);
      res.status(200).json({
        ...cart.toObject(),
        ...totals,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update item quantity
router.put(
  "/update",
  authenticateJWT,
  body("productId").isMongoId().withMessage("Invalid product ID format"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("variantId")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid variant ID format"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors
        .array()
        .map((err) => err.msg)
        .join(", ");
      return res.status(400).json({ error: errorMessages });
    }
    const { productId, quantity, variantId } = req.body;
    try {
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) return res.status(404).json({ error: "Cart not found" });

      const item = cart.items.find(
        (item) =>
          item.product.equals(productId) &&
          (!variantId || (item.variantId && item.variantId.equals(variantId)))
      );
      if (!item) return res.status(404).json({ error: "Product not in cart" });

      // Validate stock
      const product = await Product.findById(productId);
      if (variantId) {
        const variant = product.variants.id(variantId);
        if (variant.stock < quantity) {
          return res.status(400).json({ error: "Insufficient variant stock" });
        }
      }

      item.quantity = quantity;
      await cart.save();
      await cart.populate("items.product"); // Ensure product is populated in response

      const totals = calculateCartTotals(cart);
      res.status(200).json({
        ...cart.toObject(),
        ...totals,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Remove item from cart
router.delete(
  "/remove/:productId",
  authenticateJWT,
  param("productId").isMongoId().withMessage("Invalid product ID format"),
  body("variantId")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid variant ID format"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors
        .array()
        .map((err) => err.msg)
        .join(", ");
      console.error("Cart remove validation error:", {
        productId: req.params.productId,
        variantId: req.body.variantId,
        errors: errors.array(),
      });
      return res.status(400).json({ error: errorMessages });
    }
    const { productId } = req.params;
    const { variantId } = req.body;
    try {
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) return res.status(404).json({ error: "Cart not found" });

      const initialLength = cart.items.length;
      cart.items = cart.items.filter(
        (item) =>
          !(
            item.product.equals(productId) &&
            (!variantId || (item.variantId && item.variantId.equals(variantId)))
          )
      );

      if (cart.items.length === initialLength) {
        console.warn(
          "No cart item was removed. Product may not exist in cart.",
          { productId, variantId }
        );
      }

      await cart.save();
      await cart.populate("items.product"); // Ensure product is populated in response

      const totals = calculateCartTotals(cart);
      res.status(200).json({
        ...cart.toObject(),
        ...totals,
      });
    } catch (err) {
      console.error("Cart remove error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Clear cart
router.delete("/clear", authenticateJWT, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    cart.items = [];
    cart.appliedCoupon = undefined;
    await cart.save();

    res.status(200).json({
      ...cart.toObject(),
      subtotal: 0,
      tax: 0,
      total: 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Apply coupon to cart
router.post(
  "/apply-coupon",
  authenticateJWT,
  body("code").notEmpty().trim().toUpperCase(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { code } = req.body;
      const cart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product"
      );

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Import Coupon model dynamically to avoid circular dependency
      const Coupon = (await import("../models/Coupon.js")).default;
      const coupon = await Coupon.findOne({ code });

      if (!coupon) {
        return res.status(404).json({ error: "Invalid coupon code" });
      }

      // Validate coupon
      const validCheck = coupon.isValid();
      if (!validCheck.valid) {
        return res.status(400).json({ error: validCheck.reason });
      }

      const userCheck = coupon.canUserUse(req.user._id);
      if (!userCheck.valid) {
        return res.status(400).json({ error: userCheck.reason });
      }

      // Calculate cart subtotal
      const subtotal = cart.items.reduce((sum, item) => {
        const price = item.variantDetails?.price || item.product.price;
        return sum + price * item.quantity;
      }, 0);

      // Calculate discount
      const discountInfo = coupon.calculateDiscount(subtotal);
      if (!discountInfo.valid) {
        return res.status(400).json({ error: discountInfo.reason });
      }

      // Apply coupon to cart
      cart.appliedCoupon = {
        couponId: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discountInfo.discount,
      };

      await cart.save();

      res.json({
        message: "Coupon applied successfully",
        cart,
        subtotal,
        discount: discountInfo.discount,
        total: discountInfo.finalTotal,
      });
    } catch (err) {
      console.error("Apply coupon error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Remove coupon from cart
router.delete("/remove-coupon", authenticateJWT, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.appliedCoupon = undefined;
    await cart.save();
    await cart.populate("items.product"); // Ensure product is populated in response

    res.json({ message: "Coupon removed successfully", cart });
  } catch (err) {
    console.error("Remove coupon error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
