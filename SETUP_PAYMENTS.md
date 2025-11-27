# 💳 Payment Gateway Setup Guide

This guide will help you get the API keys needed to activate **Pesapal** and **PayPal** on your Amadile platform.

> **Note:** You do NOT need a verified business account to start testing. You can use "Sandbox/Demo" keys for now.

---

## 🟢 Option 1: Pesapal (Recommended for Uganda)

Pesapal is the best option for Uganda, supporting MTN/Airtel Mobile Money and Cards.

### Step 1: Create a Demo Account
1. Go to [demo.pesapal.com/register](https://demo.pesapal.com/register)
2. Fill in your details to create a business account (use dummy data if needed for testing)
3. Verify your email address

### Step 2: Get Your API Keys
1. Log in to your [Pesapal Demo Dashboard](https://demo.pesapal.com/dashboard)
2. Look for **"API Credentials"** or **"Integration Keys"** in the settings menu
3. You will see a **Consumer Key** and **Consumer Secret**
4. Copy both of them

### Step 3: Add to Your Project
1. Open `C:\Users\amadi\Shopping_site\backend\.env`
2. Add these lines:
   ```
   PESAPAL_CONSUMER_KEY=your_consumer_key_here
   PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
   PESAPAL_ENV=sandbox
   ```

> **Note:** When you are ready to go live, you will register at [pesapal.com](https://pesapal.com), get live keys, and change `PESAPAL_ENV=live`.

---

## 🔵 Option 2: PayPal (Global)

### Step 1: Create a Developer Account
1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Log in with your existing personal PayPal account (or create one)
3. Go to the **Dashboard** (top right)

### Step 2: Create an App
1. Click **"Apps & Credentials"**
2. Make sure **"Sandbox"** is selected (toggle at the top)
3. Click **"Create App"**
4. Name it "Amadile Store" and click "Create App"

### Step 3: Get Your Credentials
1. You will see your **Client ID** and **Secret**
2. Copy both of them

### Step 4: Add to Your Project
1. Open `C:\Users\amadi\Shopping_site\backend\.env`
2. Add these lines:
   ```
   PAYPAL_CLIENT_ID=your_client_id_here
   PAYPAL_CLIENT_SECRET=your_secret_here
   ```

---

## 🚀 Testing Your Payments

Once you've added the keys to your `.env` file:

1. **Restart your backend server** (`npm start` in backend folder)
2. Go to Checkout
3. Select **Pesapal** or **PayPal**
4. **For Pesapal Sandbox:**
   *   Select "Mobile Money"
   *   Use test phone number: `0772123456` (MTN) or `0752123456` (Airtel)
   *   Wait for the simulation to complete
5. **For PayPal Sandbox:**
   *   Use the "Sandbox Personal Account" email/password provided in your PayPal Developer Dashboard

---

## ⚠️ Important Security Note

*   **NEVER** share your Secret Keys with anyone.
*   **NEVER** commit your `.env` file to public GitHub repositories.
