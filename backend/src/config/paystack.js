import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
    console.warn('PAYSTACK_SECRET_KEY is not defined in environment variables');
}

export const paystack = axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
    },
});

export const initializePayment = async (email, amount, callbackUrl, metadata = {}) => {
    try {
        // Amount in kobo (multiply by 100)
        // Paystack expects amount in smallest currency unit
        const response = await paystack.post('/transaction/initialize', {
            email,
            amount: Math.round(amount * 100),
            callback_url: callbackUrl,
            metadata,
            channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
        });
        return response.data;
    } catch (error) {
        console.error('Paystack initialization error:', error.response?.data || error.message);
        throw error;
    }
};

export const verifyPayment = async (reference) => {
    try {
        const response = await paystack.get(`/transaction/verify/${reference}`);
        return response.data;
    } catch (error) {
        console.error('Paystack verification error:', error.response?.data || error.message);
        throw error;
    }
};
