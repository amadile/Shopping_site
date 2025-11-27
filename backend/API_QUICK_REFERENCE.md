# Admin API Quick Reference

## Base URL

`http://localhost:5000/api/admin`

## Authentication

All endpoints require:

```
Authorization: Bearer <admin_jwt_token>
```

---

## Commission Management

**Base:** `/commissions`

| Method | Endpoint                    | Description                |
| ------ | --------------------------- | -------------------------- |
| GET    | `/settings`                 | Get commission settings    |
| PUT    | `/settings`                 | Update commission settings |
| GET    | `/category-rates`           | List category rates        |
| POST   | `/category-rates`           | Add/update category rate   |
| DELETE | `/category-rates/:category` | Remove category rate       |
| GET    | `/tier-rates`               | Get vendor tier rates      |
| PUT    | `/tier-rates`               | Update tier rates          |
| POST   | `/calculate`                | Calculate order fees       |

---

## Payout Management

**Base:** `/payouts`

| Method | Endpoint                    | Description                     |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/`                         | List all payouts (with filters) |
| GET    | `/pending`                  | List pending payouts            |
| GET    | `/:payoutId`                | Get payout details              |
| PUT    | `/:payoutId/approve`        | Approve payout                  |
| PUT    | `/:payoutId/reject`         | Reject payout                   |
| GET    | `/vendor/:vendorId/summary` | Vendor payout summary           |
| GET    | `/statistics/overview`      | Platform payout stats           |
| POST   | `/bulk-approve`             | Bulk approve payouts            |

---

## Delivery Zones

**Base:** `/delivery-zones`

| Method | Endpoint          | Description                   |
| ------ | ----------------- | ----------------------------- |
| GET    | `/`               | List all zones (with filters) |
| GET    | `/kampala`        | List Kampala zones            |
| GET    | `/districts`      | List district zones           |
| GET    | `/:zoneId`        | Get zone details              |
| POST   | `/`               | Create new zone               |
| PUT    | `/:zoneId`        | Update zone                   |
| DELETE | `/:zoneId`        | Soft delete zone              |
| PUT    | `/:zoneId/toggle` | Toggle zone active status     |
| POST   | `/seed/default`   | Seed default zones            |

---

## Dispute Management

**Base:** `/disputes`

| Method | Endpoint               | Description                      |
| ------ | ---------------------- | -------------------------------- |
| GET    | `/`                    | List all disputes (with filters) |
| GET    | `/unassigned`          | List unassigned disputes         |
| GET    | `/:disputeId`          | Get dispute details              |
| PUT    | `/:disputeId/assign`   | Assign to admin                  |
| POST   | `/:disputeId/message`  | Add message                      |
| PUT    | `/:disputeId/resolve`  | Resolve dispute                  |
| PUT    | `/:disputeId/close`    | Close dispute                    |
| PUT    | `/:disputeId/escalate` | Escalate dispute                 |
| POST   | `/:disputeId/notes`    | Add internal note                |
| GET    | `/statistics/overview` | Dispute statistics               |

---

## Analytics

**Base:** `/analytics`

| Method | Endpoint                | Description                    |
| ------ | ----------------------- | ------------------------------ |
| GET    | `/marketplace-overview` | Complete marketplace dashboard |
| GET    | `/revenue-breakdown`    | Detailed revenue analysis      |
| GET    | `/vendor-performance`   | Top performing vendors         |
| GET    | `/growth-metrics`       | Growth comparison              |
| GET    | `/uganda-specific`      | Uganda market insights         |

---

## Vendor Management (Existing)

**Base:** `/vendors` (from admin-vendor.js)

| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ------------------------ |
| GET    | `/vendors`                | List all vendors         |
| GET    | `/vendors/pending`        | List pending vendors     |
| GET    | `/vendors/:id`            | Get vendor details       |
| PUT    | `/vendors/:id/verify`     | Verify vendor            |
| PUT    | `/vendors/:id/commission` | Update vendor commission |
| PUT    | `/vendors/:id/tier`       | Update vendor tier       |
| GET    | `/vendors/analytics`      | Vendor analytics         |

---

## Common Query Parameters

### Pagination

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Filters

- `status` - Filter by status
- `type` - Filter by type
- `priority` - Filter by priority
- `vendorId` - Filter by vendor
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `district` - Uganda district name
- `zoneType` - Zone type (kampala_zone, district, region)
- `isActive` - Active status (true/false)

### Analytics

- `period` - Time period (week, month, year, all)
- `sortBy` - Sort field (revenue, orders, rating)

---

## Request Body Examples

### Approve Payout

```json
{
  "transactionId": "MTN-TX-20250101-001",
  "processingNotes": "Processed via MTN Mobile Money"
}
```

### Reject Payout

```json
{
  "rejectionReason": "Invalid mobile money number"
}
```

### Update Commission Settings

```json
{
  "defaultCommissionRate": 15,
  "tierRates": {
    "bronze": 15,
    "silver": 12,
    "gold": 10,
    "platinum": 8
  },
  "minPayoutThreshold": 50000,
  "platformFee": 500
}
```

### Add Category Rate

```json
{
  "category": "Electronics",
  "rate": 10
}
```

### Calculate Order Fees

```json
{
  "orderTotal": 100000,
  "vendorTier": "silver",
  "category": "Electronics",
  "paymentMethod": "mtn_momo",
  "deliveryZoneType": "kampala_zone"
}
```

### Create Delivery Zone

```json
{
  "zoneName": "Wakiso",
  "zoneType": "district",
  "country": "Uganda",
  "district": "Wakiso",
  "pricing": {
    "baseFee": 8000,
    "perKmFee": 600,
    "minOrderForFreeDelivery": 150000
  },
  "estimatedDeliveryDays": 2,
  "isActive": true,
  "codAvailable": true,
  "deliveryPartners": [
    {
      "name": "SafeBoda",
      "contactPhone": "+256700000001",
      "priceMultiplier": 1.0,
      "isActive": true
    }
  ],
  "landmarks": ["Wakiso Town", "Nansana"],
  "coordinates": {
    "type": "Point",
    "coordinates": [32.4595, 0.4048]
  }
}
```

### Assign Dispute

```json
{
  "adminId": "507f1f77bcf86cd799439011"
}
```

### Resolve Dispute

```json
{
  "decision": "refund_customer",
  "resolutionNotes": "Product was defective as claimed",
  "refundAmount": 50000
}
```

### Escalate Dispute

```json
{
  "escalationReason": "Customer threatening legal action"
}
```

### Add Internal Note

```json
{
  "note": "Vendor confirmed product was damaged during shipping"
}
```

### Bulk Approve Payouts

```json
{
  "payoutIds": ["PAY-001", "PAY-002", "PAY-003"],
  "transactionIdPrefix": "MTN-BULK-20250101"
}
```

---

## Response Examples

### Marketplace Overview

```json
{
  "period": "month",
  "vendors": {
    "total": 150,
    "active": 120,
    "pending": 30
  },
  "products": {
    "total": 5000,
    "active": 4500
  },
  "orders": {
    "total": 1250,
    "byStatus": [
      { "_id": "delivered", "count": 800, "totalValue": 125000000 },
      { "_id": "shipped", "count": 200, "totalValue": 30000000 }
    ]
  },
  "revenue": {
    "totalRevenue": 155000000,
    "platformCommission": 18600000,
    "vendorEarnings": 136400000,
    "completedOrders": 1000
  },
  "customers": {
    "total": 5000,
    "new": 500
  },
  "payouts": {
    "byStatus": [{ "_id": "pending", "count": 50, "totalAmount": 25000000 }],
    "pendingBalance": 30000000,
    "totalPaid": 100000000
  },
  "disputes": {
    "byStatus": [
      { "_id": "open", "count": 15 },
      { "_id": "resolved", "count": 85 }
    ]
  }
}
```

### Payout List

```json
{
  "payouts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "payoutId": "PAY-20250101-001",
      "vendor": {
        "_id": "507f191e810c19729de860ea",
        "businessName": "Tech Store UG"
      },
      "amount": 500000,
      "status": "pending",
      "paymentDetails": {
        "method": "mtn_momo",
        "mobileMoneyNumber": "+256701234567"
      },
      "requestedDate": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalPayouts": 50,
    "limit": 20
  }
}
```

### Dispute Details

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "disputeId": "DISP-20250101-001",
  "order": "ORD-20250101-001",
  "customer": {
    "_id": "507f191e810c19729de860ea",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "vendor": {
    "_id": "507f191e810c19729de860eb",
    "businessName": "Fashion Store UG"
  },
  "type": "product_quality",
  "status": "under_review",
  "priority": "medium",
  "subject": "Defective product received",
  "description": "The item arrived damaged...",
  "messages": [
    {
      "sender": "507f191e810c19729de860ea",
      "senderModel": "User",
      "message": "I received a damaged product",
      "timestamp": "2025-01-01T10:00:00Z"
    }
  ],
  "assignedAdmin": {
    "_id": "507f191e810c19729de860ec",
    "name": "Admin User"
  },
  "createdAt": "2025-01-01T10:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid commission rate. Must be between 0 and 100"
}
```

### 401 Unauthorized

```json
{
  "error": "No token provided"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied. Admin role required"
}
```

### 404 Not Found

```json
{
  "error": "Payout not found"
}
```

### 500 Server Error

```json
{
  "error": "Server error"
}
```

---

## Status Values

### Order Status

- `pending`, `confirmed`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`

### Payout Status

- `pending`, `processing`, `completed`, `failed`, `cancelled`

### Dispute Status

- `open`, `under_review`, `resolved`, `closed`, `escalated`

### Dispute Types

- `product_quality`, `late_delivery`, `wrong_item`, `missing_item`, `damaged_item`, `refund_request`, `other`

### Dispute Resolution Decisions

- `refund_customer`, `replace_item`, `partial_refund`, `favor_vendor`, `no_action`

### Vendor Tiers

- `bronze`, `silver`, `gold`, `platinum`

### Payment Methods

- `mtn_momo` (MTN Mobile Money)
- `airtel_money` (Airtel Money)
- `cod` (Cash on Delivery)
- `bank_transfer` (Bank Transfer)

### Zone Types

- `kampala_zone` (Kampala divisions)
- `district` (Major districts)
- `region` (Larger regions)

---

## Setup & Testing

### 1. Seed Database

```bash
cd backend
node scripts/seed-default-data.js
```

### 2. Start Server

```bash
npm run dev
```

### 3. Get Admin JWT Token

Login as admin user via `/api/auth/login` with admin credentials.

### 4. Test Endpoints

```bash
# Example: Get marketplace overview
curl -X GET "http://localhost:5000/api/admin/analytics/marketplace-overview?period=month" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Example: List pending payouts
curl -X GET "http://localhost:5000/api/admin/payouts/pending" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 5. View API Documentation

Open: `http://localhost:5000/api-docs`

---

## Postman Collection Setup

1. Create new collection: "Uganda Marketplace Admin API"
2. Add environment variable: `admin_token` = your JWT token
3. Set collection authorization: Bearer Token = `{{admin_token}}`
4. Import endpoints from this guide
5. Test all endpoints systematically

---

## Monitoring & Logs

- **Application logs:** Check `logs/` directory
- **Admin actions:** All logged with admin ID and timestamp
- **Error tracking:** Errors logged with stack traces
- **Audit trail:** Complete record of admin operations

---

## Production Considerations

1. **Rate Limiting:** Add rate limiting middleware to admin routes
2. **IP Whitelisting:** Restrict admin access to specific IPs
3. **Audit Logs:** Export logs to external monitoring service
4. **Backup:** Regular database backups before bulk operations
5. **Notifications:** Alert admins of critical disputes/payouts
6. **Performance:** Index frequently queried fields
7. **Security:** Use HTTPS only, rotate JWT secrets regularly

---

For detailed documentation, see: `ADMIN_FEATURES_DOCUMENTATION.md`
