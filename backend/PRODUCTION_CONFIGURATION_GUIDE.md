# Production Configuration Guide

## Overview

This guide lists all placeholders and configurations that need to be updated with real credentials and settings before deploying to production.

---

## 🔐 Required Environment Variables (.env)

### Critical - Must Change for Production

#### 1. **JWT_SECRET**

```env
# Current: May be weak or default
JWT_SECRET=your-super-secure-random-32-character-minimum-secret-key-here

# Generate a strong secret:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 2. **MongoDB Connection**

```env
# Current: localhost
MONGO_URI=mongodb://localhost:27017/shopping

# Production Options:
# MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/shopping?retryWrites=true&w=majority
# Self-hosted: mongodb://username:password@your-server.com:27017/shopping
```

#### 3. **Redis Connection**

```env
# Current: localhost
REDIS_URL=redis://localhost:6379

# Production Options:
# Redis Cloud: redis://username:password@redis-server.com:6379
# AWS ElastiCache: redis://your-cluster.cache.amazonaws.com:6379
# Azure Cache: redis://:password@your-cache.redis.cache.windows.net:6380?ssl=true
```

#### 4. **Email Service (Nodemailer)**

```env
# Current: Generic placeholder
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# For Gmail:
# 1. Enable 2FA in Google Account
# 2. Generate App Password at https://myaccount.google.com/apppasswords
# 3. Use the 16-character password

# For Production SMTP (recommended):
# EMAIL_HOST=smtp.yourdomain.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=noreply@yourdomain.com
# EMAIL_PASS=your-smtp-password

# Popular Services:
# SendGrid: smtp.sendgrid.net (Port 587)
# Mailgun: smtp.mailgun.org (Port 587)
# AWS SES: email-smtp.region.amazonaws.com (Port 587)
```

#### 5. **Stripe Payment Gateway (Primary)**

```env
# Current: Test mode keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Production:
# 1. Go to https://dashboard.stripe.com/
# 2. Switch to "Live mode" (toggle in sidebar)
# 3. Go to Developers → API keys
# 4. Copy your live keys
# 5. Set up webhooks at Developers → Webhooks
#    - Webhook URL: https://api.yourdomain.com/api/payment/webhook
#    - Listen to: payment_intent.succeeded, payment_intent.payment_failed
# 6. Copy webhook signing secret

STRIPE_SECRET_KEY=sk_live_your_actual_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_signing_secret
```

#### 6. **PayPal (Optional - Legacy Support)**

```env
# Note: Your project primarily uses Stripe
# PayPal integration exists but is optional
# Only configure if you need PayPal as alternative payment method

PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Change to 'live' for production
```

#### 7. **Frontend & API URLs**

```env
# Current: localhost
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:5000

# Production:
FRONTEND_URL=https://www.yourdomain.com
BASE_URL=https://api.yourdomain.com
```

#### 8. **CORS Origins**

```env
# Add to .env
ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com

# Update in src/index.js if hardcoded
```

#### 9. **CSRF Secret**

```env
# Generate a strong secret for CSRF protection
CSRF_SECRET=your-csrf-secret-change-in-production

# Generate using:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 10. **JWT Refresh Secret**

```env
# Separate secret for refresh tokens
JWT_REFRESH_SECRET=your-jwt-refresh-secret-different-from-jwt-secret

# Generate using:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📝 Code Files - Configuration Status

### ✅ GOOD NEWS: Placeholders Already Addressed!

All hardcoded placeholders have been updated to use **environment variables**. You only need to set values in your `.env` file - no code changes required!

---

### 1. **Swagger API Documentation** ✅ CONFIGURED

**File:** `backend/src/config/swagger.js`

**Status:** ✅ **Already updated to use environment variables**

```javascript
// Now uses environment variables:
contact: {
  name: "API Support",
  email: process.env.SUPPORT_EMAIL || "support@yourdomain.com",
},

servers: [
  {
    url: process.env.BASE_URL || "http://localhost:5000",
    description: "Development server",
  },
  {
    url: process.env.PRODUCTION_API_URL || "https://api.yourdomain.com",
    description: "Production server",
  },
],
```

**Action Required:** Set in `.env`:

```env
SUPPORT_EMAIL=support@yourdomain.com
BASE_URL=https://api.yourdomain.com
PRODUCTION_API_URL=https://api.yourdomain.com
```

---

### 2. **Email Templates** ✅ CONFIGURED

**Files:**

- `backend/src/templates/emails/base.html`
- `backend/src/services/templateService.js`

**Status:** ✅ **Already updated to use template variables**

```html
<!-- Template now uses variables: -->
<h1>🛍️ {{companyName}}</h1>
<div class="footer">
  <p><strong>{{companyName}}</strong></p>
  <p>{{companyAddress}}</p>
  <p>Email: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
  <p>&copy; 2025 {{companyName}}. All rights reserved.</p>
</div>
```

**Action Required:** Set in `.env`:

```env
COMPANY_NAME=Your Company Name
COMPANY_ADDRESS=Your Real Address, City, State ZIP
SUPPORT_EMAIL=support@yourdomain.com
```

---

### 3. **CORS Configuration** ✅ CONFIGURED

**File:** `backend/src/index.js`

**Status:** ✅ **Already uses environment variable**

```javascript
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? process.env.ALLOWED_ORIGINS?.split(",") || []
    : ["http://localhost:3000", "http://localhost:8080"];
```

**Action Required:** Set in `.env`:

```env
ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com
```

---**What to Change:**

```html
<!-- ✅ Update with your real information -->
<h1>🛍️ Your Company Name</h1>

<div class="footer">
  <p><strong>Your Company Name</strong></p>
  <p>Your Real Address, City, State ZIP</p>
  <p>
    Email:
    <a href="mailto:support@yourdomain.com">support@yourdomain.com</a>
  </p>
  <p>&copy; 2025 Your Company Name. All rights reserved.</p>
</div>
```

---

### 3. **CORS Configuration**

**File:** `backend/src/index.js`

**Lines to Update:**

```javascript
// Line 58 - CORS origins
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://www.yourdomain.com"] // ⚠️ Add your production domains
    : ["http://localhost:3000", "http://localhost:8080"];
```

**What to Change:**

```javascript
// ✅ Add all your production domains
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "https://www.yourdomain.com",
        "https://yourdomain.com",
        "https://app.yourdomain.com", // Add all allowed domains
      ]
    : ["http://localhost:3000", "http://localhost:8080"];
```

---

### 4. **PayPal Service - Callback URLs**

**File:** `backend/src/services/paypalService.js`

**Lines to Update:**

````javascript
---

### 4. **Stripe Webhook Configuration**
**File:** `backend/src/routes/payment.js`

**Action Required:**
1. **Set up Stripe Webhook in Dashboard:**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://api.yourdomain.com/api/payment/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook signing secret

2. **Update .env with webhook secret:**
```env
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_signing_secret
````

3. **Ensure BASE_URL is set for payment redirects:**

```env
BASE_URL=https://api.yourdomain.com
```

**Note:** PayPal endpoints exist in the code (lines 85-224) but are optional. If not using PayPal, they will gracefully return "not configured" responses.

---

````

**Ensure BASE_URL is set in .env:**

```env
BASE_URL=https://api.yourdomain.com
````

---

### 5. **Payment Routes - Redirect URLs**

**File:** `backend/src/routes/payment.js`

**Line 120 - Fallback URL:**

```javascript
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000"; // ⚠️
```

**Ensure FRONTEND_URL is set in .env:**

```env
FRONTEND_URL=https://www.yourdomain.com
```

---

## 🏢 Company Branding Updates

### Items to Customize:

1. **Company Name:** "Shopping Site" → Your Company Name
2. **Support Email:** support@shoppingsite.com → support@yourdomain.com
3. **Company Address:** Update in email footer
4. **Logo:** Add your company logo to email templates
5. **Brand Colors:** Update CSS colors in email templates

---

## 🔒 Security Hardening

### 1. **Strong Secrets Generation**

```bash
# Generate JWT Secret (64 bytes = 128 hex chars)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate CSRF Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. **Environment-Specific Settings**

Create separate `.env` files:

- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

**Never commit these files to Git!**

---

## 📧 Email Service Setup

### Option 1: Gmail (Development Only)

1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use in EMAIL_PASS

### Option 2: SendGrid (Recommended for Production)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

### Option 3: AWS SES (Cost-Effective)

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password
```

### Option 4: Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@yourdomain.com
EMAIL_PASS=your_mailgun_password
```

---

## 💳 Payment Gateway Setup

### PayPal Setup

1. Go to https://developer.paypal.com/
2. Create an app
3. Switch to Live for production
4. Copy Client ID and Secret
5. Configure webhooks for order updates

### Stripe Setup (Alternative)

1. Go to https://dashboard.stripe.com/
2. Get API keys from Developers → API keys
3. Test with `sk_test_*` keys
4. Production uses `sk_live_*` keys
5. Configure webhook endpoints

---

## 🗄️ Database Configuration

### MongoDB Production Setup

#### Option 1: MongoDB Atlas (Managed)

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Add database user
4. Whitelist IP addresses (or 0.0.0.0/0 for all)
5. Get connection string
6. Update MONGO_URI in .env

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopping?retryWrites=true&w=majority
```

#### Option 2: Self-Hosted MongoDB

```env
MONGO_URI=mongodb://username:password@your-server:27017/shopping?authSource=admin
```

### Redis Production Setup

#### Option 1: Redis Cloud

1. Sign up at https://redis.com/cloud/
2. Create database
3. Get connection URL
4. Update REDIS_URL in .env

```env
REDIS_URL=redis://username:password@redis-server.com:6379
```

#### Option 2: AWS ElastiCache

```env
REDIS_URL=redis://your-cluster.cache.amazonaws.com:6379
```

---

## 🌐 Domain & SSL Configuration

### 1. **Domain Setup**

- Register domain with registrar (Namecheap, GoDaddy, etc.)
- Configure DNS records:
  ```
  A     @           -> Your server IP
  A     www         -> Your server IP
  A     api         -> Your API server IP
  CNAME www         -> yourdomain.com
  ```

### 2. **SSL Certificate**

- Use Let's Encrypt (free): https://letsencrypt.org/
- Or use cloud provider SSL (AWS Certificate Manager, etc.)

### 3. **Update All URLs**

- Environment variables: FRONTEND_URL, BASE_URL
- Swagger config: servers array
- Email templates: links and URLs
- CORS: allowed origins
- Payment callbacks: return_url, cancel_url

---

## 🚀 Deployment Checklist

### Before Deployment:

- [ ] **Generate strong secrets** (JWT_SECRET, JWT_REFRESH_SECRET, CSRF_SECRET)
- [ ] **Set up production database** (MongoDB Atlas)
- [ ] **Set up production Redis** cache
- [ ] **Configure production email** service (SendGrid/AWS SES)
- [ ] **Get Stripe live credentials** (sk_live, pk_live, webhook secret)
- [ ] **Set up Stripe webhooks** in dashboard
- [ ] **Update all URLs and domains** (FRONTEND_URL, BASE_URL, ALLOWED_ORIGINS)
- [ ] **Update company information** in email templates (name, address, email)
- [ ] **Update Swagger contact** information (support email, API URL)
- [ ] **Configure CORS** allowed origins for production domains
- [ ] **Set up SSL certificates** (Let's Encrypt or cloud provider)
- [ ] **Configure environment variables** on server (.env file)
- [ ] **Test email delivery** (registration, order confirmation, password reset)
- [ ] **Test Stripe payment** processing with test cards
- [ ] **Run database migrations** if any
- [ ] **Create database indexes:** `npm run create-indexes`
- [ ] **Set up monitoring** and logging (PM2, CloudWatch, etc.)
- [ ] **Configure automated backups** (MongoDB Atlas automated backups)
- [ ] **Set up error tracking** (Sentry, LogRocket, etc.)
- [ ] **Remove PayPal dependencies** if not using: `npm uninstall @paypal/checkout-server-sdk`

### After Deployment:

- [ ] Verify API is accessible
- [ ] Test user registration with email
- [ ] Test order placement
- [ ] Test payment processing
- [ ] Test email notifications
- [ ] Verify Swagger docs at /api-docs
- [ ] Check database connections
- [ ] Monitor error logs
- [ ] Set up automated backups
- [ ] Configure monitoring alerts

---

## 🔍 Environment Variables Summary

### Minimal Production .env File:

```env
# Application
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/shopping_site

# Cache
REDIS_URL=redis://user:pass@redis-server.com:6379

# Authentication & Security
JWT_SECRET=your-64-character-hex-secret-here-generate-with-crypto
JWT_REFRESH_SECRET=your-64-character-hex-refresh-secret-here
CSRF_SECRET=your-32-character-hex-csrf-secret-here

# Email Service
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com

# Payment - Stripe (Primary)
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_signing_secret

# Payment - PayPal (Optional)
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
PAYPAL_MODE=live

# URLs & CORS
FRONTEND_URL=https://www.yourdomain.com
BASE_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880

# Optional: Monitoring & Logging
SENTRY_DSN=your_sentry_dsn
```

---

## 📚 Additional Resources

- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **Redis Cloud:** https://redis.com/cloud/
- **SendGrid:** https://sendgrid.com/
- **AWS SES:** https://aws.amazon.com/ses/
- **PayPal Developer:** https://developer.paypal.com/
- **Stripe Documentation:** https://stripe.com/docs
- **Let's Encrypt SSL:** https://letsencrypt.org/

---

## ⚠️ Security Warnings

1. **Never commit .env files to Git**
2. **Use strong, randomly generated secrets**
3. **Rotate credentials regularly**
4. **Use environment-specific credentials**
5. **Enable 2FA on all service accounts**
6. **Whitelist IP addresses where possible**
7. **Use SSL/TLS for all connections**
8. **Monitor access logs regularly**
9. **Keep dependencies updated**
10. **Set up automated security scanning**

---

## 📞 Support

For questions about production configuration:

- Review this guide thoroughly
- Check service provider documentation
- Test in staging environment first
- Monitor logs after deployment

**Last Updated:** November 11, 2025
