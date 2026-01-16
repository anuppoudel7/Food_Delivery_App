const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5050'
        ].filter(Boolean);

        if (allowedOrigins.indexOf(origin) === -1) {
            // For development, we can be lenient or strictly log it
            // console.log('Blocked Origin:', origin);
            // return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
            // RELAXING FOR DEV:
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(helmet({
    crossOriginResourcePolicy: false, // Allow loading images from different origins (or same origin but different port in dev)
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Increased for debugging
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(express.json());
app.use(morgan('dev'));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/receipts', require('./routes/receipts'));
app.use('/api/restaurant', require('./routes/restaurant'));
app.use('/api/public', require('./routes/public'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/upload', require('./routes/upload'));

// Health Check
app.get('/', (req, res) => {
    res.send('Food Delivery API is running...');
});

module.exports = app;
