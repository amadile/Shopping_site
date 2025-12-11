import axios from "axios";
import { logger } from "../config/logger.js";
import Order from "../models/Order.js";
import emailService from "./emailService.js";

/**
 * Shipping Tracking Service
 * Integrates with FedEx, UPS, DHL, and USPS tracking APIs
 * Provides mock data when API keys are not configured
 */

class TrackingService {
  constructor() {
    // Carrier API configurations (loaded from environment variables)
    this.carriers = {
      fedex: {
        enabled: !!process.env.FEDEX_API_KEY,
        apiKey: process.env.FEDEX_API_KEY,
        apiSecret: process.env.FEDEX_API_SECRET,
        baseUrl: "https://apis.fedex.com/track/v1/trackingnumbers",
        trackingUrl: "https://www.fedex.com/fedextrack/?tracknumbers=",
      },
      ups: {
        enabled: !!process.env.UPS_ACCESS_KEY,
        accessKey: process.env.UPS_ACCESS_KEY,
        username: process.env.UPS_USERNAME,
        password: process.env.UPS_PASSWORD,
        baseUrl: "https://onlinetools.ups.com/track/v1/details/",
        trackingUrl: "https://www.ups.com/track?tracknum=",
      },
      dhl: {
        enabled: !!process.env.DHL_API_KEY,
        apiKey: process.env.DHL_API_KEY,
        baseUrl: "https://api-eu.dhl.com/track/shipments",
        trackingUrl: "https://www.dhl.com/en/express/tracking.html?AWB=",
      },
      usps: {
        enabled: !!process.env.USPS_USER_ID,
        userId: process.env.USPS_USER_ID,
        baseUrl: "https://secure.shippingapis.com/ShippingAPI.dll",
        trackingUrl: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
      },
      other: {
        enabled: true,
        trackingUrl: "", // Generic carrier
      },
    };
  }

  /**
   * Update order with tracking information
   */
  async updateOrderTracking(orderId, trackingData, adminUser) {
    try {
      const order = await Order.findById(orderId).populate("user");

      if (!order) {
        throw new Error("Order not found");
      }

      // Validate tracking data
      if (!trackingData.trackingNumber) {
        throw new Error("Tracking number is required");
      }

      if (!trackingData.carrier) {
        throw new Error("Carrier is required");
      }

      // Build tracking URL
      const carrier =
        this.carriers[trackingData.carrier] || this.carriers.other;
      const trackingUrl =
        trackingData.trackingUrl ||
        (carrier.trackingUrl
          ? `${carrier.trackingUrl}${trackingData.trackingNumber}`
          : "");

      // Update order tracking information
      order.tracking = {
        trackingNumber: trackingData.trackingNumber,
        carrier: trackingData.carrier,
        trackingUrl: trackingUrl,
        estimatedDelivery: trackingData.estimatedDelivery || null,
        history: [
          {
            timestamp: new Date(),
            status: "Shipped",
            location: trackingData.origin || "Warehouse",
            description: `Package shipped via ${trackingData.carrier.toUpperCase()}`,
            carrier: trackingData.carrier,
          },
        ],
        lastUpdated: new Date(),
      };

      // Update order status to shipped if not already
      if (order.status !== "shipped" && order.status !== "delivered") {
        order.status = "shipped";
      }

      await order.save();

      logger.info(
        `Tracking information added to order ${orderId}: ${trackingData.trackingNumber}`
      );

      // Send email notification to customer
      await emailService.sendOrderStatusUpdate(order.user, order);

      // Fetch initial tracking data if API is available
      if (carrier.enabled && trackingData.fetchTracking !== false) {
        this.fetchTrackingUpdates(
          orderId,
          trackingData.trackingNumber,
          trackingData.carrier
        ).catch((err) => {
          logger.error("Failed to fetch initial tracking data:", err);
        });
      }

      return {
        success: true,
        order: order,
        message: "Tracking information added successfully",
      };
    } catch (err) {
      logger.error("Update order tracking error:", err);
      throw err;
    }
  }

  /**
   * Fetch tracking updates from carrier API
   */
  async fetchTrackingUpdates(orderId, trackingNumber, carrier) {
    try {
      const carrierConfig = this.carriers[carrier];

      if (!carrierConfig || !carrierConfig.enabled) {
        logger.warn(
          `Carrier ${carrier} API not configured. Using mock tracking data.`
        );
        return await this.getMockTrackingData(orderId, trackingNumber, carrier);
      }

      let trackingData;

      switch (carrier) {
        case "fedex":
          trackingData = await this.fetchFedExTracking(trackingNumber);
          break;
        case "ups":
          trackingData = await this.fetchUPSTracking(trackingNumber);
          break;
        case "dhl":
          trackingData = await this.fetchDHLTracking(trackingNumber);
          break;
        case "usps":
          trackingData = await this.fetchUSPSTracking(trackingNumber);
          break;
        default:
          trackingData = await this.getMockTrackingData(
            orderId,
            trackingNumber,
            carrier
          );
      }

      // Update order with new tracking data
      await this.updateTrackingHistory(orderId, trackingData);

      return trackingData;
    } catch (err) {
      logger.error("Fetch tracking updates error:", err);
      // Fall back to mock data on error
      return await this.getMockTrackingData(orderId, trackingNumber, carrier);
    }
  }

  /**
   * FedEx Tracking API Integration
   */
  async fetchFedExTracking(trackingNumber) {
    try {
      const config = this.carriers.fedex;

      // Get OAuth token first
      const tokenResponse = await axios.post(
        "https://apis.fedex.com/oauth/token",
        "grant_type=client_credentials&client_id=" +
        config.apiKey +
        "&client_secret=" +
        config.apiSecret,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Fetch tracking data
      const response = await axios.post(
        config.baseUrl,
        {
          trackingInfo: [
            {
              trackingNumberInfo: {
                trackingNumber: trackingNumber,
              },
            },
          ],
          includeDetailedScans: true,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Parse FedEx response
      const trackingInfo = response.data.output?.completeTrackResults?.[0];
      return this.parseFedExResponse(trackingInfo);
    } catch (err) {
      logger.error("FedEx API error:", err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * UPS Tracking API Integration
   */
  async fetchUPSTracking(trackingNumber) {
    try {
      const config = this.carriers.ups;

      const response = await axios.get(`${config.baseUrl}${trackingNumber}`, {
        headers: {
          AccessLicenseNumber: config.accessKey,
          Username: config.username,
          Password: config.password,
        },
        params: {
          locale: "en_US",
          returnSignature: "false",
        },
      });

      // Parse UPS response
      return this.parseUPSResponse(response.data);
    } catch (err) {
      logger.error("UPS API error:", err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * DHL Tracking API Integration
   */
  async fetchDHLTracking(trackingNumber) {
    try {
      const config = this.carriers.dhl;

      const response = await axios.get(config.baseUrl, {
        headers: {
          "DHL-API-Key": config.apiKey,
        },
        params: {
          trackingNumber: trackingNumber,
        },
      });

      // Parse DHL response
      return this.parseDHLResponse(response.data);
    } catch (err) {
      logger.error("DHL API error:", err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * USPS Tracking API Integration
   */
  async fetchUSPSTracking(trackingNumber) {
    try {
      const config = this.carriers.usps;

      const xmlRequest = `
        <TrackFieldRequest USERID="${config.userId}">
          <TrackID ID="${trackingNumber}"></TrackID>
        </TrackFieldRequest>
      `;

      const response = await axios.get(config.baseUrl, {
        params: {
          API: "TrackV2",
          XML: xmlRequest,
        },
      });

      // Parse USPS XML response
      return this.parseUSPSResponse(response.data);
    } catch (err) {
      logger.error("USPS API error:", err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * Parse carrier API responses
   */
  parseFedExResponse(data) {
    // Parse FedEx-specific response format
    const events =
      data?.trackResults?.[0]?.scanEvents?.map((event) => ({
        timestamp: new Date(event.date),
        status: event.eventDescription,
        location: `${event.scanLocation?.city || ""}, ${event.scanLocation?.stateOrProvinceCode || ""
          }`,
        description: event.eventDescription,
        carrier: "fedex",
      })) || [];

    return {
      events: events,
      estimatedDelivery:
        data?.trackResults?.[0]?.estimatedDeliveryTimeWindow?.window?.ends,
      currentStatus: data?.trackResults?.[0]?.latestStatusDetail?.description,
    };
  }

  parseUPSResponse(data) {
    // Parse UPS-specific response format
    const events =
      data?.trackResponse?.shipment?.[0]?.package?.[0]?.activity?.map(
        (activity) => ({
          timestamp: new Date(activity.date),
          status: activity.status?.description,
          location: `${activity.location?.address?.city || ""}, ${activity.location?.address?.stateProvinceCode || ""
            }`,
          description: activity.status?.description,
          carrier: "ups",
        })
      ) || [];

    return {
      events: events,
      estimatedDelivery:
        data?.trackResponse?.shipment?.[0]?.package?.[0]?.deliveryDate?.[0]
          ?.date,
      currentStatus:
        data?.trackResponse?.shipment?.[0]?.package?.[0]?.currentStatus
          ?.description,
    };
  }

  parseDHLResponse(data) {
    // Parse DHL-specific response format
    const events =
      data?.shipments?.[0]?.events?.map((event) => ({
        timestamp: new Date(event.timestamp),
        status: event.statusCode,
        location: `${event.location?.address?.addressLocality || ""}`,
        description: event.description,
        carrier: "dhl",
      })) || [];

    return {
      events: events,
      estimatedDelivery: data?.shipments?.[0]?.estimatedTimeOfDelivery,
      currentStatus: data?.shipments?.[0]?.status?.statusCode,
    };
  }

  parseUSPSResponse(xmlData) {
    // Parse USPS XML response (simplified - would need XML parser in production)
    // For now, return mock data structure
    return {
      events: [],
      estimatedDelivery: null,
      currentStatus: "In Transit",
    };
  }

  /**
   * Update order tracking history
   */
  async updateTrackingHistory(orderId, trackingData) {
    try {
      const order = await Order.findById(orderId);

      if (!order || !order.tracking) {
        logger.warn(`Order ${orderId} not found or has no tracking info`);
        return;
      }

      // Add new events to tracking history (avoid duplicates)
      const existingTimestamps = new Set(
        order.tracking.history.map((h) => h.timestamp.getTime())
      );

      const newEvents = trackingData.events.filter(
        (event) => !existingTimestamps.has(new Date(event.timestamp).getTime())
      );

      if (newEvents.length > 0) {
        order.tracking.history.push(...newEvents);
        order.tracking.lastUpdated = new Date();

        // Update estimated delivery if provided
        if (trackingData.estimatedDelivery) {
          order.tracking.estimatedDelivery = new Date(
            trackingData.estimatedDelivery
          );
        }

        // Check if delivered
        if (
          trackingData.currentStatus?.toLowerCase().includes("delivered") &&
          order.status !== "delivered"
        ) {
          order.status = "delivered";
          order.tracking.actualDelivery = new Date();

          // Send delivery notification
          const user = await order.populate("user");
          await emailService.sendOrderStatusUpdate(user.user, order);
        }

        await order.save();

        logger.info(
          `Added ${newEvents.length} tracking events to order ${orderId}`
        );
      }
    } catch (err) {
      logger.error("Update tracking history error:", err);
      throw err;
    }
  }

  /**
   * Get mock tracking data (used when carrier APIs not configured)
   */
  async getMockTrackingData(orderId, trackingNumber, carrier) {
    logger.info(
      `Generating mock tracking data for ${carrier}: ${trackingNumber}`
    );

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return {
      events: [
        {
          timestamp: twoDaysAgo,
          status: "Label Created",
          location: "Warehouse, CA",
          description: "Shipping label created",
          carrier: carrier,
        },
        {
          timestamp: yesterday,
          status: "Picked Up",
          location: "Distribution Center, CA",
          description: "Package picked up by carrier",
          carrier: carrier,
        },
        {
          timestamp: now,
          status: "In Transit",
          location: "Sorting Facility, NV",
          description: "Package in transit to destination",
          carrier: carrier,
        },
      ],
      estimatedDelivery: threeDaysFromNow,
      currentStatus: "In Transit",
    };
  }

  /**
   * Get tracking information for an order
   */
  async getOrderTracking(orderId) {
    try {
      const order = await Order.findById(orderId).select("tracking status");

      if (!order) {
        throw new Error("Order not found");
      }

      if (!order.tracking || !order.tracking.trackingNumber) {
        return {
          hasTracking: false,
          message: "No tracking information available for this order",
        };
      }

      return {
        hasTracking: true,
        tracking: order.tracking,
        status: order.status,
      };
    } catch (err) {
      logger.error("Get order tracking error:", err);
      throw err;
    }
  }

  /**
   * Refresh tracking data from carrier API
   */
  async refreshTracking(orderId) {
    try {
      const order = await Order.findById(orderId);

      if (!order || !order.tracking || !order.tracking.trackingNumber) {
        throw new Error("Order has no tracking information");
      }

      const trackingData = await this.fetchTrackingUpdates(
        orderId,
        order.tracking.trackingNumber,
        order.tracking.carrier
      );

      return {
        success: true,
        tracking: order.tracking,
        message: "Tracking information refreshed",
      };
    } catch (err) {
      logger.error("Refresh tracking error:", err);
      throw err;
    }
  }

  /**
   * Get carrier configuration status
   */
  getCarrierStatus() {
    return Object.entries(this.carriers).map(([name, config]) => ({
      carrier: name,
      enabled: config.enabled,
      configured: config.enabled,
    }));
  }
}

export default new TrackingService();
