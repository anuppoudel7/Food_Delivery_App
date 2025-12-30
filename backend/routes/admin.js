const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Middleware to check admin
const adminAuth = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// --- PRODUCT ROUTES ---

// POST /api/admin/products
router.post('/products', auth, adminAuth, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// PUT /api/admin/products/:id
router.put('/products/:id', auth, adminAuth, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', auth, adminAuth, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// GET /api/admin/stats - Income Graph Data
router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const orders = await Order.find({ status: { $ne: 'cancelled' } });

        // Group by month
        const monthlyData = {};
        orders.forEach(order => {
            const month = new Date(order.createdAt).toLocaleString('default', { month: 'short' });
            monthlyData[month] = (monthlyData[month] || 0) + order.total;
        });

        const graphData = Object.keys(monthlyData).map(key => ({
            name: key,
            income: monthlyData[key]
        }));

        res.json(graphData);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// --- ORDER ROUTES ---

// GET /api/admin/orders - Get ALL orders
router.get('/orders', auth, adminAuth, async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'name email')
            .populate('restaurantId', 'restaurantName address')
            .populate('items.productId', 'name price');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// PUT /api/admin/orders/:id - Update Order Status
router.put('/orders/:id', auth, adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// --- USER ROUTES ---

// GET /api/admin/users - Get ALL users
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// POST /api/admin/users - Create User (Admin)
router.post('/users', auth, adminAuth, async (req, res) => {
    try {
        const { name, email, password, isAdmin } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            passwordHash,
            isAdmin: isAdmin || false
        });

        await user.save();
        res.status(201).json({ message: 'User created successfully', user: { id: user._id, name, email, isAdmin } });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// PUT /api/admin/users/:id - Update User
router.put('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, email, isAdmin } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, isAdmin },
            { new: true }
        ).select('-passwordHash');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// --- RESTAURANT ROUTES ---

// GET /api/admin/restaurants - Get all restaurants
router.get('/restaurants', auth, adminAuth, async (req, res) => {
    try {
        const restaurants = await User.find({ role: 'restaurant' })
            .select('-passwordHash')
            .sort({ createdAt: -1 });
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// PUT /api/admin/restaurants/:id/approve - Approve restaurant
router.put('/restaurants/:id/approve', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'restaurant') {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        user.restaurantDetails.isApproved = true;
        user.restaurantDetails.isActive = true;
        await user.save();

        // Sync with Restaurant collection
        let restaurant = await Restaurant.findOne({ userId: user._id });
        if (restaurant) {
            restaurant.isApproved = true;
            restaurant.isActive = true;
            await restaurant.save();
        } else {
            // Create if missing
            await Restaurant.create({
                userId: user._id,
                restaurantName: user.restaurantDetails.restaurantName,
                address: user.restaurantDetails.address,
                phone: user.restaurantDetails.phone,
                cuisine: user.restaurantDetails.cuisine,
                isApproved: true,
                isActive: true
            });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// PUT /api/admin/restaurants/:id/toggle-status - Toggle active status
router.put('/restaurants/:id/toggle-status', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'restaurant') {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        user.restaurantDetails.isActive = !user.restaurantDetails.isActive;
        await user.save();

        // Sync with Restaurant collection
        let restaurant = await Restaurant.findOne({ userId: user._id });
        if (restaurant) {
            restaurant.isActive = user.restaurantDetails.isActive;
            await restaurant.save();
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// POST /api/admin/restaurants - Create Restaurant User (Admin)
router.post('/restaurants', auth, adminAuth, async (req, res) => {
    try {
        const { name, email, password, restaurantName, address, cuisine, phone } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newRestaurantDetails = {
            restaurantName: restaurantName || `${name}'s Restaurant`,
            address: {
                city: address || 'Kathmandu',
                street: '',
                area: '',
                coordinates: { lat: 27.7172, lng: 85.3240 }
            },
            cuisine: cuisine ? cuisine.split(',').map(c => c.trim()) : [],
            phone: phone || '',
            isActive: true,
            isApproved: true // Admin created restaurants are auto-approved
        };

        user = new User({
            name,
            email,
            passwordHash,
            role: 'restaurant',
            restaurantDetails: newRestaurantDetails
        });

        await user.save();

        // Create Restaurant Document
        await Restaurant.create({
            userId: user._id,
            restaurantName: newRestaurantDetails.restaurantName,
            address: newRestaurantDetails.address,
            phone: newRestaurantDetails.phone,
            cuisine: newRestaurantDetails.cuisine,
            isActive: true, // Default to true for admin created
            isApproved: true // Default to true for admin created
        });

        res.status(201).json({ message: 'Restaurant created successfully', user });
    } catch (err) {
        console.error('Create Restaurant Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// PUT /api/admin/restaurants/:id - Update Restaurant
router.put('/restaurants/:id', auth, adminAuth, async (req, res) => {
    try {
        const { restaurantName, address, cuisine, phone, email, name } = req.body;

        // Find user by ID (params.id is userId for admin management usually)
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Restaurant User not found' });

        // Update User Model
        if (name) user.name = name;
        if (email) user.email = email;

        await user.save();

        // Sync with Restaurant Collection
        let restaurant = await Restaurant.findOne({ userId: user._id });
        if (restaurant) {
            if (restaurantName) restaurant.restaurantName = restaurantName;
            if (address) {
                if (typeof address === 'string') {
                    restaurant.address.city = address;
                } else {
                    restaurant.address = { ...restaurant.address, ...address };
                }
            }
            if (cuisine) restaurant.cuisine = user.restaurantDetails.cuisine;
            if (phone) restaurant.phone = phone;
            if (email) restaurant.email = email; // Optional if Restaurant model has email
            await restaurant.save();
        } else {
            // Create if missing (self-healing)
            await Restaurant.create({
                userId: user._id,
                restaurantName: user.restaurantDetails.restaurantName,
                address: user.restaurantDetails.address,
                phone: user.restaurantDetails.phone,
                cuisine: user.restaurantDetails.cuisine,
                isActive: user.restaurantDetails.isActive,
                isApproved: user.restaurantDetails.isApproved
            });
        }

        res.json(user);
    } catch (err) {
        console.error('Update Restaurant Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// DELETE /api/admin/restaurants/:id - Delete Restaurant
router.delete('/restaurants/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Delete from Restaurant collection
        await Restaurant.findOneAndDelete({ userId: user._id });

        // Delete Products associated? (Optional, but good cleanup)
        // For now, let's keep products but maybe orphan them or cascading delete is better.
        // Let's delete them to check cleanliness. 
        // await Product.deleteMany({ restaurantId: user._id }); // Assuming product has restaurantId ref to User or Restaurant?
        // Checking Product model... restaurantId is Ref to 'Restaurant' usually, but waiting for confirmation.
        // Based on logic above, we should find the Restaurant doc _id first if we were to delete products.
        // Simplicity: Just delete User and Restaurant doc.

        // Delete User
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'Restaurant deleted successfully' });
    } catch (err) {
        console.error('Delete Restaurant Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});


// DELETE /api/admin/users/:id - Delete User
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
