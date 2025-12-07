import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Gọi backend API qua axios instance
      const { data } = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (!data.success) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      console.log('✅ Login successful:', data.data);

      // Lưu access token và user info
      localStorage.setItem('access_token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.company));

      // Redirect (refresh_token đã được lưu trong httpOnly cookie)
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });

    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel: Welcome Page */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large Blue-Purple Circle */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-30 blur-3xl"></div>
          {/* Medium Pink-Purple Circle */}
          <div className="absolute top-1/2 -left-20 w-80 h-80 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full opacity-30 blur-3xl"></div>
          {/* Small Pink Circle */}
          <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full opacity-40 blur-2xl"></div>
          {/* Additional decorative circles */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-blue-400 rounded-full opacity-25 blur-xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full"></div>
            </div>
            <span className="text-xl font-semibold">LOGO</span>
          </div>

          {/* Welcome Text */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4">Welcome Page</h1>
              <p className="text-xl text-purple-200">Sign in to continue access</p>
            </div>
          </div>

          {/* Website URL */}
          <div className="text-purple-200 text-sm">www.yoursite.com</div>
        </div>
      </div>

      {/* Right Panel: Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Sign In Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Sign In</h2>

          {/* Show message from registration */}
          {location.state?.message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{location.state.message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-0 py-3 border-0 border-b-2 border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-0 transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-0 py-3 border-0 border-b-2 border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-0 transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  CONTINUE
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;