import { logger } from "../config/logger.js";
import Review from "../models/Review.js";

/**
 * Review Moderation Service
 * Handles review approval workflow and spam detection
 */

class ReviewModerationService {
  // Spam keywords and patterns
  spamKeywords = [
    "buy now",
    "click here",
    "free money",
    "limited offer",
    "act now",
    "viagra",
    "cialis",
    "casino",
    "lottery",
    "prize",
    "congratulations you won",
    "nigeria",
    "inheritance",
  ];

  spamPatterns = [
    /https?:\/\/[^\s]+/gi, // URLs
    /\b\d{10,}\b/g, // Long numbers (phone numbers)
    /(.)\1{5,}/gi, // Repeated characters (aaaaaaa)
    /[A-Z]{10,}/g, // Too many capitals
  ];

  /**
   * Check if review contains spam
   */
  detectSpam(text) {
    if (!text) return { isSpam: false, reasons: [] };

    const reasons = [];
    const lowerText = text.toLowerCase();

    // Check for spam keywords
    for (const keyword of this.spamKeywords) {
      if (lowerText.includes(keyword)) {
        reasons.push(`Contains spam keyword: "${keyword}"`);
      }
    }

    // Check for spam patterns
    if (this.spamPatterns[0].test(text)) {
      reasons.push("Contains suspicious URLs");
    }
    if (this.spamPatterns[1].test(text)) {
      reasons.push("Contains suspicious phone numbers");
    }
    if (this.spamPatterns[2].test(text)) {
      reasons.push("Contains repeated characters");
    }
    if (this.spamPatterns[3].test(text)) {
      reasons.push("Too many capital letters");
    }

    // Check for excessive exclamation/question marks
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;

    if (exclamationCount > 5) {
      reasons.push("Excessive exclamation marks");
    }
    if (questionCount > 5) {
      reasons.push("Excessive question marks");
    }

    // Check for very short reviews with high ratings
    if (text.length < 10) {
      reasons.push("Review too short");
    }

    if (reasons.length > 0) {
      logger.info(`Spam detected: ${JSON.stringify(reasons)} for text: "${text}"`);
    }

    return {
      isSpam: reasons.length > 0,
      reasons,
      spamScore: reasons.length,
    };
  }

  /**
   * Auto-moderate review on submission
   */
  async autoModerate(review) {
    try {
      const spamCheck = this.detectSpam(
        `${review.comment || ""} ${review.title || ""}`
      );

      // Auto-reject if high spam score
      if (spamCheck.spamScore >= 3) {
        review.moderationStatus = "rejected";
        review.moderationReason = spamCheck.reasons.join("; ");
        review.moderatedAt = new Date();
        await review.save();

        logger.info(`Review ${review._id} auto-rejected as spam`);
        return { autoModerated: true, status: "rejected", ...spamCheck };
      }

      // Flag for manual review if moderate spam score
      if (spamCheck.spamScore >= 1) {
        review.moderationStatus = "flagged";
        review.moderationReason = spamCheck.reasons.join("; ");
        await review.save();

        logger.info(`Review ${review._id} flagged for manual moderation`);
        return { autoModerated: true, status: "flagged", ...spamCheck };
      }

      // Auto-approve if no spam detected
      review.moderationStatus = "approved";
      review.moderatedAt = new Date();
      await review.save();

      logger.info(`Review ${review._id} auto-approved`);
      return { autoModerated: true, status: "approved", ...spamCheck };
    } catch (error) {
      logger.error("Error in auto-moderation:", error);
      throw error;
    }
  }

  /**
   * Manually approve a review
   */
  async approveReview(reviewId, moderatorId, reason = "") {
    try {
      logger.info(`Attempting to approve review ${reviewId} by moderator ${moderatorId}`);
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error("Review not found");
      }

      review.moderationStatus = "approved";
      review.moderatedBy = moderatorId;
      review.moderatedAt = new Date();
      review.moderationReason = reason;
      await review.save();

      logger.info(`Review ${reviewId} approved by moderator ${moderatorId}`);
      return review;
    } catch (error) {
      logger.error(`Error approving review ${reviewId}:`, error);
      throw error;
    }
  }

  /**
   * Manually reject a review
   */
  async rejectReview(reviewId, moderatorId, reason) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error("Review not found");
      }

      if (!reason) {
        throw new Error("Rejection reason is required");
      }

      review.moderationStatus = "rejected";
      review.moderatedBy = moderatorId;
      review.moderatedAt = new Date();
      review.moderationReason = reason;
      await review.save();

      logger.info(`Review ${reviewId} rejected by moderator ${moderatorId}`);
      return review;
    } catch (error) {
      logger.error("Error rejecting review:", error);
      throw error;
    }
  }

  /**
   * Flag a review for manual moderation
   */
  async flagReview(reviewId, moderatorId, reason) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error("Review not found");
      }

      review.moderationStatus = "flagged";
      review.moderatedBy = moderatorId;
      review.moderationReason = reason;
      await review.save();

      logger.info(`Review ${reviewId} flagged by moderator ${moderatorId}`);
      return review;
    } catch (error) {
      logger.error("Error flagging review:", error);
      throw error;
    }
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(status = "pending", page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const reviews = await Review.find({ moderationStatus: status })
        .populate("user", "name email")
        .populate("product", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Review.countDocuments({ moderationStatus: status });

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error getting moderation queue:", error);
      throw error;
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(startDate, endDate) {
    try {
      const match = {};
      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = startDate;
        if (endDate) match.createdAt.$lte = endDate;
      }

      const stats = await Review.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$moderationStatus",
            count: { $sum: 1 },
          },
        },
      ]);

      const result = {
        pending: 0,
        approved: 0,
        rejected: 0,
        flagged: 0,
      };

      stats.forEach((stat) => {
        if (result.hasOwnProperty(stat._id)) {
          result[stat._id] = stat.count;
        }
      });

      result.total =
        result.pending + result.approved + result.rejected + result.flagged;
      result.approvalRate =
        result.total > 0
          ? ((result.approved / result.total) * 100).toFixed(2)
          : 0;

      return result;
    } catch (error) {
      logger.error("Error getting moderation stats:", error);
      throw error;
    }
  }
}

export default new ReviewModerationService();
