# Stripe Payment Integration Setup Guide

## Overview

This project uses **Stripe** as the primary payment gateway. This guide will walk you through setting up Stripe for both development (test mode) and production (live mode).

---

## 🎯 Quick Start

### Prerequisites

- Stripe account (free to sign up)
- Node.js installed
- Backend server running

### Steps

1. [Create Stripe Account](#1-create-stripe-account)
2. [Get API Keys](#2-get-api-keys)
3. [Configure Environment Variables](#3-configure-environment-variables)
4. [Set Up Webhooks](#4-set-up-webhooks)
5. [Test Payment Flow](#5-test-payment-flow)

---

## 1. Create Stripe Account

### Sign Up

1. Go to https://dashboard.stripe.com/register
2. Enter your email and create a password
3. Verify your email address
4. You'll start in **Test Mode** (perfect for development)

### Business Verification (For Production)

- To accept live payments, you need to activate your account
- Provide business details, tax information, and bank account
- Complete identity verification
- This can take a few hours to a few days

---

## 2. Get API Keys

### Test Mode Keys (Development)

1. **Login to Stripe Dashboard:** https://dashboard.stripe.com/
2. **Ensure you're in Test Mode** (toggle in the left sidebar should show "Test mode")
3. **Navigate to:** Developers → API keys
4. **You'll see two keys:**

   - **Publishable key** (starts with `pk_test_...`) - Safe to use in frontend
   - **Secret key** (starts with `sk_test_...`) - Keep this secure, backend only!

5. **Click "Reveal test key token"** to see your secret key

### Live Mode Keys (Production)

1. **Switch to Live Mode** (toggle in the left sidebar)
2. **Complete account activation** if not already done
3. **Navigate to:** Developers → API keys
4. **You'll see:**
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`)

⚠️ **IMPORTANT:** Never commit live keys to Git or share them publicly!

---

## 3. Configure Environment Variables

### Update `.env` File

```env
# Stripe Configuration - Test Mode (Development)
STRIPE_SECRET_KEY=sk_test_51Abc123...your_actual_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_51Abc123...your_actual_test_key
STRIPE_WEBHOOK_SECRET=whsec_...your_webhook_secret

# For Production, replace with live keys:
# STRIPE_SECRET_KEY=sk_live_51Abc123...your_actual_live_key
# STRIPE_PUBLISHABLE_KEY=pk_live_51Abc123...your_actual_live_key
# STRIPE_WEBHOOK_SECRET=whsec_...your_live_webhook_secret
```

### Required Environment Variables

| Variable                 | Description                     | Example                        |
| ------------------------ | ------------------------------- | ------------------------------ |
| `STRIPE_SECRET_KEY`      | Backend API key                 | `sk_test_...` or `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Frontend key (passed to client) | `pk_test_...` or `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET`  | Webhook signing secret          | `whsec_...`                    |

---

## 4. Set Up Webhooks

Webhooks allow Stripe to notify your backend when payment events occur (e.g., payment succeeded, payment failed).

### Local Development (Using Stripe CLI)

#### Install Stripe CLI

```bash
# Windows (using Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

#### Login to Stripe CLI

```bash
stripe login
```

#### Forward Webhooks to Local Server

```bash
# This command forwards Stripe events to your local backend
stripe listen --forward-to localhost:5000/api/payment/webhook

# You'll get a webhook signing secret (starts with whsec_)
# Copy this and add to your .env file as STRIPE_WEBHOOK_SECRET
```

#### Test Webhook

```bash
# In another terminal, trigger a test payment event
stripe trigger payment_intent.succeeded
```

### Production Webhooks

1. **Go to Stripe Dashboard:** https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Enter your endpoint URL:**
   ```
   https://api.yourdomain.com/api/payment/webhook
   ```
4. **Select events to listen to:**

   - `payment_intent.succeeded` - Payment completed successfully
   - `payment_intent.payment_failed` - Payment failed
   - `charge.refunded` - Refund processed (optional)
   - `payment_intent.canceled` - Payment canceled (optional)

5. **Click "Add endpoint"**
6. **Copy the Signing Secret** (starts with `whsec_...`)
7. **Add to production `.env` file:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
   ```

#### Webhook Security

- The webhook secret verifies that events came from Stripe
- Your backend validates the signature using this secret
- Never skip webhook verification in production!

---

## 5. Test Payment Flow

### Using Test Cards

Stripe provides test card numbers that simulate different scenarios:

| Card Number           | Scenario           | Result                     |
| --------------------- | ------------------ | -------------------------- |
| `4242 4242 4242 4242` | Successful payment | ✅ Payment succeeds        |
| `4000 0000 0000 9995` | Insufficient funds | ❌ Card declined           |
| `4000 0025 0000 3155` | 3D Secure required | 🔒 Requires authentication |
| `4000 0000 0000 0002` | Card declined      | ❌ Generic decline         |

**For all test cards:**

- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### Test Payment Flow

#### 1. Create Payment Intent (Backend)

```bash
# Your backend endpoint
POST http://localhost:5000/api/payment/create-payment-intent

# Headers
Authorization: Bearer your_jwt_token
Content-Type: application/json

# Response will include clientSecret
{
  "clientSecret": "pi_xxx_secret_xxx",
  "orderId": "..."
}
```

#### 2. Confirm Payment (Frontend)

```javascript
// In your frontend, use Stripe.js
const stripe = Stripe("pk_test_your_publishable_key");

const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: "Customer Name",
    },
  },
});

if (result.error) {
  // Payment failed
  console.error(result.error.message);
} else {
  // Payment succeeded
  console.log("Payment Intent:", result.paymentIntent);
}
```

#### 3. Confirm Payment (Backend)

```bash
# Call your confirm endpoint
POST http://localhost:5000/api/payment/confirm-payment

# Body
{
  "paymentIntentId": "pi_xxx",
  "orderId": "optional_order_id"
}
```

---

## 📋 Payment Flow Diagram

```
Frontend                Backend                 Stripe
   |                       |                       |
   |------ Add to Cart --->|                       |
   |------ Checkout ------>|                       |
   |                       |                       |
   |                       |--- Create Payment --->|
   |                       |<-- Payment Intent ----|
   |<-- Client Secret -----|                       |
   |                       |                       |
   |--- Confirm Payment ---|-------------------->  |
   |                       |                  (Process)
   |                       |<----- Webhook --------|
   |                       | (payment_succeeded)   |
   |                       |                       |
   |<-- Order Created -----|                       |
```

---

## 🔒 Security Best Practices

### 1. API Keys

- ✅ **DO:** Store secret keys in `.env` file
- ✅ **DO:** Add `.env` to `.gitignore`
- ✅ **DO:** Use environment variables in production
- ❌ **DON'T:** Commit keys to Git
- ❌ **DON'T:** Share secret keys publicly
- ❌ **DON'T:** Use live keys in test environment

### 2. Webhook Verification

```javascript
// Always verify webhook signatures
const sig = req.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 3. Payment Amounts

- Always calculate amounts on the backend
- Never trust client-side amounts
- Stripe uses smallest currency unit (cents for USD)
  ```javascript
  // $99.99 = 9999 cents
  const amount = Math.round(price * 100);
  ```

### 4. HTTPS Required

- Stripe requires HTTPS in production
- Use SSL certificate (Let's Encrypt, Cloudflare, etc.)
- Webhook URLs must be HTTPS

---

## 🐛 Troubleshooting

### "Stripe is not configured"

**Problem:** Backend shows mock payment message

**Solution:**

1. Check `.env` file has `STRIPE_SECRET_KEY`
2. Restart backend server after adding env variables
3. Verify key starts with `sk_test_` or `sk_live_`

### "Webhook signature verification failed"

**Problem:** Webhook endpoint returns 400 error

**Solution:**

1. Check `STRIPE_WEBHOOK_SECRET` is set correctly
2. Ensure webhook endpoint uses `express.raw()` middleware
3. Don't parse webhook body as JSON before verification
4. Verify webhook secret matches the endpoint in Stripe Dashboard

### "Payment Intent requires a payment method"

**Problem:** Payment fails during confirmation

**Solution:**

1. Ensure frontend calls `stripe.confirmCardPayment()` with card details
2. Verify payment method is attached to payment intent
3. Check card information is valid

### "Invalid API Key"

**Problem:** 401 Unauthorized error

**Solution:**

1. Verify API key is correct (copy from Stripe Dashboard)
2. Check for extra spaces or line breaks in `.env`
3. Ensure you're using test key in test mode, live key in live mode
4. Restart server after updating `.env`

### Test Webhook Not Working

**Problem:** Stripe CLI webhook not triggering

**Solution:**

1. Ensure Stripe CLI is running: `stripe listen --forward-to localhost:5000/api/payment/webhook`
2. Check backend is running on correct port
3. Verify endpoint route is correct
4. Check firewall isn't blocking connection

---

## 📊 Testing Checklist

### Development Testing

- [ ] Create payment intent successfully
- [ ] Confirm payment with test card `4242 4242 4242 4242`
- [ ] Order created in database with status "paid"
- [ ] Test card declined scenario `4000 0000 0000 9995`
- [ ] Webhook receives `payment_intent.succeeded` event
- [ ] Webhook updates order status
- [ ] Test 3D Secure flow `4000 0025 0000 3155`

### Production Readiness

- [ ] Switched to live API keys
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Webhook secret updated in production `.env`
- [ ] SSL certificate installed (HTTPS working)
- [ ] Test live payment with real card (small amount)
- [ ] Verify webhook events arrive in production
- [ ] Check order creation in production database
- [ ] Test refund flow (if implemented)
- [ ] Monitor Stripe Dashboard for successful payments

---

## 🔗 Useful Resources

### Stripe Documentation

- **Stripe Docs:** https://stripe.com/docs
- **Payment Intents API:** https://stripe.com/docs/payments/payment-intents
- **Testing:** https://stripe.com/docs/testing
- **Webhooks:** https://stripe.com/docs/webhooks
- **Stripe CLI:** https://stripe.com/docs/stripe-cli

### Stripe Dashboard

- **Dashboard:** https://dashboard.stripe.com/
- **Payments:** https://dashboard.stripe.com/payments
- **API Keys:** https://dashboard.stripe.com/apikeys
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **Logs:** https://dashboard.stripe.com/logs

### Support

- **Stripe Support:** https://support.stripe.com/
- **Discord Community:** https://stripe.com/discord
- **Stack Overflow:** Tagged with `stripe-payments`

---

## 💡 Additional Features

### Refunds

```javascript
// Create a refund
const refund = await stripe.refunds.create({
  payment_intent: "pi_xxx",
  amount: 5000, // $50.00 in cents (optional, full refund if omitted)
});
```

### Save Cards (Future Payments)

```javascript
// Create customer
const customer = await stripe.customers.create({
  email: "customer@example.com",
});

// Attach payment method to customer
await stripe.paymentMethods.attach(paymentMethodId, {
  customer: customer.id,
});
```

### Subscriptions

- For recurring payments, use Stripe Subscriptions
- Docs: https://stripe.com/docs/billing/subscriptions/overview

---

## ⚙️ Environment Variables Summary

### Development `.env`

```env
STRIPE_SECRET_KEY=sk_test_51Abc123...
STRIPE_PUBLISHABLE_KEY=pk_test_51Abc123...
STRIPE_WEBHOOK_SECRET=whsec_local_from_stripe_cli
```

### Production `.env`

```env
STRIPE_SECRET_KEY=sk_live_51Abc123...
STRIPE_PUBLISHABLE_KEY=pk_live_51Abc123...
STRIPE_WEBHOOK_SECRET=whsec_from_dashboard_webhook
```

---

## 🎉 Success!

Once you've completed this setup:

1. ✅ Stripe integration is working
2. ✅ Test payments process correctly
3. ✅ Webhooks update order status
4. ✅ Ready to accept live payments

**Next Steps:**

- Implement frontend payment form
- Add refund functionality
- Set up email receipts
- Monitor Stripe Dashboard for transactions

---

**Last Updated:** November 11, 2025  
**Stripe API Version:** 2023-10-16
