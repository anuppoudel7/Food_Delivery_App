# Backend - Food Delivery API

This is the backend service for the Food Delivery Application, built with Node.js, Express, and MongoDB. It handles user authentication, product management, order processing, and restaurant operations.

## 📂 Project Structure

```
backend/
├── config/             # Configuration files (DB connection, etc.)
├── controllers/        # API Controllers (Auth, etc.) - [NEW]
├── middleware/         # Custom middleware (Auth, Error handling)
├── models/             # Mongoose Data Models (User, Order, Product, Restaurant)
├── routes/             # API Route Definitions
├── services/           # Business Logic & External Services (Email, Payment)
├── utils/              # Utility functions (tokens, helpers) - [NEW]
├── scripts/            # Utility scripts (Seeding, Migrations)
├── uploads/            # Static file uploads (Images)
├── tests/              # Automated tests
├── app.js             # Express App Setup
├── server.js          # Entry point (Server startup)
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (Local or Atlas URI)

### Installation

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    - Copy `.env.example` to `.env`
    - Update the values:
        ```env
        PORT=5050
        MONGO_URI=mongodb://localhost:27017/food-delivery-mvp
        JWT_SECRET=your_secret_key
        EMAIL_USER=your_email@gmail.com
        EMAIL_PASS=your_app_password
        ```

### Running the Server

- **Development Mode** (with Nodemon):
    ```bash
    npm run dev
    ```
- **Production Mode**:
    ```bash
    npm start
    ```

## 🛠️ Key Technologies

- **Express.js**: Web framework
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication (JSON Web Tokens)
- **Nodemailer**: Email Service
- **Multer**: File Uploads

## 📡 API Endpoints

### Auth
- `POST /api/auth/signup` - User Registration
- `POST /api/auth/login` - User Login
- `POST /api/auth/forgot-password` - Request Password Reset
- `POST /api/auth/reset-password/:token` - Reset Password
- `POST /api/auth/send-phone-otp` - Send Phone OTP
- `POST /api/auth/verify-phone-otp` - Verify Phone OTP

### Public
- `GET /api/public/restaurants` - List Restaurants
- `GET /api/public/restaurants/:id` - Restaurant Details
- `GET /api/public/restaurants/:id/menu` - Restaurant Menu

### Protected (User)
- `POST /api/orders` - Place Order
- `GET /api/orders/my-orders` - User Order History
- `GET /api/users/profile` - User Profile

### Protected (Admin)
- `GET /api/admin/dashboard` - Admin Stats
- `POST /api/admin/products` - Add Product
- `PUT /api/admin/orders/:id` - Update Order Status

## 🌐 Third-Party Services Integration

This backend integrates with several external services to provide rich functionality:

### 💳 Payment Gateways
- **Khalti**: Integrated for digital wallet payments. Handles payment verification via server-to-server API.
- **eSewa**: Integrated for easy mobile payments. Supports test mode for development.

### 📧 Communications
- **Nodemailer**: Used for transactional emails (Welcome, Order Confirmation, Password Reset). Configured to work with SMTP (e.g., Gmail).
- **Twilio** (Optional): Support for SMS notifications for order updates.

## 🧪 Testing

Run unit and integration tests:
```bash
npm test
```
