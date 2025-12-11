import express from 'express';
import { param, validationResult } from 'express-validator';
import { authenticateJWT } from '../middleware/auth.js';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { logger } from '../config/logger.js';

const router = express.Router();

// Get user's wishlist
router.get('/', authenticateJWT, async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate({
                path: 'products.product',
                select: 'name price images category stock isActive',
                populate: {
                    path: 'vendor',
                    select: 'businessName'
                }
            })
            .lean();

        if (!wishlist) {
            // Create empty wishlist if doesn't exist
            wishlist = await Wishlist.create({ user: req.user._id, products: [] });
        }

        // Filter out inactive products
        wishlist.products = wishlist.products.filter(item => item.product && item.product.isActive);

        res.json(wishlist);
    } catch (err) {
        logger.error('Get wishlist error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add product to wishlist
router.post(
    '/add/:productId',
    authenticateJWT,
    [param('productId').isMongoId()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { productId } = req.params;

            // Check if product exists and is active
            const product = await Product.findById(productId);
            if (!product || !product.isActive) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Find or create wishlist
            let wishlist = await Wishlist.findOne({ user: req.user._id });

            if (!wishlist) {
                wishlist = new Wishlist({ user: req.user._id, products: [] });
            }

            // Check if product already in wishlist
            const existingIndex = wishlist.products.findIndex(
                item => item.product.toString() === productId
            );

            if (existingIndex !== -1) {
                return res.status(400).json({ error: 'Product already in wishlist' });
            }

            // Add product to wishlist
            wishlist.products.push({ product: productId });
            await wishlist.save();

            // Populate and return
            await wishlist.populate({
                path: 'products.product',
                select: 'name price images category stock',
                populate: {
                    path: 'vendor',
                    select: 'businessName'
                }
            });

            logger.info('Product added to wishlist', { userId: req.user._id, productId });
            res.json({ message: 'Product added to wishlist', wishlist });
        } catch (err) {
            logger.error('Add to wishlist error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Remove product from wishlist
router.delete(
    '/remove/:productId',
    authenticateJWT,
    [param('productId').isMongoId()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { productId } = req.params;

            const wishlist = await Wishlist.findOne({ user: req.user._id });

            if (!wishlist) {
                return res.status(404).json({ error: 'Wishlist not found' });
            }

            // Remove product from wishlist
            wishlist.products = wishlist.products.filter(
                item => item.product.toString() !== productId
            );

            await wishlist.save();

            logger.info('Product removed from wishlist', { userId: req.user._id, productId });
            res.json({ message: 'Product removed from wishlist', wishlist });
        } catch (err) {
            logger.error('Remove from wishlist error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Clear entire wishlist
router.delete('/clear', authenticateJWT, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        wishlist.products = [];
        await wishlist.save();

        logger.info('Wishlist cleared', { userId: req.user._id });
        res.json({ message: 'Wishlist cleared', wishlist });
    } catch (err) {
        logger.error('Clear wishlist error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Check if product is in wishlist
router.get(
    '/check/:productId',
    authenticateJWT,
    [param('productId').isMongoId()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { productId } = req.params;

            const wishlist = await Wishlist.findOne({ user: req.user._id });

            if (!wishlist) {
                return res.json({ inWishlist: false });
            }

            const inWishlist = wishlist.products.some(
                item => item.product.toString() === productId
            );

            res.json({ inWishlist });
        } catch (err) {
            logger.error('Check wishlist error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Move product from wishlist to cart
router.post(
    '/move-to-cart/:productId',
    authenticateJWT,
    [param('productId').isMongoId()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { productId } = req.params;

            // Check if product exists and is active
            const product = await Product.findById(productId);
            if (!product || !product.isActive) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Check stock
            if (product.stock < 1) {
                return res.status(400).json({ error: 'Product is out of stock' });
            }

            const wishlist = await Wishlist.findOne({ user: req.user._id });

            if (!wishlist) {
                return res.status(404).json({ error: 'Wishlist not found' });
            }

            // Check if product is in wishlist
            const productIndex = wishlist.products.findIndex(
                item => item.product.toString() === productId
            );

            if (productIndex === -1) {
                return res.status(404).json({ error: 'Product not in wishlist' });
            }

            // Remove from wishlist
            wishlist.products.splice(productIndex, 1);
            await wishlist.save();

            logger.info('Product moved from wishlist to cart', { userId: req.user._id, productId });

            // Return product details for adding to cart (frontend will handle cart addition)
            res.json({
                message: 'Product removed from wishlist. Add to cart on frontend.',
                product: {
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    images: product.images,
                    stock: product.stock
                }
            });
        } catch (err) {
            logger.error('Move to cart error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

export default router;
