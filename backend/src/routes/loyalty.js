import express from "express";
import { logger } from "../config/logger.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import LoyaltyPoints, {
  TIER_BENEFITS,
  TIER_THRESHOLDS,
} from "../models/LoyaltyPoints.js";
import Referral, { REFERRAL_REWARDS } from "../models/Referral.js";
import Reward, { RewardRedemption } from "../models/Reward.js";

const router = express.Router();

/**
 * @swagger
 * /api/loyalty/profile:
 *   get:
 *     summary: Get user's loyalty profile
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loyalty profile retrieved
 *       404:
 *         description: Loyalty profile not found
 */
router.get("/profile", authenticateJWT, async (req, res) => {
  try {
    let loyalty = await LoyaltyPoints.findOne({ user: req.user._id });

    // Create loyalty profile if doesn't exist
    if (!loyalty) {
      loyalty = new LoyaltyPoints({
        user: req.user._id,
        tierBenefits: TIER_BENEFITS.Bronze,
      });
      await loyalty.save();
      logger.info(`Created loyalty profile for user ${req.user._id}`);
    }

    res.json({
      success: true,
      loyalty: {
        pointsBalance: loyalty.pointsBalance,
        lifetimePoints: loyalty.lifetimePoints,
        tier: loyalty.tier,
        pointsToNextTier: loyalty.pointsToNextTier,
        tierBenefits: loyalty.tierBenefits,
        referralCode: loyalty.referralCode,
        referralsCount: loyalty.referralsCount,
        tierHistory: loyalty.tierHistory,
      },
      tierInfo: {
        current: loyalty.tier,
        benefits: TIER_BENEFITS[loyalty.tier],
        allTiers: TIER_THRESHOLDS,
      },
    });
  } catch (error) {
    logger.error("Error fetching loyalty profile:", error);
    res.status(500).json({ error: req.__("common.serverError") });
  }
});

/**
 * @swagger
 * /api/loyalty/transactions:
 *   get:
 *     summary: Get loyalty points transaction history
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 */
router.get("/transactions", authenticateJWT, async (req, res) => {
  try {
    const { days = 30, page = 1, limit = 20 } = req.query;

    const loyalty = await LoyaltyPoints.findOne({ user: req.user._id });
    if (!loyalty) {
      return res.status(404).json({ error: "Loyalty profile not found" });
    }

    // Get transactions
    const allTransactions = loyalty.getPointsHistory(parseInt(days));

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const transactions = allTransactions.slice(startIndex, endIndex);

    // Calculate summary
    const earned = allTransactions
      .filter((t) => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0);
    const redeemed = allTransactions
      .filter((t) => t.points < 0)
      .reduce((sum, t) => sum + Math.abs(t.points), 0);

    res.json({
      success: true,
      transactions,
      summary: {
        totalEarned: earned,
        totalRedeemed: redeemed,
        netPoints: earned - redeemed,
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allTransactions.length / limit),
        totalTransactions: allTransactions.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching transactions:", error);
    res.status(500).json({ error: req.__("common.serverError") });
  }
});

/**
 * @swagger
 * /api/loyalty/referral/generate:
 *   post:
 *     summary: Generate referral code
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 */
router.post("/referral/generate", authenticateJWT, async (req, res) => {
  try {
    let loyalty = await LoyaltyPoints.findOne({ user: req.user._id });

    if (!loyalty) {
      loyalty = new LoyaltyPoints({
        user: req.user._id,
        tierBenefits: TIER_BENEFITS.Bronze,
      });
      await loyalty.save();
    }

    const referralCode = await loyalty.generateReferralCode();

    logger.info(
      `Generated referral code ${referralCode} for user ${req.user._id}`
    );

    res.json({
      success: true,
      referralCode,
      rewards: REFERRAL_REWARDS,
      shareLinks: {
        web: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/register?ref=${referralCode}`,
        message: `Join ${
          process.env.APP_NAME || "our store"
        } using my referral code: ${referralCode} and get ${
          REFERRAL_REWARDS.referredPoints
        } bonus points!`,
      },
    });
  } catch (error) {
    logger.error("Error generating referral code:", error);
    res.status(500).json({ error: req.__("common.serverError") });
  }
});

/**
 * @swagger
 * /api/loyalty/referral/stats:
 *   get:
 *     summary: Get referral statistics
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 */
router.get("/referral/stats", authenticateJWT, async (req, res) => {
  try {
    const stats = await Referral.getReferralStats(req.user._id);

    const loyalty = await LoyaltyPoints.findOne({ user: req.user._id });

    res.json({
      success: true,
      stats: {
        ...stats,
        referralCode: loyalty?.referralCode || null,
        totalReferralsCount: loyalty?.referralsCount || 0,
      },
      rewards: REFERRAL_REWARDS,
    });
  } catch (error) {
    logger.error("Error fetching referral stats:", error);
    res.status(500).json({ error: req.__("common.serverError") });
  }
});

/**
 * @swagger
 * /api/loyalty/referral/validate:
 *   post:
 *     summary: Validate referral code
 *     tags: [Loyalty]
 */
router.post("/referral/validate", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Referral code is required" });
    }

    const isValid = await Referral.validateReferralCode(code);

    if (isValid) {
      res.json({
        success: true,
        valid: true,
        rewards: REFERRAL_REWARDS,
        message: `You'll get ${REFERRAL_REWARDS.referredPoints} points after your first purchase!`,
      });
    } else {
      res.json({
        success: true,
        valid: false,
        message: "Invalid referral code",
      });
    }
  } catch (error) {
    logger.error("Error validating referral code:", error);
    res.status(500).json({ error: req.__("common.serverError") });
  }
});

/**
 * @swagger
 * /api/loyalty/rewards:
 *   get:
 *     summary: Get available rewards
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 */
router.get("/rewards", authenticateJWT, async (req, res) => {
  try {
    const { type, featured } = req.query;

    const loyalty = await LoyaltyPoints.findOne({ user: req.user._id });
    const userTier = loyalty?.tier || "Bronze";

    let rewards;
    if (featured === "true") {
      rewards = await Reward.getFeaturedRewards();
    } else {
      rewards = await Reward.getAvailableRewards(userTier, {
        type,
        limit: 50,
      });
    }

    // Check which rewards user can afford
    const userPoints = loyalty?.pointsBalance || 0;
    const enrichedRewards = rewards.map((reward) => ({
      ...reward.toObject(),
      canAfford: userPoints >= reward.pointsCost,
      pointsNeeded:
        userPoints < reward.pointsCost ? reward.pointsCost - userPoints : 0,
    }));

    res.json({
      success: true,
      rewards: enrichedRewards,
      userPoints,
      userTier,
    });
  } catch (error) {
    logger.error("Error fetching rewards:", error);
    res.status(500).json({ error: req.__("common.serverError") });
  }
});

/**
 * @swagger
 * /api/loyalty/rewards/:rewardId/redeem:
 *   post:
 *     summary: Redeem a reward
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 */
router.post("/rewards/:rewardId/redeem", authenticateJWT, async (req, res) => {
  try {
    const { rewardId } = req.params;

    // Get reward
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }

    // Get user loyalty
    const loyalty = await LoyaltyPoints.findOne({ user: req.user._id });
    if (!loyalty) {
      return res.status(404).json({ error: "Loyalty profile not found" });
    }

    // Check if reward is available
    if (!reward.isAvailable()) {
      return res.status(400).json({ error: "Reward is not available" });
    }

    // Check if user can redeem
    const { canRedeem, reason } = await reward.canRedeem(
      req.user._id,
      loyalty.tier
    );
    if (!canRedeem) {
      return res.status(403).json({ error: reason });
    }

    // Check points balance
    if (loyalty.pointsBalance < reward.pointsCost) {
      return res.status(400).json({
        error: "Insufficient points",
        required: reward.pointsCost,
        available: loyalty.pointsBalance,
        needed: reward.pointsCost - loyalty.pointsBalance,
      });
    }

    // Create redemption record
    const redemption = new RewardRedemption({
      user: req.user._id,
      reward: reward._id,
      pointsSpent: reward.pointsCost,
      status: "redeemed",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      metadata: {
        rewardSnapshot: reward.toObject(),
      },
    });

    await redemption.generateRedemptionCode();
    await redemption.save();

    // Deduct points
    await loyalty.redeemPoints(
      reward.pointsCost,
      "redeemed_reward",
      `Redeemed: ${reward.name}`,
      { rewardId: reward._id }
    );

    // Update reward redemption count
    await reward.redeem();

    logger.info(
      `User ${req.user._id} redeemed reward ${reward._id} for ${reward.pointsCost} points`
    );

    res.json({
      success: true,
      message: "Reward redeemed successfully!",
      redemption: {
        _id: redemption._id,
        redemptionCode: redemption.redemptionCode,
        validUntil: redemption.validUntil,
        reward: {
          name: reward.name,
          description: reward.description,
          type: reward.type,
          value: reward.value,
          valueType: reward.valueType,
        },
      },
      pointsRemaining: loyalty.pointsBalance,
    });
  } catch (error) {
    logger.error("Error redeeming reward:", error);
    res.status(500).json({ error: req.__("common.serverError") });
  }
});

/**
 * @swagger
 * /api/loyalty/redemptions:
 *   get:
 *     summary: Get user's reward redemptions
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 */
router.get("/redemptions", authenticateJWT, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const redemptions = await RewardRedemption.find(query)
      .populate("reward", "name description type value valueType image")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await RewardRedemption.countDocuments(query);

    res.json({
      success: true,
      redemptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    logger.error("Error fetching redemptions:", error);
    res.status(500).json({ error: req.__("common.serverError") });
  }
});

/**
 * @swagger
 * /api/loyalty/leaderboard:
 *   get:
 *     summary: Get loyalty leaderboard
 *     tags: [Loyalty]
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await LoyaltyPoints.getLeaderboard(parseInt(limit));

    res.json({
      success: true,
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: {
          name: entry.user?.name || "Anonymous",
          email: entry.user?.email,
        },
        lifetimePoints: entry.lifetimePoints,
        currentPoints: entry.pointsBalance,
        tier: entry.tier,
      })),
    });
  } catch (error) {
    logger.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: req.__("common.serverError") });
  }
});

/**
 * @swagger
 * /api/loyalty/settings:
 *   put:
 *     summary: Update loyalty notification settings
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 */
router.put("/settings", authenticateJWT, async (req, res) => {
  try {
    const { emailNotifications, tierUpgradeNotifications, expiryReminders } =
      req.body;

    const loyalty = await LoyaltyPoints.findOne({ user: req.user._id });
    if (!loyalty) {
      return res.status(404).json({ error: "Loyalty profile not found" });
    }

    if (typeof emailNotifications === "boolean") {
      loyalty.settings.emailNotifications = emailNotifications;
    }
    if (typeof tierUpgradeNotifications === "boolean") {
      loyalty.settings.tierUpgradeNotifications = tierUpgradeNotifications;
    }
    if (typeof expiryReminders === "boolean") {
      loyalty.settings.expiryReminders = expiryReminders;
    }

    await loyalty.save();

    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: loyalty.settings,
    });
  } catch (error) {
    logger.error("Error updating settings:", error);
    res.status(500).json({ error: req.__("common.serverError") });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /api/loyalty/admin/rewards:
 *   post:
 *     summary: Create a new reward (Admin)
 *     tags: [Loyalty - Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/admin/rewards",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const rewardData = req.body;

      const reward = new Reward(rewardData);
      await reward.save();

      logger.info(`Admin ${req.user._id} created reward ${reward._id}`);

      res.status(201).json({
        success: true,
        message: "Reward created successfully",
        reward,
      });
    } catch (error) {
      logger.error("Error creating reward:", error);
      res.status(500).json({ error: req.__("common.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/loyalty/admin/rewards/:rewardId:
 *   put:
 *     summary: Update reward (Admin)
 *     tags: [Loyalty - Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/admin/rewards/:rewardId",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { rewardId } = req.params;
      const updates = req.body;

      const reward = await Reward.findByIdAndUpdate(rewardId, updates, {
        new: true,
        runValidators: true,
      });

      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      logger.info(`Admin ${req.user._id} updated reward ${rewardId}`);

      res.json({
        success: true,
        message: "Reward updated successfully",
        reward,
      });
    } catch (error) {
      logger.error("Error updating reward:", error);
      res.status(500).json({ error: req.__("common.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/loyalty/admin/rewards/:rewardId:
 *   delete:
 *     summary: Delete reward (Admin)
 *     tags: [Loyalty - Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/admin/rewards/:rewardId",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { rewardId } = req.params;

      const reward = await Reward.findByIdAndDelete(rewardId);
      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      logger.info(`Admin ${req.user._id} deleted reward ${rewardId}`);

      res.json({
        success: true,
        message: "Reward deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting reward:", error);
      res.status(500).json({ error: req.__("common.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/loyalty/admin/points/adjust:
 *   post:
 *     summary: Manually adjust user points (Admin)
 *     tags: [Loyalty - Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/admin/points/adjust",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { userId, points, reason } = req.body;

      if (!userId || points === undefined || !reason) {
        return res.status(400).json({
          error: "userId, points, and reason are required",
        });
      }

      const loyalty = await LoyaltyPoints.findOne({ user: userId });
      if (!loyalty) {
        return res
          .status(404)
          .json({ error: "User loyalty profile not found" });
      }

      if (points > 0) {
        await loyalty.addPoints(points, "adjusted", reason);
      } else {
        await loyalty.redeemPoints(Math.abs(points), "adjusted", reason);
      }

      logger.info(
        `Admin ${req.user._id} adjusted ${points} points for user ${userId}: ${reason}`
      );

      res.json({
        success: true,
        message: "Points adjusted successfully",
        newBalance: loyalty.pointsBalance,
      });
    } catch (error) {
      logger.error("Error adjusting points:", error);
      res.status(500).json({ error: req.__("common.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/loyalty/admin/statistics:
 *   get:
 *     summary: Get loyalty program statistics (Admin)
 *     tags: [Loyalty - Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/statistics",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      // Tier distribution
      const tierDistribution = await LoyaltyPoints.getTierDistribution();

      // Total users in program
      const totalUsers = await LoyaltyPoints.countDocuments();

      // Total points in circulation
      const pointsStats = await LoyaltyPoints.aggregate([
        {
          $group: {
            _id: null,
            totalPointsBalance: { $sum: "$pointsBalance" },
            totalLifetimePoints: { $sum: "$lifetimePoints" },
            avgPointsBalance: { $avg: "$pointsBalance" },
          },
        },
      ]);

      // Referral stats
      const totalReferrals = await Referral.countDocuments();
      const completedReferrals = await Referral.countDocuments({
        status: { $in: ["completed", "rewarded"] },
      });

      // Reward redemptions
      const totalRedemptions = await RewardRedemption.countDocuments();
      const activeRedemptions = await RewardRedemption.countDocuments({
        status: { $in: ["pending", "redeemed"] },
      });

      res.json({
        success: true,
        statistics: {
          users: {
            total: totalUsers,
            tierDistribution,
          },
          points: pointsStats[0] || {
            totalPointsBalance: 0,
            totalLifetimePoints: 0,
            avgPointsBalance: 0,
          },
          referrals: {
            total: totalReferrals,
            completed: completedReferrals,
            conversionRate:
              totalReferrals > 0
                ? ((completedReferrals / totalReferrals) * 100).toFixed(2)
                : 0,
          },
          redemptions: {
            total: totalRedemptions,
            active: activeRedemptions,
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching statistics:", error);
      res.status(500).json({ error: req.__("common.serverError") });
    }
  }
);

export default router;
