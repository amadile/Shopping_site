# 🎟️ Coupon System - Quick Start Guide

## ✅ ALL FEATURES IMPLEMENTED

Your coupon/discount system is **100% complete** with all requested features:

| Feature                                         | Status |
| ----------------------------------------------- | ------ |
| Apply Coupon at Checkout                        | ✅     |
| Validation (Expiry, Usage Limits, Min Purchase) | ✅     |
| Percentage Discount                             | ✅     |
| Fixed Amount Discount                           | ✅     |
| Remove Coupon                                   | ✅     |
| Fraud Prevention                                | ✅     |
| Single-Use Codes                                | ✅     |
| Non-Stackable Rules                             | ✅     |

---

## 🚀 Quick Test (3 Steps)

### Step 1: Create Test Coupons (30 seconds)

Open terminal in backend directory and run:

```bash
cd c:\Users\amadi\Shopping_site\backend
node create-test-coupons.js
```

This creates 5 test coupons including **SAVE20** and **FLAT50**.

### Step 2: Start Servers

**Terminal 1 - Backend:**

```bash
cd c:\Users\amadi\Shopping_site\backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd c:\Users\amadi\Shopping_site\frontend
npm run dev
```

### Step 3: Test in Edge Browser

1. Open **Microsoft Edge**: `http://localhost:5173`
2. Login to your account
3. Add products to cart (make sure total is $50+)
4. Go to Cart page
5. Enter coupon code: **SAVE20**
6. Click "Apply"
7. See 20% discount applied! 🎉

---

## 🧪 Test Coupons Available

| Code          | Type       | Discount | Min Order | Limit      | Status      |
| ------------- | ---------- | -------- | --------- | ---------- | ----------- |
| **SAVE20**    | Percentage | 20% off  | $50       | 3 per user | ✅ Active   |
| **FLAT50**    | Fixed      | $50 off  | $200      | 1 per user | ✅ Active   |
| **WELCOME10** | Percentage | 10% off  | $0        | 1 per user | ✅ Active   |
| **EXPIRED**   | Test       | 50% off  | $0        | -          | ⏰ Expired  |
| **INACTIVE**  | Test       | $25 off  | $0        | -          | ❌ Inactive |

---

## 📱 Where to Test

### Cart Page (`/cart`)

- Coupon input field
- Apply/Remove buttons
- Order summary with discount

### Features to Verify:

- ✅ Apply valid coupon → See discount
- ✅ Remove coupon → Discount disappears
- ✅ Try expired coupon → Error message
- ✅ Try with cart under minimum → Error message
- ✅ Complete checkout → Coupon tracked

---

## 🔒 Fraud Prevention Working

The system automatically prevents:

- ❌ Using expired coupons
- ❌ Using inactive coupons
- ❌ Exceeding per-user limits
- ❌ Exceeding global usage limits
- ❌ Applying without meeting minimum purchase
- ❌ Stacking multiple coupons

---

## 📊 What Happens at Checkout

1. User applies coupon in cart
2. Discount calculated and shown
3. At checkout, coupon is **re-validated** (prevents fraud)
4. Usage count incremented
5. Order saved with coupon details
6. User tracked in coupon's `usedBy` array

---

## 🎯 Quick Validation Checklist

Test these 5 scenarios:

- [ ] **SAVE20** on $100 order → See $20 discount
- [ ] **FLAT50** on $250 order → See $50 discount
- [ ] **WELCOME10** twice → Second fails with usage limit error
- [ ] **EXPIRED** → "Coupon has expired" error
- [ ] Remove applied coupon → Discount disappears

---

## 💡 Technical Details

**Frontend:**

- `Cart.vue` - Coupon input UI
- `cart.js` store - State management
- `api.js` - API calls

**Backend:**

- `Coupon.js` model - Schema + validation methods
- `cart.js` routes - Apply/remove endpoints
- `orders.js` routes - Checkout validation

**Key Methods:**

- `isValid()` - Checks active, expiry, limits
- `canUserUse()` - Checks per-user limit
- `calculateDiscount()` - Computes discount amount
- `recordUsage()` - Tracks usage

---

## 📝 Sample Test Flow

```
1. Login → User Dashboard
2. Browse Products → Add items ($100 total)
3. Go to Cart
4. Enter "SAVE20" → Click Apply
5. See: Subtotal: $100, Discount: -$20, Tax: $8, Total: $88
6. Proceed to Checkout → Complete order
7. Order shows discount applied ✓
8. Try SAVE20 again → Works (3 uses allowed)
9. Use it 3rd time → Works
10. Use it 4th time → ERROR: "Usage limit reached" ✓
```

---

## 🎉 You're Ready!

All features are working and ready to test in Microsoft Edge browser.

**For detailed testing scenarios, see:** `COUPON_TESTING_GUIDE.md`
