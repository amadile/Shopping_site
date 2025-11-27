# 🧪 Email Features Testing Guide

## ✅ System Status

- ✅ **Backend Running:** http://localhost:5000
- ✅ **Frontend Running:** http://localhost:3001
- ⚠️ **Email Setup:** NEEDS APP PASSWORD (see below)
- ✅ **MongoDB:** Connected
- ✅ **All Features:** Ready to test

---

## 🔧 IMPORTANT: Complete Email Setup First

### Your current email configuration is enabled but needs an App Password:

**Current Settings:**

```
EMAIL_USER=amadilemajid10@gmail.com
EMAIL_PASS=your-16-char-app-password-here  ⚠️ REPLACE THIS
```

### 📧 How to Get Gmail App Password (2 minutes):

1. **Go to Google Account Security:**

   - Visit: https://myaccount.google.com/security
   - Login with: amadilemajid10@gmail.com

2. **Enable 2-Step Verification** (if not already enabled)

   - Scroll to "2-Step Verification"
   - Click and follow the setup

3. **Create App Password:**

   - Visit: https://myaccount.google.com/apppasswords
   - Or search for "App passwords" in settings
   - Select: **Mail** and **Windows Computer**
   - Click "Generate"
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

4. **Update .env file:**

   - Open: `backend/.env`
   - Find line: `EMAIL_PASS=your-16-char-app-password-here`
   - Replace with: `EMAIL_PASS=abcdefghijklmnop` (without spaces)
   - Save file

5. **Restart Backend:**
   ```cmd
   # Press Ctrl+C in backend terminal
   # Then run: npm run dev
   ```

---

## 🧪 Test Scenarios (In Edge Browser)

### Open in Edge: http://localhost:3001

### Test 1: Order Confirmation Email ✉️

1. **Register a new account** or **login**
2. **Add products to cart:**
   - Browse products
   - Click "Add to Cart" (2-3 items)
3. **Go to Cart** and click "Checkout"

4. **Fill checkout form:**

   - Shipping address
   - Any details required

5. **Use Stripe Test Card:**

   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/25
   CVC: 123
   ZIP: 12345
   ```

6. **Complete Order**

**✅ Expected Result:**

- Order success message
- **Email sent to:** amadilemajid10@gmail.com
- **Subject:** "Order Confirmation - #[order-id]"
- **Contains:**
  - Order number and date
  - All items with prices
  - Total amount
  - "View Order Details" button

---

### Test 2: Status Update Email (Shipping) ✉️

1. **Login as Admin:**

   - You need admin account (create one or use existing)
   - Or use API directly

2. **Update Order Status to "Shipped":**

**Option A: Via Admin Panel**

- Go to: http://localhost:3001/admin/orders
- Find your order
- Click "Edit" or "Update Status"
- Change status to: **Shipped**
- Add tracking info:
  - Tracking Number: `1Z999AA10123456784`
  - Carrier: `UPS`
  - Estimated Delivery: Pick a future date

**Option B: Via API (Postman/Thunder Client)**

```http
POST http://localhost:5000/api/orders/[order-id]/tracking
Authorization: Bearer [your-admin-token]
Content-Type: application/json

{
  "trackingNumber": "1Z999AA10123456784",
  "carrier": "ups",
  "estimatedDelivery": "2025-11-20",
  "origin": "Warehouse, CA"
}
```

**✅ Expected Result:**

- **Email sent to:** amadilemajid10@gmail.com
- **Subject:** "Order Status Update - #[order-id]"
- **Contains:**
  - Status: Shipped
  - Tracking Number: 1Z999AA10123456784
  - Carrier: UPS
  - Direct tracking link
  - Estimated delivery date
  - "Track Your Order" button

---

### Test 3: Delivery Confirmation + Review Request ✉️

1. **Update Order Status to "Delivered":**
   - Admin panel or API
   - Change status to: **Delivered**

**✅ Expected Results (2 Emails):**

**Email 1: Delivery Confirmation**

- **Subject:** "Order Status Update - #[order-id]"
- **Contains:**
  - Status: Delivered
  - Delivery confirmation
  - "Leave a Review" button

**Email 2: Review Request** (may be delayed)

- **Subject:** "How was your purchase? Leave a review ⭐"
- **Contains:**
  - List of products purchased
  - Links to review each product
  - Encouragement to share feedback

---

### Test 4: Order Cancellation Email ✉️

1. **Place another order** (follow Test 1)

2. **Cancel the order:**
   - Go to: http://localhost:3001/orders/[order-id]
   - Click "Cancel Order" button
   - Enter reason: "Testing cancellation feature"
   - Confirm cancellation

**✅ Expected Results (2 Emails):**

**Email 1: Cancellation Confirmation**

- **Subject:** "Order Cancelled - #[order-id]"
- **Contains:**
  - Cancellation reason
  - Order details
  - Refund information (if paid)

**Email 2: Refund Confirmation** (if order was paid)

- **Subject:** "Refund Processed - #[order-id]"
- **Contains:**
  - Refund amount
  - Refund ID
  - Timeline (5-7 business days)
  - Refunded items list

---

### Test 5: Welcome Email (Bonus) ✉️

1. **Register a NEW account:**
   - Use a different email or delete test account
   - Fill registration form
   - Submit

**✅ Expected Result:**

- **Email sent to:** [new-email]
- **Subject:** "Welcome to Shopping Site! 🎉"
- **Contains:**
  - Welcome message
  - Optional welcome discount code
  - "Start Shopping" button

---

### Test 6: Password Reset Email (Bonus) ✉️

1. **Go to Login Page**
2. **Click "Forgot Password?"**
3. **Enter email:** amadilemajid10@gmail.com
4. **Submit**

**✅ Expected Result:**

- **Email sent to:** amadilemajid10@gmail.com
- **Subject:** "Password Reset Request - Shopping Site"
- **Contains:**
  - Reset link (valid 1 hour)
  - Security message
  - "Reset Password" button

---

## 📊 Check Email Logs

If emails aren't arriving, check the backend logs:

```cmd
# In backend terminal, you'll see:
[info]: Order confirmation email sent to amadilemajid10@gmail.com
[info]: Order status update email sent to amadilemajid10@gmail.com
[info]: Order cancellation email sent to amadilemajid10@gmail.com
```

**If you see errors:**

- Check Gmail App Password is correct
- Check 2-Step Verification is enabled
- Check email in spam folder

---

## 🎯 Tracking Features Test

### View Tracking Timeline:

1. **After marking order as "Shipped":**
   - Go to: http://localhost:3001/orders/[order-id]
   - Scroll down to **"Track Your Order"** section

**✅ You should see:**

- 📦 Tracking number with copy button
- 🚚 Carrier name (UPS)
- 📅 Estimated delivery date
- 🗺️ Map placeholder
- 📊 Visual timeline with events:
  - "Label created"
  - "Picked up by carrier"
  - "In transit"

2. **Test Refresh Button:**
   - Click "Refresh Tracking"
   - Mock data will update with realistic tracking events

---

## 🐛 Troubleshooting

### Problem: No emails arriving

**Check 1: Email Configuration**

```cmd
# Verify .env has correct settings
cd backend
type .env | findstr EMAIL
```

Should show:

```
EMAIL_USER=amadilemajid10@gmail.com
EMAIL_PASS=[your-16-char-app-password]
```

**Check 2: Backend Logs**

- Look for email-related errors in terminal
- Check if nodemailer is connecting

**Check 3: Gmail Settings**

- Verify 2-Step Verification is ON
- Verify App Password is active
- Check Gmail spam folder

**Check 4: Restart Backend**

```cmd
# Stop backend (Ctrl+C)
npm run dev
```

### Problem: Frontend can't connect to backend

**Check CORS settings:**

- Backend is on: http://localhost:5000
- Frontend is on: http://localhost:3001
- May need to add port 3001 to ALLOWED_ORIGINS in .env

**Quick Fix:**

```env
# In backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

---

## 📧 Email Templates Locations

If you want to customize email design:

- **Templates:** `backend/src/templates/emails/`
- **Order Confirmation:** `order-confirmation.html`
- **Status Updates:** `order-status.html`
- **Cancellation:** `order-cancellation.html`
- **Refund:** `refund-confirmation.html`
- **Welcome:** `welcome.html`
- **Password Reset:** `password-reset.html`
- **Review Request:** `review-request.html`
- **Base Template:** `base.html`

---

## 🎉 Success Checklist

After testing, you should have received:

- [ ] Order confirmation email
- [ ] Shipping notification email (with tracking)
- [ ] Delivery confirmation email
- [ ] Review request email
- [ ] Cancellation email (if tested)
- [ ] Refund confirmation email (if tested)
- [ ] Welcome email (if registered new account)
- [ ] Password reset email (if tested)

---

## 🚀 Next Steps

### To Enable Real-Time Carrier Tracking:

1. **Sign up for carrier APIs** (optional, $0-100/month):

   - FedEx: https://developer.fedex.com
   - UPS: https://www.ups.com/upsdeveloperkit
   - DHL: https://developer.dhl.com
   - USPS: https://www.usps.com/business/web-tools-apis/

2. **Add API keys to .env:**

```env
FEDEX_API_KEY=your_key
FEDEX_API_SECRET=your_secret
UPS_ACCESS_KEY=your_key
DHL_API_KEY=your_key
USPS_USER_ID=your_id
```

3. **Restart backend** - Real-time tracking will work automatically!

---

## 📞 Need Help?

**Documentation:**

- Full Email Status: `EMAIL_NOTIFICATIONS_STATUS.md`
- Tracking Guide: `TRACKING_IMPLEMENTATION_GUIDE.md`
- This Guide: `TESTING_EMAIL_FEATURES.md`

**Quick Links:**

- Frontend: http://localhost:3001
- Backend API: http://localhost:5000
- Gmail App Passwords: https://myaccount.google.com/apppasswords

**All features are ready to test!** 🎊
