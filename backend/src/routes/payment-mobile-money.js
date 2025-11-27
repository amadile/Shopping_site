import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateJWT } from '../middleware/auth.js';
import { logger } from '../config/logger.js';
import Order from '../models/Order.js';
import {
    initiateMobileMoneyPayment,
    verifyMobileMoneyPayment,
    getTransactionStatus,
    validateWebhookSignature,
    detectProvider,
} from '../services/flutterwave.js';
import { sendPaymentConfirmationSMS } from '../services/sms.js';

const router = express.Router();

/**
 * @swagger
 * /api/payment/mobile-money/initiate:
 *   post:
 *     summary: Initiate mobile money payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - phoneNumber
 *             properties:
 *               orderId:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [mtn, airtel]
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 */
router.post(
    '/initiate',
    authenticateJWT,
    [
        body('orderId').notEmpty().withMessage('Order ID is required'),
        body('phoneNumber')
            .matches(/^\+256\d{9}$/)
            .withMessage('Invalid Uganda phone number. Use format: +256XXXXXXXXX'),
        body('provider').optional().isIn(['mtn', 'airtel']).withMessage('Invalid provider'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { orderId, phoneNumber, provider } = req.body;

            // Find the order
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Verify order belongs to user
            if (order.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Check if order is already paid
            if (order.status === 'paid') {
                return res.status(400).json({ error: 'Order is already paid' });
            }

            // Auto-detect provider if not provided
            const detectedProvider = provider || detectProvider(phoneNumber);

            // Generate unique transaction reference
            const txRef = `ORDER-${orderId}-${Date.now()}`;

            // Initiate payment
            const paymentResponse = await initiateMobileMoneyPayment({
                amount: order.total,
                currency: order.currency || 'UGX',
                phoneNumber,
                email: req.user.email,
                provider: detectedProvider,
                txRef,
                redirectUrl: `${process.env.FRONTEND_URL}/orders/${orderId}/payment-status`,
                fullName: req.user.name,
            });

            if (!paymentResponse.success) {
                return res.status(400).json({
                    error: 'Payment initiation failed',
                    message: paymentResponse.message,
                });
            }

            // Update order with mobile money details
            order.paymentMethod = detectedProvider === 'mtn' ? 'mtn_momo' : 'airtel_money';
            order.mobileMoneyNumber = phoneNumber;
            order.paymentIntentId = txRef;
            await order.save();

            logger.info('Mobile money payment initiated', {
                orderId,
                txRef,
                provider: detectedProvider,
                amount: order.total,
            });

            res.json({
                success: true,
                message: 'Payment initiated. Please check your phone to complete the payment.',
                data: {
                    txRef,
                    provider: detectedProvider,
                    phoneNumber,
                    amount: order.total,
                    currency: order.currency,
                    paymentLink: paymentResponse.data?.link,
                },
            });
        } catch (error) {
            logger.error('Mobile money payment initiation error', {
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({
                error: 'Payment initiation failed',
                message: error.message,
            });
        }
    }
);

/**
 * @swagger
 * /api/payment/mobile-money/verify/{transactionId}:
 *   get:
 *     summary: Verify mobile money payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verification result
 */
router.get('/verify/:transactionId', authenticateJWT, async (req, res) => {
    try {
        const { transactionId } = req.params;

        const verificationResponse = await verifyMobileMoneyPayment(transactionId);

        if (!verificationResponse.success) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed',
                data: verificationResponse.data,
            });
        }

        // Find order by transaction reference
        const order = await Order.findOne({ paymentIntentId: verificationResponse.data.tx_ref });

        if (order && verificationResponse.data.status === 'successful') {
            // Update order status
            order.status = 'paid';
            await order.save();

            logger.info('Order payment confirmed', {
                orderId: order._id,
                transactionId,
                amount: verificationResponse.data.amount,
            });

            // Send SMS notification
            try {
                await sendPaymentConfirmationSMS({
                    customerPhone: order.shippingAddress.phone,
                    orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
                    amount: order.total,
                    paymentMethod: order.paymentMethod === 'mtn_momo' ? 'MTN Mobile Money' : 'Airtel Money',
                });
                logger.info('Payment confirmation SMS sent', { orderId: order._id });
            } catch (smsError) {
                logger.error('Failed to send payment confirmation SMS', {
                    orderId: order._id,
                    error: smsError.message,
                });
            }
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                status: verificationResponse.data.status,
                amount: verificationResponse.data.amount,
                currency: verificationResponse.data.currency,
                transactionId: verificationResponse.data.id,
                orderId: order?._id,
            },
        });
    } catch (error) {
        logger.error('Mobile money payment verification error', {
            error: error.message,
        });
        res.status(500).json({
            error: 'Payment verification failed',
            message: error.message,
        });
    }
});

/**
 * @swagger
 * /api/payment/mobile-money/status/{txRef}:
 *   get:
 *     summary: Get transaction status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: txRef
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction status
 */
router.get('/status/:txRef', authenticateJWT, async (req, res) => {
    try {
        const { txRef } = req.params;

        const statusResponse = await getTransactionStatus(txRef);

        res.json({
            success: statusResponse.success,
            data: statusResponse.data,
        });
    } catch (error) {
        logger.error('Transaction status check error', {
            error: error.message,
        });
        res.status(500).json({
            error: 'Failed to get transaction status',
            message: error.message,
        });
    }
});

/**
 * @swagger
 * /api/payment/mobile-money/webhook:
 *   post:
 *     summary: Flutterwave webhook for payment notifications
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['verif-hash'];

        // Validate webhook signature
        if (!signature || !validateWebhookSignature(signature, req.body)) {
            logger.warn('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const { event, data } = req.body;

        logger.info('Flutterwave webhook received', { event, txRef: data.tx_ref });

        // Handle charge completed event
        if (event === 'charge.completed' && data.status === 'successful') {
            // Find order by transaction reference
            const order = await Order.findOne({ paymentIntentId: data.tx_ref });

            if (order && order.status !== 'paid') {
                // Verify the payment amount matches
                if (parseFloat(data.amount) >= order.total) {
                    order.status = 'paid';
                    await order.save();

                    logger.info('Order payment confirmed via webhook', {
                        orderId: order._id,
                        txRef: data.tx_ref,
                        amount: data.amount,
                    });

                    // Send SMS notification
                    try {
                        await sendPaymentConfirmationSMS({
                            customerPhone: order.shippingAddress.phone,
                            orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
                            amount: order.total,
                            paymentMethod: order.paymentMethod === 'mtn_momo' ? 'MTN Mobile Money' : 'Airtel Money',
                        });
                        logger.info('Payment confirmation SMS sent via webhook', { orderId: order._id });
                    } catch (smsError) {
                        logger.error('Failed to send payment confirmation SMS via webhook', {
                            orderId: order._id,
                            error: smsError.message,
                        });
                    }

                    // TODO: Send email confirmation
                } else {
                    logger.warn('Payment amount mismatch', {
                        expected: order.total,
                        received: data.amount,
                        txRef: data.tx_ref,
                    });
                }
            }
        }

        res.json({ success: true });
    } catch (error) {
        logger.error('Webhook processing error', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export default router;
