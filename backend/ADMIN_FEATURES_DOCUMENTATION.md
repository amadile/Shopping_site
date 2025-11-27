# Admin Backend Features - Uganda Multi-Vendor Marketplace

## Overview

This documentation covers all backend admin features for the Uganda multi-vendor e-commerce marketplace system. The implementation includes comprehensive admin management capabilities for vendor approval, commission settings, payout processing, delivery zones, dispute resolution, and analytics.

## Table of Contents

1. [Models](#models)
2. [API Routes](#api-routes)
3. [Database Seeding](#database-seeding)
4. [Authentication & Authorization](#authentication--authorization)
5. [Uganda-Specific Features](#uganda-specific-features)

---

## Models

### 1. CommissionSettings Model

**File:** `models/CommissionSettings.js`

Platform-wide commission configuration and fee management.

**Schema Fields:**

- `defaultCommissionRate` (Number): Default platform commission (15%)
- `categoryRates` (Array): Category-specific commission rates
  - `category` (String): Product category name
  - `rate` (Number): Commission percentage (0-100%)
- `tierRates` (Object): Vendor tier-based rates
  - `bronze`: 15%
  - `silver`: 12%
  - `gold`: 10%
  - `platinum`: 8%
- `paymentMethodFees` (Object): Payment method processing fees
  - `mtn_momo`: 2%
  - `airtel_money`: 2%
  - `cod`: 1%
  - `bank_transfer`: 0.5%
- `deliveryZoneFees` (Object): Flat fees by zone type
- `minPayoutThreshold` (Number): Minimum amount for vendor payout (50,000 UGX)
- `platformFee` (Number): Flat fee per order (500 UGX)
- `taxRate` (Number): VAT rate (18%)
- `currency` (String): "UGX"

**Static Methods:**

- `getCommissionRate(vendorTier, category)`: Get applicable commission rate
- `calculateOrderFees(orderTotal, paymentMethod, deliveryZone)`: Calculate all fees

---

### 2. DeliveryZone Model

**File:** `models/DeliveryZone.js`

Uganda delivery zones including Kampala divisions and major districts.

**Schema Fields:**

- `zoneName` (String, required): Zone name (e.g., "Kampala Central", "Entebbe")
- `zoneType` (String, required): Type - "kampala_zone", "district", or "region"
- `country` (String): "Uganda"
- `city` (String): City name
- `district` (String, required): District name
- `subCounty` (String): Sub-county/division name
- `pricing` (Object):
  - `baseFee` (Number): Base delivery fee in UGX
  - `perKmFee` (Number): Per-kilometer fee in UGX
  - `minOrderForFreeDelivery` (Number): Minimum order value for free delivery
- `estimatedDeliveryDays` (Number): Expected delivery time
- `isActive` (Boolean): Zone availability status
- `codAvailable` (Boolean): Cash on Delivery availability
- `deliveryPartners` (Array): Available delivery partners
  - `name` (String): Partner name (SafeBoda, Jumia Express, Fraine, Tugende)
  - `contactPhone` (String): Uganda phone number
  - `priceMultiplier` (Number): Partner price adjustment
  - `isActive` (Boolean): Partner availability
- `landmarks` (Array): Notable locations in zone
- `coordinates` (GeoJSON Point): Geographic coordinates

**Static Methods:**

- `getKampalaZones()`: Get all Kampala divisions
- `getAllDistricts()`: Get all district zones
- `getDeliveryFee(zoneId, distance)`: Calculate delivery fee
- `isDeliveryAvailable(zoneId)`: Check zone availability

**Indexes:**

- `zoneName` (text search)
- `district` (text search)
- `coordinates` (geospatial 2dsphere)

---

### 3. Dispute Model

**File:** `models/Dispute.js`

Customer-vendor dispute resolution workflow.

**Schema Fields:**

- `disputeId` (String): Auto-generated unique ID (DISP-YYYYMMDD-XXXXX)
- `order` (ObjectId, ref: "Order"): Related order
- `customer` (ObjectId, ref: "User"): Customer who filed dispute
- `vendor` (ObjectId, ref: "Vendor"): Vendor involved
- `type` (String, required): Dispute type
  - `product_quality`, `late_delivery`, `wrong_item`, `missing_item`, `damaged_item`, `refund_request`, `other`
- `status` (String): Workflow status
  - `open`, `under_review`, `resolved`, `closed`, `escalated`
- `priority` (String): Priority level - `low`, `medium`, `high`, `urgent`
- `subject` (String, required): Brief title
- `description` (String, required): Detailed description
- `evidence` (Array): File attachments
  - `fileUrl` (String): Upload URL
  - `fileType` (String): MIME type
  - `uploadedAt` (Date): Upload timestamp
- `messages` (Array): Conversation thread
  - `sender` (ObjectId, ref: "User"): Message author
  - `senderModel` (String): "User" or "Admin"
  - `message` (String): Message content
  - `timestamp` (Date): Message time
- `assignedAdmin` (ObjectId, ref: "User"): Admin handling dispute
- `resolution` (Object):
  - `decision` (String): Resolution type - `refund_customer`, `replace_item`, `partial_refund`, `favor_vendor`, `no_action`
  - `resolvedBy` (ObjectId, ref: "User"): Admin who resolved
  - `resolvedAt` (Date): Resolution timestamp
  - `resolutionNotes` (String): Admin notes
  - `refundAmount` (Number): Refund value in UGX
- `internalNotes` (Array): Admin-only notes
  - `note` (String): Note content
  - `addedBy` (ObjectId, ref: "User"): Admin who added note
  - `addedAt` (Date): Note timestamp
- `escalationReason` (String): Reason if escalated

**Instance Methods:**

- `addMessage(senderId, senderModel, messageText)`: Add message to thread
- `assignToAdmin(adminId)`: Assign to specific admin
- `escalate(reason)`: Escalate to higher priority
- `resolve(adminId, decision, notes, refundAmount)`: Resolve dispute
- `close()`: Close resolved dispute

**Static Methods:**

- `getDisputeStats(filters)`: Get statistics by status/type
- `getDisputesByType(type)`: Filter by dispute type

---

## API Routes

### 1. Commission Management Routes

**File:** `routes/admin-commission.js`  
**Base Path:** `/api/admin/commissions`

#### Endpoints:

**GET /settings**

- Get current commission settings
- Response: Full CommissionSettings document

**PUT /settings**

- Update commission settings
- Body: `{ defaultCommissionRate?, tierRates?, paymentMethodFees?, minPayoutThreshold?, platformFee?, taxRate? }`
- Validation: Rates must be 0-100%

**GET /category-rates**

- List all category commission rates
- Response: Array of category rates

**POST /category-rates**

- Add/update category rate
- Body: `{ category: string, rate: number }`

**DELETE /category-rates/:category**

- Remove category-specific rate (falls back to default)

**GET /tier-rates**

- Get all vendor tier rates
- Response: `{ bronze, silver, gold, platinum }`

**PUT /tier-rates**

- Update tier rates
- Body: `{ bronze?, silver?, gold?, platinum? }`

**POST /calculate**

- Calculate fees for hypothetical order
- Body: `{ orderTotal: number, vendorTier: string, category: string, paymentMethod: string, deliveryZoneType: string }`
- Response: Breakdown of all fees and net amounts

---

### 2. Payout Management Routes

**File:** `routes/admin-payout.js`  
**Base Path:** `/api/admin/payouts`

#### Endpoints:

**GET /**

- List all payout requests with filters
- Query params: `page=1`, `limit=20`, `status`, `vendorId`, `startDate`, `endDate`
- Response: Paginated list with vendor details

**GET /pending**

- List pending payout requests
- Response: All payouts with status "pending"

**GET /:payoutId**

- Get detailed payout information
- Response: Full payout details with vendor and order info

**PUT /:payoutId/approve**

- Approve payout request
- Body: `{ transactionId: string, processingNotes?: string }`
- Updates: Status → "processing", processes vendor balance

**PUT /:payoutId/reject**

- Reject payout request
- Body: `{ rejectionReason: string }`
- Updates: Status → "cancelled"

**GET /vendor/:vendorId/summary**

- Get vendor payout summary
- Response: Total payouts, pending balance, average amount

**GET /statistics/overview**

- Platform-wide payout statistics
- Response: Count and amount by status, total processed

**POST /bulk-approve**

- Approve multiple payouts at once
- Body: `{ payoutIds: [string], transactionIdPrefix: string }`
- Returns: Success count and failed items

---

### 3. Delivery Zone Management Routes

**File:** `routes/admin-delivery-zone.js`  
**Base Path:** `/api/admin/delivery-zones`

#### Endpoints:

**GET /**

- List all delivery zones
- Query params: `page=1`, `limit=20`, `zoneType`, `district`, `isActive`
- Response: Paginated zones

**GET /kampala**

- Get all Kampala division zones
- Response: All zones with zoneType="kampala_zone"

**GET /districts**

- Get all district zones
- Response: All zones with zoneType="district"

**GET /:zoneId**

- Get specific zone details
- Response: Full zone information

**POST /**

- Create new delivery zone
- Body: Complete DeliveryZone schema
- Validation: Required fields, valid coordinates

**PUT /:zoneId**

- Update existing zone
- Body: Partial zone updates
- Validation: Coordinates format if provided

**DELETE /:zoneId**

- Soft delete zone (sets isActive=false)

**PUT /:zoneId/toggle**

- Toggle zone active status
- Response: Updated zone with new status

**POST /seed/default**

- Seed default Kampala zones and districts
- Response: Count of zones created

---

### 4. Dispute Management Routes

**File:** `routes/admin-dispute.js`  
**Base Path:** `/api/admin/disputes`

#### Endpoints:

**GET /**

- List all disputes with filters
- Query params: `page=1`, `limit=20`, `status`, `type`, `priority`, `assignedAdmin`, `vendorId`
- Response: Paginated disputes with customer/vendor details

**GET /unassigned**

- List disputes not yet assigned to admin
- Response: Disputes where assignedAdmin is null

**GET /:disputeId**

- Get full dispute details
- Response: Complete dispute with messages, evidence, resolution

**PUT /:disputeId/assign**

- Assign dispute to admin
- Body: `{ adminId: string }`
- Updates: assignedAdmin, status → "under_review"

**POST /:disputeId/message**

- Add message to dispute thread
- Body: `{ message: string }`
- Updates: Adds message with sender=adminId

**PUT /:disputeId/resolve**

- Resolve dispute with decision
- Body: `{ decision: string, resolutionNotes: string, refundAmount?: number }`
- Validation: Decision must be valid type
- Updates: Status → "resolved", resolution object populated

**PUT /:disputeId/close**

- Close resolved dispute
- Updates: Status → "closed"

**PUT /:disputeId/escalate**

- Escalate dispute to higher priority
- Body: `{ escalationReason: string }`
- Updates: Status → "escalated", priority → "urgent"

**POST /:disputeId/notes**

- Add internal admin note
- Body: `{ note: string }`
- Updates: Adds to internalNotes array

**GET /statistics/overview**

- Dispute statistics dashboard
- Response: Count by status, type, resolution decision

---

### 5. Admin Analytics Routes

**File:** `routes/admin-analytics.js`  
**Base Path:** `/api/admin/analytics`

#### Endpoints:

**GET /marketplace-overview**

- Comprehensive marketplace dashboard
- Query params: `period=week|month|year|all`
- Response:
  - Vendor stats (total, active, pending)
  - Product stats (total, active)
  - Order stats (total, by status)
  - Revenue (total, commission, vendor earnings)
  - Customer stats (total, new)
  - Payout stats (by status, pending balance)
  - Dispute stats (by status)

**GET /revenue-breakdown**

- Detailed revenue analysis
- Query params: `period=week|month|year`
- Response:
  - Revenue by payment method
  - Revenue by delivery zone
  - Revenue by product category
  - Daily revenue trend

**GET /vendor-performance**

- Top performing vendors
- Query params: `limit=10`, `sortBy=revenue|orders|rating`
- Response: Top vendors with detailed stats, product count

**GET /growth-metrics**

- Growth comparison vs previous period
- Query params: `period=week|month|year`
- Response: Growth percentages for vendors, customers, orders, revenue

**GET /uganda-specific**

- Uganda marketplace insights
- Response:
  - Payment method distribution (MTN, Airtel, COD)
  - Vendors by district
  - Orders by Kampala zone
  - SMS notification preferences
  - Vendor tier distribution

---

## Database Seeding

### Running the Seed Script

**File:** `scripts/seed-default-data.js`

```bash
cd backend
node scripts/seed-default-data.js
```

### Seeded Data:

**Commission Settings:**

- Default rate: 15%
- Category rates: Electronics (10%), Fashion (20%), etc.
- Tier rates: Bronze (15%), Silver (12%), Gold (10%), Platinum (8%)
- Payment fees: MTN/Airtel (2%), COD (1%), Bank (0.5%)
- Min payout: 50,000 UGX
- Platform fee: 500 UGX
- Tax rate: 18%

**Kampala Zones (5):**

1. Kampala Central - 5,000 UGX base fee
2. Kawempe - 6,000 UGX base fee
3. Makindye - 6,000 UGX base fee
4. Nakawa - 5,500 UGX base fee
5. Rubaga - 5,500 UGX base fee

**Districts (5):**

1. Entebbe (Wakiso) - 15,000 UGX base fee
2. Mukono - 10,000 UGX base fee
3. Jinja - 25,000 UGX base fee
4. Mbarara - 35,000 UGX base fee
5. Gulu - 40,000 UGX base fee

Each zone includes:

- Delivery partners (SafeBoda, Jumia Express, Fraine, Tugende)
- Landmarks
- Geographic coordinates
- COD availability
- Estimated delivery days

---

## Authentication & Authorization

### Middleware

All admin routes use two middleware layers:

1. **authenticateJWT**: Validates JWT token from Authorization header
2. **authorizeRoles("admin")**: Ensures user has admin role

### Request Format

```
Authorization: Bearer <jwt_token>
```

### Error Responses

- 401 Unauthorized: Invalid/missing token
- 403 Forbidden: User is not admin
- 500 Server Error: Internal error with logging

---

## Uganda-Specific Features

### 1. Mobile Money Integration

**Payment Methods Supported:**

- MTN Mobile Money (mtn_momo)
- Airtel Money (airtel_money)
- Cash on Delivery (cod)
- Bank Transfer (bank_transfer)

**Commission Tracking:**

- Each order tracks `platformCommission` and `vendorCommission`
- Payouts support mobile money payment details
- 2% processing fee for mobile money transactions

### 2. Delivery Zones

**Kampala Divisions:**

- 5 major divisions with zone-specific pricing
- Base fees range: 5,000 - 6,000 UGX
- Per-km fees: 500 - 600 UGX
- Same-day to 1-day delivery

**Districts:**

- Major cities: Entebbe, Mukono, Jinja, Mbarara, Gulu
- Base fees range: 10,000 - 40,000 UGX
- Delivery: 2-5 days depending on distance
- Some districts have COD restrictions

### 3. Delivery Partners

- **SafeBoda**: Kampala motorcycle delivery
- **Jumia Express**: Long-distance shipping
- **Fraine**: Regional coverage
- **Tugende**: Specialized routes

### 4. Vendor Tiers

**Bronze (15% commission):**

- New vendors
- Basic features

**Silver (12% commission):**

- Established vendors
- Good sales history

**Gold (10% commission):**

- High-performing vendors
- Premium features

**Platinum (8% commission):**

- Top vendors
- Exclusive benefits

### 5. Currency

- All amounts in Ugandan Shillings (UGX)
- 18% VAT applied to platform fees
- Minimum payout threshold: 50,000 UGX

---

## Testing Endpoints

### Example: Approve Payout

```bash
curl -X PUT http://localhost:5000/api/admin/payouts/{payoutId}/approve \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "MTN-TX-20250101-001",
    "processingNotes": "Processed via MTN Mobile Money"
  }'
```

### Example: Resolve Dispute

```bash
curl -X PUT http://localhost:5000/api/admin/disputes/{disputeId}/resolve \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "refund_customer",
    "resolutionNotes": "Product was defective as claimed",
    "refundAmount": 50000
  }'
```

### Example: Get Analytics

```bash
curl -X GET "http://localhost:5000/api/admin/analytics/marketplace-overview?period=month" \
  -H "Authorization: Bearer <admin_jwt>"
```

---

## Logging & Audit Trail

All admin actions are logged using Winston logger:

**Success Logs (logger.info):**

- Admin ID and action performed
- Entity ID and relevant details
- Timestamp automatically included

**Error Logs (logger.error):**

- Error message and stack trace
- Request context
- User identification

**Example Log Entries:**

```
[INFO] Commission settings updated by admin: 507f1f77bcf86cd799439011
[INFO] Payout approved by admin: 507f1f77bcf86cd799439011, Payout ID: PAY-20250101-001
[INFO] Dispute resolved by admin: 507f1f77bcf86cd799439011, Dispute ID: DISP-20250101-002
[ERROR] Get marketplace overview error: <error details>
```

---

## Summary

### Models Created:

1. CommissionSettings - Platform commission configuration
2. DeliveryZone - Uganda delivery zones with pricing
3. Dispute - Customer-vendor dispute resolution

### Route Files Created:

1. admin-commission.js - 8 endpoints
2. admin-payout.js - 9 endpoints
3. admin-delivery-zone.js - 9 endpoints
4. admin-dispute.js - 11 endpoints
5. admin-analytics.js - 5 endpoints

**Total: 42 admin endpoints**

### Integration:

- All routes registered in `src/index.js`
- Routes protected with JWT authentication and admin authorization
- Comprehensive Swagger documentation included
- Database seeding script for default data
- Extensive logging for audit trails

### Next Steps:

1. Run database seeding: `node scripts/seed-default-data.js`
2. Start server: `npm run dev`
3. Access API docs: `http://localhost:5000/api-docs`
4. Test endpoints with admin JWT token
5. Monitor logs for admin actions

---

## Support & Maintenance

For issues or enhancements:

1. Check logs in `logs/` directory
2. Verify JWT token validity
3. Ensure admin role is properly assigned
4. Confirm MongoDB connection
5. Review Swagger docs for endpoint specifications
