import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { LayoutDashboard, Package, ShoppingBag, Plus, Trash2, TrendingUp, DollarSign, Users, Edit2, CheckCircle, XCircle, X, Save, Store, Tag, Search, Filter, Calendar, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [productFilters, setProductFilters] = useState({
        restaurant: 'all',
        category: 'all',
        search: ''
    });

    const [orderFilters, setOrderFilters] = useState({
        restaurant: 'all',
        status: 'all',
        search: ''
    });

    // Edit State
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    // Form State
    const [newProduct, setNewProduct] = useState({
        name: '',
        restaurantId: 'res_nepal_1',
        description: '',
        price: '',
        image: '',
        categories: '',
        tags: '',
        cuisine: ''
    });

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        isAdmin: false
    });

    const [newRestaurant, setNewRestaurant] = useState({
        name: '',
        email: '',
        password: '',
        restaurantName: '',
        address: '',
        cuisine: '',
        phone: ''
    });

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discountPercent: '',
        minOrderAmount: '',
        validTo: '',
        maxDiscount: ''
    });

    const [editingCoupon, setEditingCoupon] = useState(null);
    const [editingRestaurant, setEditingRestaurant] = useState(null); // Edit State for Restaurant

    const [imageMethod, setImageMethod] = useState('url'); // 'url' or 'upload'

    const handleFileUpload = async (e, callback) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            callback(res.data.imageUrl);
        } catch (err) {
            alert('Upload failed');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const results = await Promise.allSettled([
                api.get('/products'),
                api.get('/admin/orders'),
                api.get('/admin/users'),
                api.get('/admin/stats'),
                api.get('/admin/restaurants'),
                api.get('/coupons/all')
            ]);

            const [prodRes, orderRes, userRes, statsRes, restRes, couponRes] = results;

            if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data);
            else console.error('Products fetch failed:', prodRes.reason);

            if (orderRes.status === 'fulfilled') setOrders(orderRes.value.data);
            else console.error('Orders fetch failed:', orderRes.reason);

            if (userRes.status === 'fulfilled') setUsers(userRes.value.data);
            else console.error('Users fetch failed:', userRes.reason);

            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            else console.error('Stats fetch failed:', statsRes.reason);

            if (restRes.status === 'fulfilled') setRestaurants(restRes.value.data);
            else console.error('Restaurants fetch failed:', restRes.reason);

            if (couponRes.status === 'fulfilled') setCoupons(couponRes.value.data);
            else console.error('Coupons fetch failed:', couponRes.reason);

        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Create restaurant mapping for display
    const restaurantMap = useMemo(() => {
        const map = {};
        restaurants.forEach(r => {
            const name = r.restaurantDetails?.restaurantName || r.restaurantName;
            if (name) {
                map[r._id] = name;
            }
        });
        return map;
    }, [restaurants]);

    // Get unique categories from products
    const categories = useMemo(() => {
        const cats = new Set();
        products.forEach(p => {
            if (Array.isArray(p.categories)) {
                p.categories.forEach(cat => cats.add(cat));
            }
        });
        return Array.from(cats).sort();
    }, [products]);

    // Filtered Products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            // Restaurant filter
            if (productFilters.restaurant !== 'all' && p.restaurantId !== productFilters.restaurant) {
                return false;
            }
            // Category filter
            if (productFilters.category !== 'all') {
                if (!Array.isArray(p.categories) || !p.categories.includes(productFilters.category)) {
                    return false;
                }
            }
            // Search filter
            if (productFilters.search) {
                const searchLower = productFilters.search.toLowerCase();
                return p.name.toLowerCase().includes(searchLower) ||
                    (p.description && p.description.toLowerCase().includes(searchLower));
            }
            return true;
        });
    }, [products, productFilters]);

    // Filtered Orders
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            // Restaurant filter
            if (orderFilters.restaurant !== 'all' && o.restaurantId !== orderFilters.restaurant) {
                return false;
            }
            // Status filter
            if (orderFilters.status !== 'all' && o.status !== orderFilters.status) {
                return false;
            }
            // Search filter
            if (orderFilters.search) {
                const searchLower = orderFilters.search.toLowerCase();
                const orderId = o._id.slice(-6).toLowerCase();
                const userName = (o.userId?.name || '').toLowerCase();
                return orderId.includes(searchLower) || userName.includes(searchLower);
            }
            return true;
        });
    }, [orders, orderFilters]);

    // Analytics
    const revenueByRestaurant = useMemo(() => {
        const revenue = {};
        orders.forEach(order => {
            const restName = restaurantMap[order.restaurantId] || 'Unknown';
            revenue[restName] = (revenue[restName] || 0) + order.total;
        });
        return Object.entries(revenue).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
    }, [orders, restaurantMap]);

    const topProducts = useMemo(() => {
        const productCounts = {};
        orders.forEach(order => {
            order.items?.forEach(item => {
                const productId = item.productId?._id || item.productId;
                if (!productCounts[productId]) {
                    const product = products.find(p => p._id === productId);
                    if (product) {
                        productCounts[productId] = { name: product.name, count: 0, revenue: 0 };
                    }
                }
                if (productCounts[productId]) {
                    productCounts[productId].count += item.qty || 1;
                    productCounts[productId].revenue += (item.price || 0) * (item.qty || 1);
                }
            });
        });
        return Object.values(productCounts).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [orders, products]);

    // Stats - must be calculated before avgOrderValue
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, currentPage, itemsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

    // Expandable Orders
    const [expandedOrders, setExpandedOrders] = useState(new Set());

    const toggleOrderExpansion = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    // Export Functions
    const exportToCSV = (data, filename) => {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const exportProducts = () => {
        const exportData = filteredProducts.map(p => ({
            Name: p.name,
            Restaurant: restaurantMap[p.restaurantId] || 'Unknown',
            Price: p.price,
            Category: p.cuisine,
            Categories: Array.isArray(p.categories) ? p.categories.join('; ') : '',
            Tags: Array.isArray(p.tags) ? p.tags.join('; ') : ''
        }));
        exportToCSV(exportData, 'products');
    };

    const exportOrders = () => {
        const exportData = filteredOrders.map(o => ({
            OrderID: o._id.slice(-6),
            Customer: o.userId?.name || 'Unknown',
            Restaurant: restaurantMap[o.restaurantId] || 'Unknown',
            Total: o.total,
            Status: o.status,
            Date: new Date(o.createdAt).toLocaleDateString()
        }));
        exportToCSV(exportData, 'orders');
    };

    // --- PRODUCT HANDLERS ---
    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newProduct,
                categories: newProduct.categories.split(',').map(s => s.trim()),
                tags: newProduct.tags.split(',').map(s => s.trim()),
                price: Number(newProduct.price)
            };
            await api.post('/admin/products', payload);
            alert('Product Created!');
            setNewProduct({ name: '', restaurantId: 'res_nepal_1', description: '', price: '', image: '', categories: '', tags: '', cuisine: '' });
            fetchData();
        } catch (err) {
            alert('Error creating product');
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...editingProduct,
                categories: typeof editingProduct.categories === 'string' ? editingProduct.categories.split(',') : editingProduct.categories,
                tags: typeof editingProduct.tags === 'string' ? editingProduct.tags.split(',') : editingProduct.tags,
                price: Number(editingProduct.price)
            };
            await api.put(`/admin/products/${editingProduct._id}`, payload);
            alert('Product Updated!');
            setEditingProduct(null);
            fetchData();
        } catch (err) {
            alert('Error updating product');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/admin/products/${id}`);
            fetchData();
        } catch (err) {
            alert('Error deleting product');
        }
    };

    // --- ORDER HANDLERS ---
    const handleUpdateOrderStatus = async (id, status) => {
        try {
            await api.put(`/admin/orders/${id}`, { status });
            fetchData();
        } catch (err) {
            alert('Error updating order');
        }
    };

    // --- USER HANDLERS ---
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', newUser);
            alert('User Created!');
            setNewUser({ name: '', email: '', password: '', isAdmin: false });
            fetchData();
        } catch (err) {
            alert('Error creating user');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${editingUser._id}`, editingUser);
            alert('User Updated!');
            setEditingUser(null);
            fetchData();
        } catch (err) {
            alert('Error updating user');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            fetchData();
        } catch (err) {
            alert('Error deleting user');
        }
    };

    // --- RESTAURANT HANDLERS ---
    const handleApproveRestaurant = async (id) => {
        try {
            await api.put(`/admin/restaurants/${id}/approve`);
            fetchData();
        } catch (err) {
            alert('Error approving restaurant');
        }
    };

    const handleToggleRestaurantStatus = async (id) => {
        try {
            await api.put(`/admin/restaurants/${id}/toggle-status`);
            fetchData();
        } catch (err) {
            alert('Error updating restaurant status');
        }
    };

    const handleCreateRestaurant = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/restaurants', newRestaurant);
            alert('Restaurant Created!');
            setNewRestaurant({
                name: '',
                email: '',
                password: '',
                restaurantName: '',
                address: '',
                cuisine: '',
                phone: ''
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating restaurant');
        }
    };

    const handleUpdateRestaurant = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/restaurants/${editingRestaurant._id}`, editingRestaurant);
            alert('Restaurant Updated!');
            setEditingRestaurant(null);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating restaurant');
        }
    };

    const handleDeleteRestaurant = async (id) => {
        if (!window.confirm('Are you sure you want to delete this restaurant? This cannot be undone.')) return;
        try {
            await api.delete(`/admin/restaurants/${id}`);
            alert('Restaurant Deleted Successfully');
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting restaurant');
        }
    };

    // --- COUPON HANDLERS ---
    const handleUpdateCoupon = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/coupons/${editingCoupon._id}`, editingCoupon);
            alert('Coupon Updated!');
            setEditingCoupon(null);
            fetchData();
        } catch (err) {
            alert('Error updating coupon');
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            await api.post('/coupons', newCoupon);
            alert('Coupon Created!');
            setNewCoupon({ code: '', description: '', discountPercent: '', minOrderAmount: '', validTo: '', maxDiscount: '' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating coupon');
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/coupons/${id}`);
            fetchData();
        } catch (err) {
            alert('Error deleting coupon');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="flex min-h-screen bg-gray-50 -m-4 sm:-m-6 lg:-m-8">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 hidden md:block fixed h-full">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <LayoutDashboard className="text-orange-600" />
                        Admin Panel
                    </h2>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Package className="w-5 h-5" />
                        Products
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Users className="w-5 h-5" />
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('restaurants')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'restaurants' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Store className="w-5 h-5" />
                        Restaurants
                    </button>
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'coupons' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Tag className="w-5 h-5" />
                        Coupons
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 ml-64 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                                    <div className="p-2 bg-green-50 rounded-full text-green-600">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">NPR {totalRevenue.toLocaleString()}</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
                                    <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                                    <div className="p-2 bg-purple-50 rounded-full text-purple-600">
                                        <Users className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                            </div>
                        </div>

                        {/* New Analytics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-500 text-sm font-medium">Avg Order Value</h3>
                                    <div className="p-2 bg-orange-50 rounded-full text-orange-600">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">NPR {avgOrderValue.toLocaleString()}</p>
                            </div>

                            <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Restaurant</h3>
                                <div className="space-y-3">
                                    {revenueByRestaurant.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-orange-600' : idx === 1 ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
                                                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">NPR {item.total.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling Products</h3>
                            <div className="space-y-3">
                                {topProducts.length === 0 ? (
                                    <p className="text-sm text-gray-500">No product data available</p>
                                ) : (
                                    topProducts.map((product, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                                    <p className="text-xs text-gray-500">{product.count} orders</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">NPR {product.revenue.toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Income Graph */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Income</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="income" fill="#ea580c" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
                            <div className="flex gap-2">
                                <button
                                    onClick={exportProducts}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                                >
                                    <Package className="w-4 h-4" /> Export CSV
                                </button>
                                <button
                                    onClick={() => document.getElementById('addProductForm').scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
                                >
                                    <Plus className="w-4 h-4" /> Add Product
                                </button>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Filters</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Restaurant Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Restaurant</label>
                                    <select
                                        value={productFilters.restaurant}
                                        onChange={(e) => setProductFilters({ ...productFilters, restaurant: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="all">All Restaurants</option>
                                        {restaurants.map(r => (
                                            <option key={r._id} value={r._id}>
                                                {r.restaurantDetails?.restaurantName || 'Unnamed'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                                    <select
                                        value={productFilters.category}
                                        onChange={(e) => setProductFilters({ ...productFilters, category: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Search */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={productFilters.search}
                                            onChange={(e) => setProductFilters({ ...productFilters, search: e.target.value })}
                                            placeholder="Search by product name..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {(productFilters.restaurant !== 'all' || productFilters.category !== 'all' || productFilters.search) && (
                                <button
                                    onClick={() => setProductFilters({ restaurant: 'all', category: 'all', search: '' })}
                                    className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>

                        {/* Results Count */}
                        <div className="text-sm text-gray-600">
                            Showing {filteredProducts.length} of {products.length} products
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Restaurant</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                No products found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedProducts.map(p => (
                                            <tr key={p._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                    <span className="font-medium text-gray-900">{p.name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    <span className="text-sm">{restaurantMap[p.restaurantId] || 'Unknown'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">NPR {p.price}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">{p.cuisine}</span>
                                                </td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => setEditingProduct(p)} className="text-blue-500 hover:text-blue-700">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteProduct(p._id)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {filteredProducts.length > 10 && (
                            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Show</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <span className="text-sm text-gray-600">per page</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Edit Product Modal */}
                        {editingProduct && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
                                        <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleUpdateProduct} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left Column */}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                                    <input
                                                        type="text"
                                                        value={editingProduct.name}
                                                        onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="Product Name"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
                                                    <input
                                                        type="number"
                                                        value={editingProduct.price}
                                                        onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="Price"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                                                    <input
                                                        type="text"
                                                        value={editingProduct.cuisine || ''}
                                                        onChange={e => setEditingProduct({ ...editingProduct, cuisine: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="e.g., Nepalese, Chinese"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
                                                    <select
                                                        value={editingProduct.restaurantId ? (typeof editingProduct.restaurantId === 'object' ? editingProduct.restaurantId._id : editingProduct.restaurantId) : ''}
                                                        onChange={e => setEditingProduct({ ...editingProduct, restaurantId: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        required
                                                    >
                                                        <option value="">Select Restaurant</option>
                                                        {restaurants.map(r => (
                                                            <option key={r._id} value={r._id}>
                                                                {r.restaurantDetails?.restaurantName || 'Unnamed'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                                                    <input
                                                        type="number"
                                                        value={editingProduct.stock || 100}
                                                        onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="Stock"
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image Source</label>
                                                    <div className="flex gap-4 mb-2">
                                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                            <input type="radio" checked={imageMethod === 'url'} onChange={() => setImageMethod('url')} className="text-orange-600 focus:ring-orange-500" />
                                                            <span>URL</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                            <input type="radio" checked={imageMethod === 'upload'} onChange={() => setImageMethod('upload')} className="text-orange-600 focus:ring-orange-500" />
                                                            <span>Upload</span>
                                                        </label>
                                                    </div>
                                                    {imageMethod === 'url' ? (
                                                        <input
                                                            type="text"
                                                            value={editingProduct.image || ''}
                                                            onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="https://..."
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleFileUpload(e, (url) => setEditingProduct({ ...editingProduct, image: url }))}
                                                                className="block w-full text-sm text-gray-500
                                                                    file:mr-4 file:py-2 file:px-4
                                                                    file:rounded-full file:border-0
                                                                    file:text-sm file:font-semibold
                                                                    file:bg-orange-50 file:text-orange-700
                                                                    hover:file:bg-orange-100"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categories (comma separated)</label>
                                                    <input
                                                        type="text"
                                                        value={Array.isArray(editingProduct.categories) ? editingProduct.categories.join(', ') : editingProduct.categories || ''}
                                                        onChange={e => setEditingProduct({ ...editingProduct, categories: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="Momo, Lunch, Dinner"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                                    <input
                                                        type="text"
                                                        value={Array.isArray(editingProduct.tags) ? editingProduct.tags.join(', ') : editingProduct.tags || ''}
                                                        onChange={e => setEditingProduct({ ...editingProduct, tags: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="spicy, hot, vegetarian"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                    <textarea
                                                        value={editingProduct.description || ''}
                                                        onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="Product description"
                                                        rows="4"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t">
                                            <button
                                                type="button"
                                                onClick={() => setEditingProduct(null)}
                                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                Update Product
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div id="addProductForm" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Product</h2>
                            <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ... same form as before ... */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant</label>
                                        <select
                                            value={newProduct.restaurantId}
                                            onChange={e => setNewProduct({ ...newProduct, restaurantId: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                            required
                                        >
                                            <option value="">Select Restaurant</option>
                                            {restaurants.map(r => (
                                                <option key={r._id} value={r._id}>
                                                    {r.restaurantDetails?.restaurantName || 'Unnamed'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full p-2 border rounded-lg" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full p-2 border rounded-lg" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
                                            <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full p-2 border rounded-lg" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                                            <input type="text" value={newProduct.cuisine} onChange={e => setNewProduct({ ...newProduct, cuisine: e.target.value })} className="w-full p-2 border rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Image Source</label>
                                        <div className="flex gap-4 mb-2">
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input type="radio" checked={imageMethod === 'url'} onChange={() => setImageMethod('url')} className="text-orange-600 focus:ring-orange-500" />
                                                <span>URL</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input type="radio" checked={imageMethod === 'upload'} onChange={() => setImageMethod('upload')} className="text-orange-600 focus:ring-orange-500" />
                                                <span>Upload</span>
                                            </label>
                                        </div>
                                        {imageMethod === 'url' ? (
                                            <input type="text" value={newProduct.image} onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} className="w-full p-2 border rounded-lg" placeholder="Image URL" />
                                        ) : (
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, (url) => setNewProduct({ ...newProduct, image: url }))}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Categories (comma sep)</label>
                                        <input type="text" value={newProduct.categories} onChange={e => setNewProduct({ ...newProduct, categories: e.target.value })} className="w-full p-2 border rounded-lg" placeholder="Momo, Lunch" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma sep)</label>
                                        <input type="text" value={newProduct.tags} onChange={e => setNewProduct({ ...newProduct, tags: e.target.value })} className="w-full p-2 border rounded-lg" placeholder="spicy, hot" />
                                    </div>
                                    <button type="submit" className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700 mt-2">
                                        Create Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                            <button
                                onClick={exportOrders}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                            >
                                <ShoppingBag className="w-4 h-4" /> Export CSV
                            </button>
                        </div>

                        {/* Filter Bar */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Filters</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Restaurant Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Restaurant</label>
                                    <select
                                        value={orderFilters.restaurant}
                                        onChange={(e) => setOrderFilters({ ...orderFilters, restaurant: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="all">All Restaurants</option>
                                        {restaurants.map(r => (
                                            <option key={r._id} value={r._id}>
                                                {r.restaurantDetails?.restaurantName || 'Unnamed'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                                    <select
                                        value={orderFilters.status}
                                        onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="preparing">Preparing</option>
                                        <option value="out_for_delivery">Out for Delivery</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Search */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={orderFilters.search}
                                            onChange={(e) => setOrderFilters({ ...orderFilters, search: e.target.value })}
                                            placeholder="Search by Order ID or customer name..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {(orderFilters.restaurant !== 'all' || orderFilters.status !== 'all' || orderFilters.search) && (
                                <button
                                    onClick={() => setOrderFilters({ restaurant: 'all', status: 'all', search: '' })}
                                    className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>

                        {/* Results Count */}
                        <div className="text-sm text-gray-600">
                            Showing {filteredOrders.length} of {orders.length} orders
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Restaurant</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                No orders found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map(order => (
                                            <React.Fragment key={order._id}>
                                                <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleOrderExpansion(order._id)}>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-2">
                                                            <span>{expandedOrders.has(order._id) ? '▼' : '▶'}</span>
                                                            #{order._id.slice(-6)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.userId?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {order.restaurantId?.restaurantName || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">NPR {order.total}</td>
                                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                                            className={`px-2 py-1 rounded-full text-xs font-medium border-none focus:ring-0 cursor-pointer ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="preparing">Preparing</option>
                                                            <option value="out_for_delivery">Out for Delivery</option>
                                                            <option value="delivered">Delivered</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={() => handleUpdateOrderStatus(order._id, 'delivered')} className="text-green-600 hover:text-green-800" title="Mark Delivered">
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')} className="text-red-600 hover:text-red-800" title="Cancel Order">
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedOrders.has(order._id) && (
                                                    <tr className="bg-gray-50">
                                                        <td colSpan="6" className="px-6 py-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                {/* Order Items */}
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                                                                    <div className="space-y-2">
                                                                        {order.items && order.items.length > 0 ? (
                                                                            order.items.map((item, idx) => (
                                                                                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded">
                                                                                    <span className="text-gray-700">
                                                                                        {item.productId?.name || 'Unknown Product'} x {item.qty || 1}
                                                                                    </span>
                                                                                    <span className="font-medium text-gray-900">
                                                                                        NPR {(item.price || 0) * (item.qty || 1)}
                                                                                    </span>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <p className="text-gray-500">No items</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Delivery Info */}
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 mb-2">Delivery Information</h4>
                                                                    <div className="bg-white p-3 rounded space-y-1">
                                                                        <p className="text-gray-700">
                                                                            <span className="font-medium">Address:</span> {
                                                                                order.deliveryAddress ? (
                                                                                    typeof order.deliveryAddress === 'string'
                                                                                        ? order.deliveryAddress
                                                                                        : `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.area || ''}, ${order.deliveryAddress.city || ''}`
                                                                                ) : 'Not provided'
                                                                            }
                                                                        </p>
                                                                        <p className="text-gray-700">
                                                                            <span className="font-medium">Payment:</span> {order.paymentMethod || 'N/A'}
                                                                        </p>
                                                                        <p className="text-gray-700">
                                                                            <span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                            <button
                                onClick={() => document.getElementById('addUserForm').scrollIntoView({ behavior: 'smooth' })}
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
                            >
                                <Plus className="w-4 h-4" /> Add User
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {u.isAdmin ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button onClick={() => setEditingUser(u)} className="text-blue-500 hover:text-blue-700">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Edit User Modal */}
                        {editingUser && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-bold">Edit User</h2>
                                        <button onClick={() => setEditingUser(null)}><X className="w-6 h-6" /></button>
                                    </div>
                                    <form onSubmit={handleUpdateUser} className="space-y-4">
                                        <input type="text" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full p-2 border rounded" placeholder="Name" />
                                        <input type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full p-2 border rounded" placeholder="Email" />
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={editingUser.isAdmin} onChange={e => setEditingUser({ ...editingUser, isAdmin: e.target.checked })} className="rounded text-orange-600 focus:ring-orange-500" />
                                            <label className="text-sm font-medium text-gray-700">Is Admin?</label>
                                        </div>
                                        <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700">Update User</button>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div id="addUserForm" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8 max-w-2xl">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New User</h2>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                {/* ... same form as before ... */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full p-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full p-2 border rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full p-2 border rounded-lg" required />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={newUser.isAdmin} onChange={e => setNewUser({ ...newUser, isAdmin: e.target.checked })} className="rounded text-orange-600 focus:ring-orange-500" />
                                    <label className="text-sm font-medium text-gray-700">Is Admin?</label>
                                </div>
                                <button type="submit" className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700">
                                    Create User
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'restaurants' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
                            <button
                                onClick={() => document.getElementById('addRestaurantForm').scrollIntoView({ behavior: 'smooth' })}
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
                            >
                                <Plus className="w-4 h-4" /> Add Restaurant
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Restaurant</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Approval</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {restaurants.map(r => (
                                        <tr key={r._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                                        {r.restaurantDetails?.restaurantName?.[0] || 'R'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{r.restaurantDetails?.restaurantName || 'Unnamed'}</div>
                                                        <div className="text-xs text-gray-500">{r.restaurantDetails?.address?.city || 'No Address'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{r.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.restaurantDetails?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {r.restaurantDetails?.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.restaurantDetails?.isApproved ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {r.restaurantDetails?.isApproved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                {!r.restaurantDetails?.isApproved && (
                                                    <button
                                                        onClick={() => handleApproveRestaurant(r._id)}
                                                        className="text-green-600 hover:text-green-800 bg-green-50 p-2 rounded-lg"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setEditingRestaurant({
                                                        _id: r._id,
                                                        name: r.name,
                                                        email: r.email,
                                                        restaurantName: r.restaurantDetails?.restaurantName,
                                                        phone: r.restaurantDetails?.phone,
                                                        cuisine: Array.isArray(r.restaurantDetails?.cuisine) ? r.restaurantDetails.cuisine.join(', ') : '',
                                                        address: r.restaurantDetails?.address?.city || ''
                                                    })}
                                                    className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleRestaurantStatus(r._id)}
                                                    className={`p-2 rounded-lg ${r.restaurantDetails?.isActive ? 'text-red-600 hover:text-red-800 bg-red-50' : 'text-green-600 hover:text-green-800 bg-green-50'}`}
                                                    title={r.restaurantDetails?.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {r.restaurantDetails?.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRestaurant(r._id)}
                                                    className="p-2 rounded-lg text-red-600 hover:text-red-800 bg-red-50"
                                                    title="Delete Restaurant"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Edit Restaurant Modal */}
                        {editingRestaurant && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Edit Restaurant</h2>
                                        <button onClick={() => setEditingRestaurant(null)} className="text-gray-400 hover:text-gray-600">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleUpdateRestaurant} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                                                <input
                                                    type="text"
                                                    value={editingRestaurant.name || ''}
                                                    onChange={e => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    value={editingRestaurant.email || ''}
                                                    onChange={e => setEditingRestaurant({ ...editingRestaurant, email: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                                                <input
                                                    type="text"
                                                    value={editingRestaurant.restaurantName || ''}
                                                    onChange={e => setEditingRestaurant({ ...editingRestaurant, restaurantName: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                                <input
                                                    type="text"
                                                    value={editingRestaurant.phone || ''}
                                                    onChange={e => setEditingRestaurant({ ...editingRestaurant, phone: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine (comma separated)</label>
                                                <input
                                                    type="text"
                                                    value={editingRestaurant.cuisine || ''}
                                                    onChange={e => setEditingRestaurant({ ...editingRestaurant, cuisine: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Address (City)</label>
                                                <input
                                                    type="text"
                                                    value={editingRestaurant.address || ''}
                                                    onChange={e => setEditingRestaurant({ ...editingRestaurant, address: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t">
                                            <button
                                                type="button"
                                                onClick={() => setEditingRestaurant(null)}
                                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 bg-orange-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-orange-700"
                                            >
                                                Update Restaurant
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Create Restaurant Form */}
                        <div id="addRestaurantForm" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Restaurant</h2>
                            <form onSubmit={handleCreateRestaurant} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                                        <input
                                            type="text"
                                            value={newRestaurant.name}
                                            onChange={e => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
                                        <input
                                            type="email"
                                            value={newRestaurant.email}
                                            onChange={e => setNewRestaurant({ ...newRestaurant, email: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <input
                                            type="password"
                                            value={newRestaurant.password}
                                            onChange={e => setNewRestaurant({ ...newRestaurant, password: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                                        <input
                                            type="text"
                                            value={newRestaurant.restaurantName}
                                            onChange={e => setNewRestaurant({ ...newRestaurant, restaurantName: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="text"
                                            value={newRestaurant.phone}
                                            onChange={e => setNewRestaurant({ ...newRestaurant, phone: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine (comma separated)</label>
                                        <input
                                            type="text"
                                            value={newRestaurant.cuisine}
                                            onChange={e => setNewRestaurant({ ...newRestaurant, cuisine: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address (City)</label>
                                        <input
                                            type="text"
                                            value={newRestaurant.address}
                                            onChange={e => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700"
                                >
                                    Create Restaurant
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'coupons' && (
                    <div className="space-y-6">
                        <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>

                        {/* Coupon List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Code</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Discount</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Min Order</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Expires</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {coupons.map(c => (
                                        <tr key={c._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono font-bold text-orange-600">{c.code}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{c.discountPercent}%</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">NPR {c.minOrderAmount}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(c.validTo).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {c.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button onClick={() => setEditingCoupon(c)} className="text-blue-500 hover:text-blue-700">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteCoupon(c._id)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Edit Coupon Modal */}
                        {editingCoupon && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-bold">Edit Coupon</h2>
                                        <button onClick={() => setEditingCoupon(null)}><X className="w-6 h-6" /></button>
                                    </div>
                                    <form onSubmit={handleUpdateCoupon} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                                <input
                                                    type="text"
                                                    value={editingCoupon.code}
                                                    onChange={e => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                                                    className="w-full p-2 border rounded uppercase"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                                                <input
                                                    type="number"
                                                    value={editingCoupon.discountPercent}
                                                    onChange={e => setEditingCoupon({ ...editingCoupon, discountPercent: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <input
                                                type="text"
                                                value={editingCoupon.description}
                                                onChange={e => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                                                className="w-full p-2 border rounded"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order</label>
                                                <input
                                                    type="number"
                                                    value={editingCoupon.minOrderAmount || ''}
                                                    onChange={e => setEditingCoupon({ ...editingCoupon, minOrderAmount: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                                <input
                                                    type="date"
                                                    value={editingCoupon.validTo ? new Date(editingCoupon.validTo).toISOString().split('T')[0] : ''}
                                                    onChange={e => setEditingCoupon({ ...editingCoupon, validTo: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button type="button" onClick={() => setEditingCoupon(null)} className="flex-1 px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                                            <button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700">Update</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Create Coupon Form */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8 max-w-2xl">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Coupon</h2>
                            <form onSubmit={handleCreateCoupon} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                                        <input type="text" value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} className="w-full p-2 border rounded-lg uppercase" placeholder="SAVE20" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                                        <input type="number" value={newCoupon.discountPercent} onChange={e => setNewCoupon({ ...newCoupon, discountPercent: e.target.value })} className="w-full p-2 border rounded-lg" placeholder="20" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input type="text" value={newCoupon.description} onChange={e => setNewCoupon({ ...newCoupon, description: e.target.value })} className="w-full p-2 border rounded-lg" placeholder="20% off on all orders" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                                        <input type="number" value={newCoupon.minOrderAmount} onChange={e => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })} className="w-full p-2 border rounded-lg" placeholder="500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                                        <input type="date" value={newCoupon.validTo} onChange={e => setNewCoupon({ ...newCoupon, validTo: e.target.value })} className="w-full p-2 border rounded-lg" required />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700">
                                    Create Coupon
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default AdminDashboard;
