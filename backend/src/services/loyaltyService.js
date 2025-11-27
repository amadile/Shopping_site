import { logger } from "../config/logger.js";
import LoyaltyPoints from "../models/LoyaltyPoints.js";
import Order from "../models/Order.js";
import Referral, { REFERRAL_REWARDS } from "../models/Referral.js";

/**
 * Loyalty Service
 * Handles loyalty points awarding, referral completion, and tier upgrades
 */

/**
 * Award loyalty points for a completed order
 * @param {string} userId - User ID
 * @param {Object} order - Order object
 * @returns {Promise<Object>} Result with points awarded and tier upgrade info
 */
export async function awardPointsForOrder(userId, order) {
  try {
    // Check if points already awarded
    if (order.loyaltyPoints?.awarded) {
      logger.warn(`Points already awarded for order ${order._id}`);
      return {
        success: false,
        message: "Points already awarded for this order",
      };
    }

    // Get or create loyalty profile
    let loyalty = await LoyaltyPoints.findOne({ user: userId });
    if (!loyalty) {
      loyalty = new LoyaltyPoints({
        user: userId,
      });
      await loyalty.save();
      logger.info(`Created loyalty profile for user ${userId}`);
    }

    // Calculate points (use base currency amount)
    const orderAmount = order.baseTotal || order.total;
    const points = LoyaltyPoints.calculatePointsForPurchase(orderAmount);

    // Award points
    const result = await loyalty.addPoints(
      points,
      "earned_purchase",
      `Purchase: Order #${order._id.toString().substring(18)}`,
      { orderId: order._id }
    );

    // Update order
    order.loyaltyPoints = {
      earned: points,
      redeemed: 0,
      awarded: true,
      awardedAt: new Date(),
    };
    await order.save();

    // Check for tier upgrade
    const tierUpgrade = await loyalty.checkTierUpgrade();

    logger.info(
      `Awarded ${points} points to user ${userId} for order ${order._id}`
    );

    return {
      success: true,
      pointsAwarded: points,
      newBalance: loyalty.pointsBalance,
      tier: loyalty.tier,
      tierUpgrade: tierUpgrade.upgraded
        ? {
            oldTier: tierUpgrade.oldTier,
            newTier: tierUpgrade.newTier,
          }
        : null,
    };
  } catch (error) {
    logger.error("Error awarding loyalty points:", error);
    throw error;
  }
}

/**
 * Award points for writing a review
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Result with points awarded
 */
export async function awardPointsForReview(userId, productId) {
  try {
    let loyalty = await LoyaltyPoints.findOne({ user: userId });
    if (!loyalty) {
      loyalty = new LoyaltyPoints({ user: userId });
      await loyalty.save();
    }

    const points = 10; // 10 points for review
    await loyalty.addPoints(points, "earned_review", "Product review bonus", {
      productId,
    });

    logger.info(`Awarded ${points} review points to user ${userId}`);

    return {
      success: true,
      pointsAwarded: points,
      newBalance: loyalty.pointsBalance,
    };
  } catch (error) {
    logger.error("Error awarding review points:", error);
    throw error;
  }
}

/**
 * Check and complete referral on first order
 * @param {string} userId - Referred user ID
 * @param {string} orderId - Order ID
 * @param {number} orderAmount - Order total amount
 * @returns {Promise<Object>} Result with referral completion status
 */
export async function completeReferralOnOrder(userId, orderId, orderAmount) {
  try {
    // Check if user has a pending referral
    const referral = await Referral.findOne({
      referred: userId,
      status: "pending",
    });

    if (!referral) {
      return {
        success: false,
        message: "No pending referral found",
      };
    }

    // Check if this is the user's first order
    const orderCount = await Order.countDocuments({
      user: userId,
      status: { $in: ["paid", "shipped", "delivered"] },
    });

    if (orderCount > 1) {
      logger.info(`Not first order for user ${userId}, referral not completed`);
      return {
        success: false,
        message: "Not first order",
      };
    }

    // Check minimum purchase requirement
    if (orderAmount < REFERRAL_REWARDS.minimumPurchase) {
      logger.info(
        `Order amount ${orderAmount} below minimum ${REFERRAL_REWARDS.minimumPurchase} for referral`
      );
      return {
        success: false,
        message: `Order amount below minimum $${REFERRAL_REWARDS.minimumPurchase}`,
      };
    }

    // Complete referral
    await referral.complete(orderId, orderAmount);

    // Award points to both users
    await referral.awardPoints();

    // Update order with referral
    await Order.findByIdAndUpdate(orderId, {
      referralId: referral._id,
    });

    logger.info(`Completed referral ${referral._id} for order ${orderId}`);

    return {
      success: true,
      referralId: referral._id,
      referrerPoints: referral.referrerPoints,
      referredPoints: referral.referredPoints,
    };
  } catch (error) {
    logger.error("Error completing referral:", error);
    throw error;
  }
}

/**
 * Process referral code during user registration
 * @param {string} newUserId - New user ID
 * @param {string} referralCode - Referral code used
 * @returns {Promise<Object>} Result with referral creation status
 */
export async function processReferralCode(newUserId, referralCode) {
  try {
    // Find referrer by code
    const referrerLoyalty = await LoyaltyPoints.findOne({ referralCode });
    if (!referrerLoyalty) {
      return {
        success: false,
        message: "Invalid referral code",
      };
    }

    // Check if user already has a referral
    const existingReferral = await Referral.findOne({ referred: newUserId });
    if (existingReferral) {
      return {
        success: false,
        message: "User already has a referral",
      };
    }

    // Create referral record
    const referral = new Referral({
      referrer: referrerLoyalty.user,
      referred: newUserId,
      referralCode,
      status: "pending",
      metadata: {
        referrerTier: referrerLoyalty.tier,
      },
    });

    await referral.save();

    logger.info(
      `Created referral ${referral._id} for new user ${newUserId} using code ${referralCode}`
    );

    return {
      success: true,
      referralId: referral._id,
      message: `Welcome! Complete your first purchase of $${REFERRAL_REWARDS.minimumPurchase} or more to earn ${REFERRAL_REWARDS.referredPoints} bonus points!`,
    };
  } catch (error) {
    logger.error("Error processing referral code:", error);
    throw error;
  }
}

/**
 * Check for birthday rewards (should be run daily)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result with birthday reward status
 */
export async function checkBirthdayReward(userId) {
  try {
    const loyalty = await LoyaltyPoints.findOne({ user: userId });
    if (!loyalty) {
      return {
        success: false,
        message: "Loyalty profile not found",
      };
    }

    const awarded = await loyalty.awardBirthdayPoints();

    if (awarded) {
      logger.info(`Awarded birthday points to user ${userId}`);
      return {
        success: true,
        pointsAwarded: 100,
        newBalance: loyalty.pointsBalance,
      };
    }

    return {
      success: false,
      message: "Not user's birthday or already awarded this year",
    };
  } catch (error) {
    logger.error("Error checking birthday reward:", error);
    throw error;
  }
}

/**
 * Award bonus points (admin action or special promotion)
 * @param {string} userId - User ID
 * @param {number} points - Points to award
 * @param {string} reason - Reason for bonus
 * @returns {Promise<Object>} Result with points awarded
 */
export async function awardBonusPoints(userId, points, reason) {
  try {
    let loyalty = await LoyaltyPoints.findOne({ user: userId });
    if (!loyalty) {
      loyalty = new LoyaltyPoints({ user: userId });
      await loyalty.save();
    }

    await loyalty.addPoints(points, "earned_bonus", reason);

    logger.info(`Awarded ${points} bonus points to user ${userId}: ${reason}`);

    return {
      success: true,
      pointsAwarded: points,
      newBalance: loyalty.pointsBalance,
    };
  } catch (error) {
    logger.error("Error awarding bonus points:", error);
    throw error;
  }
}

/**
 * Calculate tier benefits for a given tier
 * @param {string} tier - Tier name
 * @returns {Object} Tier benefits
 */
export function getTierBenefits(tier) {
  const { TIER_BENEFITS } = require("../models/LoyaltyPoints.js");
  return TIER_BENEFITS[tier] || TIER_BENEFITS.Bronze;
}

export default {
  awardPointsForOrder,
  awardPointsForReview,
  completeReferralOnOrder,
  processReferralCode,
  checkBirthdayReward,
  awardBonusPoints,
  getTierBenefits,
};
