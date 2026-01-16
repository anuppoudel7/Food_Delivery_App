import axios from 'axios';

const api = axios.create({
    // Use localhost for local development, or your computer's IP address for mobile testing
    baseURL: 'http://localhost:5050/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Order API
export const orderAPI = {
    create: (orderData) => api.post('/orders', orderData),
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`)
};

// Admin API
export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getCoupons: () => api.get('/coupons/all'),
    createCoupon: (data) => api.post('/coupons', data),
    updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),
    deleteCoupon: (id) => api.delete(`/coupons/${id}`)
};

export default api;
