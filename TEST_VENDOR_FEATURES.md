# Vendor Features Testing Guide

## Quick Start

I've created comprehensive test files for you. Here are three ways to test:

---

## Option 1: Automated Test Script (Recommended)

**File**: `backend/test-vendor-features.js`

**Run**:
```bash
cd backend
node test-vendor-features.js
```

This script will:
- ✅ Test all vendor features automatically
- ✅ Show pass/fail for each test
- ✅ Provide detailed output
- ✅ Test all bug fixes

**Requirements**: 
- Backend server running on `http://localhost:5000`
- MongoDB connected

---

## Option 2: Jest Unit Tests

**File**: `backend/tests/vendor.test.js`

**Run**:
```bash
cd backend
npm test vendor.test.js
```

This uses Jest testing framework and provides:
- ✅ Isolated test environment
- ✅ Database cleanup
- ✅ Detailed test reports

---

## Option 3: Manual Testing with Postman/Thunder Client

**File**: `backend/tests/vendor-manual-test.md`

Follow the step-by-step guide to test each endpoint manually.

---

## Test Coverage

### ✅ Bug Fixes Tested

1. **Bug #1: Product Creation Vendor ID**
   - Test: `test5_CreateProduct()`
   - Verifies: Product links to Vendor document (not User)

2. **Bug #2: Commission Calculation**
   - Test: `test10_CommissionCalculation()`
   - Verifies: Commissions calculated on payment confirmation

3. **Bug #3: Vendor Orders Query**
   - Tests: `test11_VendorDashboard()`, `test12_ListVendorOrders()`
   - Verifies: Vendor can see their orders

4. **Bug #4: Mobile Money Payout Model**
   - Test: `test13_MobileMoneyPayout()`
   - Verifies: Mobile money payment methods supported

5. **Bug #5: Payout Request Mobile Money**
   - Test: `test13_MobileMoneyPayout()`
   - Verifies: Payout requests work with mobile money

### ✅ Feature Tests

- Vendor Registration
- Vendor Login
- Vendor Profile Management
- Product Creation & Listing
- Order Creation
- Commission Calculation
- Vendor Dashboard
- Vendor Orders
- Mobile Money Payouts
- Admin Vendor Management

---

## Running Tests

### Prerequisites

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Ensure MongoDB is Running**:
   ```bash
   # MongoDB should be running on localhost:27017
   # Or set MONGODB_URI in .env
   ```

3. **Set Environment Variables** (if needed):
   ```bash
   # In backend/.env
   MONGODB_URI=mongodb://localhost:27017/shopping_test
   JWT_SECRET=your_jwt_secret
   ```

### Run Automated Tests

```bash
cd backend
node test-vendor-features.js
```

### Expected Output

```
==================================================
VENDOR FEATURES TEST SUITE
==================================================

🧪 Test 1: Vendor Registration
==================================================
✅ PASS: Vendor registered successfully
   Vendor ID: 507f1f77bcf86cd799439011
   Status: pending

🧪 Test 2: Vendor Login
==================================================
✅ PASS: Vendor login successful
   Role: vendor

...

==================================================
TEST SUMMARY
==================================================
Total Tests: 12
✅ Passed: 12
❌ Failed: 0
Success Rate: 100.0%
==================================================
```

---

## Troubleshooting

### Issue: "Cannot connect to database"
**Solution**: Ensure MongoDB is running and connection string is correct

### Issue: "401 Unauthorized"
**Solution**: Check if tokens are being saved correctly between tests

### Issue: "404 Not Found"
**Solution**: Ensure backend server is running on correct port

### Issue: "Vendor profile not found"
**Solution**: Run tests in order - registration must happen first

---

## Manual Verification

After running tests, verify in MongoDB:

```javascript
// Check vendor
db.vendors.findOne({ businessEmail: "vendor@test.com" })

// Check product vendor link
db.products.findOne({ name: "Test Product" })

// Check order commissions
db.orders.findOne({ _id: ObjectId("...") })

// Check vendor stats
db.vendors.findOne({ _id: ObjectId("...") })
```

---

## Next Steps

1. ✅ Run automated tests
2. ✅ Review test results
3. ✅ Fix any failing tests
4. ✅ Test in production-like environment
5. ✅ Deploy to staging

---

**Status**: Ready for Testing ✅

