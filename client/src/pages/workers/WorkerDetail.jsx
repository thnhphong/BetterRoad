// client/src/pages/workers/WorkerDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Edit, Trash2, CheckCircle,
  Clock, AlertTriangle, ArrowLeft, UserCheck, UserX
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../lib/axios';

const WorkerDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchWorkerData();
  }, [id]);

  const fetchWorkerData = async () => {
    try {
      setLoading(true);

      // Fetch worker info and tasks from API
      const { data } = await api.get(`/staff/${id}`);

      if (data.success) {
        setWorker(data.data.staff);
        setTasks(data.data.tasks || []);
        setStats(data.data.stats || {
          total: 0,
          completed: 0,
          in_progress: 0,
          pending: 0,
        });
      } else {
        throw new Error(data.message || 'Failed to fetch worker data');
      }
    } catch (error) {
      console.error('Error fetching worker data:', error);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else if (error.response?.status === 404) {
        alert('Không tìm thấy thông tin công nhân');
        navigate('/workers');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tải thông tin công nhân';
        alert(errorMessage);
        navigate('/workers');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const { data } = await api.patch(`/staff/${id}/status`, {
        is_active: !worker.is_active
      });

      if (data.success) {
        fetchWorkerData();
      } else {
        alert(data.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleDeleteWorker = async () => {
    if (!confirm('Bạn có chắc muốn xóa công nhân này? Tất cả công việc liên quan sẽ bị ảnh hưởng.')) return;

    try {
      const { data } = await api.delete(`/staff/${id}`);

      if (data.success) {
        navigate('/workers');
      } else {
        alert(data.message || 'Có lỗi xảy ra khi xóa công nhân');
      }
    } catch (error) {
      console.error('Error deleting worker:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa công nhân. Có thể có công việc đang thực hiện.';
      alert(errorMessage);
    }
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
      assigned: { text: 'Đã giao', color: 'bg-blue-100 text-blue-800' },
      in_progress: { text: 'Đang thực hiện', color: 'bg-blue-100 text-blue-800' },
      completed: { text: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      cancelled: { text: 'Đã hủy', color: 'bg-gray-100 text-gray-800' },
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      urgent: { text: 'Khẩn cấp', color: 'bg-red-100 text-red-800' },
      high: { text: 'Cao', color: 'bg-orange-100 text-orange-800' },
      medium: { text: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' },
      low: { text: 'Thấp', color: 'bg-green-100 text-green-800' },
    };
    return badges[priority] || badges.medium;
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

  if (!worker) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không tìm thấy thông tin công nhân</p>
              <button
                onClick={() => navigate('/workers')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Quay lại danh sách
              </button>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/workers')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết công nhân</h2>
                <p className="text-gray-600">Thông tin và lịch sử công việc</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${worker.is_active
                  ? 'border-gray-300 hover:bg-gray-50'
                  : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
              >
                {worker.is_active ? (
                  <>
                    <UserX className="w-5 h-5" />
                    Vô hiệu hóa
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5" />
                    Kích hoạt
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/workers/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-5 h-5" />
                Chỉnh sửa
              </button>
              <button
                onClick={handleDeleteWorker}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-5 h-5" />
                Xóa
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Worker Info Card */}
            <div className="col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                    {worker.name.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{worker.name}</h3>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${worker.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {worker.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{worker.email}</div>
                    </div>
                  </div>

                  {worker.phone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Số điện thoại</div>
                        <div className="font-medium">{worker.phone}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Ngày tham gia</div>
                      <div className="font-medium">
                        {new Date(worker.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Vai trò</div>
                      <div className="font-medium">Công nhân</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats & Tasks */}
            <div className="col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-8 h-8 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-700">{stats.total}</span>
                  </div>
                  <div className="text-sm text-blue-600">Tổng công việc</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">{stats.completed}</span>
                  </div>
                  <div className="text-sm text-green-600">Hoàn thành</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-8 h-8 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-700">{stats.in_progress}</span>
                  </div>
                  <div className="text-sm text-blue-600">Đang làm</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-8 h-8 text-yellow-600" />
                    <span className="text-2xl font-bold text-yellow-700">{stats.pending}</span>
                  </div>
                  <div className="text-sm text-yellow-600">Chờ làm</div>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Hiệu suất làm việc</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Tỷ lệ hoàn thành</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full"
                        style={{
                          width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Đang thực hiện</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats.total > 0 ? Math.round((stats.in_progress / stats.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full"
                        style={{
                          width: `${stats.total > 0 ? (stats.in_progress / stats.total) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Lịch sử công việc</h3>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có công việc nào được giao</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tasks.map(task => (
                  <div key={task.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{task.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(task.status).color}`}>
                            {getStatusBadge(task.status).text}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityBadge(task.priority).color}`}>
                            {getPriorityBadge(task.priority).text}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{task.description || 'Không có mô tả'}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {task.damage ? (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>
                                {task.damage.type ? getTypeLabel(task.damage.type) : 'Không xác định'}
                                {task.damage.road ? ` - ${task.damage.road.name}` : ''}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Không có thông tin hư hỏng</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'Chưa có hạn'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerDetail;