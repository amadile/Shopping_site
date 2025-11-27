# Vendor Portal Implementation Guide

## Overview

The Vendor Portal is a comprehensive marketplace management system that allows multiple vendors to sell their products on your platform. It includes vendor registration, product management, order fulfillment, analytics, commission tracking, and payout management.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Database Models](#database-models)
4. [API Endpoints](#api-endpoints)
5. [Usage Guide](#usage-guide)
6. [Admin Management](#admin-management)
7. [Commission System](#commission-system)
8. [Payout System](#payout-system)
9. [Integration](#integration)
10. [Security](#security)

---

## Features

### Vendor Features

- ✅ **Vendor Registration & Verification**

  - Business information management
  - Document upload for verification
  - Multi-status verification workflow (pending, approved, rejected, suspended)

- ✅ **Vendor Dashboard**

  - Real-time sales statistics
  - Revenue and commission tracking
  - Order management
  - Product analytics
  - Performance metrics

- ✅ **Order Management**

  - View all orders containing vendor's products
  - Update order status
  - Add tracking numbers
  - Filter by status and date

- ✅ **Product Management**

  - Create, update, and delete products
  - Manage product variants
  - Track inventory
  - View product analytics

- ✅ **Analytics & Reporting**

  - Sales trends (daily, weekly, monthly, yearly)
  - Top-selling products
  - Revenue analysis
  - Customer insights
  - Performance metrics

- ✅ **Payout Management**

  - Request payouts
  - View payout history
  - Multiple payment methods (Bank, PayPal, Stripe)
  - Automatic commission calculation

- ✅ **Profile Management**
  - Business information
  - Logo and banner upload
  - Social media links
  - Shipping options
  - Notification preferences

### Admin Features

- ✅ **Vendor Verification**

  - Approve/reject vendor applications
  - Review verification documents
  - Suspend vendor accounts

- ✅ **Commission Management**

  - Set custom commission rates per vendor
  - Track total commissions
  - Generate commission reports

- ✅ **Payout Processing**

  - View pending payouts
  - Process payout requests
  - Mark payouts as completed/failed
  - Track payout statistics

- ✅ **Vendor Analytics**
  - Monitor all vendors
  - Performance comparison
  - Revenue tracking
  - Top vendors by sales

---

## Architecture

### High-Level Flow

```
User Registration → Vendor Application → Admin Verification
→ Product Listing → Customer Orders → Commission Calculation
→ Payout Request → Admin Processing → Payment Completion
```

### Models Relationship

```
User (1) ←→ (1) Vendor
Vendor (1) ←→ (N) Products
Vendor (1) ←→ (N) Payouts
Order (N) ←→ (N) Products (through items)
```

---

## Database Models

### 1. Vendor Model (`models/Vendor.js`)

**Schema Fields:**

``javascript
{
  user: ObjectId,              // Reference to User model
  businessName: String,         // Business name
  businessEmail: String,        // Business email
  businessPhone: String,        // Business phone
  description: String,          // Business description
  logo: String,                 // CDN URL for logo
  banner: String,               // CDN URL for banner
  address: {                    // Business address
    street, city, state, country, zipCode,
    // Uganda-specific fields
    district: String,
    zone: String,               // Kampala zones like Nakawa, Kawempe, etc.
    landmark: String            // For landmark-based addressing
  },
  isVerified: Boolean,          // Verification status
  verificationStatus: String,   // pending|approved|rejected|suspended
  verificationDocuments: [      // Uploaded verification documents
    {
      url: String,              // URL to the document file
      documentType: String,     // business_license|tax_id|identity|other
      uploadedAt: Date          // Upload timestamp
    }
  ],
  commissionRate: Number,       // Commission percentage (0-100)
  payoutInfo: {                 // Payment details
    bankName, accountNumber, accountHolderName,
    routingNumber, paypalEmail, preferredMethod
  },
  totalSales: Number,           // Total number of sales
  totalRevenue: Number,         // Total revenue earned
  totalCommission: Number,      // Total commission paid
  totalOrders: Number,          // Total orders
  totalProducts: Number,        // Total products listed
  rating: Number,               // Vendor rating (0-5)
  totalReviews: Number,         // Number of reviews
  pendingPayout: Number,        // Amount available for payout
  lastPayoutDate: Date,         // Last payout date
  totalPayouts: Number,         // Total amount paid out
  storeSettings: {              // Store configuration
    isActive, allowReturns, returnPeriod,
    shippingOptions, currencies, languages
  },
  notifications: {              // Notification preferences
    newOrder, lowStock, newReview,
    payoutProcessed, emailNotifications, smsNotifications
  },
  socialMedia: {                // Social media links
    website, facebook, instagram, twitter, linkedin
  },
  metrics: {                    // Performance metrics
    averageResponseTime,
    orderFulfillmentRate,
    returnRate
  },
  // Uganda-specific fields
  businessType: String,         // individual|company
  registrationNumber: String,    // Uganda Business Registration
  tinNumber: String,            // Tax ID
  phoneNumbers: [String],       // Additional phone numbers (MTN, Airtel)
  tier: String                  // bronze|silver|gold|platinum
}
```

**Methods:**

- `calculateCommission(amount)` - Calculate commission for an amount
- `updateSalesStats(orderAmount, commission)` - Update sales statistics
- `processPayout(amount)` - Process a payout

**Static Methods:**

- `getTopVendors(limit)` - Get top-rated vendors
- `getVendorAnalytics(vendorId, period)` - Get vendor analytics

### 2. Payout Model (`models/Payout.js`)

**Schema Fields:**

``javascript
{
  vendor: ObjectId,             // Reference to Vendor
  amount: Number,               // Payout amount
  currency: String,             // Currency code
  status: String,               // pending|processing|completed|failed|cancelled
  paymentMethod: String,        // bank|paypal|stripe
  paymentDetails: {             // Payment information
    transactionId, accountNumber (last 4),
    accountHolderName, paypalEmail
  },
  requestedDate: Date,          // When payout was requested
  processedDate: Date,          // When admin started processing
  completedDate: Date,          // When payout was completed
  failureReason: String,        // Reason if failed
  notes: String,                // Additional notes
  orders: [],                   // Orders included in payout
  processedBy: ObjectId         // Admin who processed
}
```

**Methods:**

- `markAsProcessing(adminId)` - Mark payout as being processed
- `markAsCompleted(transactionId)` - Mark payout as completed
- `markAsFailed(reason)` - Mark payout as failed

**Static Methods:**

- `getVendorPayoutSummary(vendorId)` - Get payout summary for vendor
- `getPendingPayouts(limit)` - Get all pending payouts

### 3. Product Model (Updated)

**Changed:**

- `vendor` field now references `Vendor` model instead of `User`

---

## API Endpoints

### Vendor Endpoints

#### POST `/api/vendor/register`

Register as a vendor

```json
{
  "businessName": "My Store",
  "businessEmail": "store@example.com",
  "businessPhone": "+1234567890",
  "description": "We sell amazing products",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "zipCode": "10001"
  }
}
```

**Response:**

```json
{
  "message": "Vendor registration successful",
  "vendor": {
    "id": "vendor_id",
    "businessName": "My Store",
    "verificationStatus": "pending"
  }
}
```

#### GET `/api/vendor/profile`

Get vendor profile (requires authentication)

**Response:**

```json
{
  "vendor": {
    "id": "vendor_id",
    "businessName": "My Store",
    "businessEmail": "store@example.com",
    "rating": 4.5,
    "totalSales": 150,
    "totalRevenue": 15000,
    ...
  }
}
```

#### PUT `/api/vendor/profile`

Update vendor profile (requires authentication)

**Allowed Updates:**

- businessName, businessEmail, businessPhone
- description, address, logo, banner
- socialMedia, storeSettings, notifications

#### GET `/api/vendor/dashboard`

Get vendor dashboard statistics

**Response:**

```json
{
  "dashboard": {
    "overview": {
      "totalSales": 150,
      "totalRevenue": 15000,
      "totalCommission": 2250,
      "netRevenue": 12750,
      "pendingPayout": 5000,
      "totalOrders": 120,
      "rating": 4.5,
      "totalReviews": 45
    },
    "products": {
      "total": 25,
      "active": 20,
      "lowStock": 3
    },
    "recentPeriod": {
      "days": 30,
      "orders": 35
    },
    "recentOrders": [...],
    "performance": {
      "averageResponseTime": 2.5,
      "orderFulfillmentRate": 95,
      "returnRate": 2
    }
  }
}
```

#### GET `/api/vendor/orders`

Get vendor orders with pagination and filters

**Query Parameters:**

- `status` - Filter by order status
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

#### PUT `/api/vendor/orders/:orderId/status`

Update order status

**Request:**

```json
{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

#### GET `/api/vendor/products`

Get vendor products with pagination

**Query Parameters:**

- `page`, `limit` - Pagination
- `category` - Filter by category
- `isActive` - Filter by active status

#### GET `/api/vendor/analytics`

Get vendor analytics

**Query Parameters:**

- `period` - week | month | year

**Response:**

```json
{
  "analytics": {...},
  "topProducts": [...],
  "salesTrend": [
    {
      "_id": "2025-11-11",
      "totalOrders": 10,
      "totalRevenue": 1000
    }
  ]
}
```

#### POST `/api/vendor/payout/request`

Request a payout

**Request:**

```json
{
  "amount": 500
}
```

**Requirements:**

- Vendor must be verified
- Amount must be ≥ $50 (minimum)
- Amount must be ≤ pendingPayout

#### GET `/api/vendor/payouts`

Get payout history

**Query Parameters:**

- `page`, `limit` - Pagination
- `status` - Filter by status

---

### Admin Endpoints

#### GET `/api/vendor/admin/all`

Get all vendors (Admin only)

**Query Parameters:**

- `page`, `limit` - Pagination
- `status` - Filter by verification status
- `search` - Search by business name or email

#### PUT `/api/vendor/admin/:vendorId/verify`

Verify or reject vendor (Admin only)

**Request:**

```json
{
  "status": "approved",
  "reason": "All documents verified"
}
```

#### PUT `/api/vendor/admin/:vendorId/commission`

Update vendor commission rate (Admin only)

**Request:**

``json
{
  "commissionRate": 12
}
```

#### GET `/api/payout/admin/pending`

Get pending payouts (Admin only)

**Query Parameters:**

- `limit` - Number of results (default: 50)

#### GET `/api/payout/admin/all`

Get all payouts (Admin only)

**Query Parameters:**

- `page`, `limit` - Pagination
- `status` - Filter by status
- `vendorId` - Filter by vendor

#### PUT `/api/payout/admin/:payoutId/process`

Start processing a payout (Admin only)

#### PUT `/api/payout/admin/:payoutId/complete`

Mark payout as completed (Admin only)

**Request:**

```json
{
  "transactionId": "TRANS123456"
}
```

#### PUT `/api/payout/admin/:payoutId/fail`

Mark payout as failed (Admin only)

**Request:**

```json
{
  "reason": "Invalid account details"
}
```

#### GET `/api/payout/admin/statistics`

Get payout statistics (Admin only)

**Response:**

```json
{
  "overall": {
    "totalPayouts": 50000,
    "count": 200,
    "avgAmount": 250
  },
  "byStatus": [...],
  "byMethod": [...],
  "trend": [...],
  "topVendors": [...]
}
```

---

## Usage Guide

### For Vendors

#### 1. Registration

```javascript
// Register as vendor
const response = await fetch("/api/vendor/register", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    businessName: "My Store",
    businessEmail: "store@example.com",
    businessPhone: "+1234567890",
    description: "Store description",
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10001",
    },
  }),
});
```

#### 2. View Dashboard

```javascript
// Get dashboard data
const dashboard = await fetch("/api/vendor/dashboard", {
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
  },
});
```

#### 3. Manage Orders

```javascript
// Get orders
const orders = await fetch("/api/vendor/orders?page=1&limit=20", {
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
  },
});

// Update order status
await fetch(`/api/vendor/orders/${orderId}/status`, {
  method: "PUT",
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    status: "shipped",
    trackingNumber: "TRACK123",
  }),
});
```

#### 4. Request Payout

```javascript
// Request payout
const payout = await fetch("/api/vendor/payout/request", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: 500,
  }),
});
```

### For Admins

#### 1. Verify Vendors

```javascript
// Get pending vendors
const vendors = await fetch("/api/vendor/admin/all?status=pending", {
  headers: {
    Authorization: "Bearer ADMIN_TOKEN",
  },
});

// Approve vendor
await fetch(`/api/vendor/admin/${vendorId}/verify`, {
  method: "PUT",
  headers: {
    Authorization: "Bearer ADMIN_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    status: "approved",
  }),
});
```

#### 2. Process Payouts

```javascript
// Get pending payouts
const payouts = await fetch("/api/payout/admin/pending", {
  headers: {
    Authorization: "Bearer ADMIN_TOKEN",
  },
});

// Process payout
await fetch(`/api/payout/admin/${payoutId}/process`, {
  method: "PUT",
  headers: {
    Authorization: "Bearer ADMIN_TOKEN",
  },
});

// Complete payout
await fetch(`/api/payout/admin/${payoutId}/complete`, {
  method: "PUT",
  headers: {
    Authorization: "Bearer ADMIN_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    transactionId: "TRANS123456",
  }),
});
```

---

## Commission System

### How It Works

1. **Commission Rate**: Each vendor has a `commissionRate` (0-100%)
2. **Default Rate**: 15% (configurable per vendor)
3. **Calculation**: Commission = Order Amount × (Commission Rate / 100)
4. **Net Revenue**: Net = Total Revenue - Total Commission

### Example

```
Order Amount: $100
Commission Rate: 15%
Commission: $100 × 0.15 = $15
Vendor Receives: $100 - $15 = $85
```

### Commission Tracking

- Tracked in real-time on every order
- Displayed on vendor dashboard
- Included in analytics reports
- Deducted automatically from payouts

---

## Payout System

### Workflow

1. **Vendor** requests payout (minimum $50)
2. **System** validates available balance
3. **Admin** receives payout request
4. **Admin** marks as "processing"
5. **Admin** processes payment externally
6. **Admin** marks as "completed" with transaction ID
7. **System** updates vendor balance automatically

### Payment Methods

- **Bank Transfer**: Direct deposit to vendor's bank account
- **PayPal**: Payment to vendor's PayPal email
- **Stripe**: Payment via Stripe Connect

### Payout Statuses

- `pending` - Awaiting admin review
- `processing` - Admin is processing
- `completed` - Payment sent successfully
- `failed` - Payment failed (reason provided)
- `cancelled` - Request cancelled

### Minimum Payout

Default minimum: **$50**

Can be configured in the code:

```javascript
const minPayoutAmount = 50; // in vendor.js route
```

---

## Integration

### 1. Update Existing Product Creation

When creating products, now reference Vendor instead of User:

```javascript
const product = new Product({
  name: "Product Name",
  price: 99.99,
  vendor: vendorId, // Use vendor._id, not user._id
  // ... other fields
});
```

### 2. Update Order Processing

When an order is placed, update vendor statistics:

```javascript
// After order is created and paid
const vendor = await Vendor.findById(product.vendor);
const commission = vendor.calculateCommission(orderAmount);
await vendor.updateSalesStats(orderAmount, commission);
```

### 3. Frontend Integration

Create vendor dashboard pages:

- `/vendor/register` - Registration form
- `/vendor/dashboard` - Main dashboard
- `/vendor/orders` - Order management
- `/vendor/products` - Product management
- `/vendor/analytics` - Analytics view
- `/vendor/payouts` - Payout management
- `/vendor/settings` - Profile settings

---

## Security

### Authentication & Authorization

- All vendor endpoints require `authenticateJWT` middleware
- Admin endpoints require `authorizeRoles('admin')` middleware
- Vendors can only access their own data
- Admins can access all vendor data

### Data Protection

- Sensitive bank details are masked (show last 4 digits only)
- Password/token validation on all endpoints
- Rate limiting on payout requests
- CSRF protection on state-changing operations

### Validation

- Input validation on all endpoints
- Minimum/maximum amount checks on payouts
- Commission rate validation (0-100%)
- Verification status checks before allowing payouts

---

## Environment Variables

Add to `.env`:

```bash
# Vendor Settings
MIN_PAYOUT_AMOUNT=50
DEFAULT_COMMISSION_RATE=15
VENDOR_VERIFICATION_REQUIRED=true

# Payment Processing (optional)
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

---

## Testing

### Test Vendor Registration

```
curl -X POST http://localhost:5000/api/vendor/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Store",
    "businessEmail": "test@store.com",
    "businessPhone": "+1234567890"
  }'
```

### Test Vendor Dashboard

```
curl http://localhost:5000/api/vendor/dashboard \
  -H "Authorization: Bearer VENDOR_TOKEN"
```

### Test Payout Request

```
curl -X POST http://localhost:5000/api/vendor/payout/request \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

---

## Next Steps

1. **Frontend Development**

   - Build vendor dashboard UI
   - Create admin vendor management panel
   - Add payout processing interface

2. **Payment Integration**

   - Integrate Stripe Connect
   - Set up PayPal payouts API
   - Implement bank transfer automation

3. **Notifications**

   - Email notifications for vendor registration
   - Payout status update emails
   - Low stock alerts
   - New order notifications

4. **Advanced Features**
   - Vendor subscription tiers
   - Premium features for vendors
   - Vendor performance scoring
   - Automated commission adjustments

---

## Support

For issues or questions:

- Check API documentation: `/api-docs`
- Review error logs in `logs/` directory
- Contact system administrator

---

**Version**: 1.0.0  
**Last Updated**: November 11, 2025  
**Status**: ✅ Production Ready
