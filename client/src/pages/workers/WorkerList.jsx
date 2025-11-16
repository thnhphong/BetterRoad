// client/src/pages/workers/WorkerList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Plus, Eye, Edit, Trash2, UserCheck,
  UserX, Phone, Mail, Calendar, Download
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { supabase } from '../../lib/supabase';

const WorkerList = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);

      // Sử dụng utility function
      const companyId = await getCurrentCompanyId();

      if (!companyId) {
        console.error('No company ID found');
        alert('Không tìm thấy công ty. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId)
        .eq('role', 'worker')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (workerId, currentStatus) => {
    const { error } = await supabase
      .from('users')
      .update({ is_active: !currentStatus })
      .eq('id', workerId);

    if (!error) {
      fetchWorkers();
    }
  };

  const handleDeleteWorker = async (workerId) => {
    if (!confirm('Bạn có chắc muốn xóa công nhân này?')) return;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', workerId);

    if (!error) {
      fetchWorkers();
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchSearch = worker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && worker.is_active) ||
      (filterStatus === 'inactive' && !worker.is_active);
    return matchSearch && matchStatus;
  });

  const stats = {
    total: workers.length,
    active: workers.filter(w => w.is_active).length,
    inactive: workers.filter(w => !w.is_active).length,
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
              <h2 className="text-2xl font-bold text-gray-900">Quản lý công nhân</h2>
              <p className="text-gray-600">Quản lý thông tin và phân công công việc cho công nhân</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-5 h-5" />
                Xuất danh sách
              </button>
              <button
                onClick={() => navigate('/workers/register')}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Thêm công nhân
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-blue-700">{stats.total}</span>
              </div>
              <div className="text-sm text-blue-600">Tổng công nhân</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-green-700">{stats.active}</span>
              </div>
              <div className="text-sm text-green-600">Đang hoạt động</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <UserX className="w-8 h-8 text-gray-600" />
                <span className="text-2xl font-bold text-gray-700">{stats.inactive}</span>
              </div>
              <div className="text-sm text-gray-600">Không hoạt động</div>
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
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
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
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>

        {/* Workers List */}
        <div className="p-8">
          <div className="mb-4 text-sm text-gray-600">
            Hiển thị {filteredWorkers.length} / {workers.length} công nhân
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input type="checkbox" className="w-5 h-5 rounded" />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Công nhân</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Liên hệ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ngày tham gia</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWorkers.map(worker => (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(worker.id)}
                        onChange={() => {
                          setSelectedWorkers(prev =>
                            prev.includes(worker.id)
                              ? prev.filter(id => id !== worker.id)
                              : [...prev, worker.id]
                          );
                        }}
                        className="w-5 h-5 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {worker.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{worker.name}</div>
                          <div className="text-sm text-gray-500">{worker.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {worker.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{worker.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{worker.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(worker.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(worker.id, worker.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${worker.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {worker.is_active ? 'Hoạt động' : 'Không hoạt động'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/workers/${worker.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/workers/${worker.id}/edit`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorker(worker.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredWorkers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không tìm thấy công nhân nào</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerList;