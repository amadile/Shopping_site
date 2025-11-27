# Quick Start Guide - Inventory & Performance Features

## 🚀 Getting Started

### 1. Start the Application

```bash
# Terminal 1 - Start main server
npm start

# Terminal 2 - Start worker process (for background jobs)
npm run worker
```

### 2. Test Compression

```bash
# Check if compression is working
curl -H "Accept-Encoding: gzip" http://localhost:5000/api/products -v | grep "Content-Encoding: gzip"
```

Expected: You should see `Content-Encoding: gzip` in response headers.

### 3. Test Inventory Features

#### Check Stock Availability

```bash
curl "http://localhost:5000/api/inventory/check-availability?productId=YOUR_PRODUCT_ID&quantity=5"
```

#### Reserve Stock (requires authentication)

```bash
curl -X POST http://localhost:5000/api/inventory/reserve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "YOUR_PRODUCT_ID",
    "quantity": 2,
    "orderId": "YOUR_ORDER_ID",
    "expiresInMinutes": 15
  }'
```

#### Get Low Stock Items (requires admin/vendor auth)

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/inventory/low-stock?limit=20"
```

## 📚 API Endpoints

### Public Endpoints

- `GET /api/inventory/check-availability` - Check if product is in stock

### Authenticated Endpoints (User)

- `POST /api/inventory/reserve` - Reserve stock for order
- `POST /api/inventory/reserve/:id/release` - Release reservation
- `POST /api/inventory/reserve/:id/confirm` - Confirm reservation

### Admin/Vendor Endpoints

- `POST /api/inventory/add-stock` - Add stock (restock)
- `POST /api/inventory/adjust-stock` - Adjust stock (admin only)
- `GET /api/inventory/history` - Get stock history
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/out-of-stock` - Get out of stock items
- `POST /api/inventory/release-expired` - Manually release expired reservations

## 🔄 Integration Example

### Complete Order Flow with Inventory

```javascript
// 1. User adds item to cart
// Check availability first
const availability = await fetch(
  `/api/inventory/check-availability?productId=${productId}&quantity=${quantity}`
).then((r) => r.json());

if (!availability.available) {
  alert("Sorry, this item is out of stock!");
  return;
}

// 2. User proceeds to checkout
// Create order (pending)
const order = await fetch("/api/orders", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ cartId }),
}).then((r) => r.json());

// 3. Reserve stock
const reservation = await fetch("/api/inventory/reserve", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    productId,
    quantity,
    orderId: order._id,
    expiresInMinutes: 15,
  }),
}).then((r) => r.json());

// 4. Process payment
try {
  const payment = await processPayment(order);

  if (payment.success) {
    // Confirm reservation (deduct stock)
    await fetch(`/api/inventory/reserve/${reservation.reservation}/confirm`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    // Show success
    alert("Order completed successfully!");
  }
} catch (error) {
  // Release reservation if payment fails
  await fetch(`/api/inventory/reserve/${reservation.reservation}/release`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: "Payment failed",
    }),
  });

  alert("Payment failed. Please try again.");
}
```

## 🛠️ Admin Tasks

### Check Inventory Status

```javascript
// Get low stock items
const lowStock = await fetch("/api/inventory/low-stock?limit=50", {
  headers: { Authorization: `Bearer ${adminToken}` },
}).then((r) => r.json());

console.log(`Found ${lowStock.count} low stock items`);
```

### Add Stock (Restock)

```javascript
await fetch("/api/inventory/add-stock", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    productId: "product_123",
    quantity: 100,
    reason: "Weekly restock from supplier",
  }),
});
```

### View Stock History

```javascript
const history = await fetch(
  `/api/inventory/history?productId=product_123&limit=50`,
  {
    headers: { Authorization: `Bearer ${adminToken}` },
  }
).then((r) => r.json());

console.log("Stock transactions:", history.history);
```

## 📊 Monitoring

### Check Queue Status

```bash
# In Node.js console or admin endpoint
import inventoryScheduler from './services/inventoryScheduler.js';

const stats = await inventoryScheduler.getInventoryQueueStats();
console.log('Queue statistics:', stats);
```

### View Logs

```bash
# View all logs
tail -f backend/logs/combined.log

# View errors only
tail -f backend/logs/error.log

# Search for inventory operations
grep "inventory" backend/logs/combined.log
```

## ⚙️ Configuration

### Adjust Reservation Timeout

Default is 15 minutes. You can change it per reservation:

```javascript
{
  "productId": "123",
  "quantity": 2,
  "orderId": "order_456",
  "expiresInMinutes": 30  // 30 minutes instead of 15
}
```

### Adjust Low Stock Threshold

In the Inventory model or via API:

```javascript
await fetch(`/api/inventory/${inventoryId}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    lowStockThreshold: 20, // Alert when stock drops below 20
    reorderPoint: 10, // Suggest reordering at 10
  }),
});
```

## 🎯 Performance Tips

1. **Use compression** - Already enabled globally
2. **Check availability** before adding to cart
3. **Use reservations** during checkout
4. **Monitor logs** for performance issues
5. **Run worker process** for background jobs
6. **Clean old jobs** periodically

## 🔧 Troubleshooting

### Reservations Not Expiring

```bash
# Manually trigger cleanup
curl -X POST http://localhost:5000/api/inventory/release-expired \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Worker Not Starting

```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Check logs
tail -f backend/logs/error.log
```

### Compression Not Working

```bash
# Check response headers
curl -H "Accept-Encoding: gzip" http://localhost:5000/api/products -v 2>&1 | grep "Content-Encoding"

# Should see: Content-Encoding: gzip
```

## 📖 Documentation

For detailed information, see:

- `INVENTORY_MANAGEMENT_GUIDE.md` - Complete inventory system documentation
- `PERFORMANCE_OPTIMIZATIONS_GUIDE.md` - Performance optimization details
- `FEATURES_IMPLEMENTATION_SUMMARY.md` - Implementation summary

## 🆘 Common Issues

### Issue: "Product not found in inventory"

**Solution:** Create inventory record for the product first

### Issue: "Insufficient stock"

**Solution:** Add stock using the restock endpoint

### Issue: "Reservation expired"

**Solution:** User took too long at checkout - they need to restart

### Issue: High memory usage

**Solution:** Clean old jobs: `inventoryScheduler.cleanOldJobs()`

---

## ✅ Quick Checklist

Before going to production:

- [ ] Worker process is running
- [ ] Redis is connected
- [ ] MongoDB indexes are created
- [ ] Compression is working (check headers)
- [ ] Test stock reservation flow
- [ ] Monitor logs for errors
- [ ] Set up alerts for low stock
- [ ] Configure backup jobs
- [ ] Test expired reservation cleanup
- [ ] Document custom thresholds

---

**Need help? Check the full documentation files or review the logs!**
