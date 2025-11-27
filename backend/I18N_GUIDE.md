# Internationalization (i18n) Guide

## Overview

This shopping site backend supports **7 languages** with automatic language detection and comprehensive translations for all user-facing messages.

## Supported Languages

| Language | Code | Currency |
| -------- | ---- | -------- |
| English  | en   | USD      |
| Spanish  | es   | EUR      |
| French   | fr   | EUR      |
| German   | de   | EUR      |
| Arabic   | ar   | SAR      |
| Chinese  | zh   | CNY      |
| Japanese | ja   | JPY      |

## Architecture

### Configuration Files

1. **`src/config/i18n.js`** - Main i18n configuration

   - Configures supported locales
   - Sets default locale (English)
   - Enables auto-reload in development
   - Configures translation directory

2. **`src/middleware/i18n.js`** - Language detection middleware

   - Detects user language from multiple sources
   - Attaches translation functions to request/response
   - Provides helper functions for translation

3. **`src/locales/*.json`** - Translation files
   - One JSON file per language
   - 150+ translation keys organized by domain
   - Parameterization support for dynamic values

## Language Detection Priority

The system detects the user's preferred language in the following order:

1. **Query Parameter** (highest priority): `?lang=es`
2. **Custom Header**: `X-Language: fr`
3. **Accept-Language Header**: `Accept-Language: de-DE,de;q=0.9,en;q=0.8`
4. **Default**: `en` (English)

### Examples

```bash
# Using query parameter
GET /api/products?lang=es

# Using custom header
GET /api/products
X-Language: fr

# Using Accept-Language header
GET /api/products
Accept-Language: de-DE,de;q=0.9,en;q=0.8
```

## Translation Structure

All translation files follow the same structure with **8 domains**:

### 1. Authentication (`auth`)

- Login/logout messages
- Registration confirmations
- Email verification
- Password reset
- Token validation

### 2. Products (`product`)

- CRUD operation messages
- Stock status
- Inventory alerts

### 3. Cart (`cart`)

- Add/remove/update messages
- Coupon application
- Cart validation

### 4. Orders (`order`)

- Order creation/cancellation
- Status labels
- Refund messages
- Order tracking

### 5. Reviews (`review`)

- Review submission
- Moderation workflow
- Approval/rejection

### 6. Payments (`payment`)

- Transaction status
- Success/failure messages
- Refund notifications

### 7. User (`user`)

- Profile updates
- Password changes
- Address management

### 8. Inventory (`inventory`)

- Stock alerts
- Inventory updates

### 9. Coupons (`coupon`)

- Coupon validation
- Expiration messages
- Usage limits

### 10. Vendors (`vendor`)

- Registration confirmations
- Product listings
- Order notifications
- Payout requests

### 11. Loyalty (`loyalty`)

- Points earned
- Rewards redeemed
- Tier upgrades
- Referral success

### 12. Errors (`error`)

- Server errors
- Authorization errors
- Validation errors
- Rate limiting

### 13. Common (`common`)

- UI labels
- Pagination
- Loading states
- Currency symbols

### 14. Emails (`email`)

- Email subjects
- Greetings
- Footer content
- Unsubscribe links

## Using Translations in Routes

### Basic Usage

```javascript
// In route handlers
router.post("/login", async (req, res) => {
  try {
    // Authenticate user
    const user = await authenticateUser(req.body);

    // Return translated message
    res.json({
      message: req.t("auth.loginSuccess"),
      user,
    });
  } catch (error) {
    res.status(401).json({
      error: req.t("auth.loginFailed"),
    });
  }
});
```

### With Parameters

```javascript
// Translation with dynamic values
router.get("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product.stock < 10) {
    res.json({
      product,
      warning: req.t("product.lowStock", { count: product.stock }),
    });
  }
});
```

### Pluralization

```javascript
// Using plural forms
router.get("/cart", async (req, res) => {
  const items = await Cart.find({ userId: req.user.id });

  res.json({
    items,
    message: req.tn("common.items", "common.items_plural", items.length, {
      count: items.length,
    }),
  });
});
```

## Translation Keys Reference

### Authentication Messages

```json
{
  "auth.loginSuccess": "Login successful",
  "auth.loginFailed": "Invalid credentials",
  "auth.emailNotVerified": "Email not verified. Please check your inbox.",
  "auth.userRegistered": "User registered. Please check your email.",
  "auth.emailAlreadyRegistered": "Email already registered",
  "auth.passwordResetSent": "If email exists, reset link sent.",
  "auth.passwordResetSuccess": "Password reset successful. You can now log in.",
  "auth.invalidToken": "Invalid or expired token",
  "auth.logoutSuccess": "Logged out successfully"
}
```

### Product Messages

```json
{
  "product.created": "Product created successfully",
  "product.updated": "Product updated successfully",
  "product.deleted": "Product deleted successfully",
  "product.notFound": "Product not found",
  "product.outOfStock": "Product out of stock",
  "product.lowStock": "Only {{count}} items left in stock"
}
```

### Order Status Labels

```json
{
  "order.statusPending": "Pending",
  "order.statusPaid": "Paid",
  "order.statusShipped": "Shipped",
  "order.statusDelivered": "Delivered",
  "order.statusCancelled": "Cancelled"
}
```

## Email Localization

### Email Templates

When sending emails, use translation keys for subjects and content:

```javascript
import { translate } from "./middleware/i18n.js";

async function sendOrderConfirmation(order, userLocale) {
  const subject = translate(
    "email.subject.orderConfirmation",
    { orderId: order._id },
    userLocale
  );
  const greeting = translate(
    "email.greeting",
    { name: order.user.name },
    userLocale
  );
  const thankYou = translate("email.thankYou", {}, userLocale);

  await sendEmail({
    to: order.user.email,
    subject,
    html: `
      <h2>${greeting}</h2>
      <p>${thankYou}</p>
      <p>${translate("email.orderPlaced", {}, userLocale)}</p>
      <a href="${trackingUrl}">${translate(
      "email.trackOrder",
      {},
      userLocale
    )}</a>
    `,
  });
}
```

## API Response Examples

### English Response

```bash
GET /api/products/123?lang=en

Response:
{
  "message": "Product updated successfully",
  "product": {...}
}
```

### Spanish Response

```bash
GET /api/products/123?lang=es

Response:
{
  "message": "Producto actualizado con éxito",
  "product": {...}
}
```

### Arabic Response (RTL)

```bash
GET /api/products/123?lang=ar

Response:
{
  "message": "تم تحديث المنتج بنجاح",
  "product": {...}
}
```

## Adding New Translations

### Step 1: Add to English File

Add your new key to `src/locales/en.json`:

```json
{
  "newFeature": {
    "successMessage": "Feature activated successfully",
    "errorMessage": "Failed to activate feature"
  }
}
```

### Step 2: Translate to All Languages

Add the same structure to all other language files:

- `es.json` - Spanish translation
- `fr.json` - French translation
- `de.json` - German translation
- `ar.json` - Arabic translation
- `zh.json` - Chinese translation
- `ja.json` - Japanese translation

### Step 3: Use in Code

```javascript
res.json({
  message: req.t("newFeature.successMessage"),
});
```

## Best Practices

### 1. **Always Use Translation Keys**

❌ Bad:

```javascript
res.json({ message: "Product created successfully" });
```

✅ Good:

```javascript
res.json({ message: req.t("product.created") });
```

### 2. **Use Parameters for Dynamic Content**

❌ Bad:

```javascript
res.json({ message: `Only ${stock} items left` });
```

✅ Good:

```javascript
res.json({ message: req.t("product.lowStock", { count: stock }) });
```

### 3. **Respect User's Language Preference**

- Check query parameters first
- Fall back to headers
- Store user language preference in database
- Remember language choice in sessions

### 4. **RTL Support for Arabic**

When rendering Arabic content, ensure proper RTL (Right-to-Left) support:

```css
[lang="ar"] {
  direction: rtl;
  text-align: right;
}
```

### 5. **Date and Number Formatting**

Use locale-aware formatting:

```javascript
// Format date according to locale
const formattedDate = new Date().toLocaleDateString(req.locale);

// Format currency
const price = product.price.toLocaleString(req.locale, {
  style: "currency",
  currency: req.locale === "en" ? "USD" : "EUR",
});
```

## Testing

### Test Language Switching

```bash
# Test English (default)
curl http://localhost:5000/api/products

# Test Spanish
curl http://localhost:5000/api/products?lang=es

# Test with header
curl http://localhost:5000/api/products \
  -H "X-Language: fr"

# Test with Accept-Language
curl http://localhost:5000/api/products \
  -H "Accept-Language: de-DE,de;q=0.9"
```

### Verify Translation Files

Run validation to ensure all translation files have the same keys:

```bash
node scripts/validate-translations.js
```

## Environment Configuration

No environment variables required for basic i18n functionality. The default configuration works out of the box.

Optional configurations in `.env`:

```env
# Default locale (if not specified, defaults to 'en')
DEFAULT_LOCALE=en

# Enable i18n debug mode
I18N_DEBUG=false
```

## Troubleshooting

### Translation Key Not Found

If you see `[missing "es.product.created" translation]`:

1. Check that the key exists in `src/locales/es.json`
2. Verify the JSON file is valid (no syntax errors)
3. Restart the server (if auto-reload is disabled)

### Wrong Language Returned

1. Check the priority: query param > header > Accept-Language
2. Verify the language code is supported (en, es, fr, de, ar, zh, ja)
3. Check for typos in language code (use lowercase)

### Parameterized Values Not Showing

Ensure you're passing the correct parameter object:

```javascript
// Correct
req.t("product.lowStock", { count: 5 });

// Wrong - missing parameters
req.t("product.lowStock");
```

## Performance Considerations

- **Translation files are cached** after first load
- **No database queries** for translations
- **Minimal overhead** - ~1ms per request
- **Memory efficient** - translations loaded once on startup

## Migration Guide

### Updating Existing Routes

To migrate existing routes to use i18n:

**Before:**

```javascript
res.json({ message: "Product created successfully" });
```

**After:**

```javascript
res.json({ message: req.t("product.created") });
```

### Batch Update Script

Run this script to find all hardcoded strings:

```bash
grep -r "message.*:" src/routes/ --include="*.js"
```

## Future Enhancements

- [ ] Add more languages (Italian, Portuguese, Russian, Korean)
- [ ] Implement translation management UI for admins
- [ ] Add automatic translation using Google Translate API
- [ ] Create translation validation tests
- [ ] Add frontend i18n integration guide
- [ ] Implement locale-specific currency conversion

## Support

For questions or issues with internationalization:

1. Check this guide first
2. Review translation files in `src/locales/`
3. Check middleware implementation in `src/middleware/i18n.js`
4. Test with different language codes using query parameters

---

**Last Updated:** 2024
**Version:** 1.0.0
**Supported Languages:** 7 (en, es, fr, de, ar, zh, ja)
