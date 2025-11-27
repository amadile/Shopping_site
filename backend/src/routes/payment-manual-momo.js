import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateJWT } from '../middleware/auth.js';
import Order from '../models/Order.js';

const router = express.Router();

// @route   POST /api/payment/manual-momo/submit
// @desc    Submit manual mobile money payment
// @access  Private
router.post(
    '/submit',
    authenticateJWT,
    [
        body('orderId').notEmpty().withMessage('Order ID is required'),
        body('transactionId').notEmpty().withMessage('Transaction ID is required'),
        body('phoneNumber').matches(/^\+256\d{9}$/).withMessage('Invalid Uganda phone number'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { orderId, transactionId, phoneNumber } = req.body;

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            if (order.user.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            if (order.status === 'paid') {
                return res.status(400).json({ message: 'Order is already paid' });
            }

            // Update order with manual payment details
            order.manualTransactionId = transactionId;
            order.mobileMoneyNumber = phoneNumber;
            order.paymentMethod = 'manual_momo';
            order.status = 'pending'; // Stays pending until admin verifies
            await order.save();

            res.json({
                success: true,
                message: 'Payment details submitted. Your order will be confirmed once payment is verified.',
                order: {
                    _id: order._id,
                    status: order.status,
                    transactionId: order.manualTransactionId
                }
            });
        } catch (error) {
            console.error('Manual payment submission error:', error);
            res.status(500).json({ message: 'Failed to submit payment', error: error.message });
        }
    }
);

// @route   POST /api/payment/manual-momo/verify/:orderId
// @desc    Admin verifies manual payment
// @access  Private (Admin only)
router.post('/verify/:orderId', authenticateJWT, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.role || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.paymentMethod !== 'manual_momo') {
            return res.status(400).json({ message: 'This is not a manual mobile money order' });
        }

        // Mark as paid
        order.status = 'paid';
        await order.save();

        res.json({
            success: true,
            message: 'Payment verified and order confirmed',
            order
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: 'Failed to verify payment', error: error.message });
    }
});

// @route   GET /api/payment/manual-momo/pending
// @desc    Get all pending manual payments (Admin only)
// @access  Private (Admin only)
router.get('/pending', authenticateJWT, async (req, res) => {
    try {
        if (!req.user.role || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const pendingOrders = await Order.find({
            paymentMethod: 'manual_momo',
            status: 'pending',
            manualTransactionId: { $exists: true, $ne: null }
        })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json(pendingOrders);
    } catch (error) {
        console.error('Fetch pending payments error:', error);
        res.status(500).json({ message: 'Failed to fetch pending payments', error: error.message });
    }
});

export default router;
