import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import Vendor from '../models/Vendor.js';
import Order from '../models/Order.js';

const router = express.Router();

// @route   GET /api/payment/manual-momo/config/:orderId
// @desc    Get vendor payment configuration for an order
// @access  Public
router.get('/config/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('vendor');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If order has a vendor, return vendor's payment info
        if (order.vendor && order.vendor.payoutInfo?.mobileMoneyNumbers) {
            const { mobileMoneyNumbers } = order.vendor.payoutInfo;

            return res.json({
                mtn: {
                    number: mobileMoneyNumbers.mtn || process.env.MERCHANT_MTN_NUMBER || '+256777123456',
                    name: mobileMoneyNumbers.mtnAccountName || order.vendor.businessName || 'Amadile Store'
                },
                airtel: {
                    number: mobileMoneyNumbers.airtel || process.env.MERCHANT_AIRTEL_NUMBER || '+256752123456',
                    name: mobileMoneyNumbers.airtelAccountName || order.vendor.businessName || 'Amadile Store'
                },
                businessEmail: order.vendor.businessEmail || process.env.MERCHANT_BUSINESS_EMAIL || 'amadilemajid10@gmail.com',
                vendorName: order.vendor.businessName
            });
        }

        // Fallback to platform default (for non-vendor orders or missing config)
        res.json({
            mtn: {
                number: process.env.MERCHANT_MTN_NUMBER || '+256777123456',
                name: process.env.MERCHANT_MTN_NAME || 'Amadile Store'
            },
            airtel: {
                number: process.env.MERCHANT_AIRTEL_NUMBER || '+256752123456',
                name: process.env.MERCHANT_AIRTEL_NAME || 'Amadile Store'
            },
            businessEmail: process.env.MERCHANT_BUSINESS_EMAIL || 'amadilemajid10@gmail.com'
        });
    } catch (error) {
        console.error('Config fetch error:', error);
        // Return defaults on error
        res.json({
            mtn: {
                number: process.env.MERCHANT_MTN_NUMBER || '+256777123456',
                name: process.env.MERCHANT_MTN_NAME || 'Amadile Store'
            },
            airtel: {
                number: process.env.MERCHANT_AIRTEL_NUMBER || '+256752123456',
                name: process.env.MERCHANT_AIRTEL_NAME || 'Amadile Store'
            },
            businessEmail: process.env.MERCHANT_BUSINESS_EMAIL || 'amadilemajid10@gmail.com'
        });
    }
});

// @route   PUT /api/vendor/payment-config
// @desc    Update vendor's mobile money payment configuration
// @access  Private (Vendor only)
router.put('/update', authenticateJWT, async (req, res) => {
    try {
        const { mtnNumber, mtnAccountName, airtelNumber, airtelAccountName } = req.body;

        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found' });
        }

        // Update mobile money configuration
        if (!vendor.payoutInfo) {
            vendor.payoutInfo = {};
        }
        if (!vendor.payoutInfo.mobileMoneyNumbers) {
            vendor.payoutInfo.mobileMoneyNumbers = {};
        }

        if (mtnNumber) vendor.payoutInfo.mobileMoneyNumbers.mtn = mtnNumber;
        if (mtnAccountName) vendor.payoutInfo.mobileMoneyNumbers.mtnAccountName = mtnAccountName;
        if (airtelNumber) vendor.payoutInfo.mobileMoneyNumbers.airtel = airtelNumber;
        if (airtelAccountName) vendor.payoutInfo.mobileMoneyNumbers.airtelAccountName = airtelAccountName;

        await vendor.save();

        res.json({
            success: true,
            message: 'Payment configuration updated successfully',
            paymentConfig: vendor.payoutInfo.mobileMoneyNumbers
        });
    } catch (error) {
        console.error('Payment config update error:', error);
        res.status(500).json({ message: 'Failed to update payment configuration', error: error.message });
    }
});

// @route   GET /api/vendor/payment-config
// @desc    Get vendor's current payment configuration
// @access  Private (Vendor only)
router.get('/current', authenticateJWT, async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor profile not found' });
        }

        res.json({
            mobileMoneyNumbers: vendor.payoutInfo?.mobileMoneyNumbers || {},
            businessEmail: vendor.businessEmail,
            businessName: vendor.businessName
        });
    } catch (error) {
        console.error('Fetch payment config error:', error);
        res.status(500).json({ message: 'Failed to fetch payment configuration', error: error.message });
    }
});

export default router;
