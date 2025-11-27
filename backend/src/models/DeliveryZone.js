import mongoose from "mongoose";

const deliveryZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["kampala_zone", "district", "region"],
      required: true,
    },
    // For Kampala zones
    zone: {
      type: String,
      // Kampala zones: Nakawa, Kawempe, Rubaga, Makindye, Central
    },
    // For districts outside Kampala
    district: {
      type: String,
    },
    // For regional grouping
    region: {
      type: String,
      enum: ["central", "eastern", "northern", "western"],
    },
    // Delivery pricing
    pricing: {
      baseFee: {
        type: Number,
        required: true,
        default: 5000, // 5,000 UGX base fee
      },
      perKmFee: {
        type: Number,
        default: 1000, // 1,000 UGX per km
      },
      minOrderForFreeDelivery: {
        type: Number,
        default: 100000, // 100,000 UGX for free delivery
      },
    },
    // Estimated delivery time
    estimatedDeliveryDays: {
      min: {
        type: Number,
        default: 1,
      },
      max: {
        type: Number,
        default: 3,
      },
    },
    // Available delivery partners
    availablePartners: [
      {
        type: String,
        enum: [
          "safeboda",
          "jumia_express",
          "fraine",
          "tugende",
          "customer_pickup",
          "other",
        ],
      },
    ],
    // Coordinates for map-based features
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    // Zone boundaries (polygon for mapping)
    boundaries: [
      {
        latitude: Number,
        longitude: Number,
      },
    ],
    // Popular landmarks in this zone
    landmarks: [
      {
        name: String,
        description: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
    ],
    // Delivery coverage status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Special instructions for delivery in this zone
    specialInstructions: {
      type: String,
    },
    // COD availability
    codAvailable: {
      type: Boolean,
      default: true,
    },
    // Minimum order amount for this zone
    minOrderAmount: {
      type: Number,
      default: 10000, // 10,000 UGX
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
deliveryZoneSchema.index({ name: 1 });
deliveryZoneSchema.index({ type: 1, isActive: 1 });
deliveryZoneSchema.index({ zone: 1 });
deliveryZoneSchema.index({ district: 1 });
deliveryZoneSchema.index({ region: 1 });
deliveryZoneSchema.index({
  "coordinates.latitude": 1,
  "coordinates.longitude": 1,
});

// Static method to get all Kampala zones
deliveryZoneSchema.statics.getKampalaZones = function () {
  return this.find({ type: "kampala_zone", isActive: true }).sort({ name: 1 });
};

// Static method to get all districts
deliveryZoneSchema.statics.getAllDistricts = function () {
  return this.find({ type: "district", isActive: true }).sort({ district: 1 });
};

// Static method to get delivery fee for a zone
deliveryZoneSchema.statics.getDeliveryFee = async function (
  zoneName,
  orderAmount,
  distance = null
) {
  const zone = await this.findOne({ name: zoneName, isActive: true });

  if (!zone) {
    return {
      baseFee: 5000,
      totalFee: 5000,
      freeDelivery: false,
    };
  }

  // Check if order qualifies for free delivery
  if (orderAmount >= zone.pricing.minOrderForFreeDelivery) {
    return {
      baseFee: 0,
      totalFee: 0,
      freeDelivery: true,
    };
  }

  let totalFee = zone.pricing.baseFee;

  // Add distance-based fee if provided
  if (distance && zone.pricing.perKmFee) {
    totalFee += distance * zone.pricing.perKmFee;
  }

  return {
    baseFee: zone.pricing.baseFee,
    distanceFee: distance ? distance * zone.pricing.perKmFee : 0,
    totalFee,
    freeDelivery: false,
  };
};

// Static method to find zone by coordinates
deliveryZoneSchema.statics.findZoneByCoordinates = async function (
  latitude,
  longitude
) {
  // This would require geospatial queries in production
  // For now, return null and implement proper geospatial logic later
  return null;
};

// Method to check if delivery is available
deliveryZoneSchema.methods.isDeliveryAvailable = function (orderAmount) {
  if (!this.isActive) {
    return {
      available: false,
      reason: "Delivery not available in this zone",
    };
  }

  if (orderAmount < this.minOrderAmount) {
    return {
      available: false,
      reason: `Minimum order amount is ${this.minOrderAmount} UGX`,
    };
  }

  return {
    available: true,
    estimatedDays: `${this.estimatedDeliveryDays.min}-${this.estimatedDeliveryDays.max} days`,
  };
};

const DeliveryZone = mongoose.model("DeliveryZone", deliveryZoneSchema);

export default DeliveryZone;
