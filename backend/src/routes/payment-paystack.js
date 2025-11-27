import express from 'express';
import { initializePayment, verifyPayment } from '../config/paystack.js';
import Order from '../models/Order.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/payment/paystack/initialize
// @desc    Initialize Paystack transaction
// @access  Private
router.post('/initialize', protect, async (req, res) => {
    try {
        const { orderId, email, amount } = req.body;

        // Verify order exists and belongs to user
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Callback URL for frontend to handle redirect
        const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/paystack/callback`;

        const paymentData = await initializePayment(
            email || req.user.email,
            amount || order.total,
            callbackUrl,
            {
                order_id: orderId,
                user_id: req.user._id
            }
        );

        res.json(paymentData);
    } catch (error) {
        console.error('Paystack init error:', error);
        res.status(500).json({ message: 'Payment initialization failed', error: error.message });
    }
});

// @route   GET /api/payment/paystack/verify/:reference
// @desc    Verify Paystack transaction
// @access  Private
router.get('/verify/:reference', protect, async (req, res) => {
    try {
        const { reference } = req.params;

        const verification = await verifyPayment(reference);

        if (verification.status && verification.data.status === 'success') {
            const { order_id } = verification.data.metadata;

            // Update order status
            const order = await Order.findById(order_id);
            if (order) {
                order.status = 'paid';
                order.paymentMethod = 'paystack';
                order.paymentIntentId = reference;
                await order.save();

                return res.json({
                    success: true,
                    message: 'Payment verified successfully',
                    order
                });
            }
        }

        res.status(400).json({
            success: false,
            message: 'Payment verification failed or invalid'
        });
    } catch (error) {
        console.error('Paystack verify error:', error);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
});

export default router;
