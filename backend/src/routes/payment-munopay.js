import express from 'express';
import { munoPayService } from '../services/munopay.js';
import { logger } from '../config/logger.js';
import Order from '../models/Order.js';

const router = express.Router();

/**
 * Initiate MunoPay Payment
 * POST /api/payment/munopay/initiate
 */
router.post('/initiate', async (req, res) => {
    try {
        const { orderId, phoneNumber } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const paymentResponse = await munoPayService.initiatePayment({
            phoneNumber,
            amount: order.totalAmount || order.total,
            reference: order._id.toString(),
            description: `Payment for Order #${order.orderNumber || order._id}`
        });

        // Update order with payment reference if available
        if (paymentResponse.transaction_id) {
            order.paymentResult = {
                id: paymentResponse.transaction_id,
                status: 'pending',
                provider: 'munopay'
            };
            await order.save();
        }

        res.json({
            success: true,
            message: 'Payment initiated. Please check your phone.',
            data: paymentResponse
        });
    } catch (error) {
        logger.error('MunoPay initiation route error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to initiate payment'
        });
    }
});

/**
 * MunoPay Webhook
 * POST /api/payment/munopay/webhook
 */
router.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;
        const signature = req.headers['x-munopay-signature']; // Verify header name in docs

        logger.info('Received MunoPay webhook:', payload);

        // Verify signature (optional but recommended)
        // if (!munoPayService.verifyWebhook(payload, signature)) {
        //   return res.status(400).json({ message: 'Invalid signature' });
        // }

        const { external_reference, status, transaction_id } = payload;

        if (status === 'successful' || status === 'completed') {
            const order = await Order.findById(external_reference);
            if (order) {
                order.isPaid = true;
                order.paidAt = Date.now();
                order.paymentResult = {
                    id: transaction_id,
                    status: 'completed',
                    provider: 'munopay',
                    update_time: new Date().toISOString()
                };
                order.status = 'processing'; // Move to processing
                await order.save();

                logger.info(`Order ${order._id} marked as paid via MunoPay`);
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('MunoPay webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
});

export default router;
