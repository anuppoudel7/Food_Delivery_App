import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverifiedData, setUnverifiedData] = useState(null); // Store unverified user data
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(email, password);
      // Check role from response or decoded token (login function might need to return user data)
      // Assuming login returns the response data or we can get it from context if updated immediately
      // But context update might be async. Best to rely on what login returns if possible.
      // Let's assume login returns the user object or we can decode token.
      // Actually, looking at AuthContext, login usually sets state.
      // Let's try to get user from the response of the API call inside login if possible, 
      // but useAuth login usually just returns void or promise.
      // Let's modify the login call in AuthContext to return the user, or just check local storage/token here.

      // A safer way without modifying AuthContext right now:
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser?.role === 'restaurant') {
        navigate('/restaurant/dashboard');
      } else if (storedUser?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.needsVerification) {
        setError(err.response.data.message);
        setUnverifiedData(err.response.data);
      } else {
        setError(err.response?.data?.message || 'Login failed');
        setUnverifiedData(null);
      }
    }
  };

  const handleVerifyNow = () => {
    navigate('/register', { state: { unverifiedUser: unverifiedData } });
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex flex-col items-center gap-2">
          <span>{error}</span>
          {unverifiedData && (
            <button
              onClick={handleVerifyNow}
              className="bg-red-600 text-white px-4 py-1 rounded text-sm hover:bg-red-700 transition-colors font-semibold"
            >
              Verify Now
            </button>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
        <div className="mb-4 text-right">
          <Link to="/forgot-password" className="text-sm text-orange-600 hover:text-orange-700">
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition-colors"
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account? <Link to="/register" className="text-orange-600 hover:underline">Sign up</Link>
      </p>
    </div>
  );
};

export default Login;