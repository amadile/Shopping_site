# 📧 Production Email Setup Guide

## ✅ Current Status
- **Development Mode**: ✅ Working (console logs)
- **Production Mode**: ⏳ Pending SMTP configuration

## 🎯 Quick Setup Options

### Option 1: Gmail (Easiest - Recommended for Testing)

**Pros**: Free, simple setup, works immediately
**Cons**: 500 emails/day limit, requires Google account

#### Step-by-Step:

1. **Enable 2-Step Verification**
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification" → Turn it ON
   - Follow the setup wizard

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Enter "Shopping Site"
   - Click "Generate"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update Your `.env` File**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcdefghijklmnop
   SHOP_NAME=Your Shop Name
   ```

4. **Restart Backend**
   ```bash
   # Stop current backend (Ctrl+C)
   npm start
   ```

5. **Test**
   - Request password reset from frontend
   - Check your email inbox
   - ✅ Email should arrive within seconds

---

### Option 2: SendGrid (Recommended for Production)

**Pros**: Free tier (100 emails/day), better deliverability, professional
**Cons**: Requires account creation

#### Step-by-Step:

1. **Create SendGrid Account**
   - Go to: https://signup.sendgrid.com/
   - Sign up for free account
   - Verify your email

2. **Create API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "Shopping Site Backend"
   - Permissions: "Full Access"
   - Copy the API key (starts with `SG.`)

3. **Verify Sender Email**
   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your email and details
   - Check your email and verify

4. **Update Your `.env` File**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.your-sendgrid-api-key-here
   SHOP_NAME=Your Shop Name
   ```

5. **Restart Backend & Test**

---

### Option 3: AWS SES (Best for Scale)

**Pros**: Very reliable, pay-as-you-go, handles millions of emails
**Cons**: More complex setup, requires AWS account

#### Step-by-Step:

1. **Create AWS Account**
   - Go to: https://aws.amazon.com/ses/
   - Sign up for AWS account

2. **Set Up SES**
   - Go to AWS Console → SES
   - Verify your email address
   - Request production access (if needed)
   - Create SMTP credentials

3. **Get SMTP Credentials**
   - In SES Console → SMTP Settings
   - Click "Create My SMTP Credentials"
   - Download credentials

4. **Update Your `.env` File**
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-ses-smtp-username
   SMTP_PASS=your-ses-smtp-password
   SHOP_NAME=Your Shop Name
   ```

5. **Restart Backend & Test**

---

### Option 4: Mailgun (Good Balance)

**Pros**: 5,000 emails/month free, good API, easy setup
**Cons**: Requires domain verification for production

#### Step-by-Step:

1. **Create Mailgun Account**
   - Go to: https://signup.mailgun.com/
   - Sign up for free account

2. **Get SMTP Credentials**
   - Go to Sending → Domain Settings
   - Click on your sandbox domain
   - Find SMTP credentials section
   - Copy username and password

3. **Update Your `.env` File**
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=postmaster@sandboxXXX.mailgun.org
   SMTP_PASS=your-mailgun-password
   SHOP_NAME=Your Shop Name
   ```

4. **Restart Backend & Test**

---

## 🧪 Testing Your Email Setup

### 1. Test Password Reset
```bash
# From frontend:
1. Go to /forgot-password
2. Enter your email
3. Click "Send Reset Link"
4. Check your email inbox
```

### 2. Test User Registration
```bash
# From frontend:
1. Register a new account
2. Check email for verification link
3. Click link to verify
4. Should receive welcome email
```

### 3. Check Backend Logs
```bash
# Look for these log messages:
✅ "Verification email sent"
✅ "Password reset email sent"
✅ "Order confirmation email sent"

# Or errors:
❌ "Failed to send verification email"
```

---

## 🔒 Security Best Practices

### DO:
- ✅ Use App Passwords for Gmail (never your main password)
- ✅ Store credentials in `.env` file only
- ✅ Add `.env` to `.gitignore` (already done)
- ✅ Use different credentials for dev/staging/production
- ✅ Rotate credentials every 3-6 months
- ✅ Monitor email sending logs

### DON'T:
- ❌ Commit credentials to Git
- ❌ Share credentials in Slack/email
- ❌ Use the same password for multiple services
- ❌ Use your personal email password
- ❌ Ignore email bounce rates

---

## 📊 Email Limits by Provider

| Provider   | Free Tier Limit      | Cost After Free    |
|------------|---------------------|-------------------|
| Gmail      | 500/day             | N/A               |
| SendGrid   | 100/day             | $19.95/mo (40k)   |
| AWS SES    | 62,000/month        | $0.10/1000 emails |
| Mailgun    | 5,000/month         | $35/mo (50k)      |

---

## 🚨 Troubleshooting

### "Failed to send email" Error

**Check:**
1. SMTP credentials are correct
2. SMTP_HOST and SMTP_PORT are correct
3. For Gmail: 2-Step Verification is enabled
4. For Gmail: Using App Password (not regular password)
5. Firewall isn't blocking port 587
6. Internet connection is working

**Test SMTP Connection:**
```bash
# Run this in backend directory:
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transporter.verify((error, success) => {
  if (error) console.log('❌ Error:', error);
  else console.log('✅ SMTP connection successful!');
});
"
```

### Emails Going to Spam

**Solutions:**
1. Use a professional email service (SendGrid, AWS SES)
2. Set up SPF and DKIM records for your domain
3. Avoid spam trigger words in subject lines
4. Include unsubscribe links
5. Maintain low bounce rates

### Emails Not Arriving

**Check:**
1. Spam folder
2. Backend logs for errors
3. Email address is correct
4. SMTP service status page
5. Daily/monthly limits not exceeded

---

## 📝 Quick Reference

### Current Configuration Check
```bash
# In backend directory:
node check_email_config.js
```

### Environment Variables Needed
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SHOP_NAME=Your Shop Name
FRONTEND_URL=http://localhost:3000
```

### Restart Backend After Changes
```bash
# Stop current process (Ctrl+C)
npm start
```

---

## ✅ Recommended Setup for Your Project

**For Development/Testing:**
→ Use **Gmail** with App Password (easiest, free)

**For Production:**
→ Use **SendGrid** (professional, reliable, good free tier)

**For Enterprise/Scale:**
→ Use **AWS SES** (unlimited scale, pay-as-you-go)

---

## 🎯 Next Steps

1. **Choose a provider** (I recommend Gmail for testing)
2. **Follow the step-by-step guide** above
3. **Update your `.env` file** with credentials
4. **Restart the backend**
5. **Test password reset** from frontend
6. **Check your email inbox**
7. **Celebrate!** 🎉

---

**Need Help?** Check the troubleshooting section or review backend logs for specific error messages.
