# Loyalty & Rewards Program Guide

## Overview

The Loyalty & Rewards Program is a comprehensive customer retention system that rewards users with points for purchases, reviews, and referrals. Users advance through tier levels (Bronze, Silver, Gold, Platinum) earning increasing benefits and can redeem points for rewards.

## Features

### For Customers

- **Points Earning**

  - 1 point per dollar spent on purchases
  - 10 points for writing product reviews
  - 100-200 points for successful referrals
  - 100 points on birthday
  - Bonus points from promotions

- **Tier System**

  - Bronze (0+ points) - Standard benefits
  - Silver (500+ points) - 5% discount, 1.2x points multiplier
  - Gold (2,000+ points) - 10% discount, 1.5x points multiplier, free shipping
  - Platinum (5,000+ points) - 15% discount, 2x points multiplier, free shipping, priority support

- **Rewards Redemption**

  - Discount coupons (percentage or fixed amount)
  - Free shipping vouchers
  - Product discounts
  - Gift vouchers
  - Free products

- **Referral Program**
  - Unique referral code for each user
  - Referrer earns 200 points per successful referral
  - Referred friend earns 100 points on first purchase
  - Minimum $50 purchase required to complete referral

### For Admins

- **Reward Management**

  - Create and manage reward catalog
  - Set points cost and availability
  - Configure tier requirements
  - Track redemptions

- **Points Administration**

  - Manually adjust user points
  - Award bonus points
  - View loyalty statistics
  - Track tier distribution

- **Analytics**
  - Loyalty program statistics
  - Referral conversion rates
  - Reward redemption tracking
  - User engagement metrics

---

## Database Models

### 1. LoyaltyPoints Model

```javascript
{
  user: ObjectId,               // Reference to User
  pointsBalance: Number,         // Current available points
  lifetimePoints: Number,        // Total points earned ever
  tier: String,                  // Bronze/Silver/Gold/Platinum
  pointsToNextTier: Number,      // Points needed for next tier
  tierBenefits: {
    discountPercentage: Number,
    pointsMultiplier: Number,
    freeShipping: Boolean,
    prioritySupport: Boolean,
    earlyAccess: Boolean
  },
  transactions: [{              // Points history
    type: String,               // earned_purchase, earned_review, etc.
    points: Number,
    description: String,
    orderId: ObjectId,
    createdAt: Date
  }],
  referralCode: String,         // Unique referral code
  referralsCount: Number,       // Successful referrals
  birthday: Date,
  lastBirthdayReward: Date,
  tierHistory: [{              // Tier upgrade history
    tier: String,
    achievedAt: Date,
    lifetimePointsAtAchievement: Number
  }]
}
```

### 2. Referral Model

```javascript
{
  referrer: ObjectId,           // User who referred
  referred: ObjectId,           // User who was referred
  referralCode: String,
  status: String,               // pending/completed/rewarded/cancelled
  referrerPoints: Number,       // Points awarded to referrer
  referredPoints: Number,       // Points awarded to referred user
  completedOrder: ObjectId,     // Order that completed the referral
  completedAt: Date,
  rewardedAt: Date
}
```

### 3. Reward Model

```javascript
{
  name: String,
  description: String,
  type: String,                 // discount_percentage, discount_fixed, etc.
  pointsCost: Number,
  value: Number,
  valueType: String,            // percentage or fixed
  isActive: Boolean,
  stockQuantity: Number,        // -1 = unlimited
  redemptionLimits: {
    maxPerUser: Number,
    maxPerOrder: Number,
    maxTotal: Number
  },
  conditions: {
    minimumPurchase: Number,
    minimumTier: String,
    validFrom: Date,
    validUntil: Date
  },
  totalRedemptions: Number,
  isFeatured: Boolean
}
```

### 4. RewardRedemption Model

```javascript
{
  user: ObjectId,
  reward: ObjectId,
  pointsSpent: Number,
  status: String,               // pending/redeemed/used/expired/cancelled
  redemptionCode: String,       // Unique code to use reward
  validFrom: Date,
  validUntil: Date,
  usedInOrder: ObjectId,
  usedAt: Date
}
```

---

## API Endpoints

### User Endpoints

#### Get Loyalty Profile

```http
GET /api/loyalty/profile
Authorization: Bearer {token}

Response:
{
  "success": true,
  "loyalty": {
    "pointsBalance": 1250,
    "lifetimePoints": 3500,
    "tier": "Gold",
    "pointsToNextTier": 1500,
    "tierBenefits": {
      "discountPercentage": 10,
      "pointsMultiplier": 1.5,
      "freeShipping": true,
      "prioritySupport": true
    },
    "referralCode": "REF123ABC",
    "referralsCount": 5
  },
  "tierInfo": {
    "current": "Gold",
    "allTiers": {
      "Bronze": 0,
      "Silver": 500,
      "Gold": 2000,
      "Platinum": 5000
    }
  }
}
```

#### Get Transaction History

```http
GET /api/loyalty/transactions?days=30&page=1&limit=20
Authorization: Bearer {token}

Response:
{
  "success": true,
  "transactions": [
    {
      "type": "earned_purchase",
      "points": 150,
      "description": "Purchase: Order #abc123",
      "balanceAfter": 1250,
      "createdAt": "2025-11-10T10:00:00Z"
    }
  ],
  "summary": {
    "totalEarned": 3500,
    "totalRedeemed": 2250,
    "netPoints": 1250
  }
}
```

#### Generate Referral Code

```http
POST /api/loyalty/referral/generate
Authorization: Bearer {token}

Response:
{
  "success": true,
  "referralCode": "REF123ABC",
  "rewards": {
    "referrerPoints": 200,
    "referredPoints": 100,
    "minimumPurchase": 50
  },
  "shareLinks": {
    "web": "https://example.com/register?ref=REF123ABC",
    "message": "Join our store using my referral code: REF123ABC..."
  }
}
```

#### Validate Referral Code

```http
POST /api/loyalty/referral/validate
Content-Type: application/json

{
  "code": "REF123ABC"
}

Response:
{
  "success": true,
  "valid": true,
  "message": "You'll get 100 points after your first purchase!",
  "rewards": {
    "referredPoints": 100,
    "minimumPurchase": 50
  }
}
```

#### Get Referral Statistics

```http
GET /api/loyalty/referral/stats
Authorization: Bearer {token}

Response:
{
  "success": true,
  "stats": {
    "total": 10,
    "pending": 3,
    "completed": 7,
    "conversionRate": 70,
    "referralCode": "REF123ABC",
    "totalReferralsCount": 7
  }
}
```

#### Get Available Rewards

```http
GET /api/loyalty/rewards?featured=true
Authorization: Bearer {token}

Response:
{
  "success": true,
  "rewards": [
    {
      "_id": "reward123",
      "name": "10% Off Coupon",
      "description": "Get 10% off your next purchase",
      "type": "discount_percentage",
      "pointsCost": 500,
      "value": 10,
      "valueType": "percentage",
      "canAfford": true,
      "pointsNeeded": 0
    }
  ],
  "userPoints": 1250,
  "userTier": "Gold"
}
```

#### Redeem Reward

```http
POST /api/loyalty/rewards/:rewardId/redeem
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Reward redeemed successfully!",
  "redemption": {
    "_id": "redemption123",
    "redemptionCode": "RWD1ABC2DEF3",
    "validUntil": "2026-02-10T10:00:00Z",
    "reward": {
      "name": "10% Off Coupon",
      "description": "Get 10% off your next purchase",
      "type": "discount_percentage",
      "value": 10
    }
  },
  "pointsRemaining": 750
}
```

#### Get Redemption History

```http
GET /api/loyalty/redemptions?status=redeemed&page=1&limit=20
Authorization: Bearer {token}

Response:
{
  "success": true,
  "redemptions": [
    {
      "_id": "redemption123",
      "redemptionCode": "RWD1ABC2DEF3",
      "status": "redeemed",
      "pointsSpent": 500,
      "validUntil": "2026-02-10T10:00:00Z",
      "reward": {
        "name": "10% Off Coupon",
        "description": "Get 10% off your next purchase",
        "type": "discount_percentage",
        "value": 10
      }
    }
  ]
}
```

#### Get Leaderboard

```http
GET /api/loyalty/leaderboard?limit=10

Response:
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "user": {
        "name": "John Doe"
      },
      "lifetimePoints": 15000,
      "currentPoints": 8500,
      "tier": "Platinum"
    }
  ]
}
```

#### Update Settings

```http
PUT /api/loyalty/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "emailNotifications": true,
  "tierUpgradeNotifications": true,
  "expiryReminders": false
}

Response:
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": {
    "emailNotifications": true,
    "tierUpgradeNotifications": true,
    "expiryReminders": false
  }
}
```

---

### Admin Endpoints

#### Create Reward

```http
POST /api/loyalty/admin/rewards
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "15% Off Coupon",
  "description": "Get 15% off your entire order",
  "type": "discount_percentage",
  "pointsCost": 1000,
  "value": 15,
  "valueType": "percentage",
  "stockQuantity": 100,
  "conditions": {
    "minimumPurchase": 100,
    "minimumTier": "Silver"
  },
  "isFeatured": true
}

Response:
{
  "success": true,
  "message": "Reward created successfully",
  "reward": { ...reward_data }
}
```

#### Update Reward

```http
PUT /api/loyalty/admin/rewards/:rewardId
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "pointsCost": 900,
  "stockQuantity": 150
}

Response:
{
  "success": true,
  "message": "Reward updated successfully",
  "reward": { ...updated_reward_data }
}
```

#### Delete Reward

```http
DELETE /api/loyalty/admin/rewards/:rewardId
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "message": "Reward deleted successfully"
}
```

#### Adjust User Points

```http
POST /api/loyalty/admin/points/adjust
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userId": "user123",
  "points": 500,
  "reason": "Customer service compensation"
}

Response:
{
  "success": true,
  "message": "Points adjusted successfully",
  "newBalance": 2750
}
```

#### Get Program Statistics

```http
GET /api/loyalty/admin/statistics
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "statistics": {
    "users": {
      "total": 5000,
      "tierDistribution": [
        { "_id": "Bronze", "count": 3000, "avgPoints": 150 },
        { "_id": "Silver", "count": 1200, "avgPoints": 850 },
        { "_id": "Gold", "count": 600, "avgPoints": 3200 },
        { "_id": "Platinum", "count": 200, "avgPoints": 8500 }
      ]
    },
    "points": {
      "totalPointsBalance": 2500000,
      "totalLifetimePoints": 8750000,
      "avgPointsBalance": 500
    },
    "referrals": {
      "total": 1500,
      "completed": 1050,
      "conversionRate": "70.00"
    },
    "redemptions": {
      "total": 3500,
      "active": 450
    }
  }
}
```

---

## Integration Guide

### 1. Award Points on Order Completion

```javascript
import {
  awardPointsForOrder,
  completeReferralOnOrder,
} from "../services/loyaltyService.js";

// After order payment is confirmed
async function handleOrderPayment(order) {
  // Award loyalty points
  const pointsResult = await awardPointsForOrder(order.user, order);

  if (pointsResult.success) {
    console.log(`Awarded ${pointsResult.pointsAwarded} points`);

    // Check for tier upgrade
    if (pointsResult.tierUpgrade) {
      console.log(
        `Tier upgraded: ${pointsResult.tierUpgrade.oldTier} → ${pointsResult.tierUpgrade.newTier}`
      );
      // Send tier upgrade notification
    }
  }

  // Check and complete referral (if applicable)
  const referralResult = await completeReferralOnOrder(
    order.user,
    order._id,
    order.total
  );

  if (referralResult.success) {
    console.log("Referral completed!");
    // Send referral completion notification
  }
}
```

### 2. Process Referral Code on Registration

```javascript
import { processReferralCode } from "../services/loyaltyService.js";

// During user registration
async function registerUser(userData, referralCode) {
  // Create user account
  const user = await User.create(userData);

  // Process referral code if provided
  if (referralCode) {
    const result = await processReferralCode(user._id, referralCode);
    if (result.success) {
      // Show success message to user
      console.log(result.message);
    }
  }

  return user;
}
```

### 3. Award Points for Reviews

```javascript
import { awardPointsForReview } from "../services/loyaltyService.js";

// After review is approved
async function approveReview(review) {
  review.status = "approved";
  await review.save();

  // Award review points
  const result = await awardPointsForReview(review.user, review.product);

  if (result.success) {
    console.log(`Awarded ${result.pointsAwarded} points for review`);
  }
}
```

### 4. Apply Reward to Order

```javascript
import { RewardRedemption } from "../models/Reward.js";

// During checkout
async function applyRewardToOrder(userId, redemptionCode, order) {
  const redemption = await RewardRedemption.findOne({
    user: userId,
    redemptionCode,
    status: "redeemed",
  }).populate("reward");

  if (!redemption) {
    throw new Error("Invalid redemption code");
  }

  // Apply reward based on type
  switch (redemption.reward.type) {
    case "discount_percentage":
      order.discount = (order.subtotal * redemption.reward.value) / 100;
      break;
    case "discount_fixed":
      order.discount = redemption.reward.value;
      break;
    case "free_shipping":
      order.shippingCost = 0;
      break;
  }

  // Mark redemption as used
  await redemption.markAsUsed(order._id);

  return order;
}
```

---

## Tier Benefits Configuration

Tiers and benefits are configured in the `LoyaltyPoints.js` model:

```javascript
const TIER_THRESHOLDS = {
  Bronze: 0, // Starting tier
  Silver: 500, // Requires 500 lifetime points
  Gold: 2000, // Requires 2,000 lifetime points
  Platinum: 5000, // Requires 5,000 lifetime points
};

const TIER_BENEFITS = {
  Bronze: {
    discountPercentage: 0,
    pointsMultiplier: 1,
    freeShipping: false,
    prioritySupport: false,
    earlyAccess: false,
  },
  Silver: {
    discountPercentage: 5,
    pointsMultiplier: 1.2,
    freeShipping: false,
    prioritySupport: false,
    earlyAccess: false,
  },
  Gold: {
    discountPercentage: 10,
    pointsMultiplier: 1.5,
    freeShipping: true,
    prioritySupport: true,
    earlyAccess: false,
  },
  Platinum: {
    discountPercentage: 15,
    pointsMultiplier: 2,
    freeShipping: true,
    prioritySupport: true,
    earlyAccess: true,
  },
};
```

---

## Testing

### Test Loyalty Profile Creation

```bash
curl -X GET http://localhost:5000/api/loyalty/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Referral Code Generation

```bash
curl -X POST http://localhost:5000/api/loyalty/referral/generate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Reward Redemption

```bash
curl -X POST http://localhost:5000/api/loyalty/rewards/REWARD_ID/redeem \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Admin Reward Creation

```bash
curl -X POST http://localhost:5000/api/loyalty/admin/rewards \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Reward",
    "description": "10% off coupon",
    "type": "discount_percentage",
    "pointsCost": 500,
    "value": 10,
    "valueType": "percentage"
  }'
```

---

## Best Practices

1. **Points Earning**

   - Award points immediately after order confirmation
   - Use background jobs for processing to avoid delaying order completion
   - Log all points transactions for audit trail

2. **Tier Upgrades**

   - Send congratulatory email/notification on tier upgrade
   - Highlight new benefits
   - Encourage continued engagement

3. **Referral Program**

   - Make referral codes easy to share
   - Provide multiple sharing options (email, social media, copy link)
   - Track referral sources for marketing insights

4. **Reward Management**

   - Regularly update reward catalog
   - Create time-limited featured rewards to drive engagement
   - Monitor redemption rates and adjust points costs

5. **User Communication**
   - Send point balance updates
   - Remind users of expiring points
   - Promote rewards near point thresholds
   - Celebrate milestones (tier upgrades, referral milestones)

---

## Security Considerations

1. **Points Integrity**

   - All points transactions are logged
   - Admin adjustments require authentication and authorization
   - Points balance cannot be directly modified

2. **Referral Fraud Prevention**

   - One referral per user
   - Minimum purchase requirement
   - Monitor for suspicious patterns

3. **Reward Redemption**

   - Unique redemption codes
   - Expiration dates enforced
   - One-time use per redemption

4. **Tier Manipulation**
   - Tier based on lifetime points, not current balance
   - Cannot downgrade tiers (only upgrade)
   - Admin review of unusual activity

---

## Support

For questions or issues:

- Check API documentation: `/api-docs`
- Review transaction history for debugging
- Contact support for point adjustments

---

**Last Updated:** November 11, 2025  
**Version:** 1.0.0
