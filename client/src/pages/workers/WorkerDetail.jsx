// client/src/pages/workers/WorkerDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Edit, Trash2,
  AlertTriangle, ArrowLeft, UserCheck, UserX
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../lib/axios';

const WorkerDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);

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
          <div className="max-w-2xl mx-auto">
            {/* Worker Info Card */}
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
        </div>
      </main>
    </div>
  );
};

export default WorkerDetail;