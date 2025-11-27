// Flutterwave Mobile Money Service (Uganda)
import axios from "axios";

const FLW_BASE_URL = "https://api.flutterwave.com/v3";
const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

// If secret key is missing, mock payment responses for testing
const isMock = !FLW_SECRET_KEY;

/**
 * Initiate a mobile money payment (MTN/Airtel)
 * @param {Object} params - { amount, currency, tx_ref, phone_number, network, email, redirect_url, ... }
 */
export async function initiateMobileMoneyPayment(params) {
  if (isMock) {
    // Return a mock payment response
    return {
      status: "success",
      message: "Mock payment initiated (no FLUTTERWAVE_SECRET_KEY)",
      data: {
        tx_ref: params.tx_ref,
        amount: params.amount,
        currency: params.currency || "UGX",
        payment_type: "mobilemoneyuganda",
        order_id: params.order_id,
        email: params.email,
        phone_number: params.phone_number,
        network: params.network,
        redirect_url: params.redirect_url,
        mock: true,
      },
    };
  }
  const payload = {
    tx_ref: params.tx_ref,
    amount: params.amount,
    currency: params.currency || "UGX",
    payment_type: "mobilemoneyuganda",
    redirect_url: params.redirect_url,
    order_id: params.order_id,
    email: params.email,
    phone_number: params.phone_number,
    network: params.network, // 'mtn' or 'airtel'
    ...params.extra,
  };
  const res = await axios.post(
    `${FLW_BASE_URL}/charges?type=mobilemoneyuganda`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
}

/**
 * Verify a payment by transaction ID
 * @param {string} transactionId
 */
export async function verifyPayment(transactionId) {
  if (isMock) {
    return {
      status: "success",
      message: "Mock payment verified (no FLUTTERWAVE_SECRET_KEY)",
      data: {
        transactionId,
        mock: true,
      },
    };
  }
  const res = await axios.get(
    `${FLW_BASE_URL}/transactions/${transactionId}/verify`,
    {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
    }
  );
  return res.data;
}

// TODO: Add webhook handler for payment status updates
