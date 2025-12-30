// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, Store, Package, TrendingUp, DollarSign, Ticket } from 'lucide-react';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data.stats);
      setRecentOrders(response.data.recentOrders);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Revenue', value: `$${stats?.totalRevenue.toFixed(2) || 0}`, icon: DollarSign, color: 'bg-green-500' },
    { title: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'bg-blue-500' },
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-purple-500' },
    { title: 'Restaurants', value: stats?.totalRestaurants || 0, icon: Store, color: 'bg-orange-500' },
    { title: 'Products', value: stats?.totalProducts || 0, icon: Package, color: 'bg-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your food delivery platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/admin/restaurants" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <Store className="w-8 h-8 text-primary-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Manage Restaurants</h3>
            <p className="text-gray-600 text-sm">Add, edit, or remove restaurants</p>
          </Link>
          <Link to="/admin/products" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <Package className="w-8 h-8 text-primary-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Manage Products</h3>
            <p className="text-gray-600 text-sm">Update menu items and pricing</p>
          </Link>
          <Link to="/admin/orders" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <ShoppingBag className="w-8 h-8 text-primary-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Manage Orders</h3>
            <p className="text-gray-600 text-sm">Track and update order status</p>
          </Link>

          <Link to="/admin/coupons" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <Ticket className="w-8 h-8 text-primary-500 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Manage Coupons</h3>
            <p className="text-gray-600 text-sm">Create and track discounts</p>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">
                      {order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4">{order.userId?.name || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold">${order.total.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div >
  );
};

export default AdminDashboard;