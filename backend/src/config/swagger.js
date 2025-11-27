import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Shopping Site API",
      version: "1.0.0",
      description:
        "Comprehensive API documentation for Shopping Site e-commerce platform with Stripe payment integration",
      contact: {
        name: "API Support",
        email: process.env.SUPPORT_EMAIL || "support@yourdomain.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:5000",
        description: "Development server",
      },
      {
        url: process.env.PRODUCTION_API_URL || "https://api.yourdomain.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token obtained from login endpoint",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["email", "password", "name"],
          properties: {
            _id: {
              type: "string",
              description: "User ID",
            },
            name: {
              type: "string",
              description: "User full name",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "john@example.com",
            },
            role: {
              type: "string",
              enum: ["customer", "admin", "vendor"],
              default: "customer",
              description: "User role",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Product: {
          type: "object",
          required: ["name", "price"],
          properties: {
            _id: {
              type: "string",
              description: "Product ID",
            },
            name: {
              type: "string",
              description: "Product name",
              example: "Wireless Headphones",
            },
            description: {
              type: "string",
              description: "Product description",
            },
            price: {
              type: "number",
              minimum: 0,
              description: "Product price",
              example: 99.99,
            },
            category: {
              type: "string",
              description: "Product category",
              example: "Electronics",
            },
            image: {
              type: "string",
              description: "Product image URL",
            },
            rating: {
              type: "number",
              minimum: 0,
              maximum: 5,
              description: "Average rating",
            },
            reviewCount: {
              type: "number",
              minimum: 0,
              description: "Number of reviews",
            },
            variants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sku: { type: "string" },
                  size: { type: "string" },
                  color: { type: "string" },
                  price: { type: "number" },
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Order ID",
            },
            user: {
              type: "string",
              description: "User ID",
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  quantity: { type: "number" },
                  price: { type: "number" },
                  variantId: { type: "string" },
                },
              },
            },
            subtotal: {
              type: "number",
              description: "Order subtotal",
            },
            total: {
              type: "number",
              description: "Order total",
            },
            status: {
              type: "string",
              enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
              description: "Order status",
            },
            appliedCoupon: {
              type: "object",
              properties: {
                code: { type: "string" },
                discountAmount: { type: "number" },
              },
            },
            cancellationReason: {
              type: "string",
            },
            cancelledAt: {
              type: "string",
              format: "date-time",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Review: {
          type: "object",
          required: ["product", "rating"],
          properties: {
            _id: {
              type: "string",
            },
            product: {
              type: "string",
              description: "Product ID",
            },
            user: {
              type: "string",
              description: "User ID",
            },
            rating: {
              type: "number",
              minimum: 1,
              maximum: 5,
              description: "Rating (1-5)",
            },
            comment: {
              type: "string",
              maxLength: 1000,
              description: "Review comment",
            },
            moderationStatus: {
              type: "string",
              enum: ["pending", "approved", "rejected", "flagged"],
              description: "Moderation status",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Cart: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            user: {
              type: "string",
              description: "User ID",
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  quantity: { type: "number", minimum: 1 },
                  variantId: { type: "string" },
                },
              },
            },
            appliedCoupon: {
              type: "object",
              properties: {
                code: { type: "string" },
                discountAmount: { type: "number" },
              },
            },
          },
        },
        Coupon: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            code: {
              type: "string",
              description: "Coupon code",
              example: "SAVE20",
            },
            discountType: {
              type: "string",
              enum: ["percentage", "fixed"],
            },
            discountValue: {
              type: "number",
              minimum: 0,
            },
            minOrderAmount: {
              type: "number",
              minimum: 0,
            },
            maxUses: {
              type: "number",
            },
            validFrom: {
              type: "string",
              format: "date-time",
            },
            validUntil: {
              type: "string",
              format: "date-time",
            },
            isActive: {
              type: "boolean",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  msg: { type: "string" },
                  param: { type: "string" },
                  location: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and registration",
      },
      {
        name: "Products",
        description: "Product management and browsing",
      },
      {
        name: "Cart",
        description: "Shopping cart operations",
      },
      {
        name: "Orders",
        description: "Order management and checkout",
      },
      {
        name: "Reviews",
        description: "Product reviews and moderation",
      },
      {
        name: "Coupons",
        description: "Coupon management",
      },
      {
        name: "Inventory",
        description: "Inventory and stock management",
      },
      {
        name: "Analytics",
        description: "Sales and business analytics",
      },
      {
        name: "Admin",
        description: "Administrative operations",
      },
    ],
  },
  apis: [
    "./src/routes/*.js",
    "./src/index.js",
    "./src/docs/swagger-annotations.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
