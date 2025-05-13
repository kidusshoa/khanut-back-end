# Khanut Backend API

A robust RESTful API service for the Khanut platform - a local business finder and management system built with Express.js, TypeScript, and MongoDB.

## Overview

Khanut Backend provides the API endpoints that power the Khanut platform, connecting customers with local businesses and services in Ethiopia. This service handles authentication, business management, customer interactions, payments, and more.

## Features

### Authentication & User Management

- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Business Owner, Customer)
- Two-factor authentication for enhanced security
- Password reset functionality
- Email verification

### Business Management

- Business registration and profile management
- Service and product listings
- Inventory management
- Staff management
- Business analytics and reporting

### Customer Experience

- Business discovery and search
- Favorites and bookmarking
- Ratings and reviews
- Personalized recommendations
- Order and appointment management

### Payment Processing

- Secure payment integration with Chapa (Ethiopian payment gateway)
- Support for multiple payment methods
- Transaction history and receipts
- Payment verification and callbacks

### Appointment System

- Appointment scheduling and management
- Recurring appointments
- Availability management
- Appointment reminders

### File Management

- Image uploads for businesses, services, and users
- Backblaze B2 integration for file storage
- Support for multiple file uploads

### Notifications

- Real-time notifications for users and businesses
- Email notifications for important events
- System announcements

### Admin Dashboard

- User management
- Business approval workflow
- Content moderation
- System settings

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Chapa** - Payment gateway
- **Backblaze B2** - File storage
- **Swagger** - API documentation
- **Winston** - Logging
- **Node-cron** - Scheduled tasks

## API Endpoints

The API is organized into the following main categories:

- `/api/auth` - Authentication endpoints
- `/api/admin` - Admin management endpoints
- `/api/businesses` - Business management endpoints
- `/api/customer` - Customer-specific endpoints
- `/api/services` - Service management endpoints
- `/api/appointments` - Appointment scheduling endpoints
- `/api/orders` - Order management endpoints
- `/api/payments` - Payment processing endpoints
- `/api/reviews` - Review management endpoints
- `/api/search` - Search functionality endpoints
- `/api/upload` - File upload endpoints
- `/api/notifications` - Notification endpoints
- `/api/staff` - Staff management endpoints
- `/api/analytics` - Business analytics endpoints
- `/api/inventory` - Inventory management endpoints

Full API documentation is available at `/api-docs` when the server is running.

## Getting Started

### Prerequisites

- Node.js 16+
- MongoDB 4.4+
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/kidusshoa/khanut-back-end.git
cd khanut-back-end
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:

```
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/khanut
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRES_IN=30d

# Chapa Payment Gateway
CHAPA_SECRET_KEY=your_chapa_secret_key
CHAPA_PUBLIC_KEY=your_chapa_public_key
CHAPA_WEBHOOK_SECRET=your_chapa_webhook_secret
CHAPA_CALLBACK_URL=http://localhost:4000/api/payments/callback
CHAPA_RETURN_URL=http://localhost:3000/payment/success

# File Storage (Backblaze B2)
B2_KEY_ID=your_b2_key_id
B2_APP_KEY=your_b2_app_key
B2_BUCKET_NAME=your_b2_bucket_name
B2_BUCKET_URL=your_b2_bucket_url

# Email
RESEND_API_KEY=your_resend_api_key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Recommendation Service
RECOMMENDATION_SERVICE_URL=http://localhost:5000
ENABLE_RECOMMENDATION_SYNC=true
```

4. Start the development server

```bash
npm run dev
# or
yarn dev
```

The server will be running at http://localhost:4000

### Building for Production

```bash
npm run build
# or
yarn build
```

### Running in Production

```bash
npm start
# or
yarn start
```

## Related Services

- [Khanut Frontend](https://github.com/kidusshoa/khanut-front-end) - Next.js frontend application
- [Recommendation Service](https://github.com/kidusshoa/recommendation-service) - Python-based recommendation engine

## API Documentation

Swagger documentation is available at `/api-docs` when the server is running. This provides a comprehensive and interactive documentation of all available endpoints.

## Database Schema

The application uses MongoDB with Mongoose for data modeling. Key models include:

- User - Customer, business owner, and admin accounts
- Business - Business profiles and details
- Service - Products and services offered by businesses
- Appointment - Customer appointments with businesses
- Order - Customer orders for products
- Payment - Payment records and transactions
- Review - Customer reviews of businesses and services

## Authentication Flow

1. User registers with email, password, and role
2. User receives a verification code via email
3. User verifies email with the code
4. User logs in with email and password
5. System returns JWT access token and refresh token
6. Access token is used for API requests
7. Refresh token is used to obtain a new access token when expired

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Integration with Recommendation Service

The backend integrates with a separate Python-based recommendation service that provides personalized business recommendations to users. The recommendation service uses a hybrid approach combining collaborative filtering and content-based methods.

Key integration points:

- Scheduled synchronization of user activity data
- API endpoints for fetching personalized recommendations
- Webhook support for real-time updates

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Two-factor authentication
- Token blacklisting for logout
- Input validation and sanitization
- Rate limiting for sensitive endpoints

## Deployment

The application is configured for deployment on platforms like Render, Heroku, or any Node.js hosting service. The production build process optimizes the application for performance and security.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
