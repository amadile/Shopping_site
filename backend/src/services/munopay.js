import axios from 'axios';
import { logger } from '../config/logger.js';

class MunoPayService {
    constructor() {
        this.baseURL = process.env.MUNOPAY_BASE_URL || 'https://api.munopay.com/v1';
        this.apiKey = process.env.MUNOPAY_API_KEY;
        this.webhookSecret = process.env.MUNOPAY_WEBHOOK_SECRET;
        this.merchantId = process.env.MUNOPAY_MERCHANT_ID;

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    /**
     * Initiate Mobile Money Payment
     * @param {Object} data Payment details
     * @returns {Promise<Object>} Payment response
     */
    async initiatePayment(data) {
        try {
            const { phoneNumber, amount, currency = 'UGX', reference, description } = data;

            // Construct payload
            const payload = {
                phone_number: phoneNumber,
                amount: amount,
                currency: currency,
                external_reference: reference,
                description: description || `Payment for order ${reference}`,
                callback_url: `${process.env.API_URL}/api/payment/munopay/webhook`
            };

            // Only add merchant_id if it exists
            if (this.merchantId) {
                payload.merchant_id = this.merchantId;
            }

            logger.info('Initiating MunoPay payment:', { reference, amount, phoneNumber });

            // Simulation mode for testing without valid keys
            if (process.env.MUNOPAY_MODE === 'sandbox' && !this.apiKey) {
                logger.info('MunoPay Simulation Mode: Payment initiated successfully');
                return {
                    success: true,
                    reference: reference,
                    transaction_id: `MUNO-${Date.now()}`,
                    status: 'pending',
                    message: 'Payment initiated successfully (Simulation)'
                };
            }

            const response = await this.client.post('/collection/mobile_money', payload);
            return response.data;
        } catch (error) {
            logger.error('MunoPay initiation error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Payment initiation failed');
        }
    }

    /**
     * Verify Payment Status
     * @param {string} reference Transaction reference
     * @returns {Promise<Object>} Transaction status
     */
    async verifyPayment(reference) {
        try {
            // Simulation mode
            if (process.env.MUNOPAY_MODE === 'sandbox' && !this.apiKey) {
                return {
                    status: 'successful',
                    reference: reference,
                    amount: 1000,
                    currency: 'UGX'
                };
            }

            const response = await this.client.get(`/transaction/status/${reference}`);
            return response.data;
        } catch (error) {
            logger.error('MunoPay verification error:', error.response?.data || error.message);
            throw new Error('Payment verification failed');
        }
    }

    /**
     * Verify Webhook Signature
     * @param {Object} payload Webhook body
     * @param {string} signature Header signature
     * @returns {boolean} Is valid
     */
    verifyWebhook(payload, signature) {
        // Implement signature verification logic here
        // Usually HMAC SHA256 of payload with Secret Key
        return true; // Placeholder
    }
}

export const munoPayService = new MunoPayService();
