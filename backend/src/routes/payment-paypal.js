import express from 'express';
import { client, paypal } from '../config/paypal.js';
import Order from '../models/Order.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/payment/paypal/create-order
// @desc    Create PayPal order
// @access  Private
router.post('/create-order', authenticateJWT, async (req, res) => {
    try {
        const { orderId } = req.body;

        // Verify order exists and belongs to user
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: orderId,
                amount: {
                    currency_code: 'USD', // PayPal works best with USD, might need conversion if base is UGX
                    value: (order.total / 3700).toFixed(2) // Approximate conversion if UGX, ideally use real rate
                }
            }]
        });

        const response = await client.execute(request);
        res.json({ id: response.result.id });
    } catch (error) {
        console.error('PayPal create order error:', error);
        res.status(500).json({ message: 'PayPal order creation failed', error: error.message });
    }
});

// @route   POST /api/payment/paypal/capture-order
// @desc    Capture PayPal payment
// @access  Private
router.post('/capture-order', authenticateJWT, async (req, res) => {
    try {
        const { orderID, dbOrderId } = req.body;

        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});

        const response = await client.execute(request);

        if (response.result.status === 'COMPLETED') {
            // Update order status
            const order = await Order.findById(dbOrderId);
            if (order) {
                order.status = 'paid';
                order.paymentMethod = 'paypal';
                order.paymentIntentId = response.result.id;
                await order.save();

                return res.json({
                    success: true,
                    message: 'Payment captured successfully',
                    order
                });
            }
        }

        res.status(400).json({
            success: false,
            message: 'Payment capture failed or not completed'
        });
    } catch (error) {
        console.error('PayPal capture error:', error);
        res.status(500).json({ message: 'Payment capture failed', error: error.message });
    }
});

export default router;
