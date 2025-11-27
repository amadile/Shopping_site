import dotenv from "dotenv";
import mongoose from "mongoose";
import { logger } from "../src/config/logger.js";
import CommissionSettings from "../src/models/CommissionSettings.js";
import DeliveryZone from "../src/models/DeliveryZone.js";

dotenv.config();

/**
 * Default Kampala delivery zones
 */
const kampalaZones = [
  {
    zoneName: "Kampala Central",
    zoneType: "kampala_zone",
    country: "Uganda",
    city: "Kampala",
    district: "Kampala",
    subCounty: "Central Division",
    pricing: {
      baseFee: 5000,
      perKmFee: 500,
      minOrderForFreeDelivery: 100000,
    },
    estimatedDeliveryDays: 1,
    isActive: true,
    codAvailable: true,
    deliveryPartners: [
      {
        name: "SafeBoda",
        contactPhone: "+256700000001",
        priceMultiplier: 1.0,
        isActive: true,
      },
      {
        name: "Jumia Express",
        contactPhone: "+256700000002",
        priceMultiplier: 1.1,
        isActive: true,
      },
    ],
    landmarks: [
      "Old Taxi Park",
      "Nakivubo Stadium",
      "Post Office",
      "Parliament",
    ],
    coordinates: {
      type: "Point",
      coordinates: [32.5825, 0.3476],
    },
  },
  {
    zoneName: "Kawempe",
    zoneType: "kampala_zone",
    country: "Uganda",
    city: "Kampala",
    district: "Kampala",
    subCounty: "Kawempe Division",
    pricing: {
      baseFee: 6000,
      perKmFee: 600,
      minOrderForFreeDelivery: 120000,
    },
    estimatedDeliveryDays: 1,
    isActive: true,
    codAvailable: true,
    deliveryPartners: [
      {
        name: "SafeBoda",
        contactPhone: "+256700000003",
        priceMultiplier: 1.0,
        isActive: true,
      },
      {
        name: "Fraine",
        contactPhone: "+256700000004",
        priceMultiplier: 1.15,
        isActive: true,
      },
    ],
    landmarks: ["Kalerwe Market", "Makerere University", "Kawempe Hospital"],
    coordinates: {
      type: "Point",
      coordinates: [32.5669, 0.3635],
    },
  },
  {
    zoneName: "Makindye",
    zoneType: "kampala_zone",
    country: "Uganda",
    city: "Kampala",
    district: "Kampala",
    subCounty: "Makindye Division",
    pricing: {
      baseFee: 6000,
      perKmFee: 600,
      minOrderForFreeDelivery: 120000,
    },
    estimatedDeliveryDays: 1,
    isActive: true,
    codAvailable: true,
    deliveryPartners: [
      {
        name: "SafeBoda",
        contactPhone: "+256700000005",
        priceMultiplier: 1.0,
        isActive: true,
      },
      {
        name: "Tugende",
        contactPhone: "+256700000006",
        priceMultiplier: 1.1,
        isActive: true,
      },
    ],
    landmarks: ["Ggaba Road", "Tank Hill", "Kansanga", "Kabalagala"],
    coordinates: {
      type: "Point",
      coordinates: [32.6, 0.29],
    },
  },
  {
    zoneName: "Nakawa",
    zoneType: "kampala_zone",
    country: "Uganda",
    city: "Kampala",
    district: "Kampala",
    subCounty: "Nakawa Division",
    pricing: {
      baseFee: 5500,
      perKmFee: 550,
      minOrderForFreeDelivery: 110000,
    },
    estimatedDeliveryDays: 1,
    isActive: true,
    codAvailable: true,
    deliveryPartners: [
      {
        name: "SafeBoda",
        contactPhone: "+256700000007",
        priceMultiplier: 1.0,
        isActive: true,
      },
      {
        name: "Jumia Express",
        contactPhone: "+256700000008",
        priceMultiplier: 1.1,
        isActive: true,
      },
    ],
    landmarks: ["Nakawa Market", "Industrial Area", "Ntinda", "Naguru"],
    coordinates: {
      type: "Point",
      coordinates: [32.6167, 0.3333],
    },
  },
  {
    zoneName: "Rubaga",
    zoneType: "kampala_zone",
    country: "Uganda",
    city: "Kampala",
    district: "Kampala",
    subCounty: "Rubaga Division",
    pricing: {
      baseFee: 5500,
      perKmFee: 550,
      minOrderForFreeDelivery: 110000,
    },
    estimatedDeliveryDays: 1,
    isActive: true,
    codAvailable: true,
    deliveryPartners: [
      {
        name: "SafeBoda",
        contactPhone: "+256700000009",
        priceMultiplier: 1.0,
        isActive: true,
      },
      {
        name: "Fraine",
        contactPhone: "+256700000010",
        priceMultiplier: 1.15,
        isActive: true,
      },
    ],
    landmarks: ["Rubaga Cathedral", "Mengo Palace", "Namirembe Cathedral"],
    coordinates: {
      type: "Point",
      coordinates: [32.5481, 0.3051],
    },
  },
];

/**
 * Major Uganda districts
 */
const districts = [
  {
    zoneName: "Entebbe",
    zoneType: "district",
    country: "Uganda",
    city: "Entebbe",
    district: "Wakiso",
    pricing: {
      baseFee: 15000,
      perKmFee: 800,
      minOrderForFreeDelivery: 200000,
    },
    estimatedDeliveryDays: 2,
    isActive: true,
    codAvailable: true,
    deliveryPartners: [
      {
        name: "Jumia Express",
        contactPhone: "+256700000011",
        priceMultiplier: 1.2,
        isActive: true,
      },
    ],
    landmarks: ["Entebbe Airport", "Botanical Gardens"],
    coordinates: {
      type: "Point",
      coordinates: [32.4795, 0.0535],
    },
  },
  {
    zoneName: "Mukono",
    zoneType: "district",
    country: "Uganda",
    district: "Mukono",
    pricing: {
      baseFee: 10000,
      perKmFee: 700,
      minOrderForFreeDelivery: 150000,
    },
    estimatedDeliveryDays: 2,
    isActive: true,
    codAvailable: true,
    deliveryPartners: [
      {
        name: "SafeBoda",
        contactPhone: "+256700000012",
        priceMultiplier: 1.1,
        isActive: true,
      },
    ],
    landmarks: ["Mukono Town", "Uganda Christian University"],
    coordinates: {
      type: "Point",
      coordinates: [32.7553, 0.3536],
    },
  },
  {
    zoneName: "Jinja",
    zoneType: "district",
    country: "Uganda",
    city: "Jinja",
    district: "Jinja",
    pricing: {
      baseFee: 25000,
      perKmFee: 1000,
      minOrderForFreeDelivery: 300000,
    },
    estimatedDeliveryDays: 3,
    isActive: true,
    codAvailable: true,
    deliveryPartners: [
      {
        name: "Jumia Express",
        contactPhone: "+256700000013",
        priceMultiplier: 1.3,
        isActive: true,
      },
    ],
    landmarks: ["Source of the Nile", "Jinja Main Street"],
    coordinates: {
      type: "Point",
      coordinates: [33.2043, 0.4244],
    },
  },
  {
    zoneName: "Mbarara",
    zoneType: "district",
    country: "Uganda",
    city: "Mbarara",
    district: "Mbarara",
    pricing: {
      baseFee: 35000,
      perKmFee: 1200,
      minOrderForFreeDelivery: 400000,
    },
    estimatedDeliveryDays: 4,
    isActive: true,
    codAvailable: true,
    deliveryPartners: [
      {
        name: "Jumia Express",
        contactPhone: "+256700000014",
        priceMultiplier: 1.4,
        isActive: true,
      },
    ],
    landmarks: ["Mbarara University", "High Street"],
    coordinates: {
      type: "Point",
      coordinates: [30.6619, -0.6069],
    },
  },
  {
    zoneName: "Gulu",
    zoneType: "district",
    country: "Uganda",
    city: "Gulu",
    district: "Gulu",
    pricing: {
      baseFee: 40000,
      perKmFee: 1500,
      minOrderForFreeDelivery: 500000,
    },
    estimatedDeliveryDays: 5,
    isActive: true,
    codAvailable: false,
    deliveryPartners: [
      {
        name: "Jumia Express",
        contactPhone: "+256700000015",
        priceMultiplier: 1.5,
        isActive: true,
      },
    ],
    landmarks: ["Gulu Main Market", "Gulu University"],
    coordinates: {
      type: "Point",
      coordinates: [32.2989, 2.7747],
    },
  },
];

/**
 * Default commission settings
 */
const defaultCommissionSettings = {
  defaultCommissionRate: 15,
  categoryRates: [
    { category: "Electronics", rate: 10 },
    { category: "Fashion", rate: 20 },
    { category: "Home & Garden", rate: 15 },
    { category: "Sports", rate: 12 },
    { category: "Beauty", rate: 18 },
    { category: "Books", rate: 8 },
    { category: "Toys", rate: 15 },
    { category: "Automotive", rate: 12 },
    { category: "Groceries", rate: 5 },
  ],
  tierRates: {
    bronze: 15,
    silver: 12,
    gold: 10,
    platinum: 8,
  },
  paymentMethodFees: {
    mtn_momo: 2,
    airtel_money: 2,
    cod: 1,
    bank_transfer: 0.5,
  },
  deliveryZoneFees: {
    kampala_zone: 0,
    district: 1000,
    region: 2000,
  },
  minPayoutThreshold: 50000,
  platformFee: 500,
  taxRate: 18,
  currency: "UGX",
};

/**
 * Seed the database with default data
 */
async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    // Seed Commission Settings
    console.log("\nSeeding Commission Settings...");
    const existingSettings = await CommissionSettings.findOne();
    if (!existingSettings) {
      const settings = new CommissionSettings(defaultCommissionSettings);
      await settings.save();
      console.log("✓ Commission settings created");
    } else {
      console.log("✓ Commission settings already exist");
    }

    // Seed Kampala Zones
    console.log("\nSeeding Kampala Delivery Zones...");
    for (const zone of kampalaZones) {
      const existing = await DeliveryZone.findOne({
        zoneName: zone.zoneName,
        zoneType: "kampala_zone",
      });
      if (!existing) {
        const newZone = new DeliveryZone(zone);
        await newZone.save();
        console.log(`✓ Created zone: ${zone.zoneName}`);
      } else {
        console.log(`✓ Zone already exists: ${zone.zoneName}`);
      }
    }

    // Seed Districts
    console.log("\nSeeding District Delivery Zones...");
    for (const district of districts) {
      const existing = await DeliveryZone.findOne({
        zoneName: district.zoneName,
        zoneType: "district",
      });
      if (!existing) {
        const newDistrict = new DeliveryZone(district);
        await newDistrict.save();
        console.log(`✓ Created district: ${district.zoneName}`);
      } else {
        console.log(`✓ District already exists: ${district.zoneName}`);
      }
    }

    console.log("\n✅ Database seeding completed successfully!");
    console.log(`\nSummary:`);
    console.log(`- Commission Settings: 1`);
    console.log(`- Kampala Zones: ${kampalaZones.length}`);
    console.log(`- Districts: ${districts.length}`);
    console.log(
      `- Total Delivery Zones: ${kampalaZones.length + districts.length}`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    logger.error("Database seeding failed:", error);
    process.exit(1);
  }
}

// Run the seeding script
seedDatabase();
