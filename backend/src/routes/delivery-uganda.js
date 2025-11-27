import express from "express";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import Order from "../models/Order.js";
import { logger } from "../config/logger.js";

const router = express.Router();

// Kampala districts and zones
const KAMPALA_ZONES = {
  "Central Division": ["Nakawa", "Kawempe", "Rubaga", "Makindye"],
  "East Division": ["Nakawa", "Kira", "Bugolobi", "Nakawa Industrial"],
  "West Division": ["Kawempe", "Wandegeya", "Kibuli", "Makerere"],
  "North Division": ["Kawempe", "Kyambogo", "Nakawa", "Kira"],
  "South Division": ["Makindye", "Kibuye", "Kisugu", "Nsambya"]
};

// Other major districts in Uganda
const UGANDA_DISTRICTS = [
  "Kampala",
  "Wakiso",
  "Mukono",
  "Entebbe",
  "Jinja",
  "Mbale",
  "Mbarara",
  "Kasese",
  "Fort Portal",
  "Masaka",
  "Kalangala",
  "Kiboga",
  "Luwero",
  "Kayunga",
  "Kyenjojo",
  "Kamwenge",
  "Kabarole",
  "Bushenyi",
  "Iganga",
  "Kamuli",
  "Kapchorwa",
  "Kasese",
  "Kibale",
  "Kisoro",
  "Kitgum",
  "Kotido",
  "Kumi",
  "Lira",
  "Moroto",
  "Moyo",
  "Nebbi",
  "Ntungamo",
  "Pallisa",
  "Rakai",
  "Rukungiri",
  "Sembabule",
  "Sironko",
  "Soroti",
  "Tororo",
  "Adjumani",
  "Apac",
  "Arua",
  "Bundibugyo",
  "Bushenyi",
  "Busia",
  "Gulu",
  "Hoima",
  "Ibanda",
  "Jinja",
  "Kaabong",
  "Kabale",
  "Kabarole",
  "Kaberamaido",
  "Kalangala",
  "Kaliro",
  "Kampala",
  "Kamuli",
  "Kamwenge",
  "Kanungu",
  "Kapchorwa",
  "Kasese",
  "Katakwi",
  "Kayunga",
  "Kibale",
  "Kiboga",
  "Kisoro",
  "Kitgum",
  "Kotido",
  "Kumi",
  "Kyenjojo",
  "Lira",
  "Luwero",
  "Lyantonde",
  "Manafwa",
  "Maracha",
  "Masaka",
  "Masindi",
  "Mayuge",
  "Mbale",
  "Mbarara",
  "Mityana",
  "Moroto",
  "Moyo",
  "Mpigi",
  "Mubende",
  "Mukono",
  "Nakapiripirit",
  "Nakaseke",
  "Nakasongola",
  "Nebbi",
  "Ntungamo",
  "Oyam",
  "Pader",
  "Pallisa",
  "Rakai",
  "Rukungiri",
  "Sembabule",
  "Sironko",
  "Soroti",
  "Tororo",
  "Wakiso",
  "Yumbe"
];

/**
 * @swagger
 * /api/delivery/zones:
 *   get:
 *     summary: Get delivery zones (Uganda-specific)
 *     tags: [Delivery Uganda]
 *     responses:
 *       200:
 *         description: Delivery zones
 */
router.get("/zones", async (req, res) => {
  try {
    res.json({
      kampalaZones: KAMPALA_ZONES,
      districts: UGANDA_DISTRICTS,
    });
  } catch (error) {
    logger.error("Get delivery zones error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/delivery/zones/kampala:
 *   get:
 *     summary: Get Kampala zones
 *     tags: [Delivery Uganda]
 *     responses:
 *       200:
 *         description: Kampala zones
 */
router.get("/zones/kampala", async (req, res) => {
  try {
    res.json({
      zones: KAMPALA_ZONES,
    });
  } catch (error) {
    logger.error("Get Kampala zones error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/delivery/districts:
 *   get:
 *     summary: Get Uganda districts
 *     tags: [Delivery Uganda]
 *     responses:
 *       200:
 *         description: Uganda districts
 */
router.get("/districts", async (req, res) => {
  try {
    res.json({
      districts: UGANDA_DISTRICTS,
    });
  } catch (error) {
    logger.error("Get districts error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/delivery/order/{orderId}/zone:
 *   put:
 *     summary: Update order delivery zone (Uganda-specific)
 *     tags: [Delivery Uganda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               district:
 *                 type: string
 *               zone:
 *                 type: string
 *               landmark:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delivery zone updated
 */
router.put("/order/:orderId/zone", authenticateJWT, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { district, zone, landmark } = req.body;

    // Validate input
    if (!district) {
      return res.status(400).json({ error: "District is required" });
    }

    // Validate district
    if (!UGANDA_DISTRICTS.includes(district)) {
      return res.status(400).json({ error: "Invalid district" });
    }

    // Validate zone if provided
    if (zone && district === "Kampala") {
      let validZone = false;
      for (const division in KAMPALA_ZONES) {
        if (KAMPALA_ZONES[division].includes(zone)) {
          validZone = true;
          break;
        }
      }
      if (!validZone) {
        return res.status(400).json({ error: "Invalid Kampala zone" });
      }
    }

    // Get order
    const order = await Order.findById(orderId).populate("user");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Update order with delivery zone information
    if (!order.shippingAddress) {
      order.shippingAddress = {};
    }
    
    order.shippingAddress.district = district;
    if (zone) order.shippingAddress.zone = zone;
    if (landmark) order.shippingAddress.landmark = landmark;

    await order.save();

    logger.info(`Delivery zone updated for order ${orderId}`, {
      orderId,
      userId: req.user._id,
      district,
      zone,
      landmark,
    });

    res.json({
      message: "Delivery zone updated successfully",
      order: {
        id: order._id,
        shippingAddress: order.shippingAddress,
      },
    });
  } catch (error) {
    logger.error("Update delivery zone error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin routes for managing delivery zones

/**
 * @swagger
 * /api/admin/delivery/zones:
 *   get:
 *     summary: Get all delivery zones (Admin only)
 *     tags: [Delivery Uganda Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery zones
 */
router.get("/admin/zones", authenticateJWT, authorizeRoles("admin"), async (req, res) => {
  try {
    res.json({
      kampalaZones: KAMPALA_ZONES,
      districts: UGANDA_DISTRICTS,
    });
  } catch (error) {
    logger.error("Get delivery zones error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/delivery/zones:
 *   post:
 *     summary: Add new delivery zone (Admin only)
 *     tags: [Delivery Uganda Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               district:
 *                 type: string
 *               zones:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Delivery zone added
 */
router.post("/admin/zones", authenticateJWT, authorizeRoles("admin"), async (req, res) => {
  try {
    const { district, zones } = req.body;

    // Validate input
    if (!district || !zones || !Array.isArray(zones)) {
      return res.status(400).json({ error: "District and zones array are required" });
    }

    // In a real implementation, we would store this in a database
    // For now, we'll just log it

    logger.info(`New delivery zone added`, {
      district,
      zones,
      adminId: req.user._id,
    });

    res.json({
      message: "Delivery zone added successfully",
      district,
      zones,
    });
  } catch (error) {
    logger.error("Add delivery zone error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;