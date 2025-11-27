import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_ENV = process.env.PESAPAL_ENV || 'sandbox'; // 'sandbox' or 'live'

const BASE_URL = PESAPAL_ENV === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3';

let token = null;
let tokenExpiry = null;

/**
 * Get Pesapal Access Token
 */
export const getAccessToken = async () => {
    // Return existing valid token
    if (token && tokenExpiry && new Date() < tokenExpiry) {
        return token;
    }

    try {
        const response = await axios.post(`${BASE_URL}/api/Auth/RequestToken`, {
            consumer_key: PESAPAL_CONSUMER_KEY,
            consumer_secret: PESAPAL_CONSUMER_SECRET
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (response.data && response.data.token) {
            token = response.data.token;
            // Token is valid for 5 minutes, refresh slightly before
            const expiryDate = new Date(response.data.expiryDate);
            tokenExpiry = expiryDate;
            return token;
        } else {
            throw new Error('Failed to retrieve Pesapal token');
        }
    } catch (error) {
        console.error('Pesapal Auth Error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Register Order with Pesapal
 */
export const registerOrder = async (orderData) => {
    try {
        const accessToken = await getAccessToken();

        // IPN ID registration is usually a one-time setup or per-transaction if dynamic
        // For simplicity, we'll assume we register a new IPN URL for this transaction or use a default
        // Ideally, you register the IPN URL once and store the IPN_ID in env, but v3 allows dynamic registration

        const ipnResponse = await axios.post(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
            url: orderData.ipn_url,
            ipn_notification_type: 'GET'
        }, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const ipn_id = ipnResponse.data.ipn_id;

        const payload = {
            id: orderData.id,
            currency: orderData.currency || 'UGX',
            amount: orderData.amount,
            description: orderData.description,
            callback_url: orderData.callback_url,
            notification_id: ipn_id,
            billing_address: {
                email_address: orderData.email,
                phone_number: orderData.phone_number || '',
                country_code: 'UG',
                first_name: orderData.first_name || 'Guest',
                last_name: orderData.last_name || 'User',
                line_1: orderData.address || '',
                city: orderData.city || '',
                state: orderData.state || '',
                postal_code: '',
                zip_code: ''
            }
        };

        const response = await axios.post(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, payload, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        return response.data;
    } catch (error) {
        console.error('Pesapal Order Error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Get Transaction Status
 */
export const getTransactionStatus = async (orderTrackingId) => {
    try {
        const accessToken = await getAccessToken();

        const response = await axios.get(`${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        return response.data;
    } catch (error) {
        console.error('Pesapal Status Error:', error.response?.data || error.message);
        throw error;
    }
};
