# Ugandan E-Commerce Marketplace

## Overview

This is a specialized implementation of our e-commerce platform tailored for the Ugandan market. It transforms the system into a multi-vendor marketplace (like Jumia, Jiji, SafeBoda Market) with features specifically designed for Ugandan businesses and consumers.

## Key Features for Uganda

### 🏪 Vendor System (Core Marketplace Feature)
- Vendor registration and verification
- Vendor dashboard with sales analytics
- Product listing and management
- Order fulfillment and tracking
- Commission calculation and payout management
- Vendor tier system (bronze/silver/gold/platinum)

### 💰 Ugandan Payment Methods
- **MTN Mobile Money** (80% market share)
- **Airtel Money** (15% market share)
- **Cash on Delivery** (60% preference)
- Bank transfers (optional)

### 🚚 Location-Based Delivery
- District selector for all Ugandan districts
- Kampala zone selector (Nakawa, Kawempe, Rubaga, Makindye)
- Landmark-based addressing system
- Integration with local delivery partners

### 📱 SMS Notifications
- Order confirmation SMS
- Payment confirmation SMS
- Dispatch notifications
- Delivery ETA alerts
- OTP verification

### 🌍 Multi-Language Support
- English (default)
- Luganda (Kampala)
- Runyankole (Western Uganda)

## Implementation Status

✅ **Ready for Production**
- Vendor system fully implemented
- Mobile money integration ready (requires Flutterwave/Pesapal keys)
- SMS notifications ready (requires Africa's Talking keys)
- Delivery zones implemented
- Multi-language support added
- Vendor document upload implemented

## API Documentation

Complete API documentation is available at `/api-docs` when the server is running.

## Environment Variables

To enable payment and SMS features, add these to your `.env` file:

```bash
# Mobile Money Integration
FLUTTERWAVE_PUBLIC_KEY=your_key_here
FLUTTERWAVE_SECRET_KEY=your_key_here
PESAPAL_CONSUMER_KEY=your_key_here
PESAPAL_CONSUMER_SECRET=your_key_here

# SMS Notifications
AFRICASTALKING_API_KEY=your_key_here
AFRICASTALKING_USERNAME=your_username_here
```

## Getting Started

1. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd frontend && npm install
   ```

2. **Configure Environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

4. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

## Vendor Registration Process

1. Customer registers on the platform
2. Customer applies to become a vendor through `/vendor/register`
3. Admin reviews and approves vendor application
4. Vendor can now list products and manage orders

## Payment Flow

### Mobile Money
1. Customer selects mobile money at checkout
2. Customer enters phone number and network
3. System initiates payment request
4. Customer confirms payment on phone
5. System verifies payment and processes order

### Cash on Delivery
1. Customer selects COD at checkout
2. Order is processed and marked as paid
3. Product is delivered
4. Customer pays delivery agent in cash

## Delivery Process

1. Customer selects district during checkout
2. If in Kampala, customer selects zone
3. Customer provides landmark for precise location
4. Order is assigned to appropriate delivery partner
5. Customer receives SMS updates throughout process

## Multi-Language Support

The platform automatically detects user language preferences. Translations are available for:
- English (default)
- Luganda
- Runyankole

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Run frontend tests:
```bash
cd frontend
npm test
```

## Deployment

1. Set up MongoDB database
2. Configure environment variables
3. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```
4. Deploy backend and built frontend
5. Configure web server (nginx/Apache) for production

## Support

For issues or questions:
1. Check the API documentation at `/api-docs`
2. Review logs in the `backend/logs/` directory
3. Contact system administrator

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new features
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.