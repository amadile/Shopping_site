# GitHub Secrets Setup Guide

This document lists all the secrets that need to be configured in your GitHub repository for the CI/CD workflows to function properly.

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed below

---

## Required Secrets

### Database & Authentication

- **`TEST_MONGO_URI`** - MongoDB connection string for testing (e.g., `mongodb://localhost:27017/shopping-site-test`)
- **`JWT_SECRET`** - JWT secret key for token signing (generate a strong random string)

### AWS Deployment (Optional - only if deploying to AWS)

- **`AWS_ACCESS_KEY_ID`** - AWS access key for deployment
- **`AWS_SECRET_ACCESS_KEY`** - AWS secret access key
- **`S3_BUCKET`** - S3 bucket name for deployment artifacts (e.g., `shopping-site-deployments`)

### Azure Deployment (Optional - only if deploying to Azure)

- **`AZURE_WEBAPP_PUBLISH_PROFILE`** - Azure Web App publish profile (download from Azure Portal)

### Heroku Deployment (Optional - only if deploying to Heroku)

- **`HEROKU_API_KEY`** - Heroku API key (found in Account Settings)
- **`HEROKU_EMAIL`** - Your Heroku account email

### SSH Deployment (Optional - only if deploying via SSH)

- **`SSH_HOST`** - SSH host address (e.g., `your-server.com`)
- **`SSH_USERNAME`** - SSH username (e.g., `ubuntu`)
- **`SSH_PRIVATE_KEY`** - SSH private key (contents of your private key file)

### Notifications (Optional)

- **`SLACK_WEBHOOK`** - Slack webhook URL for deployment notifications

---

## Secret Generation Commands

### Generate JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

### Generate SSH Key Pair

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@shopping-site"
# Copy the private key content to SSH_PRIVATE_KEY secret
# Add the public key to your server's ~/.ssh/authorized_keys
```

---

## Testing Configuration

After adding secrets, you can test the workflows:

1. **Test CI Workflow**: Push to a feature branch
2. **Test Staging Deployment**: Merge to `develop` branch
3. **Test Production Deployment**: Merge to `main` branch or create a version tag

---

## Security Best Practices

✅ **DO:**

- Use strong, randomly generated secrets
- Rotate secrets regularly (every 90 days)
- Use different secrets for development, staging, and production
- Keep secrets in a secure password manager
- Use GitHub Environment Secrets for production

❌ **DON'T:**

- Commit secrets to the repository
- Share secrets via email or chat
- Use the same secret across multiple environments
- Use weak or predictable secrets

---

## Troubleshooting

### Secret Not Found Error

If you see "Context access might be invalid" warnings:

- These are linting warnings, not errors
- The workflow will fail at runtime if a required secret is missing
- Add the secret to GitHub repository settings

### Deployment Failures

If deployment steps fail:

- Check that all required secrets for that deployment method are configured
- Verify secret values are correct (no extra spaces, line breaks)
- Check the workflow logs for specific error messages

---

## Minimal Setup (Just for CI/CD Testing)

If you only want to run tests without deployment, you only need:

- **`TEST_MONGO_URI`** (required)
- **`JWT_SECRET`** (required)

All deployment steps have `continue-on-error: true`, so they won't fail the workflow if secrets are missing.

---

**Last Updated:** November 11, 2025
