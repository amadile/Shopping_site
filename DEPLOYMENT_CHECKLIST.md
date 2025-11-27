# 🚀 Deployment Checklist - New Features

## Pre-Deployment Checklist

### ✅ Code Implementation

- [x] Inventory service implemented
- [x] Stock reservation system created
- [x] Background workers set up
- [x] Database indexes added to all models
- [x] Compression middleware implemented
- [x] API routes created
- [x] Documentation completed
- [x] Tests written

### 📦 Dependencies

- [ ] All npm packages installed (`npm install`)
- [ ] Redis server available
- [ ] MongoDB connection configured
- [ ] Environment variables set

### 🗄️ Database Setup

- [ ] Run index creation script: `npm run create-indexes`
- [ ] Verify all indexes created successfully
- [ ] Check MongoDB logs for errors
- [ ] Test database connectivity

### 🔧 Configuration

#### Environment Variables (.env)

```bash
# Check these are set:
- [ ] MONGO_URI
- [ ] REDIS_HOST
- [ ] REDIS_PORT
- [ ] JWT_SECRET
- [ ] JWT_REFRESH_SECRET
- [ ] PORT
```

#### Redis Configuration

- [ ] Redis server running
- [ ] Redis accessible from app
- [ ] Test connection: `redis-cli ping`

### 🧪 Testing

#### Unit Tests

- [ ] Run inventory tests: `npm test -- tests/inventory.test.js`
- [ ] All tests passing
- [ ] No critical errors in logs

#### API Testing

```bash
# Test these endpoints:

- [ ] GET /api/inventory/check-availability
- [ ] POST /api/inventory/reserve (with auth)
- [ ] POST /api/inventory/reserve/:id/release (with auth)
- [ ] POST /api/inventory/reserve/:id/confirm (with auth)
- [ ] GET /api/inventory/low-stock (with admin auth)
- [ ] POST /api/inventory/add-stock (with admin auth)
```

#### Compression Testing

- [ ] Verify gzip header: `curl -H "Accept-Encoding: gzip" http://localhost:5000/api/products -v`
- [ ] Check response is compressed
- [ ] Verify images are NOT compressed

#### Performance Testing

- [ ] Product search < 100ms
- [ ] Order queries < 50ms
- [ ] Cart operations < 30ms

### 🔄 Background Jobs

#### Worker Process

- [ ] Worker starts without errors
- [ ] Jobs scheduled successfully
- [ ] Check logs: `tail -f backend/logs/combined.log`

#### Scheduled Jobs

- [ ] Expired reservations cleanup (every 5 min)
- [ ] Low stock alerts (daily at 9 AM)
- [ ] Out of stock alerts (daily at 9 AM)

#### Manual Job Testing

```bash
# Test manual triggers:
- [ ] POST /api/inventory/release-expired (with admin auth)
- [ ] Verify jobs execute
- [ ] Check job results in logs
```

### 📊 Monitoring Setup

#### Logging

- [ ] Winston logger configured
- [ ] Log files created in `backend/logs/`
- [ ] Error logs separate from info logs
- [ ] Log rotation configured

#### Metrics to Monitor

- [ ] Query execution times
- [ ] Response sizes (before/after compression)
- [ ] Queue job success/failure rates
- [ ] Memory usage
- [ ] CPU usage

### 🔐 Security

#### Authentication

- [ ] All protected routes require auth
- [ ] JWT tokens working
- [ ] Refresh tokens functional
- [ ] CSRF protection enabled

#### Authorization

- [ ] Admin routes protected
- [ ] Vendor routes check ownership
- [ ] Public routes accessible

#### Data Validation

- [ ] Input sanitization active
- [ ] NoSQL injection prevention working
- [ ] Rate limiting configured

### 📚 Documentation

#### Code Documentation

- [ ] README updated
- [ ] API docs complete
- [ ] Swagger UI accessible: `/api-docs`
- [ ] All guides created

#### Deployment Docs

- [ ] Environment setup documented
- [ ] Installation steps clear
- [ ] Configuration examples provided
- [ ] Troubleshooting guide available

---

## Production Deployment Steps

### 1. Pre-Production

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
cd backend
npm install

# 3. Set environment variables
cp .env.example .env
# Edit .env with production values

# 4. Create database indexes
npm run create-indexes

# 5. Run tests
npm test
```

### 2. Deploy

```bash
# Option A: PM2 (Recommended)
pm2 start src/index.js --name "shopping-api"
pm2 start src/worker.js --name "shopping-worker"
pm2 save
pm2 startup

# Option B: Docker
docker-compose up -d

# Option C: systemd
sudo systemctl start shopping-api
sudo systemctl start shopping-worker
```

### 3. Post-Deployment Verification

```bash
# 1. Check services are running
pm2 status
# or
docker ps

# 2. Test API health
curl http://your-domain.com/

# 3. Test compression
curl -H "Accept-Encoding: gzip" http://your-domain.com/api/products -v | grep "Content-Encoding"

# 4. Test inventory endpoint
curl "http://your-domain.com/api/inventory/check-availability?productId=123&quantity=1"

# 5. Check logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# 6. Monitor worker
pm2 logs shopping-worker
```

### 4. Monitoring

```bash
# Set up monitoring alerts for:
- [ ] API response time > 500ms
- [ ] Error rate > 1%
- [ ] Memory usage > 80%
- [ ] CPU usage > 80%
- [ ] Queue backlog > 100 jobs
- [ ] Failed jobs > 5%
```

---

## Post-Deployment Checklist

### Immediate (First Hour)

- [ ] All services running
- [ ] No errors in logs
- [ ] Health check passing
- [ ] Compression working
- [ ] Database connected
- [ ] Redis connected
- [ ] Worker jobs running

### First Day

- [ ] Monitor error rates
- [ ] Check query performance
- [ ] Verify compression ratios
- [ ] Test stock reservations
- [ ] Verify job execution
- [ ] Check low stock alerts

### First Week

- [ ] Performance benchmarks met
- [ ] No memory leaks
- [ ] Queue processing smooth
- [ ] Expired reservations cleaned
- [ ] Stock alerts working
- [ ] User feedback positive

---

## Rollback Plan

If issues occur:

### Quick Rollback

```bash
# Stop new services
pm2 stop shopping-api shopping-worker

# Revert to previous version
git checkout previous-version
npm install
pm2 restart all
```

### Database Rollback

```bash
# If indexes cause issues:
# Connect to MongoDB
mongo

# Drop problematic indexes
db.collection.dropIndex("index_name")
```

### Gradual Rollout (Recommended)

1. Deploy to staging first
2. Test thoroughly
3. Deploy to 10% of production
4. Monitor for 24 hours
5. Gradually increase to 100%

---

## Performance Targets

### Response Times

- [ ] API endpoints < 100ms (avg)
- [ ] Product search < 50ms (avg)
- [ ] Inventory check < 20ms (avg)
- [ ] Stock reservation < 30ms (avg)

### Compression

- [ ] JSON responses 70-85% smaller
- [ ] HTML responses 60-75% smaller
- [ ] Images not compressed

### Database

- [ ] All queries using indexes
- [ ] No full collection scans
- [ ] Query time < 50ms (p95)

### Background Jobs

- [ ] Job processing < 1 second
- [ ] No failed jobs
- [ ] Queue size < 10 jobs

---

## Support & Maintenance

### Daily Tasks

- [ ] Check error logs
- [ ] Monitor performance
- [ ] Review failed jobs
- [ ] Check low stock alerts

### Weekly Tasks

- [ ] Review performance trends
- [ ] Clean old job data
- [ ] Update documentation
- [ ] Security updates

### Monthly Tasks

- [ ] Performance optimization review
- [ ] Index usage analysis
- [ ] Storage cleanup
- [ ] Backup verification

---

## Emergency Contacts

```
Tech Lead: _______________
DevOps: __________________
Database Admin: __________
On-Call: _________________
```

---

## Common Issues & Solutions

### Issue: High Memory Usage

**Solution:** Reduce worker concurrency, increase memory limit

### Issue: Slow Queries

**Solution:** Check index usage with `.explain()`, add missing indexes

### Issue: Failed Jobs

**Solution:** Check Redis connection, review job logs, restart worker

### Issue: Compression Not Working

**Solution:** Check middleware order, verify headers, test with curl

### Issue: Stock Overselling

**Solution:** Check reservation system, verify worker is running

---

## Success Criteria

✅ All services running without errors
✅ Performance targets met
✅ Compression working (80% reduction)
✅ No overselling incidents
✅ Background jobs processing
✅ Low stock alerts firing
✅ Response times < 100ms
✅ Zero critical bugs
✅ Positive user feedback

---

## Documentation Links

- [Quick Start Guide](./backend/QUICKSTART.md)
- [Inventory Management Guide](./backend/INVENTORY_MANAGEMENT_GUIDE.md)
- [Performance Guide](./backend/PERFORMANCE_OPTIMIZATIONS_GUIDE.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)
- [API Documentation](http://your-domain.com/api-docs)

---

**Ready to deploy? Follow this checklist step by step!** ✅
