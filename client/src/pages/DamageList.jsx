// client/src/pages/DamageList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Search, Plus, MapPin, Calendar,
  Eye, Edit, Trash2, Download, Upload, X
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar from '../components/layout/Sidebar';
import api from '../lib/axios';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DamageList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [selectedDamages, setSelectedDamages] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [damages, setDamages] = useState([]);
  const [roads, setRoads] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium', // Changed from 3 to 'medium'
    status: 'pending',
    location: {
      lat: '',
      lng: '',
      address: ''
    },
    road_id: '',
    images: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    fetchDamages();
    fetchRoads();
  }, []);

  // Initialize map when modal opens
  useEffect(() => {
    if (showAddModal) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (mapRef.current && !mapInstanceRef.current) {
          initializeMap();
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // Cleanup map when modal closes
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    }
  }, [showAddModal]);

  // Update map marker when location changes
  useEffect(() => {
    if (mapInstanceRef.current && formData.location.lat && formData.location.lng) {
      const lat = parseFloat(formData.location.lat);
      const lng = parseFloat(formData.location.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        updateMarker(lat, lng);
      }
    }
  }, [formData.location.lat, formData.location.lng]);

  const fetchDamages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/damages');

      if (data.success && data.data) {
        setDamages(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch damages');
      }
    } catch (error) {
      console.error('Error fetching damages:', error);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoads = async () => {
    try {
      const { data } = await api.get('/damages/roads');
      if (data.success && data.data) {
        setRoads(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching roads:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[severity] || colors.medium;
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical'
    };
    return labels[severity] || 'Medium';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
      in_progress: { text: 'Đang sửa', color: 'bg-blue-100 text-blue-800' },
      completed: { text: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      rejected: { text: 'Từ chối', color: 'bg-gray-100 text-gray-800' },
    };
    return badges[status] || badges.pending;
  };

  const getTypeLabel = (type) => {
    const types = {
      crack: 'Nứt vỡ',
      pothole: 'Ổ gà',
      rutting: 'Rãnh bánh xe',
      raveling: 'Bong tróc',
      depression: 'Lún',
      other: 'Khác',
    };
    return types[type] || type;
  };

  const handleSelectDamage = (id) => {
    setSelectedDamages(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleDeleteDamage = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa hư hỏng này?')) return;

    try {
      const { data } = await api.delete(`/damages/${id}`);
      if (data.success) {
        fetchDamages();
      } else {
        alert(data.message || 'Có lỗi xảy ra khi xóa hư hỏng');
      }
    } catch (error) {
      console.error('Error deleting damage:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa hư hỏng');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Vui lòng nhập tiêu đề';
    }

    if (!formData.location.lat || !formData.location.lng) {
      errors.location = 'Vui lòng nhập tọa độ (vĩ độ và kinh độ)';
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(formData.severity)) {
      errors.severity = 'Mức độ nghiêm trọng không hợp lệ';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: formData.title,
        description: formData.description || null,
        severity: formData.severity, // Remove parseInt(), send as string
        status: formData.status,
        location: {
          lat: parseFloat(formData.location.lat),
          lng: parseFloat(formData.location.lng),
          address: formData.location.address || ''
        },
        road_id: formData.road_id || null,
        images: formData.images.length > 0 ? formData.images : [],
      };

      const { data } = await api.post('/damages', payload);

      if (data.success) {
        alert('Thêm hư hỏng thành công!');
        setShowAddModal(false);
        // Reset form
        setFormData({
          title: '',
          description: '',
          severity: 'medium', // Changed from 3
          status: 'pending',
          location: {
            lat: '',
            lng: '',
            address: ''
          },
          road_id: '',
          images: []
        });
        setFormErrors({});
        fetchDamages();
      } else {
        throw new Error(data.message || 'Failed to create damage');
      }
    } catch (error) {
      console.error('Error creating damage:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thêm hư hỏng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUrlAdd = (url) => {
    if (url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default center (Vietnam - Ho Chi Minh City)
    const defaultCenter = [10.8231, 106.6297];

    // If form already has coordinates, use them
    const lat = formData.location.lat ? parseFloat(formData.location.lat) : null;
    const lng = formData.location.lng ? parseFloat(formData.location.lng) : null;

    const center = (lat && lng && !isNaN(lat) && !isNaN(lng))
      ? [lat, lng]
      : defaultCenter;

    const map = L.map(mapRef.current, {
      center: center,
      zoom: lat && lng ? 15 : 10,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add click handler
    map.on('click', handleMapClick);

    // Add initial marker if coordinates exist
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      updateMarker(lat, lng);
    }
  };

  const updateMarker = (lat, lng) => {
    if (!mapInstanceRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
    }

    // Add new marker
    markerRef.current = L.marker([lat, lng], {
      draggable: true,
      icon: L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(mapInstanceRef.current);

    // Center map on marker
    mapInstanceRef.current.setView([lat, lng], 15);

    // Handle marker drag
    markerRef.current.on('dragend', (e) => {
      const position = e.target.getLatLng();
      handleLocationSelect(position.lat, position.lng);
    });
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    handleLocationSelect(lat, lng);
  };

  const handleLocationSelect = async (lat, lng) => {
    // Update form data immediately
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
      }
    }));

    // Update marker
    updateMarker(lat, lng);

    // Reverse geocode to get address
    setMapLoading(true);
    try {
      const address = await reverseGeocode(lat, lng);
      if (address) {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: address
          }
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setMapLoading(false);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      // Using Nominatim API (OpenStreetMap) - free, no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BetterRoad-App' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        // Build address string from components
        const addressParts = [];

        if (addr.road) addressParts.push(addr.road);
        if (addr.house_number) addressParts.push(addr.house_number);
        if (addr.suburb) addressParts.push(addr.suburb);
        if (addr.city || addr.town || addr.village) {
          addressParts.push(addr.city || addr.town || addr.village);
        }
        if (addr.state) addressParts.push(addr.state);
        if (addr.country) addressParts.push(addr.country);

        return addressParts.length > 0 ? addressParts.join(', ') : data.display_name || '';
      }

      return data.display_name || '';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return '';
    }
  };

  const filteredDamages = damages.filter(damage => {
    const matchSearch = damage.road?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      damage.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      damage.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || damage.status === filterStatus;
    const matchSeverity = filterSeverity === 'all' || damage.severity === filterSeverity; // Remove parseInt()
    return matchSearch && matchStatus && matchSeverity;
  });

  const stats = {
    high: damages.filter(d => d.severity === 'high' || d.severity === 'critical').length,
    pending: damages.filter(d => d.status === 'pending').length,
    in_progress: damages.filter(d => d.status === 'in_progress').length,
    completed: damages.filter(d => d.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quản lý hư hỏng</h2>
              <p className="text-gray-600">Theo dõi và xử lý các hư hỏng trên đường</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-5 h-5" />
                Export Excel
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add new damage
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-red-600 mb-1">Nghiêm trọng</div>
              <div className="text-2xl font-bold text-red-700">{stats.high}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 mb-1">Chờ xử lý</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 mb-1">Đang sửa</div>
              <div className="text-2xl font-bold text-blue-700">{stats.in_progress}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 mb-1">Hoàn thành</div>
              <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo vị trí, loại hư hỏng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="5">Rất cao</option>
              <option value="4">Cao</option>
              <option value="3">Trung bình</option>
              <option value="2">Thấp</option>
              <option value="1">Rất thấp</option>
            </select>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                List
              </button>
            </div>
          </div>

          {selectedDamages.length > 0 && (
            <div className="mt-4 flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700 font-medium">
                Đã chọn {selectedDamages.length} hư hỏng
              </span>
              <button className="text-blue-600 hover:text-blue-700">Giao việc</button>
              <button className="text-blue-600 hover:text-blue-700">Xuất báo cáo</button>
              <button
                onClick={() => setSelectedDamages([])}
                className="text-red-600 hover:text-red-700 ml-auto"
              >
                Bỏ chọn
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-4 text-sm text-gray-600">
            Hiển thị {filteredDamages.length} / {damages.length} hư hỏng
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDamages.map(damage => (
                <div key={damage.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="relative h-48 bg-gray-200">
                    {damage.images && damage.images.length > 0 ? (
                      <img
                        src={damage.images[0]}
                        alt={damage.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <AlertTriangle className="w-16 h-16" />
                      </div>
                    )}
                    <input
                      type="checkbox"
                      checked={selectedDamages.includes(damage.id)}
                      onChange={() => handleSelectDamage(damage.id)}
                      className="absolute top-3 left-3 w-5 h-5 rounded"
                    />
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(damage.severity)}`}>
                      {getSeverityLabel(damage.severity)}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{damage.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(damage.status).color}`}>
                        {getStatusBadge(damage.status).text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{damage.road?.name || damage.location?.address || 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(damage.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {damage.description || 'Không có mô tả'}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/damages/${damage.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        Chi tiết
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDamage(damage.id)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input type="checkbox" className="w-5 h-5 rounded" />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Loại</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Vị trí</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mức độ</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ngày phát hiện</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDamages.map(damage => (
                    <tr key={damage.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDamages.includes(damage.id)}
                          onChange={() => handleSelectDamage(damage.id)}
                          className="w-5 h-5 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{damage.title}</td>
                      <td className="px-6 py-4 text-gray-600">{damage.road?.name || damage.location?.address || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(damage.severity)}`}>
                          {getSeverityLabel(damage.severity)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(damage.status).color}`}>
                          {getStatusBadge(damage.status).text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(damage.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/damages/${damage.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDamage(damage.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Damage Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Thêm hư hỏng mới</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors({});
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Nhập tiêu đề hư hỏng"
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mô tả chi tiết về hư hỏng"
                  />
                </div>

                {/* Severity and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mức độ nghiêm trọng <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="severity"
                      value={formData.severity}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.severity ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                      <option value="critical">Nghiêm trọng</option>
                    </select>
                    {formErrors.severity && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.severity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="in_progress">Đang sửa</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="rejected">Từ chối</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vị trí <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Click trên bản đồ để chọn vị trí)</span>
                  </label>

                  {/* Map Picker */}
                  <div className="mb-4">
                    <div
                      ref={mapRef}
                      style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}
                      className="border border-gray-300"
                    />
                    {mapLoading && (
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Đang lấy địa chỉ...
                      </div>
                    )}
                  </div>

                  {/* Coordinate Inputs */}
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Vĩ độ (Latitude)</label>
                      <input
                        type="number"
                        step="any"
                        name="location.lat"
                        value={formData.location.lat}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.location ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="10.8231"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Kinh độ (Longitude)</label>
                      <input
                        type="number"
                        step="any"
                        name="location.lng"
                        value={formData.location.lng}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.location ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="106.6297"
                      />
                    </div>
                  </div>

                  {/* Address Input */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Địa chỉ</label>
                    <input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Địa chỉ sẽ được tự động điền khi chọn vị trí trên bản đồ"
                    />
                  </div>

                  {formErrors.location && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.location}</p>
                  )}
                </div>

                {/* Road Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đường (tùy chọn)
                  </label>
                  <select
                    name="road_id"
                    value={formData.road_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn đường --</option>
                    {roads.map(road => (
                      <option key={road.id} value={road.id}>
                        {road.name} {road.code && `(${road.code})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh (URL)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      placeholder="Nhập URL hình ảnh"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleImageUrlAdd(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        handleImageUrlAdd(input.value);
                        input.value = '';
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      Thêm
                    </button>
                  </div>
                  {formData.images.length > 0 && (
                    <div className="space-y-2">
                      {formData.images.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="flex-1 text-sm text-gray-600 truncate">{url}</span>
                          <button
                            type="button"
                            onClick={() => handleImageRemove(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Đang xử lý...
                    </span>
                  ) : (
                    'Thêm hư hỏng'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormErrors({});
                  }}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DamageList;