const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

// GET /api/public/restaurants - List all restaurants
router.get('/restaurants', async (req, res) => {
    try {
        const { cuisine, search } = req.query;
        const filter = {
            isActive: true,
            isApproved: true
        };

        if (cuisine) {
            filter.cuisine = { $in: [new RegExp(cuisine, 'i')] };
        }

        if (search) {
            filter.restaurantName = { $regex: search, $options: 'i' };
        }

        const restaurants = await Restaurant.find(filter)
            .populate('userId', 'name email')
            .sort({ rating: -1 });

        console.log('Public Restaurants Debug:');
        console.log('Filter:', JSON.stringify(filter));
        console.log('Found Count:', restaurants.length);
        if (restaurants.length > 0) {
            console.log('Sample Restaurant:', JSON.stringify(restaurants[0], null, 2));
        } else {
            console.log('No restaurants found matching filter');
            // Double check total count in DB
            const total = await Restaurant.countDocuments();
            console.log('Total Restaurants is DB Collection:', total);
        }

        // Transform to match expected frontend structure
        const transformedRestaurants = restaurants.map(r => ({
            _id: r._id,
            name: r.userId?.name,
            email: r.userId?.email,
            restaurantDetails: {
                restaurantName: r.restaurantName,
                description: r.description,
                logo: r.logo,
                coverImage: r.coverImage,
                cuisine: r.cuisine,
                address: r.address,
                phone: r.phone,
                rating: r.rating,
                totalReviews: r.totalReviews,
                isActive: r.isActive,
                isApproved: r.isApproved
            }
        }));

        res.json(transformedRestaurants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/public/restaurants/:id - Get restaurant details
router.get('/restaurants/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id)
            .populate('userId', 'name email');

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Transform to match expected frontend structure
        const transformedRestaurant = {
            _id: restaurant._id,
            name: restaurant.userId?.name,
            email: restaurant.userId?.email,
            restaurantDetails: {
                restaurantName: restaurant.restaurantName,
                description: restaurant.description,
                logo: restaurant.logo,
                coverImage: restaurant.coverImage,
                cuisine: restaurant.cuisine,
                address: restaurant.address,
                phone: restaurant.phone,
                email: restaurant.email,
                openingHours: restaurant.openingHours,
                rating: restaurant.rating,
                totalReviews: restaurant.totalReviews,
                isActive: restaurant.isActive,
                isApproved: restaurant.isApproved
            }
        };

        res.json(transformedRestaurant);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/public/restaurants/:id/menu - Get restaurant menu
router.get('/restaurants/:id/menu', async (req, res) => {
    try {
        const products = await Product.find({
            restaurantId: req.params.id,
            isAvailable: true
        }).sort({ category: 1, name: 1 });

        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/public/restaurants/:id/reviews - Get restaurant reviews (from orders)
router.get('/restaurants/:id/reviews', async (req, res) => {
    try {
        // This is a placeholder. In a real app, you'd have a Review model.
        // For now, we can't easily get reviews without a Review model.
        // We'll return an empty array or implement a Review model later.
        res.json([]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
