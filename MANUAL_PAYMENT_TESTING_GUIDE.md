# 🧪 Manual Mobile Money - Complete Testing Guide

## 📋 Overview

This guide walks you through the **complete end-to-end flow** of the Manual Mobile Money payment system with **sample test data**.

---

## 🎯 How It Works (End-to-End)

### **The Complete Flow:**

```
Customer → Vendor → Payment → Verification → Order Complete
```

### **Step-by-Step Process:**

1. **Customer** adds items to cart and goes to checkout
2. **Customer** selects "Manual Mobile Money" as payment method
3. **System** fetches the vendor's payment numbers (or platform defaults)
4. **Customer** sees MTN/Airtel numbers and order total
5. **Customer** opens their mobile money app and sends money
6. **Customer** receives SMS with Transaction ID
7. **Customer** enters Transaction ID on website
8. **Order** is created with status "pending"
9. **Vendor/Admin** sees pending payment in dashboard
10. **Vendor/Admin** verifies Transaction ID in their mobile money app
11. **Vendor/Admin** clicks "Verify Payment" on website
12. **Order** status changes to "paid"
13. **Customer** receives confirmation

---

## 🧪 Testing Guide with Sample Data

### **Prerequisites:**
- ✅ Backend running on `http://localhost:5000`
- ✅ Frontend running on `http://localhost:3000`
- ✅ At least one user account (customer)
- ✅ At least one vendor account (optional, for vendor-specific testing)
- ✅ At least one product in the system

---

## 📝 Test Scenario 1: Platform Default Payment

**Goal:** Test manual payment with platform default numbers (no vendor)

### **Step 1: Configure Platform Defaults**

Check your `backend/.env` file has:
```bash
MERCHANT_MTN_NUMBER=+256777123456
MERCHANT_MTN_NAME=Amadile Store
MERCHANT_AIRTEL_NUMBER=+256752123456
MERCHANT_AIRTEL_NAME=Amadile Store
MERCHANT_BUSINESS_EMAIL=amadilemajid10@gmail.com
```

### **Step 2: Customer - Add to Cart**

1. Go to `http://localhost:3000`
2. Browse products
3. Click "Add to Cart" on any product
4. Click cart icon → "Checkout"

### **Step 3: Customer - Checkout**

1. Fill in shipping address:
   ```
   Full Name: John Doe
   Phone: +256777999888
   Street: 123 Test Street
   City: Kampala
   District: Central
   Zone: Nakawa
   ```

2. Scroll to "Payment Method"
3. Select **"Manual Mobile Money"** (green badge: "No API Needed")
4. You should see:
   ```
   ✓ Send money to our MTN/Airtel number
   ✓ Submit your Transaction ID to confirm
   ✓ No API setup required - works immediately!
   ```

5. Click **"Place Order"**

### **Step 4: Customer - Payment Page**

You'll be redirected to `/cart/manual-momo/{orderId}`

**What you see:**
- Order summary with total amount
- Payment instructions (step-by-step)
- **MTN Number:** +256777123456 (Name: Amadile Store)
- **Airtel Number:** +256752123456 (Name: Amadile Store)
- Form to enter Transaction ID

### **Step 5: Customer - Submit Transaction ID**

**Sample Test Data:**
```
Phone Number: +256777999888
Transaction ID: TEST-MP241126-1234-A12345
```

1. Enter the phone number you "sent" money from
2. Enter a fake Transaction ID (format: `TEST-MP241126-1234-A12345`)
3. Click **"Submit Payment"**

**Expected Result:**
- ✅ Success message: "Payment details submitted successfully!"
- ✅ Redirected to order details page
- ✅ Order status shows "pending"

### **Step 6: Admin - View Pending Payments**

1. Login as admin
2. Go to `http://localhost:3000/admin`
3. **You should see a YELLOW ALERT BANNER:**
   ```
   ⚠️ 1 Pending Manual Payment
   
   Order #ABC123
   John Doe - john@example.com
   Transaction ID: TEST-MP241126-1234-A12345
   UGX 50,000
   2 minutes ago
   
   [📱 Verify Payments (1)] [🔄 Refresh]
   ```

4. Click **"Verify Payments"** button

### **Step 7: Admin - Verify Payment**

You'll be redirected to `/admin/manual-payments`

**What you see:**
- List of all pending manual payments
- Each shows:
  - Order number
  - Customer name & email
  - Phone number used
  - **Transaction ID** (large, monospace font)
  - Order total
  - Time submitted

**Sample Payment Card:**
```
Order #ABC123
2025-11-26 14:30:00

Customer: John Doe
john@example.com

Phone Number: +256777999888

Transaction ID:
TEST-MP241126-1234-A12345

UGX 50,000

[✓ Verify & Confirm Payment] [👁️ View Order]
```

### **Step 8: Admin - Confirm Payment**

1. **In Real Life:** Check your MTN/Airtel mobile money app for incoming payment
2. **In Testing:** Just verify the Transaction ID matches
3. Click **"✓ Verify & Confirm Payment"**

**Expected Result:**
- ✅ Success message: "Payment verified successfully!"
- ✅ Payment removed from pending list
- ✅ Order status changed to "paid"

### **Step 9: Customer - Check Order Status**

1. Customer goes to `http://localhost:3000/orders`
2. Finds their order
3. **Status now shows: "Paid"** ✅

---

## 📝 Test Scenario 2: Vendor-Specific Payment

**Goal:** Test manual payment with vendor's own numbers

### **Step 1: Vendor - Configure Payment Numbers**

1. Login as vendor
2. Go to `http://localhost:3000/vendor`
3. **You should see a BLUE ALERT:**
   ```
   📱 Configure Your Payment Numbers
   
   Set up your MTN and Airtel Mobile Money numbers...
   
   [⚙️ Configure Payment Settings]
   ```

4. Click **"Configure Payment Settings"**
5. You'll be at `/vendor/payment-settings`

### **Step 2: Vendor - Enter Payment Numbers**

**Sample Vendor Data:**
```
MTN Number: +256777555444
MTN Account Name: John's Electronics

Airtel Number: +256752666777
Airtel Account Name: John's Electronics
```

1. Fill in the form with above data
2. Click **"💾 Save Payment Configuration"**

**Expected Result:**
- ✅ Success message: "Payment configuration saved successfully!"
- ✅ Preview section shows your numbers

### **Step 3: Vendor - Check Dashboard**

1. Go back to `/vendor` dashboard
2. **You should now see a GREEN SUCCESS BANNER:**
   ```
   ✓ Payment Settings Configured
   MTN: +256777555444 | Airtel: +256752666777
   
   [Edit Settings]
   ```

### **Step 4: Customer - Buy from Vendor**

1. Logout and login as customer
2. Find a product from this vendor
3. Add to cart and checkout
4. Select **"Manual Mobile Money"**
5. Place order

### **Step 5: Customer - See Vendor's Numbers**

On the payment page, you should now see:

```
MTN Mobile Money
+256777555444
Name: John's Electronics

Airtel Money
+256752666777
Name: John's Electronics
```

**NOT the platform defaults!**

### **Step 6: Complete Payment**

**Sample Test Data:**
```
Phone Number: +256777888999
Transaction ID: VENDOR-TEST-241126-9876-B54321
```

Submit and continue as in Scenario 1.

---

## 🎨 Visual Flow Diagram

```
┌─────────────┐
│  Customer   │
│  Shopping   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Checkout   │
│  Select:    │
│  Manual     │
│  Mobile $   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  System Checks:         │
│  - Is this vendor order?│
│  - Vendor has config?   │
│  YES → Vendor numbers   │
│  NO  → Platform numbers │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Payment Page           │
│  Shows:                 │
│  - MTN: +256777...      │
│  - Airtel: +256752...   │
│  - Transaction ID form  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Customer Actions:      │
│  1. Open mobile app     │
│  2. Send money          │
│  3. Get SMS with ID     │
│  4. Enter ID on site    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Order Created          │
│  Status: PENDING        │
│  Saved:                 │
│  - Transaction ID       │
│  - Phone number         │
│  - Payment method       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Admin Dashboard        │
│  Shows YELLOW ALERT:    │
│  "1 Pending Payment"    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Admin Verification     │
│  1. Check mobile app    │
│  2. Verify Trans ID     │
│  3. Click "Verify"      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Order Updated          │
│  Status: PAID ✅        │
│  Customer notified      │
└─────────────────────────┘
```

---

## 🧪 Sample Test Data Sets

### **Test Set 1: Basic Payment**
```javascript
Customer: {
  name: "Alice Nakato",
  email: "alice@test.com",
  phone: "+256777111222"
}

Order: {
  total: 75000,
  items: 2
}

Payment: {
  phoneNumber: "+256777111222",
  transactionId: "MP241126.1430.A11111"
}
```

### **Test Set 2: Large Order**
```javascript
Customer: {
  name: "Bob Okello",
  email: "bob@test.com",
  phone: "+256752333444"
}

Order: {
  total: 500000,
  items: 5
}

Payment: {
  phoneNumber: "+256752333444",
  transactionId: "AM241126.1445.B22222"
}
```

### **Test Set 3: Multiple Pending**
Create 3 orders with different customers to test the admin panel with multiple pending payments.

---

## ✅ Validation Checklist

### **Phone Number Validation:**
- ✅ Must start with `+256`
- ✅ Must have exactly 9 digits after +256
- ✅ Format: `+256XXXXXXXXX`
- ❌ Invalid: `0777123456` (missing +256)
- ❌ Invalid: `+256 777 123 456` (spaces)
- ❌ Invalid: `+25677123456` (only 8 digits)

### **Transaction ID Validation:**
- ✅ Minimum 10 characters
- ✅ Can contain letters, numbers, dots, hyphens
- ✅ Examples:
  - `MP241126.1234.A12345`
  - `TEST-PAYMENT-001`
  - `AM20251126-5678`

---

## 🐛 Troubleshooting

### **Issue: "No pending manual payments"**
**Solution:**
1. Make sure you created an order with "Manual Mobile Money"
2. Make sure you submitted a Transaction ID
3. Check order status is "pending" (not "paid")
4. Refresh the admin dashboard

### **Issue: "Invalid phone number format"**
**Solution:**
- Use format: `+256777123456`
- No spaces, no dashes
- Must start with +256

### **Issue: "Transaction ID seems too short"**
**Solution:**
- Use at least 10 characters
- Example: `TEST123456789`

### **Issue: Payment page shows platform numbers instead of vendor numbers**
**Solution:**
1. Make sure vendor configured their numbers at `/vendor/payment-settings`
2. Make sure the product belongs to that vendor
3. Check vendor's `payoutInfo.mobileMoneyNumbers` in database

---

## 📊 Database Verification

### **Check Order in Database:**
```javascript
// In MongoDB
db.orders.findOne({ _id: ObjectId("your-order-id") })

// Should show:
{
  paymentMethod: "manual_momo",
  manualTransactionId: "TEST-MP241126-1234-A12345",
  mobileMoneyNumber: "+256777999888",
  status: "pending" // or "paid" after verification
}
```

### **Check Vendor Config:**
```javascript
// In MongoDB
db.vendors.findOne({ user: ObjectId("vendor-user-id") })

// Should show:
{
  payoutInfo: {
    mobileMoneyNumbers: {
      mtn: "+256777555444",
      mtnAccountName: "John's Electronics",
      airtel: "+256752666777",
      airtelAccountName: "John's Electronics"
    }
  }
}
```

---

## 🎯 Success Criteria

After testing, you should have:

- ✅ Created at least 1 test order
- ✅ Submitted a Transaction ID
- ✅ Seen the pending payment in admin dashboard
- ✅ Verified the payment
- ✅ Order status changed to "paid"
- ✅ (Optional) Configured vendor payment numbers
- ✅ (Optional) Tested vendor-specific payment flow

---

## 🚀 Production Checklist

Before going live:

- [ ] Update `MERCHANT_MTN_NUMBER` with real number
- [ ] Update `MERCHANT_MTN_NAME` with real business name
- [ ] Update `MERCHANT_AIRTEL_NUMBER` with real number
- [ ] Update `MERCHANT_AIRTEL_NAME` with real business name
- [ ] Update `MERCHANT_BUSINESS_EMAIL` with real email
- [ ] Test with real mobile money transaction
- [ ] Train staff on verification process
- [ ] Set up notification system for pending payments
- [ ] Document your verification workflow

---

## 💡 Pro Tips

1. **Check Payments Regularly:** Set a schedule (every 2 hours during business hours)
2. **Keep Records:** Screenshot Transaction IDs for dispute resolution
3. **Communicate Timing:** Tell customers verification takes 1-2 hours
4. **Weekend Handling:** Set up auto-response for off-hours
5. **Upgrade Path:** When ready, add Pesapal/DusuPay alongside manual payments

---

**Your Manual Mobile Money system is ready for testing!** 🎉

Start with Test Scenario 1, then move to Scenario 2 to test the full multi-vendor capability.
