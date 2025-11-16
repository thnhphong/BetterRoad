// client/src/pages/DamageList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Search, Plus, MapPin, Calendar,
  Eye, Edit, Trash2, Download, Upload, X
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    fetchDamages();
    fetchRoads();
  }, []);

  const fetchDamages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('damages')
        .select(`
          *,
          road:roads(name, code),
          detected_by_user:users(name)
        `)
        .order('detected_at', { ascending: false });

      if (error) throw error;
      setDamages(data || []);
    } catch (error) {
      console.error('Error fetching damages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoads = async () => {
    const { data } = await supabase
      .from('roads')
      .select('*')
      .order('name');
    setRoads(data || []);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      1: 'bg-green-100 text-green-800 border-green-200',
      2: 'bg-green-100 text-green-800 border-green-200',
      3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      4: 'bg-red-100 text-red-800 border-red-200',
      5: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[severity] || colors[3];
  };

  const getSeverityLabel = (severity) => {
    const labels = { 1: 'Rất thấp', 2: 'Thấp', 3: 'Trung bình', 4: 'Cao', 5: 'Rất cao' };
    return labels[severity] || 'Trung bình';
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

    const { error } = await supabase
      .from('damages')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchDamages();
    }
  };

  const filteredDamages = damages.filter(damage => {
    const matchSearch = damage.road?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      damage.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      damage.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || damage.status === filterStatus;
    const matchSeverity = filterSeverity === 'all' || damage.severity === parseInt(filterSeverity);
    return matchSearch && matchStatus && matchSeverity;
  });

  const stats = {
    high: damages.filter(d => d.severity >= 4).length,
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
                Xuất Excel
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Báo cáo mới
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="in_progress">Đang sửa</option>
              <option value="completed">Hoàn thành</option>
              <option value="rejected">Từ chối</option>
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
                    {damage.image_url ? (
                      <img
                        src={damage.image_url}
                        alt={damage.type}
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
                      <h3 className="font-bold text-gray-900">{getTypeLabel(damage.type)}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(damage.status).color}`}>
                        {getStatusBadge(damage.status).text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{damage.road?.name || 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(damage.detected_at).toLocaleDateString('vi-VN')}</span>
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
                      <td className="px-6 py-4 font-medium text-gray-900">{getTypeLabel(damage.type)}</td>
                      <td className="px-6 py-4 text-gray-600">{damage.road?.name || 'N/A'}</td>
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
                        {new Date(damage.detected_at).toLocaleDateString('vi-VN')}
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
    </div>
  );
};

export default DamageList;