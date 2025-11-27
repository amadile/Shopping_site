import express from "express";
import { body, param, validationResult } from "express-validator";
import { authenticateJWT } from "../middleware/auth.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import reviewModerationService from "../services/reviewModerationService.js";

const router = express.Router();

// Get user's own reviews (must come before /:productId to avoid conflicts)
router.get("/user/me", authenticateJWT, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate("product", "name images")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get reviews for a product - specific path (must come before /:productId)
router.get(
  "/product/:productId",
  param("productId").isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const reviews = await Review.find({
        product: req.params.productId,
        moderationStatus: "approved", // Only show approved reviews
      }).populate("user", "name");
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Admin routes (must come before /:productId)
// Admin: Get moderation queue
router.get("/admin/moderation-queue", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { status = "pending", page = 1, limit = 20 } = req.query;
    const result = await reviewModerationService.getModerationQueue(
      status,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Get moderation statistics
router.get("/admin/moderation-stats", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { startDate, endDate } = req.query;
    const stats = await reviewModerationService.getModerationStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Approve review
router.post(
  "/admin/:id/approve",
  authenticateJWT,
  param("id").isMongoId(),
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const review = await reviewModerationService.approveReview(
        req.params.id,
        req.user._id,
        req.body.reason
      );

      // Update product rating
      const product = await Product.findById(review.product);
      const approvedReviews = await Review.find({
        product: review.product,
        moderationStatus: "approved",
      });
      if (approvedReviews.length > 0) {
        const avgRating =
          approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
          approvedReviews.length;
        product.rating = avgRating;
        product.reviewCount = approvedReviews.length;
        await product.save();
      }

      res.json(review);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Admin: Reject review
router.post(
  "/admin/:id/reject",
  authenticateJWT,
  param("id").isMongoId(),
  body("reason").notEmpty().withMessage("Rejection reason is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const review = await reviewModerationService.rejectReview(
        req.params.id,
        req.user._id,
        req.body.reason
      );

      res.json(review);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Admin: Flag review
router.post(
  "/admin/:id/flag",
  authenticateJWT,
  param("id").isMongoId(),
  body("reason").notEmpty().withMessage("Flag reason is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const review = await reviewModerationService.flagReview(
        req.params.id,
        req.user._id,
        req.body.reason
      );

      res.json(review);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Add a review
router.post(
  "/",
  authenticateJWT,
  body("productId").isMongoId().withMessage("Invalid product ID"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").isString().trim().isLength({ max: 1000 }).optional().withMessage("Comment too long"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(", ");
      return res.status(400).json({ error: errorMessages });
    }
    const { productId, rating, comment } = req.body;
    try {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: "Product not found" });
      // Prevent duplicate review by same user
      const existing = await Review.findOne({
        product: productId,
        user: req.user._id,
      });
      if (existing)
        return res
          .status(400)
          .json({ error: "You have already reviewed this product" });
      const review = new Review({
        product: productId,
        user: req.user._id,
        rating,
        comment,
      });
      await review.save();

      // Auto-moderate the review
      const moderation = await reviewModerationService.autoModerate(review);

      // Update product rating and review count (only for approved reviews)
      const approvedReviews = await Review.find({
        product: productId,
        moderationStatus: "approved",
      });
      if (approvedReviews.length > 0) {
        const avgRating =
          approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
          approvedReviews.length;
        product.rating = avgRating;
        product.reviewCount = approvedReviews.length;
        await product.save();
      }

      res.status(201).json({ review, moderation });
    } catch (err) {
      console.error("Review submission error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get reviews for a product (only approved) - generic route (must come last)
router.get("/:productId", param("productId").isMongoId(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const reviews = await Review.find({
      product: req.params.productId,
      moderationStatus: "approved", // Only show approved reviews
    }).populate("user", "name");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a review (user or admin)
router.delete(
  "/:id",
  authenticateJWT,
  param("id").isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const review = await Review.findById(req.params.id);
      if (!review) return res.status(404).json({ error: "Review not found" });
      if (
        review.user.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }
      await review.deleteOne();
      // Update product rating and review count (only approved reviews)
      const product = await Product.findById(review.product);
      const approvedReviews = await Review.find({
        product: review.product,
        moderationStatus: "approved",
      });
      if (approvedReviews.length > 0) {
        const avgRating =
          approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
          approvedReviews.length;
        product.rating = avgRating;
        product.reviewCount = approvedReviews.length;
      } else {
        product.rating = 0;
        product.reviewCount = 0;
      }
      await product.save();
      res.json({ message: "Review deleted" });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
