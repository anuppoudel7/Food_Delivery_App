import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Mail, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const Register = () => {
    // Steps: register, select-method, verify-email-otp, verify-phone
    const [step, setStep] = useState('register');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'customer',
        restaurantName: '',
        cuisine: '',
        address: ''
    });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [unverifiedUser, setUnverifiedUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.unverifiedUser) {
            const { name, email, phoneNumber } = location.state.unverifiedUser;
            setFormData(prev => ({
                ...prev,
                name: name || '',
                email: email || '',
                phoneNumber: phoneNumber || ''
            }));
            // Automatically move to method selection if we have the data
            setStep('select-method');
        }
    }, [location.state]);

    // Helper to reset transient UI state
    const resetTransient = () => {
        setError('');
        setLoading(false);
        setOtp('');
    };

    // Continue verification for an existing unverified user
    const handleContinueVerification = () => {
        if (unverifiedUser) {
            setFormData(prev => ({
                ...prev,
                name: unverifiedUser.name,
                email: unverifiedUser.email,
                phoneNumber: unverifiedUser.phoneNumber
            }));
            setStep('select-method');
            setUnverifiedUser(null);
            setError('');
        }
    };

    // ---------- Registration ----------
    const handleSubmit = async e => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        setLoading(true);
        setError('');
        setUnverifiedUser(null);
        try {
            await api.post('/auth/signup', {
                name: formData.name,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                password: formData.password,
                role: formData.role,
                restaurantDetails: formData.role === 'restaurant' ? {
                    restaurantName: formData.restaurantName,
                    cuisine: [formData.cuisine],
                    address: { street: formData.address }
                } : undefined
            });
            setStep('select-method');
        } catch (err) {
            if (err.response?.status === 409 && err.response?.data?.unverified) {
                setUnverifiedUser(err.response.data.user);
                setError('Account exists but is not verified.');
            } else {
                setError(err.response?.data?.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    // ---------- Email OTP Flow ----------
    const handleSendEmailOTP = async () => {
        resetTransient();
        try {
            await api.post('/auth/send-email-otp', { email: formData.email });
            setStep('verify-email-otp');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send email OTP');
        }
    };

    const handleVerifyEmailOTP = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-email-otp', { email: formData.email, otp });
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                localStorage.removeItem('cart'); // Clear cart for new user
                window.location.href = '/';
            } else {
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    // ---------- Phone OTP Flow ----------
    const handleSendPhoneOTP = async () => {
        resetTransient();
        try {
            const formattedPhone = formData.phoneNumber.startsWith('+')
                ? formData.phoneNumber
                : `+${formData.phoneNumber}`;
            const res = await api.post('/auth/send-phone-otp', { phoneNumber: formattedPhone });
            if (res.data.mock) {
                alert('Mock OTP sent! Check backend console.');
            }
            setStep('verify-phone');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send phone OTP');
        }
    };

    const handleVerifyPhoneOTP = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formattedPhone = formData.phoneNumber.startsWith('+')
                ? formData.phoneNumber
                : `+${formData.phoneNumber}`;
            const res = await api.post('/auth/verify-phone-otp', { phoneNumber: formattedPhone, otp });
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                localStorage.removeItem('cart'); // Clear cart for new user
                window.location.href = '/';
            } else {
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    // ---------- Render ----------
    // Registration form
    if (step === 'register') {
        return (
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
                <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex flex-col gap-2 items-center">
                        <span>{error}</span>
                        {unverifiedUser && (
                            <button
                                onClick={handleContinueVerification}
                                className="bg-red-600 text-white px-4 py-1 rounded text-sm hover:bg-red-700 transition-colors font-semibold"
                            >
                                Verify Now
                            </button>
                        )}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-6 flex gap-4 justify-center">
                        <label className={`cursor-pointer px-4 py-2 rounded-full border ${formData.role === 'customer' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                            <input
                                type="radio"
                                name="role"
                                value="customer"
                                checked={formData.role === 'customer'}
                                onChange={() => setFormData({ ...formData, role: 'customer' })}
                                className="hidden"
                            />
                            Customer
                        </label>
                        <label className={`cursor-pointer px-4 py-2 rounded-full border ${formData.role === 'restaurant' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                            <input
                                type="radio"
                                name="role"
                                value="restaurant"
                                checked={formData.role === 'restaurant'}
                                onChange={() => setFormData({ ...formData, role: 'restaurant' })}
                                className="hidden"
                            />
                            Restaurant Partner
                        </label>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                        <PhoneInput
                            country="np"
                            value={formData.phoneNumber}
                            onChange={phone => setFormData({ ...formData, phoneNumber: phone })}
                            inputStyle={{ width: '100%', height: '42px' }}
                            containerClass="w-full"
                        />
                    </div>

                    {formData.role === 'restaurant' && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-bold text-gray-700 mb-3">Restaurant Details</h3>
                            <div className="mb-3">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Restaurant Name</label>
                                <input
                                    type="text"
                                    value={formData.restaurantName || ''}
                                    onChange={e => setFormData({ ...formData, restaurantName: e.target.value })}
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Cuisine Type</label>
                                <input
                                    type="text"
                                    value={formData.cuisine || ''}
                                    onChange={e => setFormData({ ...formData, cuisine: e.target.value })}
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="e.g. Nepali, Italian"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Address</label>
                                <input
                                    type="text"
                                    value={formData.address || ''}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                            minLength="6"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                            minLength="6"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-orange-600 hover:underline">Login</Link>
                </p>
            </div>
        );
    }

    // Verification method selection
    if (step === 'select-method') {
        return (
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10 text-center">
                <div className="mb-6">
                    <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Account Created!</h2>
                    <p className="text-gray-600 mt-2">Please verify your account to continue.</p>
                </div>
                <div className="space-y-4">
                    <button
                        onClick={handleSendEmailOTP}
                        className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-full group-hover:bg-white transition-colors">
                                <Mail className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-900">Verify with Email OTP</h3>
                                <p className="text-sm text-gray-500">Send a 6‑digit code to {formData.email}</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500" />
                    </button>
                    <button
                        onClick={handleSendPhoneOTP}
                        className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-green-100 p-3 rounded-full group-hover:bg-white transition-colors">
                                <Phone className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-900">Verify with Phone</h3>
                                <p className="text-sm text-gray-500">Send OTP to +{formData.phoneNumber}</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500" />
                    </button>
                </div>
            </div>
        );
    }

    // Email OTP verification UI
    if (step === 'verify-email-otp') {
        return (
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10 text-center">
                <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Enter Email OTP</h2>
                <p className="text-gray-600 mb-6">
                    We sent a 6‑digit code to <strong>{formData.email}</strong>. Please enter it below.
                </p>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
                    <input
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        className="w-full text-center text-3xl tracking-widest p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-5"
                        placeholder="000000"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>
                <div className="mt-4 space-y-2">
                    <button
                        onClick={handleSendEmailOTP}
                        disabled={loading}
                        className="text-sm text-orange-600 hover:underline"
                    >
                        Resend OTP
                    </button>
                    <button
                        onClick={() => setStep('select-method')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Choose another method
                    </button>
                </div>
            </div>
        );
    }

    // Phone OTP verification UI
    if (step === 'verify-phone') {
        return (
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10 text-center">
                <Phone className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Verify Phone Number</h2>
                <p className="text-gray-600 mb-6">
                    Enter the 6-digit code sent to <strong>+{formData.phoneNumber}</strong>
                </p>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                    <input
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        className="w-full text-center text-3xl tracking-widest p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-5"
                        placeholder="000000"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>
                <div className="mt-6 space-y-2">
                    <button
                        onClick={handleSendPhoneOTP}
                        disabled={loading}
                        className="text-sm text-orange-600 hover:underline"
                    >
                        Resend OTP
                    </button>
                    <button
                        onClick={() => setStep('select-method')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Choose another method
                    </button>
                </div>
            </div>
        );
    }

    // Fallback – should never happen
    return null;
};

export default Register;
