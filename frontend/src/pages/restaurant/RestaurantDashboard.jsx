import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Utensils,
    BarChart2,
    Settings,
    LogOut,
    Menu as MenuIcon,
    X,
    Bell,
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    Edit2,
    Trash2,
    Save,
    Image as ImageIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import MapPicker from '../../components/MapPicker';

const RestaurantDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [restaurantInfo, setRestaurantInfo] = useState(null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

    // Form States
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        image: '',
        categories: '',
        tags: '',
        cuisine: '',
        preparationTime: 30,
        isAvailable: true
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardRes, ordersRes, productsRes, analyticsRes] = await Promise.all([
                api.get('/restaurant/dashboard'),
                api.get('/restaurant/orders'),
                api.get('/restaurant/products'),
                api.get('/restaurant/analytics')
            ]);

            setStats(dashboardRes.data);
            setOrders(ordersRes.data);
            setProducts(productsRes.data);
            setAnalytics(analyticsRes.data);

            // Properly initialize restaurantInfo from backend data
            const info = dashboardRes.data.restaurantInfo;
            setRestaurantInfo({
                name: info?.name || '',
                description: info?.description || '',
                phone: info?.phone || '',
                address: info?.address || { street: '', city: '', area: '', coordinates: { lat: 27.7172, lng: 85.3240 } },
                cuisine: info?.cuisine || [],
                openingHours: info?.openingHours || [],
                logo: info?.logo || '',
                coverImage: info?.coverImage || ''
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            // If unauthorized, redirect to login
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            await api.put('/restaurant/profile', {
                restaurantDetails: {
                    restaurantName: restaurantInfo.name,
                    description: restaurantInfo.description,
                    phone: restaurantInfo.phone,
                    address: restaurantInfo.address,
                    cuisine: restaurantInfo.cuisine,
                    openingHours: restaurantInfo.openingHours,
                    logo: restaurantInfo.logo,
                    coverImage: restaurantInfo.coverImage
                }
            });
            alert('Profile updated successfully!');
            // Refresh data
            await fetchDashboardData();
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile: ' + (err.response?.data?.message || err.message));
        }
    };

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // --- ORDER HANDLERS ---
    const handleUpdateOrderStatus = async (orderId, status, reason = '') => {
        try {
            await api.put(`/restaurant/orders/${orderId}`, {
                restaurantStatus: status,
                rejectionReason: reason
            });

            // Refresh orders
            const res = await api.get('/restaurant/orders');
            setOrders(res.data);

            // Update stats
            const dashboardRes = await api.get('/restaurant/dashboard');
            setStats(dashboardRes.data);
        } catch (err) {
            console.error('Error updating order:', err);
            alert('Failed to update order status');
        }
    };

    // --- PRODUCT HANDLERS ---
    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            await api.post('/restaurant/products', newProduct);
            alert('Product created successfully!');
            setNewProduct({
                name: '',
                description: '',
                price: '',
                image: '',
                categories: '',
                tags: '',
                cuisine: '',
                preparationTime: 30,
                isAvailable: true
            });
            const res = await api.get('/restaurant/products');
            setProducts(res.data);
        } catch (err) {
            console.error('Error creating product:', err);
            alert('Failed to create product');
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/restaurant/products/${editingProduct._id}`, editingProduct);
            alert('Product updated successfully!');
            setEditingProduct(null);
            const res = await api.get('/restaurant/products');
            setProducts(res.data);
        } catch (err) {
            console.error('Error updating product:', err);
            alert('Failed to update product');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/restaurant/products/${id}`);
            const res = await api.get('/restaurant/products');
            setProducts(res.data);
        } catch (err) {
            console.error('Error deleting product:', err);
            alert('Failed to delete product');
        }
    };

    const toggleProductAvailability = async (product) => {
        try {
            await api.put(`/restaurant/products/${product._id}`, {
                ...product,
                isAvailable: !product.isAvailable
            });
            const res = await api.get('/restaurant/products');
            setProducts(res.data);
        } catch (err) {
            console.error('Error updating product:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xl">
                            {restaurantInfo?.name?.charAt(0) || 'R'}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800 truncate w-32">{restaurantInfo?.name}</h2>
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Online
                            </span>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <LayoutDashboard size={20} />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ShoppingBag size={20} />
                        Orders
                        {stats?.pendingOrders > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {stats.pendingOrders}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'menu' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Utensils size={20} />
                        Menu
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <BarChart2 size={20} />
                        Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Settings size={20} />
                        Settings
                    </button>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-white shadow-sm sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600">
                        <MenuIcon size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 capitalize">
                        {activeTab}
                    </h1>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                            <Bell size={20} />
                            {stats?.pendingOrders > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                        </button>
                        <div className="flex items-center gap-2">
                            <img
                                src={user.profileImage || "https://ui-avatars.com/api/?name=" + user.name}
                                alt="Profile"
                                className="w-8 h-8 rounded-full bg-gray-200"
                            />
                            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
                        </div>
                    </div>
                </header>

                <main className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">NPR {stats?.totalRevenue || 0}</h3>
                                        </div>
                                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                            <BarChart2 size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.pendingOrders || 0}</h3>
                                        </div>
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                            <Clock size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Today's Orders</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.todayOrders || 0}</h3>
                                        </div>
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <ShoppingBag size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Total Products</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalProducts || 0}</h3>
                                        </div>
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                            <Utensils size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Orders */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                                    <button onClick={() => setActiveTab('orders')} className="text-orange-600 text-sm font-medium hover:text-orange-700">View All</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {orders.slice(0, 5).map(order => (
                                                <tr key={order._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order._id.slice(-6)}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{order.userId?.name || 'Guest'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{order.items.length} items</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">NPR {order.total}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.restaurantStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            order.restaurantStatus === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                                                order.restaurantStatus === 'preparing' ? 'bg-orange-100 text-orange-800' :
                                                                    order.restaurantStatus === 'ready' ? 'bg-green-100 text-green-800' :
                                                                        'bg-red-100 text-red-800'
                                                            }`}>
                                                            {order.restaurantStatus.charAt(0).toUpperCase() + order.restaurantStatus.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {order.restaurantStatus === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateOrderStatus(order._id, 'accepted')}
                                                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                                    title="Accept"
                                                                >
                                                                    <CheckCircle size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateOrderStatus(order._id, 'rejected')}
                                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                                    title="Reject"
                                                                >
                                                                    <XCircle size={18} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h2 className="text-lg font-bold text-gray-900">All Orders</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {orders.map(order => (
                                                <tr key={order._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order._id.slice(-6)}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{order.userId?.name || 'Guest'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        <div className="flex flex-col gap-1">
                                                            {order.items.map((item, idx) => (
                                                                <span key={idx} className="text-xs">
                                                                    {item.qty}x {item.productId?.name || 'Unknown Item'}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">NPR {order.total}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.restaurantStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            order.restaurantStatus === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                                                order.restaurantStatus === 'preparing' ? 'bg-orange-100 text-orange-800' :
                                                                    order.restaurantStatus === 'ready' ? 'bg-green-100 text-green-800' :
                                                                        'bg-red-100 text-red-800'
                                                            }`}>
                                                            {order.restaurantStatus.charAt(0).toUpperCase() + order.restaurantStatus.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            {order.restaurantStatus === 'pending' && (
                                                                <>
                                                                    <button onClick={() => handleUpdateOrderStatus(order._id, 'accepted')} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Accept</button>
                                                                    <button onClick={() => handleUpdateOrderStatus(order._id, 'rejected')} className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Reject</button>
                                                                </>
                                                            )}
                                                            {order.restaurantStatus === 'accepted' && (
                                                                <button onClick={() => handleUpdateOrderStatus(order._id, 'preparing')} className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700">Start Preparing</button>
                                                            )}
                                                            {order.restaurantStatus === 'preparing' && (
                                                                <button onClick={() => handleUpdateOrderStatus(order._id, 'ready')} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Mark Ready</button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'menu' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">Menu Management</h2>
                                <button
                                    onClick={() => document.getElementById('addProductForm').scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700"
                                >
                                    <Plus size={18} /> Add Item
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map(product => (
                                    <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
                                        <div className="relative h-48">
                                            <img src={product.image || 'https://via.placeholder.com/300'} alt={product.name} className="w-full h-full object-cover" />
                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <button
                                                    onClick={() => setEditingProduct(product)}
                                                    className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-orange-600"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product._id)}
                                                    className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            {!product.isAvailable && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">Unavailable</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900">{product.name}</h3>
                                                <span className="font-bold text-orange-600">NPR {product.price}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{product.description}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{product.categories[0]}</span>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <span className="text-xs text-gray-600">Available</span>
                                                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                                        <input
                                                            type="checkbox"
                                                            checked={product.isAvailable}
                                                            onChange={() => toggleProductAvailability(product)}
                                                            className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                        />
                                                        <label className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add/Edit Form */}
                            <div id="addProductForm" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                                <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                                <input
                                                    type="text"
                                                    value={editingProduct ? editingProduct.name : newProduct.name}
                                                    onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, name: e.target.value }) : setNewProduct({ ...newProduct, name: e.target.value })}
                                                    className="w-full p-2 border rounded-lg"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR)</label>
                                                <input
                                                    type="number"
                                                    value={editingProduct ? editingProduct.price : newProduct.price}
                                                    onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, price: e.target.value }) : setNewProduct({ ...newProduct, price: e.target.value })}
                                                    className="w-full p-2 border rounded-lg"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                                                <input
                                                    type="text"
                                                    value={editingProduct ? editingProduct.cuisine : newProduct.cuisine}
                                                    onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, cuisine: e.target.value }) : setNewProduct({ ...newProduct, cuisine: e.target.value })}
                                                    className="w-full p-2 border rounded-lg"
                                                />
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
                                                    <input
                                                        type="text"
                                                        value={editingProduct ? editingProduct.image : newProduct.image}
                                                        onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, image: e.target.value }) : setNewProduct({ ...newProduct, image: e.target.value })}
                                                        className="w-full p-2 border rounded-lg"
                                                        placeholder="Image URL"
                                                    />
                                                ) : (
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, (url) => editingProduct ? setEditingProduct({ ...editingProduct, image: url }) : setNewProduct({ ...newProduct, image: url }))}
                                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Categories (comma separated)</label>
                                                <input
                                                    type="text"
                                                    value={editingProduct ? (Array.isArray(editingProduct.categories) ? editingProduct.categories.join(', ') : editingProduct.categories) : newProduct.categories}
                                                    onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, categories: e.target.value }) : setNewProduct({ ...newProduct, categories: e.target.value })}
                                                    className="w-full p-2 border rounded-lg"
                                                    placeholder="Momo, Lunch"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (mins)</label>
                                                <input
                                                    type="number"
                                                    value={editingProduct ? editingProduct.preparationTime : newProduct.preparationTime}
                                                    onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, preparationTime: e.target.value }) : setNewProduct({ ...newProduct, preparationTime: e.target.value })}
                                                    className="w-full p-2 border rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={editingProduct ? editingProduct.description : newProduct.description}
                                            onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, description: e.target.value }) : setNewProduct({ ...newProduct, description: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                            rows="3"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        {editingProduct && (
                                            <button
                                                type="button"
                                                onClick={() => setEditingProduct(null)}
                                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                                        >
                                            <Save size={18} />
                                            {editingProduct ? 'Update Product' : 'Create Product'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>

                            {/* Revenue Chart */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Overview</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics?.revenueByMonth || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="_id" tickFormatter={(val) => `Month ${val}`} />
                                            <YAxis />
                                            <Tooltip formatter={(value) => [`NPR ${value}`, 'Revenue']} />
                                            <Bar dataKey="revenue" fill="#ea580c" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900">Top Selling Products</h3>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Units Sold</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {analytics?.topProducts?.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={item._id.image || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                        <span className="font-medium text-gray-900">{item._id.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{item.totalSold}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">NPR {item.revenue}</td>
                                            </tr>
                                        ))}
                                        {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No sales data available yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="max-w-3xl">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Restaurant Settings</h2>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                                        <input
                                            type="text"
                                            value={restaurantInfo?.name || ''}
                                            onChange={(e) => setRestaurantInfo({ ...restaurantInfo, name: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={restaurantInfo?.phone || ''}
                                            onChange={(e) => setRestaurantInfo({ ...restaurantInfo, phone: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={restaurantInfo?.description || ''}
                                            onChange={(e) => setRestaurantInfo({ ...restaurantInfo, description: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                            rows="3"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Street"
                                                value={restaurantInfo?.address?.street || ''}
                                                onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: { ...restaurantInfo.address, street: e.target.value } })}
                                                className="w-full p-2 border rounded-lg"
                                            />
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={restaurantInfo?.address?.city || ''}
                                                onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: { ...restaurantInfo.address, city: e.target.value } })}
                                                className="w-full p-2 border rounded-lg"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Area"
                                                value={restaurantInfo?.address?.area || ''}
                                                onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: { ...restaurantInfo.address, area: e.target.value } })}
                                                className="w-full p-2 border rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Types (comma separated)</label>
                                        <input
                                            type="text"
                                            value={restaurantInfo?.cuisine?.join(', ') || ''}
                                            onChange={(e) => setRestaurantInfo({ ...restaurantInfo, cuisine: e.target.value.split(',').map(c => c.trim()) })}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>

                                    {/* Map Picker for Location */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Location</label>
                                        <div className="border rounded-lg overflow-hidden">
                                            <MapPicker
                                                initialCoordinates={restaurantInfo?.address?.coordinates || { lat: 27.7172, lng: 85.3240 }}
                                                onLocationSelect={(coords) => {
                                                    setRestaurantInfo({
                                                        ...restaurantInfo,
                                                        address: {
                                                            ...restaurantInfo.address,
                                                            coordinates: coords
                                                        }
                                                    });
                                                }}
                                                height="300px"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Click on the map or search for your restaurant location
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4">Opening Hours</h3>
                                    <div className="space-y-3">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                                            const daySchedule = restaurantInfo?.openingHours?.find(h => h.day === day) || { day, open: '09:00', close: '22:00', isClosed: false };
                                            return (
                                                <div key={day} className="flex items-center gap-4">
                                                    <span className="w-24 text-sm text-gray-600">{day}</span>
                                                    <input
                                                        type="time"
                                                        value={daySchedule.open}
                                                        onChange={(e) => {
                                                            const newHours = [...(restaurantInfo?.openingHours || [])];
                                                            const idx = newHours.findIndex(h => h.day === day);
                                                            if (idx >= 0) newHours[idx].open = e.target.value;
                                                            else newHours.push({ day, open: e.target.value, close: '22:00', isClosed: false });
                                                            setRestaurantInfo({ ...restaurantInfo, openingHours: newHours });
                                                        }}
                                                        className="p-1 border rounded text-sm"
                                                        disabled={daySchedule.isClosed}
                                                    />
                                                    <span className="text-gray-400">-</span>
                                                    <input
                                                        type="time"
                                                        value={daySchedule.close}
                                                        onChange={(e) => {
                                                            const newHours = [...(restaurantInfo?.openingHours || [])];
                                                            const idx = newHours.findIndex(h => h.day === day);
                                                            if (idx >= 0) newHours[idx].close = e.target.value;
                                                            else newHours.push({ day, open: '09:00', close: e.target.value, isClosed: false });
                                                            setRestaurantInfo({ ...restaurantInfo, openingHours: newHours });
                                                        }}
                                                        className="p-1 border rounded text-sm"
                                                        disabled={daySchedule.isClosed}
                                                    />
                                                    <label className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
                                                        <input
                                                            type="checkbox"
                                                            checked={daySchedule.isClosed}
                                                            onChange={(e) => {
                                                                const newHours = [...(restaurantInfo?.openingHours || [])];
                                                                const idx = newHours.findIndex(h => h.day === day);
                                                                if (idx >= 0) newHours[idx].isClosed = e.target.checked;
                                                                else newHours.push({ day, open: '09:00', close: '22:00', isClosed: e.target.checked });
                                                                setRestaurantInfo({ ...restaurantInfo, openingHours: newHours });
                                                            }}
                                                            className="rounded text-orange-600 focus:ring-orange-500"
                                                        />
                                                        Closed
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveProfile}
                                        className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default RestaurantDashboard;
