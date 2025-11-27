import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateJWT } from '../middleware/auth.js';
import { logger } from '../config/logger.js';
import Order from '../models/Order.js';
import { sendOrderConfirmationSMS } from '../services/sms.js';

const router = express.Router();

/**
 * @swagger
 * /api/payment/cod/place-order:
 *   post:
 *     summary: Place order with Cash on Delivery
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
 *               - items
 *               - shippingAddress
 *             properties:
 *               items:
 *                 type: array
 *               shippingAddress:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order placed successfully
 */
router.post(
    '/place-order',
    authenticateJWT,
    [
        body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
        body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
        body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
        body('shippingAddress.phone').notEmpty().withMessage('Phone number is required'),
        body('shippingAddress.district').notEmpty().withMessage('District is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { items, shippingAddress, notes, appliedCoupon } = req.body;

            // Calculate totals
            let subtotal = 0;
            const orderItems = items.map((item) => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                return {
                    product: item.product,
                    quantity: item.quantity,
                    price: item.price,
                    variantId: item.variantId,
                    variantDetails: item.variantDetails,
                };
            });

            // Apply coupon discount if provided
            let discountAmount = 0;
            if (appliedCoupon) {
                if (appliedCoupon.discountType === 'percentage') {
                    discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
                } else {
                    discountAmount = appliedCoupon.discountValue;
                }
            }

            const total = subtotal - discountAmount;

            // Create COD order
            const order = new Order({
                user: req.user._id,
                items: orderItems,
                subtotal,
                total,
                currency: 'UGX',
                paymentMethod: 'cod',
                shippingAddress: {
                    fullName: shippingAddress.fullName,
                    phone: shippingAddress.phone,
                    addressLine1: shippingAddress.addressLine1 || '',
                    addressLine2: shippingAddress.addressLine2 || '',
                    city: shippingAddress.city || shippingAddress.district,
                    state: shippingAddress.state || 'Uganda',
                    country: 'Uganda',
                    district: shippingAddress.district,
                    zone: shippingAddress.zone,
                    landmark: shippingAddress.landmark,
                },
                notes: notes || '',
                appliedCoupon: appliedCoupon || undefined,
                status: 'pending', // COD orders start as pending
                smsNotifications: true, // Default to SMS for Uganda
            });

            await order.save();

            logger.info('COD order placed', {
                orderId: order._id,
                userId: req.user._id,
                total: order.total,
                district: shippingAddress.district,
            });

            // Send SMS notification (don't fail order if SMS fails)
            try {
                await sendOrderConfirmationSMS({
                    customerPhone: shippingAddress.phone,
                    orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
                    total: order.total,
                    paymentMethod: 'Cash on Delivery',
                });
                logger.info('Order confirmation SMS sent', { orderId: order._id });
            } catch (smsError) {
                logger.error('Failed to send order confirmation SMS', {
                    orderId: order._id,
                    error: smsError.message,
                });
                // Continue - don't fail the order if SMS fails
            }

            res.status(201).json({
                success: true,
                message: 'Order placed successfully. Pay cash when you receive your items.',
                order: {
                    id: order._id,
                    orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
                    total: order.total,
                    currency: order.currency,
                    paymentMethod: order.paymentMethod,
                    status: order.status,
                    estimatedDelivery: calculateEstimatedDelivery(shippingAddress.district),
                    items: order.items.length,
                },
            });
        } catch (error) {
            logger.error('COD order placement error', {
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({
                error: 'Failed to place order',
                message: error.message,
            });
        }
    }
);

/**
 * @swagger
 * /api/payment/cod/confirm/{orderId}:
 *   post:
 *     summary: Confirm COD payment received (for delivery personnel/vendor)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountReceived
 *             properties:
 *               amountReceived:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed
 */
router.post(
    '/confirm/:orderId',
    authenticateJWT,
    [
        body('amountReceived')
            .isNumeric()
            .withMessage('Amount received must be a number')
            .custom((value, { req }) => value > 0)
            .withMessage('Amount must be greater than 0'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { orderId } = req.params;
            const { amountReceived, notes } = req.body;

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Verify payment method is COD
            if (order.paymentMethod !== 'cod') {
                return res.status(400).json({ error: 'This order is not a COD order' });
            }

            // Verify order is not already paid
            if (order.status === 'paid' || order.status === 'delivered') {
                return res.status(400).json({ error: 'Order payment already confirmed' });
            }

            // Verify amount matches (allow small variance for change)
            const variance = Math.abs(amountReceived - order.total);
            if (variance > 1000) {
                // Allow 1000 UGX variance
                logger.warn('COD payment amount mismatch', {
                    orderId,
                    expected: order.total,
                    received: amountReceived,
                    variance,
                });
            }

            // Update order status
            order.status = 'paid';
            if (notes) {
                order.notes = order.notes ? `${order.notes}\nCOD Payment: ${notes}` : notes;
            }

            await order.save();

            logger.info('COD payment confirmed', {
                orderId: order._id,
                amountReceived,
                expectedAmount: order.total,
                confirmedBy: req.user._id,
            });

            // TODO: Send SMS confirmation to customer
            // TODO: Update vendor balance if vendor order
            // TODO: Send email receipt

            res.json({
                success: true,
                message: 'Cash payment confirmed successfully',
                order: {
                    id: order._id,
                    status: order.status,
                    total: order.total,
                    amountReceived,
                },
            });
        } catch (error) {
            logger.error('COD payment confirmation error', {
                error: error.message,
            });
            res.status(500).json({
                error: 'Failed to confirm payment',
                message: error.message,
            });
        }
    }
);

/**
 * @swagger
 * /api/payment/cod/cancel/{orderId}:
 *   post:
 *     summary: Cancel COD order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled
 */
router.post('/cancel/:orderId', authenticateJWT, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Verify order belongs to user or user is admin/vendor
        const isOwner = order.user.toString() === req.user._id.toString();
        const isAuthorized = isOwner || req.user.role === 'admin' || req.user.role === 'vendor';

        if (!isAuthorized) {
            return res.status(403).json({ error: 'Unauthorized to cancel this order' });
        }

        // Can't cancel if already paid or delivered
        if (order.status === 'paid' || order.status === 'delivered') {
            return res.status(400).json({
                error: 'Cannot cancel order that is already paid or delivered',
            });
        }

        // Update order status
        order.status = 'cancelled';
        order.cancellationReason = reason || 'Cancelled by user';
        order.cancelledAt = new Date();
        order.cancelledBy = req.user._id;

        await order.save();

        logger.info('COD order cancelled', {
            orderId: order._id,
            reason: order.cancellationReason,
            cancelledBy: req.user._id,
        });

        // TODO: Send SMS notification
        // TODO: Restore inventory if needed

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order: {
                id: order._id,
                status: order.status,
                cancellationReason: order.cancellationReason,
            },
        });
    } catch (error) {
        logger.error('COD order cancellation error', {
            error: error.message,
        });
        res.status(500).json({
            error: 'Failed to cancel order',
            message: error.message,
        });
    }
});

/**
 * Helper function to calculate estimated delivery date
 */
function calculateEstimatedDelivery(district) {
    const now = new Date();
    let daysToAdd = 3; // Default 3 days

    // Kampala and nearby districts: 1-2 days
    const nearbyDistricts = ['Kampala', 'Wakiso', 'Mukono', 'Entebbe'];
    if (nearbyDistricts.includes(district)) {
        daysToAdd = 2;
    }

    // Remote districts: 5-7 days
    const remoteDistricts = ['Karamoja', 'Kotido', 'Moroto', 'Kabong'];
    if (remoteDistricts.some((d) => district.includes(d))) {
        daysToAdd = 7;
    }

    const estimatedDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return estimatedDate.toISOString();
}

export default router;
