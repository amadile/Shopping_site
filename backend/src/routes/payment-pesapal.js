import express from 'express';
import { registerOrder, getTransactionStatus } from '../config/pesapal.js';
import Order from '../models/Order.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/payment/pesapal/submit-order
// @desc    Submit order to Pesapal
// @access  Private
router.post('/submit-order', authenticateJWT, async (req, res) => {
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

        // Base URL for callbacks
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const orderData = {
            id: order._id.toString(),
            currency: 'UGX', // Pesapal works best with local currency
            amount: order.total,
            description: `Payment for Order #${order._id.toString().slice(-6).toUpperCase()}`,
            callback_url: `${frontendUrl}/orders/${orderId}/payment-status`, // Redirect user here after payment
            ipn_url: `${baseUrl}/api/payment/pesapal/ipn`, // Server-to-server notification
            email: req.user.email,
            phone_number: order.shippingAddress.phone || '',
            first_name: req.user.name.split(' ')[0],
            last_name: req.user.name.split(' ').slice(1).join(' ') || 'User',
            address: order.shippingAddress.addressLine1 || order.shippingAddress.zone,
            city: order.shippingAddress.city || order.shippingAddress.district,
            state: order.shippingAddress.district
        };

        const response = await registerOrder(orderData);

        if (response && response.redirect_url) {
            res.json({
                redirect_url: response.redirect_url,
                order_tracking_id: response.order_tracking_id,
                merchant_reference: response.merchant_reference
            });
        } else {
            throw new Error('Invalid response from Pesapal');
        }

    } catch (error) {
        console.error('Pesapal submit error:', error);
        res.status(500).json({ message: 'Payment initialization failed', error: error.message });
    }
});

// @route   GET /api/payment/pesapal/ipn
// @desc    Handle Pesapal IPN (Instant Payment Notification)
// @access  Public
router.get('/ipn', async (req, res) => {
    try {
        const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.query;

        console.log('Pesapal IPN received:', req.query);

        if (!OrderTrackingId || !OrderMerchantReference) {
            return res.status(400).send('Invalid parameters');
        }

        // Verify status with Pesapal
        const statusData = await getTransactionStatus(OrderTrackingId);

        // statusData.payment_status_description: 'COMPLETED', 'FAILED', 'INVALID', etc.
        // statusData.status_code: 1 (Completed), 0 (Invalid), 2 (Failed), 3 (Reversed)

        if (statusData.status_code === 1) { // Completed
            const order = await Order.findById(OrderMerchantReference);
            if (order) {
                order.status = 'paid';
                order.paymentMethod = 'pesapal';
                order.paymentIntentId = OrderTrackingId;
                await order.save();
                console.log(`Order ${order._id} marked as paid via Pesapal IPN`);
            }
        }

        // Respond to Pesapal to acknowledge receipt
        // Format: Same as request but with status=200
        const response = {
            OrderTrackingId,
            OrderMerchantReference,
            OrderNotificationType,
            OrderPaymentStatus: statusData.payment_status_description
        };

        res.json(response);

    } catch (error) {
        console.error('Pesapal IPN error:', error);
        res.status(500).send('IPN processing failed');
    }
});

// @route   GET /api/payment/pesapal/status/:orderId
// @desc    Check payment status manually (frontend polling)
// @access  Private
router.get('/status/:orderId', authenticateJWT, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If we have a tracking ID, check with Pesapal
        if (order.paymentIntentId && order.status !== 'paid') {
            const statusData = await getTransactionStatus(order.paymentIntentId);

            if (statusData.status_code === 1) {
                order.status = 'paid';
                await order.save();
            }

            return res.json({
                status: order.status,
                pesapal_status: statusData.payment_status_description
            });
        }

        res.json({ status: order.status });
    } catch (error) {
        console.error('Check status error:', error);
        res.status(500).json({ message: 'Failed to check status' });
    }
});

export default router;
