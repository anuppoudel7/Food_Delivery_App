# Frontend - Food Delivery App

This is the client-side application for the Food Delivery platform, built with React, Vite, and Tailwind CSS. It provides interfaces for Customers, Restaurant Owners, and System Admins.

## 📂 Project Structure

```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI Components (Cards, Buttons, Modals)
│   ├── context/        # React Context (Auth, Cart State)
│   ├── pages/          # Application Pages (Home, Menu, Admin Dashboard)
│   ├── services/       # API Integration & Axios Configuration
│   ├── App.jsx         # Main Application Component & Routing
│   └── main.jsx        # Entry point
└── index.html          # HTML Template
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- Backend server running on port 5050 (default)

### Installation

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    - Ensure `src/services/api.js` points to your backend URL (default: `http://localhost:5050/api`)

### Running the App

- **Development Mode**:
    ```bash
    npm run dev
    ```
    Access at `http://localhost:5173`

- **Build for Production**:
    ```bash
    npm run build
    ```

## 🛠️ Key Technologies

- **React**: UI Library
- **Vite**: Build Tool
- **Tailwind CSS**: Styling
- **React Router**: Navigation
- **Axios**: API Requests
- **Recharts**: Admin Dashboard Charts
- **Lucide React**: Icons

## 🗺️ Integrations & Features

- **Leaflet Maps**: Integrated interactive maps for:
    - User address selection during checkout.
    - Restaurant location display.
- **Payment SDKs**:
    - **Khalti**: Integrated checkout workflow.
    - **eSewa**: Integrated form submission for payments.

## 📱 Features

- **User**: Browse Restaurants, View Menus, Add to Cart, Place Orders, Track History.
- **Admin**: Dashboard with Sales Charts, Manage Products, Users, and Order Status.
- **Responsive**: Fully responsive design for mobile and desktop.
