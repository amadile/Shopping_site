     * @returns { Promise < Object >} Transaction status
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
