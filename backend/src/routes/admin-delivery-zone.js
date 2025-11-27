import express from "express";
import { logger } from "../config/logger.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import DeliveryZone from "../models/DeliveryZone.js";

const router = express.Router();

// Apply authentication and authorization middleware
router.use(authenticateJWT);
router.use(authorizeRoles("admin"));

/**
 * @swagger
 * /api/admin/delivery-zones:
 *   get:
 *     summary: Get all delivery zones
 *     tags: [Admin Delivery Zone]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [kampala_zone, district, region]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of delivery zones
 */
router.get("/", async (req, res) => {
  try {
    const { type, isActive } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const zones = await DeliveryZone.find(query).sort({ name: 1 });

    res.json({
      zones,
      total: zones.length,
    });
  } catch (error) {
    logger.error("Get delivery zones error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/delivery-zones/kampala:
 *   get:
 *     summary: Get all Kampala zones
 *     tags: [Admin Delivery Zone]
 *     responses:
 *       200:
 *         description: List of Kampala zones
 */
router.get("/kampala", async (req, res) => {
  try {
    const zones = await DeliveryZone.getKampalaZones();

    res.json({
      zones,
      total: zones.length,
    });
  } catch (error) {
    logger.error("Get Kampala zones error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/delivery-zones/districts:
 *   get:
 *     summary: Get all districts
 *     tags: [Admin Delivery Zone]
 *     responses:
 *       200:
 *         description: List of districts
 */
router.get("/districts", async (req, res) => {
  try {
    const zones = await DeliveryZone.getAllDistricts();

    res.json({
      zones,
      total: zones.length,
    });
  } catch (error) {
    logger.error("Get districts error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/delivery-zones/{zoneId}:
 *   get:
 *     summary: Get delivery zone details
 *     tags: [Admin Delivery Zone]
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zone details
 */
router.get("/:zoneId", async (req, res) => {
  try {
    const { zoneId } = req.params;

    const zone = await DeliveryZone.findById(zoneId);

    if (!zone) {
      return res.status(404).json({ error: "Delivery zone not found" });
    }

    res.json({ zone });
  } catch (error) {
    logger.error("Get delivery zone details error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/delivery-zones:
 *   post:
 *     summary: Create a new delivery zone
 *     tags: [Admin Delivery Zone]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [kampala_zone, district, region]
 *               zone:
 *                 type: string
 *               district:
 *                 type: string
 *               region:
 *                 type: string
 *               pricing:
 *                 type: object
 *               estimatedDeliveryDays:
 *                 type: object
 *     responses:
 *       201:
 *         description: Zone created successfully
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      type,
      zone,
      district,
      region,
      pricing,
      estimatedDeliveryDays,
      availablePartners,
      coordinates,
      landmarks,
      specialInstructions,
      codAvailable,
      minOrderAmount,
    } = req.body;

    // Check if zone already exists
    const existingZone = await DeliveryZone.findOne({ name });
    if (existingZone) {
      return res
        .status(400)
        .json({ error: "Delivery zone with this name already exists" });
    }

    const deliveryZone = new DeliveryZone({
      name,
      type,
      zone,
      district,
      region,
      pricing: pricing || {
        baseFee: 5000,
        perKmFee: 1000,
        minOrderForFreeDelivery: 100000,
      },
      estimatedDeliveryDays: estimatedDeliveryDays || { min: 1, max: 3 },
      availablePartners,
      coordinates,
      landmarks,
      specialInstructions,
      codAvailable,
      minOrderAmount,
    });

    await deliveryZone.save();

    logger.info(`Delivery zone ${name} created by admin ${req.user._id}`, {
      zoneId: deliveryZone._id,
      adminId: req.user._id,
    });

    res.status(201).json({
      message: "Delivery zone created successfully",
      zone: deliveryZone,
    });
  } catch (error) {
    logger.error("Create delivery zone error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/delivery-zones/{zoneId}:
 *   put:
 *     summary: Update a delivery zone
 *     tags: [Admin Delivery Zone]
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Zone updated successfully
 */
router.put("/:zoneId", async (req, res) => {
  try {
    const { zoneId } = req.params;
    const updates = req.body;

    const zone = await DeliveryZone.findByIdAndUpdate(zoneId, updates, {
      new: true,
      runValidators: true,
    });

    if (!zone) {
      return res.status(404).json({ error: "Delivery zone not found" });
    }

    logger.info(`Delivery zone ${zoneId} updated by admin ${req.user._id}`, {
      zoneId,
      adminId: req.user._id,
    });

    res.json({
      message: "Delivery zone updated successfully",
      zone,
    });
  } catch (error) {
    logger.error("Update delivery zone error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/delivery-zones/{zoneId}:
 *   delete:
 *     summary: Delete a delivery zone
 *     tags: [Admin Delivery Zone]
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zone deleted successfully
 */
router.delete("/:zoneId", async (req, res) => {
  try {
    const { zoneId } = req.params;

    const zone = await DeliveryZone.findByIdAndDelete(zoneId);

    if (!zone) {
      return res.status(404).json({ error: "Delivery zone not found" });
    }

    logger.info(`Delivery zone ${zoneId} deleted by admin ${req.user._id}`, {
      zoneId,
      adminId: req.user._id,
    });

    res.json({
      message: "Delivery zone deleted successfully",
    });
  } catch (error) {
    logger.error("Delete delivery zone error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/delivery-zones/{zoneId}/toggle:
 *   put:
 *     summary: Toggle zone active status
 *     tags: [Admin Delivery Zone]
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Zone status toggled
 */
router.put("/:zoneId/toggle", async (req, res) => {
  try {
    const { zoneId } = req.params;

    const zone = await DeliveryZone.findById(zoneId);

    if (!zone) {
      return res.status(404).json({ error: "Delivery zone not found" });
    }

    zone.isActive = !zone.isActive;
    await zone.save();

    logger.info(
      `Delivery zone ${zoneId} status toggled to ${zone.isActive} by admin ${req.user._id}`,
      {
        zoneId,
        adminId: req.user._id,
        isActive: zone.isActive,
      }
    );

    res.json({
      message: `Delivery zone ${
        zone.isActive ? "activated" : "deactivated"
      } successfully`,
      zone,
    });
  } catch (error) {
    logger.error("Toggle delivery zone status error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/delivery-zones/seed/default:
 *   post:
 *     summary: Seed default Kampala zones and districts
 *     tags: [Admin Delivery Zone]
 *     responses:
 *       201:
 *         description: Default zones created
 */
router.post("/seed/default", async (req, res) => {
  try {
    // Default Kampala zones
    const kampalaZones = [
      {
        name: "Nakawa",
        type: "kampala_zone",
        zone: "Nakawa",
        pricing: {
          baseFee: 5000,
          perKmFee: 1000,
          minOrderForFreeDelivery: 100000,
        },
        estimatedDeliveryDays: { min: 1, max: 2 },
        availablePartners: ["safeboda", "jumia_express", "customer_pickup"],
        codAvailable: true,
        minOrderAmount: 10000,
      },
      {
        name: "Kawempe",
        type: "kampala_zone",
        zone: "Kawempe",
        pricing: {
          baseFee: 5000,
          perKmFee: 1000,
          minOrderForFreeDelivery: 100000,
        },
        estimatedDeliveryDays: { min: 1, max: 2 },
        availablePartners: ["safeboda", "jumia_express", "customer_pickup"],
        codAvailable: true,
        minOrderAmount: 10000,
      },
      {
        name: "Rubaga",
        type: "kampala_zone",
        zone: "Rubaga",
        pricing: {
          baseFee: 5000,
          perKmFee: 1000,
          minOrderForFreeDelivery: 100000,
        },
        estimatedDeliveryDays: { min: 1, max: 2 },
        availablePartners: ["safeboda", "jumia_express", "customer_pickup"],
        codAvailable: true,
        minOrderAmount: 10000,
      },
      {
        name: "Makindye",
        type: "kampala_zone",
        zone: "Makindye",
        pricing: {
          baseFee: 5000,
          perKmFee: 1000,
          minOrderForFreeDelivery: 100000,
        },
        estimatedDeliveryDays: { min: 1, max: 2 },
        availablePartners: ["safeboda", "jumia_express", "customer_pickup"],
        codAvailable: true,
        minOrderAmount: 10000,
      },
      {
        name: "Central",
        type: "kampala_zone",
        zone: "Central",
        pricing: {
          baseFee: 3000,
          perKmFee: 800,
          minOrderForFreeDelivery: 80000,
        },
        estimatedDeliveryDays: { min: 1, max: 1 },
        availablePartners: ["safeboda", "jumia_express", "customer_pickup"],
        codAvailable: true,
        minOrderAmount: 5000,
      },
    ];

    // Sample districts
    const sampleDistricts = [
      {
        name: "Wakiso",
        type: "district",
        district: "Wakiso",
        region: "central",
        pricing: {
          baseFee: 8000,
          perKmFee: 1500,
          minOrderForFreeDelivery: 150000,
        },
        estimatedDeliveryDays: { min: 1, max: 3 },
        availablePartners: ["safeboda", "fraine"],
        codAvailable: true,
        minOrderAmount: 15000,
      },
      {
        name: "Entebbe",
        type: "district",
        district: "Entebbe",
        region: "central",
        pricing: {
          baseFee: 15000,
          perKmFee: 2000,
          minOrderForFreeDelivery: 200000,
        },
        estimatedDeliveryDays: { min: 2, max: 4 },
        availablePartners: ["fraine", "tugende"],
        codAvailable: true,
        minOrderAmount: 20000,
      },
    ];

    const allZones = [...kampalaZones, ...sampleDistricts];
    const created = [];

    for (const zoneData of allZones) {
      const existing = await DeliveryZone.findOne({ name: zoneData.name });
      if (!existing) {
        const zone = await DeliveryZone.create(zoneData);
        created.push(zone);
      }
    }

    res.status(201).json({
      message: "Default delivery zones seeded successfully",
      created: created.length,
      zones: created,
    });
  } catch (error) {
    logger.error("Seed default zones error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
