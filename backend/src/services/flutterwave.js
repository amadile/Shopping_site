import Flutterwave from 'flutterwave-node-v3';
import { logger } from '../config/logger.js';

// Check if Flutterwave credentials are configured
const hasFlutterwaveCredentials =
    process.env.FLUTTERWAVE_PUBLIC_KEY &&
    process.env.FLUTTERWAVE_SECRET_KEY &&
    process.env.FLUTTERWAVE_PUBLIC_KEY.length > 10 &&
    process.env.FLUTTERWAVE_SECRET_KEY.length > 10;

// Initialize Flutterwave only if credentials are configured
let flw = null;
if (hasFlutterwaveCredentials) {
    try {
        flw = new Flutterwave(
            process.env.FLUTTERWAVE_PUBLIC_KEY,
            process.env.FLUTTERWAVE_SECRET_KEY
        );
        logger.info('Flutterwave initialized successfully', {
            publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY.substring(0, 20) + '...',
            environment: process.env.FLUTTERWAVE_ENV || 'sandbox'
        });
    } catch (error) {
        logger.error('Flutterwave initialization failed', { error: error.message });
    }
} else {
    logger.warn('Flutterwave credentials not configured. Mobile money payments will not work.');
    logger.warn('Add FLUTTERWAVE_PUBLIC_KEY and FLUTTERWAVE_SECRET_KEY to .env file');
}

/**
 * Check if Flutterwave is configured
 */
function ensureFlutterwaveConfigured() {
    if (!flw) {
        throw new Error('Flutterwave is not configured. Please add valid credentials to .env file.');
    }
}

/**
 * Initiate mobile money payment
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.amount - Amount to charge
 * @param {string} paymentData.currency - Currency (UGX for Uganda)
 * @param {string} paymentData.phoneNumber - Customer phone number
 * @param {string} paymentData.email - Customer email
 * @param {string} paymentData.provider - Mobile money provider (mtn or airtel)
 * @param {string} paymentData.txRef - Unique transaction reference
 * @param {string} paymentData.redirectUrl - Redirect URL after payment
 * @returns {Promise<Object>} Payment response
 */
export async function initiateMobileMoneyPayment(paymentData) {
    ensureFlutterwaveConfigured();

    try {
        const {
            amount,
            currency = 'UGX',
            phoneNumber,
            email,
            provider, // 'mtn' or 'airtel'
            txRef,
            redirectUrl,
            fullName,
        } = paymentData;

        // Validate phone number format (Uganda: +256...)
        const ugandaPhoneRegex = /^\+256\d{9}$/;
        if (!ugandaPhoneRegex.test(phoneNumber)) {
            throw new Error('Invalid Uganda phone number format. Use +256XXXXXXXXX');
        }

        // Map provider to Flutterwave network
        const networkMap = {
            mtn: 'MTN',
            airtel: 'AIRTEL',
        };

        const network = networkMap[provider.toLowerCase()];
        if (!network) {
            throw new Error('Invalid mobile money provider. Use "mtn" or "airtel"');
        }

        const payload = {
            tx_ref: txRef,
            amount: parseFloat(amount),
            currency,
            network,
            email,
            phone_number: phoneNumber,
            fullname: fullName || email,
            redirect_url: redirectUrl,
        };

        logger.info('Initiating mobile money payment', { txRef, provider, amount });

        const response = await flw.MobileMoney.uganda(payload);

        logger.info('Mobile money payment initiated', {
            txRef,
            status: response.status,
            message: response.message,
        });

        return {
            success: response.status === 'success',
            data: response.data,
            message: response.message,
            meta: response.meta,
        };
    } catch (error) {
        logger.error('Mobile money payment initiation failed', {
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
}

/**
 * Verify mobile money payment
 * @param {string} transactionId - Flutterwave transaction ID
 * @returns {Promise<Object>} Verification response
 */
export async function verifyMobileMoneyPayment(transactionId) {
    ensureFlutterwaveConfigured();

    try {
        logger.info('Verifying mobile money payment', { transactionId });

        const response = await flw.Transaction.verify({ id: transactionId });

        const isSuccessful =
            response.status === 'success' &&
            response.data.status === 'successful' &&
            response.data.amount >= 0;

        logger.info('Mobile money payment verification result', {
            transactionId,
            status: response.data.status,
            amount: response.data.amount,
            isSuccessful,
        });

        return {
            success: isSuccessful,
            data: response.data,
            message: response.message,
        };
    } catch (error) {
        logger.error('Mobile money payment verification failed', {
            transactionId,
            error: error.message,
        });
        throw error;
    }
}

/**
 * Process mobile money payout to vendor
 * @param {Object} payoutData - Payout details
 * @param {string} payoutData.amount - Amount to transfer
 * @param {string} payoutData.phoneNumber - Vendor phone number
 * @param {string} payoutData.provider - Mobile money provider (mtn or airtel)
 * @param {string} payoutData.reference - Unique payout reference
 * @param {string} payoutData.narration - Payout description
 * @returns {Promise<Object>} Payout response
 */
export async function processMobileMoneyPayout(payoutData) {
    ensureFlutterwaveConfigured();

    try {
        const {
            amount,
            phoneNumber,
            provider,
            reference,
            narration = 'Vendor payout',
            currency = 'UGX',
        } = payoutData;

        // Validate phone number
        const ugandaPhoneRegex = /^\+256\d{9}$/;
        if (!ugandaPhoneRegex.test(phoneNumber)) {
            throw new Error('Invalid Uganda phone number format. Use +256XXXXXXXXX');
        }

        // Map provider to Flutterwave network
        const networkMap = {
            mtn: 'MTN',
            airtel: 'AIRTEL',
        };

        const network = networkMap[provider.toLowerCase()];
        if (!network) {
            throw new Error('Invalid mobile money provider. Use "mtn" or "airtel"');
        }

        const payload = {
            account_bank: network,
            account_number: phoneNumber,
            amount: parseFloat(amount),
            currency,
            narration,
            reference,
            callback_url: `${process.env.BASE_URL}/api/payment/mobile-money/payout-callback`,
            debit_currency: currency,
        };

        logger.info('Processing mobile money payout', {
            reference,
            provider,
            amount,
            phoneNumber,
        });

        const response = await flw.Transfer.initiate(payload);

        logger.info('Mobile money payout processed', {
            reference,
            status: response.status,
            message: response.message,
        });

        return {
            success: response.status === 'success',
            data: response.data,
            message: response.message,
        };
    } catch (error) {
        logger.error('Mobile money payout failed', {
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
}

/**
 * Get transaction status
 * @param {string} txRef - Transaction reference
 * @returns {Promise<Object>} Transaction status
 */
export async function getTransactionStatus(txRef) {
    ensureFlutterwaveConfigured();

    try {
        logger.info('Fetching transaction status', { txRef });

        const response = await flw.Transaction.verify({ tx_ref: txRef });

        return {
            success: response.status === 'success',
            data: response.data,
            message: response.message,
        };
    } catch (error) {
        logger.error('Failed to fetch transaction status', {
            txRef,
            error: error.message,
        });
        throw error;
    }
}

/**
 * Validate Flutterwave webhook signature
 * @param {string} signature - Webhook signature from headers
 * @param {Object} payload - Webhook payload
 * @returns {boolean} Is signature valid
 */
export function validateWebhookSignature(signature, payload) {
    try {
        const hash = require('crypto')
            .createHmac('sha256', process.env.FLUTTERWAVE_SECRET_KEY)
            .update(JSON.stringify(payload))
            .digest('hex');

        return hash === signature;
    } catch (error) {
        logger.error('Webhook signature validation failed', { error: error.message });
        return false;
    }
}

/**
 * Detect mobile money provider from phone number
 * @param {string} phoneNumber - Phone number
 * @returns {string} Provider ('mtn' or 'airtel')
 */
export function detectProvider(phoneNumber) {
    // Remove +256 prefix
    const number = phoneNumber.replace('+256', '');

    // MTN prefixes: 77, 78, 76, 39
    const mtnPrefixes = ['77', '78', '76', '39'];
    // Airtel prefixes: 70, 75, 74, 20
    const airtelPrefixes = ['70', '75', '74', '20'];

    const prefix = number.substring(0, 2);

    if (mtnPrefixes.includes(prefix)) {
        return 'mtn';
    } else if (airtelPrefixes.includes(prefix)) {
        return 'airtel';
    }

    // Default to MTN if unknown
    return 'mtn';
}

export default {
    initiateMobileMoneyPayment,
    verifyMobileMoneyPayment,
    processMobileMoneyPayout,
    getTransactionStatus,
    validateWebhookSignature,
    detectProvider,
};
