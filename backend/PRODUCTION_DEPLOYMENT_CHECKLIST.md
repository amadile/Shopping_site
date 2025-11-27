# Production Deployment Checklist

## 🚀 Quick Reference: Replace All Placeholders

This is a quick checklist for replacing all placeholders with production values before deploying.

---

## ✅ Step 1: Generate Secure Secrets

Run these commands to generate strong secrets:

```bash
# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# CSRF Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Step 2: Update Environment Variables

Create/update your production `.env` file:

```env
# ============================================
# PRODUCTION .ENV FILE
# ============================================

# ----- Application -----
NODE_ENV=production
PORT=5000

# ----- Database -----
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopping_site
# 📝 Get from: MongoDB Atlas dashboard

# ----- Cache -----
REDIS_URL=redis://username:password@your-redis-host:6379
# 📝 Get from: Redis Cloud, AWS ElastiCache, or self-hosted

# ----- Security Secrets -----
JWT_SECRET=<paste-64-char-hex-from-step-1>
JWT_REFRESH_SECRET=<paste-64-char-hex-from-step-1>
CSRF_SECRET=<paste-32-char-hex-from-step-1>

# ----- Email Service -----
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=<your-sendgrid-api-key>
# 📝 Get from: SendGrid, AWS SES, or Mailgun

# ----- Company Information -----
COMPANY_NAME=Your Company Name
COMPANY_ADDRESS=Your Real Address, City, State ZIP
SUPPORT_EMAIL=support@yourdomain.com

# ----- URLs -----
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://www.yourdomain.com
PRODUCTION_API_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com

# ----- Stripe Payment (Primary) -----
STRIPE_SECRET_KEY=sk_live_<your-live-secret-key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your-live-publishable-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-signing-secret>
# 📝 Get from: https://dashboard.stripe.com/apikeys

# ----- Rate Limiting -----
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ----- File Upload -----
MAX_FILE_SIZE=5242880

# ----- Optional: Monitoring -----
# SENTRY_DSN=<your-sentry-dsn>
```

---

## ✅ Step 3: Update Code Files

### File: `backend/src/config/swagger.js`

✅ **ALREADY UPDATED** - Now uses environment variables:

- `process.env.SUPPORT_EMAIL`
- `process.env.BASE_URL`
- `process.env.PRODUCTION_API_URL`

**Action:** No code changes needed, just set env variables above!

---

### File: `backend/src/templates/emails/base.html`

✅ **ALREADY UPDATED** - Now uses template variables:

- `{{companyName}}`
- `{{companyAddress}}`
- `{{supportEmail}}`

**Action:** No code changes needed, just set env variables above!

---

## ✅ Step 4: Service Setup

### 4.1 MongoDB Atlas

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0)
3. Create database user with password
4. Add IP address: `0.0.0.0/0` (allow all) or specific IPs
5. Get connection string → Click "Connect" → "Connect your application"
6. Copy connection string and update `MONGO_URI` in `.env`

**Example:**

```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/shopping_site?retryWrites=true&w=majority
```

---

### 4.2 Redis (Optional but Recommended)

**Option A: Redis Cloud (Free tier available)**

1. Sign up at https://redis.com/cloud/
2. Create free database
3. Copy connection URL
4. Update `REDIS_URL` in `.env`

**Option B: Skip Redis**

- Comment out Redis in code or leave localhost URL
- Caching will be disabled, but app will still work

---

### 4.3 Email Service

**Option A: SendGrid (Recommended)**

1. Sign up at https://sendgrid.com/
2. Create API key: Settings → API Keys
3. Verify sender identity: Settings → Sender Authentication
4. Update `.env`:
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=SG.your_api_key_here
   ```

**Option B: AWS SES**

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=<your-smtp-username>
EMAIL_PASS=<your-smtp-password>
```

**Option C: Gmail (Development Only)**

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=<app-specific-password>
```

---

### 4.4 Stripe Payment Gateway

1. **Sign up:** https://dashboard.stripe.com/register
2. **Activate account** (provide business details)
3. **Switch to Live Mode** (toggle in sidebar)
4. **Get API keys:** Developers → API keys
5. **Set up webhook:**
   - Go to: Developers → Webhooks
   - Add endpoint: `https://api.yourdomain.com/api/payment/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook signing secret
6. **Update `.env`:**
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

📖 **Detailed Guide:** See `STRIPE_SETUP_GUIDE.md`

---

## ✅ Step 5: Domain & SSL Setup

### 5.1 Register Domain

- Use: Namecheap, GoDaddy, Google Domains, etc.
- Point DNS to your server IP

### 5.2 DNS Records

```
A     @     -> Your server IP (e.g., 123.45.67.89)
A     www   -> Your server IP
A     api   -> Your server IP (or separate API server)
```

### 5.3 SSL Certificate

**Option A: Let's Encrypt (Free)**

```bash
# Using Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

**Option B: Cloudflare (Free SSL + CDN)**

1. Sign up at https://www.cloudflare.com/
2. Add your domain
3. Update nameservers
4. Enable SSL/TLS

---

## ✅ Step 6: Deploy Backend

### Using VPS (DigitalOcean, AWS, etc.)

1. **SSH into server:**

   ```bash
   ssh root@your-server-ip
   ```

2. **Install dependencies:**

   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 (process manager)
   sudo npm install -g pm2
   ```

3. **Clone repository:**

   ```bash
   git clone https://github.com/yourusername/shopping_site.git
   cd shopping_site/backend
   ```

4. **Install packages:**

   ```bash
   npm install --production
   ```

5. **Create `.env` file:**

   ```bash
   nano .env
   # Paste production environment variables
   ```

6. **Start server with PM2:**

   ```bash
   pm2 start src/index.js --name shopping-api
   pm2 save
   pm2 startup
   ```

7. **Set up Nginx reverse proxy:**

   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## ✅ Step 7: GitHub Secrets (for CI/CD)

If using GitHub Actions workflows, add these secrets:

**Settings → Secrets and variables → Actions → New repository secret**

```
TEST_MONGO_URI           = mongodb://localhost:27017/shopping_test
JWT_SECRET               = <your-jwt-secret>
STRIPE_SECRET_KEY        = sk_test_<test-key-for-ci>

# Deployment Secrets (Optional)
HEROKU_API_KEY          = <if using Heroku>
AWS_ACCESS_KEY_ID       = <if using AWS>
AWS_SECRET_ACCESS_KEY   = <if using AWS>
SSH_PRIVATE_KEY         = <if using SSH deploy>
SSH_HOST                = <your-server-ip>
SSH_USERNAME            = root
```

---

## ✅ Step 8: Run Database Setup

```bash
# Create indexes
npm run create-indexes

# Or manually:
node -e "require('./src/models/Product.js'); require('./src/models/Order.js');"
```

---

## ✅ Step 9: Test Production Deployment

### 9.1 Test API Endpoints

```bash
# Health check
curl https://api.yourdomain.com/health

# Register user
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234"}'
```

### 9.2 Test Email Delivery

- Register a new user
- Check email inbox for welcome email

### 9.3 Test Stripe Payment

- Use test card: `4242 4242 4242 4242`
- Create order and complete payment
- Check Stripe Dashboard for payment event

### 9.4 Test Swagger Docs

- Visit: https://api.yourdomain.com/api-docs
- Verify all endpoints are documented

---

## ✅ Step 10: Monitor & Maintain

### Setup Monitoring

```bash
# View PM2 logs
pm2 logs shopping-api

# Monitor processes
pm2 monit

# Check status
pm2 status
```

### Enable MongoDB Atlas Backups

- Go to: Clusters → Backup
- Enable continuous backups

### Monitor Stripe Dashboard

- Payments: https://dashboard.stripe.com/payments
- Failed payments: https://dashboard.stripe.com/payments?status=failed

---

## 📋 Final Checklist

Before going live, verify:

- [ ] All environment variables set in production `.env`
- [ ] Strong secrets generated (JWT, CSRF)
- [ ] MongoDB Atlas connected and accessible
- [ ] Redis configured (or disabled gracefully)
- [ ] Email service working (test welcome email)
- [ ] Stripe live keys configured
- [ ] Stripe webhook endpoint added in dashboard
- [ ] Domain DNS pointing to server
- [ ] SSL certificate installed (HTTPS working)
- [ ] Nginx reverse proxy configured
- [ ] Backend running on PM2
- [ ] Database indexes created
- [ ] Company information updated (name, address, email)
- [ ] CORS origins configured correctly
- [ ] Tested user registration
- [ ] Tested order placement
- [ ] Tested Stripe payment
- [ ] Swagger docs accessible
- [ ] GitHub secrets added (if using CI/CD)
- [ ] Monitoring/logging configured
- [ ] Backups configured

---

## 🆘 Quick Troubleshooting

**Problem:** Backend not starting  
**Solution:** Check `.env` file syntax, verify MongoDB connection

**Problem:** Emails not sending  
**Solution:** Check EMAIL\_\* variables, verify SMTP credentials

**Problem:** Stripe payments failing  
**Solution:** Verify STRIPE*SECRET_KEY is `sk_live*...`, check webhook secret

**Problem:** CORS errors  
**Solution:** Update ALLOWED_ORIGINS with your frontend domain

**Problem:** Swagger not loading  
**Solution:** Check PRODUCTION_API_URL is set correctly

---

## 📚 Documentation References

- **Production Config Guide:** `PRODUCTION_CONFIGURATION_GUIDE.md`
- **Stripe Setup Guide:** `STRIPE_SETUP_GUIDE.md`
- **Coupon System:** `COUPON_SYSTEM_GUIDE.md`
- **Product Variants:** `PRODUCT_VARIANTS_GUIDE.md`

---

## 🎉 You're Ready for Production!

Once all checklist items are complete, your Shopping Site backend is production-ready and accepting live payments through Stripe!

**Need Help?**

- Review detailed guides in backend folder
- Check Stripe documentation: https://stripe.com/docs
- MongoDB Atlas docs: https://docs.atlas.mongodb.com

---

**Last Updated:** November 11, 2025
