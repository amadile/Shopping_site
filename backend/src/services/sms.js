import AfricasTalking from 'africastalking';
import { logger } from '../config/logger.js';

// Check if Africa's Talking credentials are configured
const hasATCredentials =
    process.env.AT_USERNAME &&
    process.env.AT_API_KEY &&
    !process.env.AT_USERNAME.includes('your_') &&
    !process.env.AT_API_KEY.includes('your_');

// Initialize Africa's Talking only if credentials are configured
let sms = null;
if (hasATCredentials) {
    try {
        const africastalking = AfricasTalking({
            apiKey: process.env.AT_API_KEY,
            username: process.env.AT_USERNAME,
        });
        sms = africastalking.SMS;
        logger.info('Africa\'s Talking SMS initialized successfully');
    } catch (error) {
        logger.error('Africa\'s Talking initialization failed', { error: error.message });
    }
} else {
    logger.warn('Africa\'s Talking credentials not configured. SMS notifications will not work.');
    logger.warn('Add AT_USERNAME and AT_API_KEY to .env file');
}

/**
 * Check if SMS is configured
 */
function ensureSMSConfigured() {
    if (!sms) {
        throw new Error('SMS service is not configured. Please add Africa\'s Talking credentials to .env file.');
    }
}

/**
 * Send SMS
 * @param {Object} smsData - SMS details
 * @param {string|string[]} smsData.to - Recipient phone number(s)
 * @param {string} smsData.message - SMS message
 * @param {string} smsData.from - Sender ID (optional)
 * @returns {Promise<Object>} SMS response
 */
export async function sendSMS(smsData) {
    // Simulation mode check
    if (!sms) {
        logger.info('SIMULATION MODE: SMS would be sent', {
            to: smsData.to,
            message: smsData.message,
            from: smsData.from
        });
        return {
            success: true,
            data: { simulation: true },
            message: 'SMS simulated successfully',
        };
    }

    try {
        const { to, message, from } = smsData;

        // Validate phone number format
        const phoneNumbers = Array.isArray(to) ? to : [to];
        const ugandaPhoneRegex = /^\+256\d{9}$/;

        for (const phone of phoneNumbers) {
            if (!ugandaPhoneRegex.test(phone)) {
                throw new Error(`Invalid Uganda phone number format: ${phone}. Use +256XXXXXXXXX`);
            }
        }

        const options = {
            to: phoneNumbers,
            message,
        };

        if (from) {
            options.from = from;
        }

        logger.info('Sending SMS', {
            to: phoneNumbers,
            messageLength: message.length
        });

        const response = await sms.send(options);

        logger.info('SMS sent successfully', {
            to: phoneNumbers,
            status: response.SMSMessageData.Recipients.map(r => r.status),
        });

        return {
            success: true,
            data: response.SMSMessageData,
            message: 'SMS sent successfully',
        };
    } catch (error) {
        logger.error('SMS sending failed', {
            error: error.message,
            stack: error.stack,
        });
        // Don't throw in production for SMS failures to avoid blocking main flow, 
        // but return failure status
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send order confirmation SMS
 * @param {Object} orderData - Order details
 * @param {string} orderData.customerPhone - Customer phone number
 * @param {string} orderData.orderNumber - Order number
 * @param {number} orderData.total - Order total
 * @param {string} orderData.paymentMethod - Payment method
 * @returns {Promise<Object>} SMS response
 */
export async function sendOrderConfirmationSMS(orderData) {
    const { customerPhone, orderNumber, total, paymentMethod } = orderData;

    const paymentText = paymentMethod === 'cod'
        ? 'Cash on Delivery'
        : paymentMethod === 'mtn_momo'
            ? 'MTN Mobile Money'
            : paymentMethod === 'airtel_money'
                ? 'Airtel Money'
                : 'Card Payment';

    const message = `Order Confirmed! Your order ${orderNumber} for UGX ${total.toLocaleString()} has been placed. Payment: ${paymentText}. We'll notify you when it's ready for delivery. Thank you for shopping with us!`;

    return sendSMS({
        to: customerPhone,
        message,
    });
}

/**
 * Send payment confirmation SMS
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.customerPhone - Customer phone number
 * @param {string} paymentData.orderNumber - Order number
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.paymentMethod - Payment method
 * @returns {Promise<Object>} SMS response
 */
export async function sendPaymentConfirmationSMS(paymentData) {
    const { customerPhone, orderNumber, amount, paymentMethod } = paymentData;

    const message = `Payment Received! Your payment of UGX ${amount.toLocaleString()} for order ${orderNumber} via ${paymentMethod} has been confirmed. Your order will be processed shortly.`;

    return sendSMS({
        to: customerPhone,
        message,
    });
}

/**
 * Send dispatch notification SMS
 * @param {Object} dispatchData - Dispatch details
 * @param {string} dispatchData.customerPhone - Customer phone number
 * @param {string} dispatchData.orderNumber - Order number
 * @param {string} dispatchData.trackingNumber - Tracking number (optional)
 * @returns {Promise<Object>} SMS response
 */
export async function sendDispatchNotificationSMS(dispatchData) {
    const { customerPhone, orderNumber, trackingNumber } = dispatchData;

    let message = `Your order ${orderNumber} has been dispatched and is on its way!`;

    if (trackingNumber) {
        message += ` Tracking: ${trackingNumber}`;
    }

    message += ` You'll receive another SMS when it's out for delivery.`;

    return sendSMS({
        to: customerPhone,
        message,
    });
}

/**
 * Send delivery ETA SMS
 * @param {Object} etaData - ETA details
 * @param {string} etaData.customerPhone - Customer phone number
 * @param {string} etaData.orderNumber - Order number
 * @param {string} etaData.eta - Estimated time of arrival
 * @param {string} etaData.driverPhone - Driver phone number (optional)
 * @returns {Promise<Object>} SMS response
 */
export async function sendDeliveryETASMS(etaData) {
    const { customerPhone, orderNumber, eta, driverPhone } = etaData;

    let message = `Your order ${orderNumber} is out for delivery! Expected arrival: ${eta}.`;

    if (driverPhone) {
        message += ` Driver contact: ${driverPhone}`;
    }

    message += ` Please ensure someone is available to receive the order.`;

    return sendSMS({
        to: customerPhone,
        message,
    });
}

/**
 * Send delivery confirmation SMS
 * @param {Object} deliveryData - Delivery details
 * @param {string} deliveryData.customerPhone - Customer phone number
 * @param {string} deliveryData.orderNumber - Order number
 * @returns {Promise<Object>} SMS response
 */
export async function sendDeliveryConfirmationSMS(deliveryData) {
    const { customerPhone, orderNumber } = deliveryData;

    const message = `Order Delivered! Your order ${orderNumber} has been successfully delivered. Thank you for shopping with us! We hope to serve you again soon.`;

    return sendSMS({
        to: customerPhone,
        message,
    });
}

/**
 * Send vendor payout notification SMS
 * @param {Object} payoutData - Payout details
 * @param {string} payoutData.vendorPhone - Vendor phone number
 * @param {number} payoutData.amount - Payout amount
 * @param {string} payoutData.reference - Payout reference
 * @returns {Promise<Object>} SMS response
 */
export async function sendVendorPayoutSMS(payoutData) {
    const { vendorPhone, amount, reference } = payoutData;

    const message = `Payout Processed! UGX ${amount.toLocaleString()} has been sent to your mobile money account. Reference: ${reference}. Thank you for being a valued vendor!`;

    return sendSMS({
        to: vendorPhone,
        message,
    });
}

export default {
    sendSMS,
    sendOrderConfirmationSMS,
    sendPaymentConfirmationSMS,
    sendDispatchNotificationSMS,
    sendDeliveryETASMS,
    sendDeliveryConfirmationSMS,
    sendVendorPayoutSMS,
};
