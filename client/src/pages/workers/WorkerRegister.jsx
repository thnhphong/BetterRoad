// client/src/pages/workers/WorkerRegister.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Lock, Save, X
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../lib/axios';

const WorkerRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    avatar: '',
  });
  const [errors, setErrors] = useState({});

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      // Get user data from API
      const { data } = await api.get('/auth/me');

      if (data.success && data.data && data.data.user) {
        const userData = data.data.user;
        // Store user info for display
        setCurrentUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
        });
      } else {
        alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      navigate('/login');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      alert('Không tìm thấy thông tin công ty. Vui lòng tải lại trang.');
      return;
    }

    try {
      setLoading(true);

      // Register staff via API
      const { data } = await api.post('/staff/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
        avatar: formData.avatar || null,
        role: 'worker', // Default role for workers
      });

      if (data.success) {
        alert('Đăng ký công nhân thành công!');
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          avatar: '',
        });
        navigate('/workers');
      } else {
        throw new Error(data.message || 'Failed to register worker');
      }
    } catch (error) {
      console.error('Error registering worker:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi đăng ký công nhân';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Đăng ký công nhân mới</h2>
              <p className="text-gray-600">
                Thêm công nhân vào hệ thống quản lý
                {currentUser && ` - ${currentUser.name}`}
              </p>
            </div>
            <button
              onClick={() => navigate('/workers')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="w-5 h-5" />
              Hủy
            </button>
          </div>
        </header>

        {/* Loading state */}
        {!currentUser ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang kiểm tra xác thực...</p>
            </div>
          </div>
        ) : (
          /* Form */
          <div className="p-8">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-xl shadow-md p-8">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="Nguyễn Văn A"
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="example@email.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="0912345678"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Đăng ký công nhân
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/workers')}
                      disabled={loading}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>

              {/* Information Card */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Lưu ý:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Công nhân sẽ nhận email xác nhận tài khoản</li>
                  <li>• Tài khoản mặc định ở trạng thái hoạt động</li>
                  <li>• Bạn có thể thay đổi thông tin sau khi tạo</li>
                  <li>• Mật khẩu nên được thay đổi khi đăng nhập lần đầu</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkerRegister;