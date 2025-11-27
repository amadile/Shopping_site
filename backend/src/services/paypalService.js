import paypal from "@paypal/checkout-server-sdk";
import { logger } from "../config/logger.js";

// Initialize PayPal environment and client using env vars
function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();

  if (!clientId || !clientSecret) {
    logger.warn("PayPal client not configured (missing client id/secret)");
    return null;
  }

  const environment =
    mode === "live"
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);

  return new paypal.core.PayPalHttpClient(environment);
}

/**
 * Create a PayPal order for the given amount and return the order object
 * @param {{total: number, currency?: string, returnUrl?: string, cancelUrl?: string, reference?: string}} opts
 */
export async function createOrder({
  total,
  currency = "USD",
  returnUrl,
  cancelUrl,
  reference,
} = {}) {
  const client = getPayPalClient();
  if (!client) return null;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: reference || "default",
        amount: {
          currency_code: currency,
          value: (Number(total) || 0).toFixed(2),
        },
      },
    ],
    application_context: {
      return_url:
        returnUrl ||
        `${process.env.BASE_URL || "http://localhost:5000"}/paypal/success`,
      cancel_url:
        cancelUrl ||
        `${process.env.BASE_URL || "http://localhost:5000"}/paypal/cancel`,
    },
  });

  try {
    const response = await client.execute(request);
    logger.info(`PayPal order created: ${response.result.id}`);
    return response.result;
  } catch (err) {
    logger.error("PayPal createOrder error:", err);
    throw err;
  }
}

/**
 * Capture a PayPal order by orderId
 * @param {string} orderId
 */
export async function captureOrder(orderId) {
  const client = getPayPalClient();
  if (!client) return null;

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const response = await client.execute(request);
    logger.info(`PayPal order captured: ${orderId}`);
    return response.result;
  } catch (err) {
    logger.error("PayPal captureOrder error:", err);
    throw err;
  }
}

/**
 * Verify webhook signature for PayPal events.
 * Returns true if verification succeeded.
 */
export async function verifyWebhook(headers = {}, body = {}) {
  const client = getPayPalClient();
  if (!client) return false;

  try {
    const request = new paypal.notifications.VerifyWebhookSignatureRequest();
    const transmissionId =
      headers["paypal-transmission-id"] ||
      headers["Paypal-Transmission-Id"] ||
      headers["PAYPAL-TRANSMISSION-ID"];
    const transmissionTime =
      headers["paypal-transmission-time"] ||
      headers["Paypal-Transmission-Time"] ||
      headers["PAYPAL-TRANSMISSION-TIME"];
    const certUrl =
      headers["paypal-cert-url"] ||
      headers["Paypal-Cert-Url"] ||
      headers["PAYPAL-CERT-URL"];
    const authAlgo =
      headers["paypal-auth-algo"] ||
      headers["Paypal-Auth-Algo"] ||
      headers["PAYPAL-AUTH-ALGO"];
    const transmissionSig =
      headers["paypal-transmission-sig"] ||
      headers["Paypal-Transmission-Sig"] ||
      headers["PAYPAL-TRANSMISSION-SIG"];

    request.requestBody({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: process.env.PAYPAL_WEBHOOK_ID || "",
      webhook_event: body,
    });

    const response = await client.execute(request);
    const status = response?.result?.verification_status;
    logger.info("PayPal webhook verification status:", status);
    return status === "SUCCESS";
  } catch (err) {
    logger.error("PayPal verifyWebhook error:", err);
    return false;
  }
}

export default {
  createOrder,
  captureOrder,
  verifyWebhook,
};
