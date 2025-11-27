# CI/CD Pipeline Setup Guide

## Overview

This guide covers the complete CI/CD pipeline setup for the Shopping Site application using GitHub Actions.

## Features

### ✅ Automated Testing

- Run tests on every push and pull request
- Multi-version Node.js testing (18.x, 20.x)
- MongoDB and Redis service containers
- Code coverage reporting with Codecov
- Automatic PR comments with coverage metrics

### ✅ Code Quality

- ESLint for code linting
- Prettier for code formatting
- Security audits with npm audit
- Secret detection with TruffleHog

### ✅ Docker Support

- Multi-platform builds (amd64, arm64)
- Automated image building and publishing to GitHub Container Registry
- Vulnerability scanning with Trivy
- Build caching for faster builds

### ✅ Multi-Environment Deployments

- **Staging**: Deploy on push to `dev`/`staging` branches
- **Production**: Deploy on push to `main` or version tags
- Support for multiple cloud providers (AWS, Azure, Heroku, SSH)

### ✅ Monitoring & Notifications

- Slack notifications for deployment status
- GitHub release creation for tagged versions
- Smoke tests after deployment
- Health check monitoring

## Workflows

### 1. Test and Lint (`test.yml`)

**Triggers:**

- Push to `main`, `dev`, `staging` branches
- Pull requests to `main`, `dev`

**Jobs:**

- **Test**: Run Jest tests with coverage on Node 18.x and 20.x
- **Lint**: Run ESLint and Prettier checks
- **Security**: npm audit and secret detection

**Services:**

- MongoDB 6.0
- Redis 7

### 2. Docker Build (`docker.yml`)

**Triggers:**

- Push to `main`, `dev` branches
- Version tags (`v*`)
- Pull requests to `main`

**Actions:**

- Build multi-platform Docker images
- Push to GitHub Container Registry
- Run Trivy security scans
- Upload results to GitHub Security

### 3. Deploy to Staging (`deploy-staging.yml`)

**Triggers:**

- Push to `dev`, `staging` branches
- Manual workflow dispatch

**Actions:**

- Run tests before deployment
- Create deployment package
- Deploy to staging environment
- Run smoke tests
- Send Slack notifications

### 4. Deploy to Production (`deploy-production.yml`)

**Triggers:**

- Push to `main` branch
- Version tags (`v*`)
- Manual workflow dispatch (requires approval)

**Actions:**

- Full test suite with coverage verification (≥70%)
- Security audit
- Create deployment artifact
- Deploy to production
- Extensive smoke tests and monitoring
- Create GitHub release
- Rollback on failure

## Setup Instructions

### Step 1: Repository Secrets

Configure the following secrets in your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

#### Required for All Deployments

```
JWT_SECRET=your-jwt-secret-key
TEST_MONGO_URI=mongodb://testuser:testpass@localhost:27017/test
```

#### AWS Deployment

```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=your-deployment-bucket
```

#### Azure Deployment

```
AZURE_WEBAPP_PUBLISH_PROFILE=<download from Azure Portal>
```

#### Heroku Deployment

```
HEROKU_API_KEY=your-heroku-api-key
HEROKU_EMAIL=your-heroku-email
```

#### SSH Deployment

```
SSH_HOST=your-server-ip
SSH_USERNAME=your-ssh-username
SSH_PRIVATE_KEY=your-private-key
SSH_PORT=22
```

#### Notifications

```
SLACK_WEBHOOK=your-slack-webhook-url
```

### Step 2: Environment Configuration

Create environment configurations:
**Settings → Environments**

#### Staging Environment

- Name: `staging`
- URL: `https://staging.shoppingsite.com`
- No protection rules

#### Production Environment

- Name: `production`
- URL: `https://shoppingsite.com`
- Protection rules:
  - ✅ Required reviewers (1-2 people)
  - ✅ Wait timer (5 minutes)
  - Deployment branches: `main` only

### Step 3: Branch Protection

Configure branch protection for `main`:
**Settings → Branches → Add rule**

```
Branch name pattern: main

Protection rules:
✅ Require a pull request before merging
  ✅ Require approvals (1)
  ✅ Dismiss stale pull request approvals
✅ Require status checks to pass before merging
  - test / Run Tests (Node 20.x)
  - lint / Lint Code
  - security / Security Audit
✅ Require conversation resolution before merging
✅ Do not allow bypassing the above settings
```

### Step 4: Enable GitHub Container Registry

1. Go to **Settings → Packages**
2. Enable **Improved container support**
3. Make packages public or private as needed

### Step 5: Configure Codecov (Optional)

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. No secret needed (uses `GITHUB_TOKEN`)

### Step 6: Slack Integration (Optional)

1. Create a Slack App
2. Enable Incoming Webhooks
3. Add webhook URL to repository secrets as `SLACK_WEBHOOK`

## Deployment Workflows

### Staging Deployment

```bash
# Automatic on push to dev
git checkout dev
git add .
git commit -m "feat: new feature"
git push origin dev
# ✅ Triggers staging deployment

# Manual trigger
# Go to Actions → Deploy to Staging → Run workflow
```

### Production Deployment

```bash
# Via main branch
git checkout main
git merge dev
git push origin main
# ⏳ Requires approval in GitHub UI

# Via version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
# ⏳ Requires approval in GitHub UI
```

## Cloud Provider Setup

### AWS Elastic Beanstalk

1. **Create Application:**

```bash
aws elasticbeanstalk create-application \
  --application-name shopping-site \
  --description "Shopping Site E-Commerce Platform"
```

2. **Create Environments:**

```bash
# Staging
aws elasticbeanstalk create-environment \
  --application-name shopping-site \
  --environment-name shopping-site-staging \
  --solution-stack-name "64bit Amazon Linux 2 v5.8.0 running Node.js 18"

# Production
aws elasticbeanstalk create-environment \
  --application-name shopping-site \
  --environment-name shopping-site-production \
  --solution-stack-name "64bit Amazon Linux 2 v5.8.0 running Node.js 18"
```

3. **Create S3 Bucket:**

```bash
aws s3 mb s3://shopping-site-deployments
```

### Azure App Service

1. **Create Resource Group:**

```bash
az group create --name shopping-site-rg --location eastus
```

2. **Create App Service Plans:**

```bash
# Staging
az appservice plan create \
  --name shopping-site-staging-plan \
  --resource-group shopping-site-rg \
  --sku B1 \
  --is-linux

# Production
az appservice plan create \
  --name shopping-site-prod-plan \
  --resource-group shopping-site-rg \
  --sku P1V2 \
  --is-linux
```

3. **Create Web Apps:**

```bash
# Staging
az webapp create \
  --name shopping-site-staging \
  --resource-group shopping-site-rg \
  --plan shopping-site-staging-plan \
  --runtime "NODE:18-lts"

# Production
az webapp create \
  --name shopping-site-prod \
  --resource-group shopping-site-rg \
  --plan shopping-site-prod-plan \
  --runtime "NODE:18-lts"
```

4. **Download Publish Profile:**

```bash
az webapp deployment list-publishing-profiles \
  --name shopping-site-prod \
  --resource-group shopping-site-rg \
  --xml
```

Copy the XML content to `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

### Heroku

1. **Create Apps:**

```bash
heroku create shopping-site-staging
heroku create shopping-site-prod
```

2. **Configure Buildpacks:**

```bash
heroku buildpacks:set heroku/nodejs -a shopping-site-staging
heroku buildpacks:set heroku/nodejs -a shopping-site-prod
```

3. **Add MongoDB:**

```bash
heroku addons:create mongolab:sandbox -a shopping-site-staging
heroku addons:create mongolab:shared-cluster-0 -a shopping-site-prod
```

4. **Add Redis:**

```bash
heroku addons:create heroku-redis:hobby-dev -a shopping-site-staging
heroku addons:create heroku-redis:premium-0 -a shopping-site-prod
```

### SSH Deployment (VPS/Dedicated Server)

1. **Setup Server:**

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/shopping-site
sudo chown $USER:$USER /var/www/shopping-site

# Clone repository
cd /var/www/shopping-site
git clone https://github.com/yourusername/shopping-site.git .
```

2. **Configure PM2:**

```bash
# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'shopping-site',
    cwd: '/var/www/shopping-site/backend',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

3. **Setup Nginx:**

```bash
sudo apt-get install nginx

cat > /etc/nginx/sites-available/shopping-site << EOF
server {
    listen 80;
    server_name shoppingsite.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/shopping-site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **SSL with Let's Encrypt:**

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d shoppingsite.com
```

## Monitoring and Troubleshooting

### View Workflow Runs

1. Go to **Actions** tab in GitHub
2. Click on specific workflow run
3. View logs for each job

### Common Issues

#### Tests Failing

```bash
# Run tests locally
cd backend
npm test

# Check MongoDB connection
docker ps | grep mongo

# Check Redis connection
docker ps | grep redis
```

#### Deployment Failing

```bash
# Check secrets are configured
# GitHub → Settings → Secrets and variables → Actions

# Verify environment variables
# Check .env.production or .env.staging files

# Test deployment package locally
tar -xzf deploy.tar.gz
cd deploy
npm start
```

#### Docker Build Failing

```bash
# Build locally
docker build -t shopping-site:test ./backend

# Run locally
docker run -p 5000:5000 shopping-site:test
```

### Rollback Procedures

#### Automatic Rollback

Production workflow includes automatic rollback on failure.

#### Manual Rollback

```bash
# AWS EB
aws elasticbeanstalk update-environment \
  --environment-name shopping-site-production \
  --version-label <previous-version-sha>

# Heroku
heroku rollback -a shopping-site-prod

# SSH/PM2
cd /var/www/shopping-site
git reset --hard <previous-commit>
npm ci --production
pm2 restart shopping-site
```

## Performance Optimization

### Caching

- Docker layer caching enabled
- npm dependency caching
- Build artifact caching

### Parallel Execution

- Tests run on multiple Node versions simultaneously
- Independent jobs run in parallel

### Conditional Execution

- Deployments skip when tests fail
- Cloud-specific steps only run when secrets exist

## Security Best Practices

1. **Secrets Management**

   - Never commit secrets to repository
   - Use GitHub Secrets for sensitive data
   - Rotate secrets regularly

2. **Dependency Security**

   - npm audit runs on every PR
   - Trivy scans Docker images
   - Dependabot alerts enabled

3. **Access Control**

   - Branch protection rules enforced
   - Required reviewers for production
   - Deployment approvals required

4. **Secret Scanning**
   - TruffleHog detects committed secrets
   - Pre-commit hooks (recommended)

## Cost Optimization

- Use workflow caching to reduce build times
- Limit concurrent workflow runs
- Use self-hosted runners for high-volume projects
- Clean up old artifacts and images

## Maintenance

### Weekly Tasks

- Review failed workflows
- Update dependencies
- Check security advisories

### Monthly Tasks

- Rotate secrets and API keys
- Review deployment logs
- Optimize workflow performance
- Update action versions

### Quarterly Tasks

- Audit access permissions
- Review and update branch protection
- Evaluate cloud costs
- Update documentation

## Support

For issues or questions:

- Create GitHub Issue
- Check Actions logs
- Review deployment documentation
- Contact DevOps team

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [AWS Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/)
- [Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/)
- [Heroku Documentation](https://devcenter.heroku.com/)
