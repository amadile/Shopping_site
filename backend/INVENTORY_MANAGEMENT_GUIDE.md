# Inventory Management System Guide

## Overview

This comprehensive inventory management system provides advanced stock control features including:

- Real-time stock availability checking
- Stock reservations with automatic expiration
- Low stock and out-of-stock alerts
- Complete stock history tracking
- Vendor-specific inventory management
- Warehouse location tracking

## Features

### 1. Stock Availability Check

Check if a product/variant has sufficient stock before adding to cart or processing orders.

**Endpoint:** `GET /api/inventory/check-availability`

**Parameters:**

- `productId` (required): Product ID
- `variantId` (optional): Variant ID
- `quantity` (default: 1): Quantity to check

**Example:**

```javascript
GET /api/inventory/check-availability?productId=123&quantity=5

Response:
{
  "available": true,
  "stock": 50,
  "lowStock": false,
  "outOfStock": false
}
```

### 2. Stock Reservation System

Reserve stock for pending orders to prevent overselling. Reservations automatically expire after a configurable timeout.

**Reserve Stock:** `POST /api/inventory/reserve`

```json
{
  "productId": "product_123",
  "variantId": "variant_456",
  "quantity": 2,
  "orderId": "order_789",
  "expiresInMinutes": 15
}
```

**Release Reservation:** `POST /api/inventory/reserve/:reservationId/release`

```json
{
  "reason": "Order cancelled by user"
}
```

**Confirm Reservation:** `POST /api/inventory/reserve/:reservationId/confirm`

This deducts the reserved stock from inventory when payment is successful.

### 3. Stock Management Operations

#### Add Stock (Restock)

**Endpoint:** `POST /api/inventory/add-stock`

```json
{
  "productId": "product_123",
  "variantId": "variant_456",
  "quantity": 100,
  "reason": "Weekly restock from supplier"
}
```

#### Adjust Stock (Manual Correction)

**Endpoint:** `POST /api/inventory/adjust-stock`

```json
{
  "productId": "product_123",
  "variantId": "variant_456",
  "newQuantity": 75,
  "reason": "Physical inventory count correction"
}
```

### 4. Stock History

Get complete transaction history for any product.

**Endpoint:** `GET /api/inventory/history?productId=123&limit=50`

**Response:**

```json
{
  "success": true,
  "history": [
    {
      "type": "restock",
      "quantity": 100,
      "previousStock": 50,
      "newStock": 150,
      "reason": "Weekly restock",
      "user": { "name": "Admin User", "email": "admin@example.com" },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 5. Low Stock & Out of Stock Alerts

**Get Low Stock Products:** `GET /api/inventory/low-stock?limit=50`

**Get Out of Stock Products:** `GET /api/inventory/out-of-stock?limit=50`

**Get All Alerts:** `GET /api/inventory/alerts`

### 6. Automatic Expired Reservation Cleanup

Run periodically (via cron job) to release expired reservations:

**Endpoint:** `POST /api/inventory/release-expired` (Admin only)

## Database Models

### Inventory Model

Main inventory tracking with:

- Current stock levels
- Reserved stock (for pending orders)
- Available stock (calculated)
- Low stock thresholds
- Reorder points
- Warehouse location
- Supplier information
- Transaction history

### StockReservation Model

Tracks temporary stock reservations:

- Automatic expiration
- Status tracking (active, confirmed, released, expired)
- Links to orders and users

### StockHistory Model

Complete audit trail:

- All stock movements
- Who performed the action
- Reason for change
- Before/after quantities

### StockAlert Model

Alert system:

- Low stock alerts
- Out of stock alerts
- Reorder point alerts
- Notification tracking

## Performance Optimizations

### Database Indexes

All models include optimized indexes for:

- Fast availability lookups
- Efficient filtering by status
- Quick reservation expiration checks
- Fast history queries

### Compression Middleware

Automatic response compression for:

- Large JSON responses
- API endpoints with multiple records
- Configurable compression levels
- Smart filtering (skips images/videos)

## Integration with Order System

### Order Creation Flow

1. Check stock availability
2. Reserve stock for order
3. Process payment
4. Confirm reservation (deduct stock)
5. If payment fails, release reservation

### Order Cancellation Flow

1. Find stock reservation
2. Release reserved stock
3. Create stock history record

## Cron Jobs Setup

### Release Expired Reservations

Run every 5 minutes:

```javascript
import cron from "node-cron";
import inventoryService from "./services/inventoryService.js";

// Every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    await inventoryService.releaseExpiredReservations();
  } catch (error) {
    console.error("Error releasing expired reservations:", error);
  }
});
```

### Check Low Stock Alerts

Run daily:

```javascript
cron.schedule("0 9 * * *", async () => {
  try {
    const result = await inventoryService.getLowStockProducts();
    // Send notification to admin/vendors
  } catch (error) {
    console.error("Error checking low stock:", error);
  }
});
```

## Best Practices

1. **Always check availability** before adding items to cart or creating orders
2. **Use reservations** for checkout flow to prevent overselling
3. **Set appropriate expiration times** (15 minutes recommended for checkout)
4. **Monitor low stock alerts** regularly
5. **Keep stock history** for audit purposes
6. **Use vendor-specific permissions** for multi-vendor platforms
7. **Run expired reservation cleanup** regularly
8. **Document reasons** for manual adjustments

## Security

- All inventory modification endpoints require authentication
- Vendor users can only manage their own products
- Admin users have full access
- Stock history is immutable (audit trail)
- All actions are logged with user information

## Testing

Run inventory tests:

```bash
npm test -- tests/inventory.test.js
```

## API Endpoints Summary

| Method | Endpoint                             | Auth         | Description                  |
| ------ | ------------------------------------ | ------------ | ---------------------------- |
| GET    | `/api/inventory/check-availability`  | Public       | Check stock availability     |
| POST   | `/api/inventory/reserve`             | User         | Reserve stock                |
| POST   | `/api/inventory/reserve/:id/release` | User         | Release reservation          |
| POST   | `/api/inventory/reserve/:id/confirm` | User         | Confirm reservation          |
| POST   | `/api/inventory/add-stock`           | Admin/Vendor | Add stock                    |
| POST   | `/api/inventory/adjust-stock`        | Admin        | Adjust stock                 |
| GET    | `/api/inventory/history`             | Admin/Vendor | Get stock history            |
| GET    | `/api/inventory/low-stock`           | Admin/Vendor | Get low stock items          |
| GET    | `/api/inventory/out-of-stock`        | Admin/Vendor | Get out of stock items       |
| POST   | `/api/inventory/release-expired`     | Admin        | Release expired reservations |

## Error Handling

Common error responses:

```json
{
  "error": "Insufficient stock. Available: 5, Requested: 10"
}
```

```json
{
  "error": "Reservation has expired"
}
```

```json
{
  "error": "Product not found in inventory"
}
```

## Future Enhancements

- [ ] Multi-warehouse support
- [ ] Automatic reordering
- [ ] Stock forecasting
- [ ] Batch operations
- [ ] Export/import functionality
- [ ] Integration with shipping providers
- [ ] Real-time stock sync across channels
