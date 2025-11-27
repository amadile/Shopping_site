# Quick Start Guide - New Features

## 🚀 Getting Started with All Features

This guide will help you quickly set up and test all the newly implemented features.

---

## Prerequisites

```bash
# Ensure you have these installed:
- Node.js 18+
- MongoDB 6+
- Redis 7+
- Git
```

---

## 1. Initial Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your configuration
# Required variables:
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/shopping
JWT_SECRET=your-secret-key-at-least-32-chars
REDIS_URL=redis://localhost:6379
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# 5. Start MongoDB and Redis
docker-compose up -d

# 6. Create database indexes
npm run create-indexes

# 7. Start the application
npm run dev
```

---

## 2. Test Swagger Documentation

### Access the API Documentation

```bash
# Open your browser
http://localhost:5000/api-docs
```

### Try It Out

1. Click **Authorize** button (top right)
2. Register a new user:
   - Expand `POST /api/auth/register`
   - Click "Try it out"
   - Fill in user details
   - Click "Execute"
3. Copy the JWT token from response
4. Click **Authorize** again
5. Paste token in format: `Bearer <your-token>`
6. Now you can test all protected endpoints!

### Test These Endpoints

```bash
# Browse products
GET /api/products

# Add to cart
POST /api/cart/add
{
  "productId": "<product-id>",
  "quantity": 2
}

# Checkout
POST /api/orders/checkout

# View your orders
GET /api/orders/my

# Leave a review
POST /api/reviews
{
  "productId": "<product-id>",
  "rating": 5,
  "comment": "Great product!"
}
```

---

## 3. Test Email Templates

### Setup Gmail for Testing

```bash
# 1. Enable 2-Step Verification in your Google Account
# 2. Generate App Password:
#    - Go to https://myaccount.google.com/apppasswords
#    - Select "Mail" and your device
#    - Copy the 16-character password
# 3. Update .env:
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=<16-char-app-password>
```

### Test Order Confirmation Email

```bash
# 1. Create an order via API or Swagger UI
POST /api/orders/checkout

# 2. Check your email inbox
# You should receive a professional order confirmation email

# 3. Test other emails:
# - Order Status Update: Update order status as admin
# - Order Cancellation: Cancel an order
# - Welcome Email: Register a new user
# - Password Reset: Request password reset
# - Review Request: Automated after order delivery
```

### Preview Email Templates

```bash
# Templates are located at:
backend/src/templates/emails/

# Open in browser to preview:
backend/src/templates/emails/order-confirmation.html
```

---

## 4. Test Order Cancellation

### Cancel an Order

```bash
# 1. Create an order first
POST /api/orders/checkout

# 2. Check if order can be cancelled
GET /api/orders/:orderId/can-cancel

# 3. Cancel the order
POST /api/orders/:orderId/cancel
{
  "reason": "Changed my mind"
}

# 4. Check emails:
# - Order cancellation notification
# - Refund confirmation (if applicable)

# 5. Verify stock restoration
GET /api/products/:productId
# Stock should be increased back
```

### Admin Cancellation Stats

```bash
# View cancellation statistics (admin only)
GET /api/admin/orders/cancellation-stats
```

---

## 5. Test Review Moderation

### Submit Reviews

```bash
# 1. Submit a normal review
POST /api/reviews
{
  "productId": "<product-id>",
  "rating": 5,
  "comment": "Excellent product, highly recommended!"
}

# 2. Submit a spam review (will be auto-rejected)
POST /api/reviews
{
  "productId": "<product-id>",
  "rating": 5,
  "comment": "BUY NOW!!! CLICK HERE!!! FREE MONEY!!!"
}

# 3. Submit review with profanity (will be flagged)
POST /api/reviews
{
  "productId": "<product-id>",
  "rating": 1,
  "comment": "This product is [profanity]"
}
```

### Admin Moderation Queue

```bash
# 1. Login as admin
# 2. View moderation queue
GET /api/reviews/admin/moderation-queue?status=pending

# 3. Approve a review
POST /api/reviews/admin/:reviewId/approve

# 4. Reject a review
POST /api/reviews/admin/:reviewId/reject
{
  "reason": "Inappropriate content"
}

# 5. Flag for review
POST /api/reviews/admin/:reviewId/flag
{
  "reason": "Requires further investigation"
}

# 6. View moderation stats
GET /api/reviews/admin/moderation-stats
```

---

## 6. Test Enhanced Analytics

### Admin Dashboard

```bash
# Access comprehensive analytics (admin only)
GET /api/analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31

# Response includes:
# - Total revenue, orders, customers
# - Average order value
# - Top products and categories
# - Customer metrics
# - Revenue trends
```

### Specific Analytics

```bash
# Sales overview
GET /api/analytics/sales/overview?startDate=2024-01-01

# Revenue trends (group by month)
GET /api/analytics/sales/trends?groupBy=month

# Top 10 products
GET /api/analytics/products/top?limit=10

# Customer metrics
GET /api/analytics/customers/metrics

# Product performance
GET /api/analytics/products/performance

# Category sales
GET /api/analytics/categories/sales
```

---

## 7. Test Inventory Management

### Check Product Availability

```bash
POST /api/inventory/check-availability
{
  "productId": "<product-id>",
  "quantity": 5
}
```

### Reserve Stock (for checkout)

```bash
POST /api/inventory/reserve
{
  "productId": "<product-id>",
  "quantity": 2
}
# Returns reservationId - used in checkout
```

### Admin Stock Management

```bash
# Add stock
POST /api/inventory/add-stock
{
  "productId": "<product-id>",
  "quantity": 100
}

# Adjust stock (can be negative)
POST /api/inventory/adjust-stock
{
  "productId": "<product-id>",
  "quantity": -5,
  "reason": "Damaged items"
}

# View stock history
GET /api/inventory/history/:productId

# View low stock alerts
GET /api/inventory/alerts
```

---

## 8. Test CI/CD Pipeline (Local)

### Run Tests Locally

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test auth.test.js
```

### Test Docker Build

```bash
# Build Docker image
docker build -t shopping-site:test .

# Run container
docker run -p 5000:5000 \
  -e MONGO_URI=mongodb://host.docker.internal:27017/shopping \
  -e JWT_SECRET=test-secret \
  shopping-site:test

# Test the API
curl http://localhost:5000/health
```

### Setup GitHub Actions

```bash
# 1. Push code to GitHub
git add .
git commit -m "feat: add all new features"
git push origin main

# 2. GitHub Actions will automatically:
# - Run tests
# - Run linting
# - Run security audits
# - Build Docker image (on main/dev)

# 3. View workflow runs:
# GitHub → Actions tab
```

---

## 9. End-to-End Testing

### Complete User Journey

```bash
# 1. Register
POST /api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "securepass123"
}
# ✉️ Receives welcome email

# 2. Login
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "securepass123"
}
# 🔑 Get JWT token

# 3. Browse products
GET /api/products?category=electronics&sort=price-asc

# 4. Check availability
POST /api/inventory/check-availability
{
  "productId": "<product-id>",
  "quantity": 2
}

# 5. Add to cart
POST /api/cart/add
{
  "productId": "<product-id>",
  "quantity": 2
}

# 6. Apply coupon
POST /api/coupons/validate
{
  "code": "SAVE20"
}

# 7. Checkout
POST /api/orders/checkout
# ✉️ Receives order confirmation email
# 📦 Stock automatically reserved

# 8. View order
GET /api/orders/my

# 9. Cancel order (if within 24 hours)
POST /api/orders/:orderId/cancel
{
  "reason": "Changed my mind"
}
# ✉️ Receives cancellation + refund emails
# 📦 Stock automatically restored

# 10. Leave review
POST /api/reviews
{
  "productId": "<product-id>",
  "rating": 5,
  "comment": "Great product!"
}
# 🔍 Auto-moderated for spam
# ✉️ Admin notified if flagged
```

---

## 10. Admin Workflow

### Admin Access

```bash
# 1. Create admin user (via database or script)
# 2. Login as admin
# 3. Access admin endpoints
```

### Admin Tasks

```bash
# View all orders
GET /api/admin/orders

# View cancellation stats
GET /api/admin/orders/cancellation-stats

# Moderate reviews
GET /api/reviews/admin/moderation-queue
POST /api/reviews/admin/:id/approve
POST /api/reviews/admin/:id/reject

# View analytics
GET /api/analytics/dashboard

# Manage inventory
POST /api/inventory/add-stock
GET /api/inventory/alerts

# Manage users
GET /api/admin/users
PUT /api/admin/users/:id/role
```

---

## Troubleshooting

### Issue: Swagger UI not loading

```bash
# Solution:
1. Check if server is running: http://localhost:5000/health
2. Clear browser cache
3. Check console for errors
4. Verify swagger packages: npm list swagger-jsdoc swagger-ui-express
```

### Issue: Emails not sending

```bash
# Solution:
1. Check EMAIL_USER and EMAIL_PASS in .env
2. Use Gmail App Password (not regular password)
3. Check logs: backend/logs/error.log
4. Test SMTP connection:
   node -e "require('./src/services/emailService.js')"
```

### Issue: Redis connection failed

```bash
# Solution:
1. Check if Redis is running: redis-cli ping
2. Start Redis: docker-compose up -d redis
3. Check REDIS_URL in .env
```

### Issue: MongoDB indexes not created

```bash
# Solution:
npm run create-indexes
# Check output for any errors
```

### Issue: Tests failing

```bash
# Solution:
1. Ensure MongoDB Memory Server is installed
2. Check test environment variables
3. Run tests with verbose output: npm test -- --verbose
4. Check specific test file: npm test auth.test.js
```

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench
# Ubuntu: sudo apt-get install apache2-utils
# Mac: brew install apache2-utils

# Test product listing
ab -n 1000 -c 10 http://localhost:5000/api/products

# Test with authentication
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
   http://localhost:5000/api/orders/my
```

### Monitor Performance

```bash
# Check response times in logs
tail -f backend/logs/combined.log

# Monitor Redis cache hits
redis-cli monitor

# Check MongoDB query performance
# Enable profiling in MongoDB
```

---

## Next Steps

### Production Deployment

1. Read `CI_CD_PIPELINE_GUIDE.md`
2. Configure GitHub secrets
3. Set up cloud provider accounts
4. Configure domain and SSL
5. Deploy to staging first
6. Run smoke tests
7. Deploy to production with approval

### Additional Features

1. Explore API documentation at `/api-docs`
2. Customize email templates in `src/templates/emails/`
3. Add custom analytics queries
4. Configure additional payment gateways
5. Set up monitoring and alerting

---

## Resources

- **API Documentation**: http://localhost:5000/api-docs
- **Feature Summary**: `FEATURE_IMPLEMENTATION_SUMMARY.md`
- **CI/CD Guide**: `CI_CD_PIPELINE_GUIDE.md`
- **Swagger Guide**: `SWAGGER_DOCUMENTATION.md`
- **Code Examples**: Check `tests/` directory

---

## Support

Need help? Check these resources:

1. API documentation at `/api-docs`
2. Feature guides in root directory
3. Test files for code examples
4. GitHub Issues for bug reports

---

**Happy Coding! 🚀**
