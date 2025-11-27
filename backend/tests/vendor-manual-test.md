# Vendor Features Manual Testing Guide

This guide provides step-by-step instructions to manually test each vendor feature using API tools like Postman, curl, or Thunder Client.

## Prerequisites

1. Backend server running on `http://localhost:5000`
2. MongoDB database connected
3. API testing tool (Postman, Thunder Client, or curl)

---

## Test 1: Vendor Registration ✅

**Endpoint**: `POST /api/vendor/register`

**Request Body**:
```json
{
  "businessName": "Test Vendor Store",
  "businessEmail": "vendor1@test.com",
  "businessPhone": "+256700000000",
  "password": "Test123456",
  "district": "Kampala",
  "zone": "Nakawa",
  "landmark": "Near Shell Station",
  "businessType": "company",
  "tinNumber": "TIN123456"
}
```

**Expected Response**: `201 Created`
```json
{
  "message": "Vendor registration successful...",
  "token": "jwt_token_here",
  "vendor": {
    "id": "vendor_id",
    "businessName": "Test Vendor Store",
    "status": "pending"
  }
}
```

**Save**: `vendorToken` and `vendorId` for later tests

---

## Test 2: Vendor Login ✅

**Endpoint**: `POST /api/vendor/login`

**Request Body**:
```json
{
  "email": "vendor1@test.com",
  "password": "Test123456"
}
```

**Expected Response**: `200 OK`
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "role": "vendor",
    "vendorProfile": {
      "id": "vendor_id",
      "businessName": "Test Vendor Store"
    }
  }
}
```

---

## Test 3: Get Vendor Profile ✅

**Endpoint**: `GET /api/vendor/profile`

**Headers**:
```
Authorization: Bearer {vendorToken}
```

**Expected Response**: `200 OK`
```json
{
  "vendor": {
    "businessName": "Test Vendor Store",
    "businessEmail": "vendor1@test.com",
    "verificationStatus": "pending",
    "address": {
      "district": "Kampala",
      "zone": "Nakawa"
    }
  }
}
```

---

## Test 4: Update Vendor Profile ✅

**Endpoint**: `PUT /api/vendor/profile`

**Headers**:
```
Authorization: Bearer {vendorToken}
```

**Request Body**:
```json
{
  "description": "Updated store description",
  "payoutInfo": {
    "preferredMethod": "mtn_momo",
    "mobileMoneyNumbers": {
      "mtn": "+256700000000",
      "airtel": "+256700000001"
    }
  }
}
```

**Expected Response**: `200 OK`
```json
{
  "message": "Profile updated",
  "vendor": {
    "description": "Updated store description",
    "payoutInfo": {
      "preferredMethod": "mtn_momo"
    }
  }
}
```

---

## Test 5: Create Product (Bug Fix #1) ✅

**Endpoint**: `POST /api/products`

**Headers**:
```
Authorization: Bearer {vendorToken}
```

**Request Body**:
```json
{
  "name": "Test Product",
  "description": "Test product description",
  "price": 50000,
  "category": "Electronics",
  "stock": 100,
  "images": ["https://example.com/image.jpg"]
}
```

**Expected Response**: `201 Created`
```json
{
  "_id": "product_id",
  "name": "Test Product",
  "vendor": {
    "_id": "vendor_id",
    "businessName": "Test Vendor Store"
  }
}
```

**Verify**: 
- `vendor` field should be a Vendor document (with `businessName`), NOT a User document
- Product is linked to correct vendor

**Save**: `productId` for later tests

---

## Test 6: List Vendor Products ✅

**Endpoint**: `GET /api/vendor/products`

**Headers**:
```
Authorization: Bearer {vendorToken}
```

**Expected Response**: `200 OK`
```json
{
  "products": [
    {
      "_id": "product_id",
      "name": "Test Product",
      "vendor": "vendor_id"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 1
  }
}
```

**Verify**: All products belong to the logged-in vendor

---

## Test 7: Register Customer & Create Order ✅

### 7a. Register Customer

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "name": "Test Customer",
  "email": "customer1@test.com",
  "password": "Test123456",
  "phone": "+256700000002"
}
```

**Save**: `customerToken`

### 7b. Add Product to Cart

**Endpoint**: `POST /api/cart/add`

**Headers**:
```
Authorization: Bearer {customerToken}
```

**Request Body**:
```json
{
  "productId": "{productId}",
  "quantity": 2
}
```

### 7c. Create Order

**Endpoint**: `POST /api/orders/checkout`

**Headers**:
```
Authorization: Bearer {customerToken}
```

**Request Body**:
```json
{
  "shippingAddress": {
    "fullName": "Test Customer",
    "phone": "+256700000002",
    "addressLine1": "Test Address",
    "city": "Kampala",
    "state": "Central",
    "zipCode": "00000",
    "country": "Uganda",
    "district": "Kampala",
    "zone": "Nakawa",
    "landmark": "Near Shell Station"
  },
  "paymentMethod": "cod"
}
```

**Expected Response**: `201 Created`
```json
{
  "_id": "order_id",
  "status": "pending",
  "total": 100000
}
```

**Save**: `orderId`

---

## Test 8: Commission Calculation (Bug Fix #2) ✅

**Endpoint**: `POST /api/payment/cod/confirm`

**Headers**:
```
Authorization: Bearer {customerToken}
```

**Request Body**:
```json
{
  "orderId": "{orderId}"
}
```

**Expected Response**: `200 OK`

**Verify in Database**:
```javascript
// Check order
const order = await Order.findById(orderId);
console.log("Vendor Commission:", order.vendorCommission); // Should be > 0
console.log("Platform Commission:", order.platformCommission); // Should be > 0
console.log("Vendor ID:", order.vendor); // Should be vendorId

// Check vendor stats
const vendor = await Vendor.findById(vendorId);
console.log("Total Revenue:", vendor.totalRevenue); // Should be > 0
console.log("Total Commission:", vendor.totalCommission); // Should be > 0
console.log("Pending Payout:", vendor.pendingPayout); // Should be > 0
console.log("Total Orders:", vendor.totalOrders); // Should be 1
```

**Expected**: 
- ✅ `order.vendorCommission > 0`
- ✅ `order.platformCommission > 0`
- ✅ `order.vendor` equals `vendorId`
- ✅ `vendor.totalRevenue > 0`
- ✅ `vendor.pendingPayout > 0`

---

## Test 9: Vendor Dashboard (Bug Fix #3) ✅

**Endpoint**: `GET /api/vendor/dashboard`

**Headers**:
```
Authorization: Bearer {vendorToken}
```

**Expected Response**: `200 OK`
```json
{
  "dashboard": {
    "overview": {
      "totalSales": 1,
      "totalRevenue": 100000,
      "totalCommission": 15000,
      "pendingPayout": 85000,
      "totalOrders": 1
    },
    "recentOrders": [
      {
        "id": "order_id",
        "customer": "Test Customer",
        "total": 100000,
        "status": "paid"
      }
    ]
  }
}
```

**Verify**: 
- ✅ `recentOrders` array is NOT empty
- ✅ `totalOrders` matches number of orders
- ✅ Orders belong to this vendor

---

## Test 10: List Vendor Orders (Bug Fix #3) ✅

**Endpoint**: `GET /api/vendor/orders`

**Headers**:
```
Authorization: Bearer {vendorToken}
```

**Expected Response**: `200 OK`
```json
{
  "orders": [
    {
      "_id": "order_id",
      "status": "paid",
      "total": 100000,
      "items": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "total": 1
  }
}
```

**Verify**: 
- ✅ Orders array is NOT empty
- ✅ All orders contain vendor's products
- ✅ Can filter by status: `GET /api/vendor/orders?status=paid`

---

## Test 11: Update Order Status ✅

**Endpoint**: `PUT /api/vendor/orders/{orderId}/status`

**Headers**:
```
Authorization: Bearer {vendorToken}
```

**Request Body**:
```json
{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

**Expected Response**: `200 OK`

**Verify**: Order status updated in database

---

## Test 12: Vendor Analytics ✅

**Endpoint**: `GET /api/vendor/analytics?period=month`

**Headers**:
```
Authorization: Bearer {vendorToken}
```

**Expected Response**: `200 OK`
```json
{
  "analytics": {
    "sales": {
      "total": 1,
      "revenue": 100000
    }
  },
  "topProducts": [...],
  "salesTrend": [...]
}
```

---

## Test 13: Mobile Money Payout Request (Bug Fix #4 & #5) ✅

**Prerequisite**: Vendor must be approved first (see Test 15)

**Endpoint**: `POST /api/vendor/payout/request`

**Headers**:
```
Authorization: Bearer {vendorToken}
```

**Request Body**:
```json
{
  "amount": 50000
}
```

**Expected Response**: `201 Created`
```json
{
  "message": "Payout requested",
  "payout": {
    "id": "payout_id",
    "amount": 50000,
    "paymentMethod": "mtn_momo",
    "status": "pending",
    "paymentDetails": {
      "mobileMoneyNumber": "+256700000000",
      "mobileMoneyNetwork": "mtn"
    }
  }
}
```

**Verify**: 
- ✅ `paymentMethod` is `"mtn_momo"` or `"airtel_money"`
- ✅ `paymentDetails.mobileMoneyNumber` is set
- ✅ `paymentDetails.mobileMoneyNetwork` is set

---

## Test 14: List Payout History ✅

**Endpoint**: `GET /api/vendor/payouts`

**Headers**:
```
Authorization: Bearer {vendorToken}
```

**Expected Response**: `200 OK`
```json
{
  "payouts": [
    {
      "_id": "payout_id",
      "amount": 50000,
      "status": "pending",
      "paymentMethod": "mtn_momo"
    }
  ],
  "summary": {
    "pending": {
      "amount": 50000,
      "count": 1
    }
  }
}
```

---

## Test 15: Admin - Approve Vendor ✅

**Prerequisite**: Create admin user first

**Endpoint**: `PUT /api/admin/vendors/{vendorId}/verify`

**Headers**:
```
Authorization: Bearer {adminToken}
```

**Request Body**:
```json
{
  "status": "approved",
  "reason": "All documents verified"
}
```

**Expected Response**: `200 OK`

**Verify**: Vendor `isVerified` is now `true`

---

## Test 16: Admin - List Vendors ✅

**Endpoint**: `GET /api/admin/vendors`

**Headers**:
```
Authorization: Bearer {adminToken}
```

**Expected Response**: `200 OK`
```json
{
  "vendors": [
    {
      "_id": "vendor_id",
      "businessName": "Test Vendor Store",
      "verificationStatus": "approved"
    }
  ]
}
```

---

## Test 17: Admin - Process Payout ✅

**Endpoint**: `PUT /api/payout/admin/{payoutId}/process`

**Headers**:
```
Authorization: Bearer {adminToken}
```

**Expected Response**: `200 OK`
```json
{
  "message": "Payout processing",
  "payout": {
    "status": "processing"
  }
}
```

---

## Test 18: Complete Integration Flow ✅

Test the complete workflow:

1. ✅ Vendor registers
2. ✅ Vendor creates product
3. ✅ Customer registers
4. ✅ Customer adds product to cart
5. ✅ Customer creates order
6. ✅ Customer pays (mobile money or COD)
7. ✅ **Verify commissions calculated**
8. ✅ **Verify vendor sees order**
9. ✅ Vendor updates order status
10. ✅ Vendor requests payout
11. ✅ Admin processes payout

---

## Common Issues & Solutions

### Issue: "Vendor profile not found"
**Solution**: Make sure vendor registration completed successfully

### Issue: "Forbidden" when updating order
**Solution**: Verify order belongs to vendor (check `order.vendor` field)

### Issue: Orders not showing in vendor dashboard
**Solution**: 
- Check if commissions were calculated (order should have `vendor` field)
- Verify order contains vendor's products

### Issue: Payout request fails
**Solution**: 
- Vendor must be approved (`isVerified: true`)
- Vendor must have mobile money number configured
- Amount must be >= 50,000 UGX

---

## Verification Checklist

After running all tests, verify:

- [ ] Products are linked to Vendor documents (not User)
- [ ] Orders calculate commissions on payment
- [ ] Vendor can see their orders
- [ ] Vendor dashboard shows correct statistics
- [ ] Mobile money payouts work
- [ ] Admin can manage vendors
- [ ] Admin can process payouts

---

**Status**: All tests should pass ✅

