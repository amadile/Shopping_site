# API Documentation with Swagger

## Overview

The Shopping Site API is fully documented using Swagger/OpenAPI 3.0 specification. This provides an interactive API documentation interface accessible via web browser.

## Accessing the Documentation

### Development

Open your browser and navigate to:

```
http://localhost:5000/api-docs
```

### Production

```
https://api.shoppingsite.com/api-docs
```

## Features

### Interactive API Explorer

- **Try It Out**: Test API endpoints directly from the documentation
- **Request/Response Examples**: See example payloads and responses
- **Schema Validation**: View detailed schema definitions for all data models
- **Authentication**: Authenticate with JWT tokens to test protected endpoints

### Comprehensive Coverage

The API documentation includes all endpoints across 9 categories:

1. **Authentication** - User registration, login, password reset
2. **Products** - Product catalog, search, filtering
3. **Cart** - Shopping cart management
4. **Orders** - Order creation, tracking, cancellation
5. **Reviews** - Product reviews and moderation
6. **Coupons** - Discount code management
7. **Inventory** - Stock management and availability
8. **Analytics** - Sales and performance metrics
9. **Admin** - Administrative operations

## Using the Swagger UI

### 1. Authorize with JWT

Click the **Authorize** button at the top right of the Swagger UI:

1. Enter your JWT token in the format: `Bearer <your-token>`
2. Click "Authorize"
3. All subsequent API calls will include the authentication header

### 2. Testing Endpoints

1. Expand any endpoint section
2. Click "Try it out"
3. Fill in required parameters
4. Click "Execute"
5. View the response below

### 3. Understanding Responses

Each endpoint shows:

- **Request Body Schema**: Required and optional fields
- **Response Codes**: All possible HTTP status codes
- **Response Schema**: Structure of successful responses
- **Error Schema**: Structure of error responses

## API Schemas

### User

```json
{
  "_id": "string",
  "name": "string",
  "email": "string",
  "role": "customer|admin|vendor",
  "isVerified": "boolean",
  "createdAt": "date"
}
```

### Product

```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "category": "string",
  "stock": "number",
  "images": ["string"],
  "variants": [
    {
      "name": "string",
      "options": [
        {
          "value": "string",
          "priceModifier": "number",
          "stock": "number"
        }
      ]
    }
  ],
  "rating": {
    "average": "number",
    "count": "number"
  }
}
```

### Order

```json
{
  "_id": "string",
  "user": "string",
  "items": [
    {
      "product": "string",
      "variant": "string",
      "quantity": "number",
      "price": "number"
    }
  ],
  "totalAmount": "number",
  "status": "pending|processing|shipped|delivered|cancelled",
  "shippingAddress": "object",
  "paymentMethod": "string",
  "cancellationReason": "string",
  "cancelledAt": "date",
  "cancelledBy": "string",
  "createdAt": "date"
}
```

### Review

```json
{
  "_id": "string",
  "product": "string",
  "user": "string",
  "rating": "number",
  "comment": "string",
  "moderationStatus": "pending|approved|rejected|flagged",
  "moderatedBy": "string",
  "moderatedAt": "date",
  "moderationReason": "string",
  "createdAt": "date"
}
```

### Cart

```json
{
  "_id": "string",
  "user": "string",
  "items": [
    {
      "product": "string",
      "variant": "string",
      "quantity": "number"
    }
  ],
  "coupon": "string",
  "updatedAt": "date"
}
```

### Coupon

```json
{
  "_id": "string",
  "code": "string",
  "type": "percentage|fixed",
  "value": "number",
  "minOrderValue": "number",
  "maxDiscount": "number",
  "expiryDate": "date",
  "usageLimit": "number",
  "usedCount": "number",
  "isActive": "boolean"
}
```

## Security

### Authentication

All protected endpoints require a valid JWT token:

- **Header**: `Authorization: Bearer <token>`
- **Format**: JWT
- **Expiration**: 24 hours

### Role-Based Access

- **Customer**: Can access own orders, cart, reviews
- **Admin**: Full access to all endpoints including analytics and moderation
- **Vendor**: Can manage own products and inventory

## Query Parameters

### Pagination

Most list endpoints support pagination:

```
?page=1&limit=20
```

### Filtering

Products can be filtered:

```
?category=electronics&minPrice=100&maxPrice=500
```

### Sorting

Products can be sorted:

```
?sort=price-asc|price-desc|rating-desc|newest
```

### Search

Full-text search on products:

```
?search=laptop
```

## Response Codes

| Code | Description                             |
| ---- | --------------------------------------- |
| 200  | Success                                 |
| 201  | Created                                 |
| 400  | Bad Request - Validation error          |
| 401  | Unauthorized - Missing or invalid token |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found                               |
| 409  | Conflict - Resource already exists      |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error                   |

## Rate Limiting

API endpoints are rate-limited:

- **Authentication endpoints**: 5 requests per 15 minutes
- **General endpoints**: 100 requests per 15 minutes
- **Admin endpoints**: 200 requests per 15 minutes

## Examples

### Complete Workflow Example

#### 1. Register a User

```bash
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

#### 2. Login

```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepass123"
}
# Response includes JWT token
```

#### 3. Browse Products

```bash
GET /api/products?category=electronics&sort=price-asc
```

#### 4. Add to Cart

```bash
POST /api/cart/add
Authorization: Bearer <token>
{
  "productId": "60d5ec49f1b2c8b1f8e4e1a1",
  "quantity": 2
}
```

#### 5. Apply Coupon

```bash
POST /api/coupons/validate
Authorization: Bearer <token>
{
  "code": "SAVE20"
}
```

#### 6. Checkout

```bash
POST /api/orders/checkout
Authorization: Bearer <token>
```

#### 7. Track Order

```bash
GET /api/orders/my
Authorization: Bearer <token>
```

#### 8. Leave Review

```bash
POST /api/reviews
Authorization: Bearer <token>
{
  "productId": "60d5ec49f1b2c8b1f8e4e1a1",
  "rating": 5,
  "comment": "Excellent product!"
}
```

## Advanced Features

### Order Cancellation

Cancel orders within allowed timeframe:

```bash
POST /api/orders/{orderId}/cancel
{
  "reason": "Changed my mind"
}
```

Check if order can be cancelled:

```bash
GET /api/orders/{orderId}/can-cancel
```

### Review Moderation (Admin)

Get moderation queue:

```bash
GET /api/reviews/admin/moderation-queue?status=pending
```

Approve/Reject review:

```bash
POST /api/reviews/admin/{reviewId}/approve
POST /api/reviews/admin/{reviewId}/reject
{
  "reason": "Violation of community guidelines"
}
```

### Analytics (Admin)

Comprehensive dashboard:

```bash
GET /api/analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31
```

Revenue trends:

```bash
GET /api/analytics/sales/trends?groupBy=month
```

Top products:

```bash
GET /api/analytics/products/top?limit=10
```

### Inventory Management

Check availability:

```bash
POST /api/inventory/check-availability
{
  "productId": "60d5ec49f1b2c8b1f8e4e1a1",
  "quantity": 5
}
```

Reserve stock:

```bash
POST /api/inventory/reserve
{
  "productId": "60d5ec49f1b2c8b1f8e4e1a1",
  "quantity": 2
}
```

## Configuration

### Swagger Options

The Swagger configuration is located at:

```
backend/src/config/swagger.js
```

### API Annotations

Endpoint annotations are in:

```
backend/src/docs/swagger-annotations.js
backend/src/routes/*.js
```

### Customization

To modify the Swagger UI appearance, edit:

```javascript
// In src/index.js
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Shopping Site API Docs",
  })
);
```

## Troubleshooting

### Swagger UI Not Loading

1. Ensure server is running: `npm run dev`
2. Check console for errors
3. Verify swagger packages are installed:
   ```bash
   npm list swagger-jsdoc swagger-ui-express
   ```

### Endpoints Not Showing

1. Verify JSDoc annotations are correct
2. Check `apis` array in `swagger.js` includes correct paths
3. Restart the server to reload annotations

### Authentication Not Working

1. Click "Authorize" button
2. Enter token in format: `Bearer <your-token>`
3. Ensure token is valid and not expired
4. Get fresh token from `/api/auth/login`

## Best Practices

1. **Always authenticate first** when testing protected endpoints
2. **Use Try It Out** to test endpoints before implementing in code
3. **Check response schemas** to understand expected data structure
4. **Review error responses** to handle edge cases properly
5. **Test pagination** for large data sets
6. **Validate request bodies** against schemas before sending

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/)
- [API Best Practices](https://swagger.io/resources/articles/best-practices-in-api-documentation/)

## Support

For API support or documentation issues:

- Email: support@shoppingsite.com
- GitHub Issues: [Repository Issues](https://github.com/yourorg/shopping-site/issues)
