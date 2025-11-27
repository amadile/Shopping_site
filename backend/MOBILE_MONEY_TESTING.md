# Mobile Money Integration - Testing Guide

## ✅ Backend Implementation Complete

### What's Been Built

1. **Flutterwave Service** (`src/services/flutterwave.js`)
   - Payment initiation for MTN & Airtel Money
   - Payment verification
   - Vendor payouts
   - Provider auto-detection
   - Webhook validation

2. **Payment Routes** (`src/routes/payment-mobile-money.js`)
   - `POST /api/payment/mobile-money/initiate` - Initiate payment
   - `GET /api/payment/mobile-money/verify/:id` - Verify payment
   - `GET /api/payment/mobile-money/status/:txRef` - Check status
   - `POST /api/payment/mobile-money/webhook` - Flutterwave webhooks

3. **Order Model** - Already supports mobile money fields

## 🔑 Setup Required for Testing

### 1. Get Flutterwave Credentials

1. Go to https://dashboard.flutterwave.com/
2. Sign up for a free account
3. Navigate to Settings → API Keys
4. Copy your **Sandbox** credentials:
   - Public Key (starts with `FLWPUBK_TEST-`)
   - Secret Key (starts with `FLWSECK_TEST-`)
   - Encryption Key

### 2. Update .env File

```env
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_actual_key_here
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_actual_key_here
FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key_here
FLUTTERWAVE_ENV=sandbox
```

### 3. Restart Backend Server

```bash
npm start
```

## 🧪 Running Tests

### Option 1: With Flutterwave Credentials
```bash
node test-mobile-money.js
```

This will test:
- ✅ Payment initiation (MTN & Airtel)
- ✅ Phone number validation
- ✅ Provider auto-detection
- ✅ Payment verification
- ✅ Webhook handling

### Option 2: Without Credentials (Unit Tests)
```bash
# Test phone number validation only
node -e "
const phone = '+256777123456';
const regex = /^\+256\d{9}$/;
console.log('Phone validation:', regex.test(phone) ? '✅ PASS' : '❌ FAIL');
"
```

## 📱 Test Phone Numbers (Uganda)

### MTN Mobile Money
- `+256777123456` (77x prefix)
- `+256787654321` (78x prefix)
- `+256767654321` (76x prefix)
- `+256397654321` (39x prefix)

### Airtel Money
- `+256750123456` (75x prefix)
- `+256700123456` (70x prefix)
- `+256747654321` (74x prefix)
- `+256207654321` (20x prefix)

## 🔄 Payment Flow

### Customer Payment
```
1. Customer selects mobile money at checkout
2. Enters phone number (+256...)
3. Backend initiates payment via Flutterwave
4. Customer receives prompt on phone
5. Customer enters PIN to approve
6. Flutterwave sends webhook to backend
7. Order status updated to "paid"
```

### Vendor Payout
```
1. Vendor requests payout
2. Admin approves payout
3. Backend initiates transfer via Flutterwave
4. Vendor receives money in mobile money account
```

## 🎯 API Endpoints

### Initiate Payment
```bash
POST /api/payment/mobile-money/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439011",
  "phoneNumber": "+256777123456",
  "provider": "mtn"  // optional, auto-detected
}
```

### Verify Payment
```bash
GET /api/payment/mobile-money/verify/:transactionId
Authorization: Bearer <token>
```

### Check Status
```bash
GET /api/payment/mobile-money/status/:txRef
Authorization: Bearer <token>
```

## ⚠️ Important Notes

1. **Sandbox Mode**: Always use sandbox credentials for testing
2. **Test Cards**: Flutterwave provides test phone numbers for sandbox
3. **Webhooks**: Configure webhook URL in Flutterwave dashboard
4. **Phone Format**: Must be Uganda format (+256XXXXXXXXX)
5. **Currency**: Defaults to UGX (Ugandan Shillings)

## 🐛 Troubleshooting

### Error: "Public Key required"
- Check `.env` file has valid Flutterwave keys
- Restart backend server after updating .env

### Error: "Invalid phone number"
- Use Uganda format: +256XXXXXXXXX
- Check phone number has exactly 9 digits after +256

### Error: "Payment initiation failed"
- Verify Flutterwave credentials are correct
- Check you're using sandbox keys (FLWPUBK_TEST-)
- Ensure backend server is running

## ✨ Next Steps

1. **Get Flutterwave Credentials** - Sign up and get sandbox keys
2. **Update .env** - Add your credentials
3. **Run Tests** - Verify integration works
4. **Build Frontend** - Create mobile money checkout UI
5. **Test End-to-End** - Complete payment flow
6. **Go Live** - Switch to production credentials

## 📚 Resources

- [Flutterwave Documentation](https://developer.flutterwave.com/)
- [Mobile Money API](https://developer.flutterwave.com/docs/collecting-payments/mobile-money)
- [Sandbox Testing](https://developer.flutterwave.com/docs/integration-guides/testing-helpers)
