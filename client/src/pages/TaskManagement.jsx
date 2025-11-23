// client/src/pages/TaskManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, Users, Calendar, Plus, Search,
  AlertTriangle, MapPin, Eye, Edit, Trash2, X, ArrowRight
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import api from '../lib/axios';

const TaskManagement = () => {
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState('kanban');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [damages, setDamages] = useState([]);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    damage_id: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchWorkers();
    fetchDamages();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tasks');

      if (data.success && data.data) {
        // Transform data to match expected format
        const transformedTasks = data.data.map(task => ({
          ...task,
          damage: task.damage || null,
          assigned_user: task.assigned_staff ? {
            id: task.assigned_staff.id,
            name: task.assigned_staff.name,
            email: task.assigned_staff.email
          } : null
        }));
        setTasks(transformedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await api.get('/tasks/staff');
      if (data.success && data.data) {
        setWorkers(data.data || []);
      } else {
        setWorkers([]);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      setWorkers([]);
    }
  };

  const fetchDamages = async () => {
    try {
      const { data } = await api.get('/tasks/damages');
      if (data.success && data.data) {
        setDamages(data.data || []);
      } else {
        setDamages([]);
      }
    } catch (error) {
      console.error('Error fetching damages:', error);
      setDamages([]);
    }
  };

  const columns = {
    pending: { title: 'Chờ xử lý', color: 'yellow', icon: Clock },
    assigned: { title: 'Đã giao', color: 'blue', icon: Users },
    in_progress: { title: 'Đang thực hiện', color: 'blue', icon: Users },
    completed: { title: 'Hoàn thành', color: 'green', icon: CheckCircle },
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      urgent: { text: 'Khẩn cấp', color: 'bg-red-100 text-red-800 border-red-200' },
      high: { text: 'Cao', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      medium: { text: 'Trung bình', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      low: { text: 'Thấp', color: 'bg-green-100 text-green-800 border-green-200' },
    };
    return badges[priority] || badges.medium;
  };

  const calculateProgress = (task) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'in_progress') {
      if (!task.start_date || !task.due_date) return 50;
      const start = new Date(task.start_date).getTime();
      const end = new Date(task.due_date).getTime();
      const now = Date.now();
      const progress = ((now - start) / (end - start)) * 100;
      return Math.min(Math.max(progress, 0), 100);
    }
    return 0;
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Bạn có chắc muốn xóa công việc này?')) return;

    try {
      const { data } = await api.delete(`/tasks/${taskId}`);
      if (data.success) {
        fetchTasks();
      } else {
        alert(data.message || 'Có lỗi xảy ra khi xóa công việc');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa công việc');
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      if (newStatus === 'in_progress' && !tasks.find(t => t.id === taskId)?.started_at) {
        updates.started_at = new Date().toISOString();
      }

      const { data } = await api.put(`/tasks/${taskId}`, updates);
      if (data.success) {
        fetchTasks();
      } else {
        alert(data.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Vui lòng nhập tiêu đề';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      // Format due_date to ISO string if provided
      const dueDateISO = formData.due_date && formData.due_date.trim() !== ''
        ? new Date(formData.due_date).toISOString()
        : null;

      // Normalize empty strings to null
      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        damage_id: formData.damage_id && formData.damage_id.trim() !== '' ? formData.damage_id : null,
        assigned_to: formData.assigned_to && formData.assigned_to.trim() !== '' ? formData.assigned_to : null,
        priority: formData.priority,
        due_date: dueDateISO,
        notes: formData.notes?.trim() || null,
      };

      console.log('Creating task with payload:', payload);

      const { data } = await api.post('/tasks', payload);

      if (data.success) {
        alert('Tạo công việc thành công!');
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          damage_id: '',
          assigned_to: '',
          priority: 'medium',
          due_date: '',
          notes: ''
        });
        setFormErrors({});
        fetchTasks();
      } else {
        throw new Error(data.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo công việc');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchAssignee = filterAssignee === 'all' ||
      (task.assigned_to && task.assigned_to.toString() === filterAssignee) ||
      (task.assigned_staff && task.assigned_staff.id.toString() === filterAssignee);
    return matchSearch && matchPriority && matchAssignee;
  });

  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress' || t.status === 'assigned').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    high_priority: tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length,
  };

  const TaskCard = ({ task }) => {
    const priorityBadge = getPriorityBadge(task.priority);
    const progress = calculateProgress(task);

    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
          <span className={`px-2 py-1 rounded text-xs font-semibold border ${priorityBadge.color}`}>
            {priorityBadge.text}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

        {task.damage?.road && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{task.damage.road.name || task.damage.title}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Calendar className="w-4 h-4" />
          <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'Chưa có'}</span>
        </div>

        {(task.status === 'in_progress' || task.status === 'assigned') && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Tiến độ</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {task.assigned_user ? (
              <>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {task.assigned_user.name.charAt(0)}
                </div>
                <span className="text-sm text-gray-700">{task.assigned_user.name}</span>
              </>
            ) : (
              <span className="text-sm text-gray-400">Chưa giao</span>
            )}
          </div>
          <button
            onClick={() => setSelectedTask(task)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
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
              <h2 className="text-2xl font-bold text-gray-900">Quản lý công việc</h2>
              <p className="text-gray-600">Theo dõi và phân công công việc sửa chữa</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-md"
            >
              <Plus className="w-5 h-5" />
              Tạo công việc mới
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-700">{stats.pending}</span>
              </div>
              <div className="text-sm text-yellow-600">Chờ xử lý</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-blue-700">{stats.in_progress}</span>
              </div>
              <div className="text-sm text-blue-600">Đang thực hiện</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-green-700">{stats.completed}</span>
              </div>
              <div className="text-sm text-green-600">Hoàn thành</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-purple-700">{stats.high_priority}</span>
              </div>
              <div className="text-sm text-purple-600">Ưu tiên cao</div>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm công việc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setSelectedView('kanban')}
                className={`px-4 py-2 ${selectedView === 'kanban' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Bảng
              </button>
              <button
                onClick={() => setSelectedView('list')}
                className={`px-4 py-2 ${selectedView === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Danh sách
              </button>
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Tất cả ưu tiên</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="high">Cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>

            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Tất cả người thực hiện</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Kanban Board */}
        {selectedView === 'kanban' && (
          <div className="p-8">
            <div className="grid grid-cols-4 gap-6">
              {Object.entries(columns).map(([status, config]) => {
                const Icon = config.icon;
                const columnTasks = filteredTasks.filter(t => t.status === status);

                return (
                  <div key={status} className="bg-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 text-${config.color}-600`} />
                        <h3 className="font-semibold text-gray-900">{config.title}</h3>
                        <span className="bg-white px-2 py-0.5 rounded-full text-sm font-medium text-gray-600">
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {columnTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          Không có công việc
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {selectedView === 'list' && (
          <div className="p-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Công việc</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Người thực hiện</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ưu tiên</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Hạn hoàn thành</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tiến độ</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map(task => {
                    const priorityBadge = getPriorityBadge(task.priority);
                    const statusInfo = columns[task.status];
                    const progress = calculateProgress(task);

                    return (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{task.title}</div>
                          {task.damage?.road && (
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {task.damage.road.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {task.assigned_staff || task.assigned_user ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {(task.assigned_staff?.name || task.assigned_user?.name || '').charAt(0)}
                              </div>
                              <span className="text-gray-700">{task.assigned_staff?.name || task.assigned_user?.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Chưa giao</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${priorityBadge.color}`}>
                            {priorityBadge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs bg-${statusInfo.color}-100 text-${statusInfo.color}-800 border-none`}
                          >
                            <option value="pending">Chờ xử lý</option>
                            <option value="assigned">Đã giao</option>
                            <option value="in_progress">Đang thực hiện</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Hủy</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'Chưa có'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12">{Math.round(progress)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold">Tạo công việc mới</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    title: '',
                    description: '',
                    damage_id: '',
                    assigned_to: '',
                    priority: 'medium',
                    due_date: '',
                    notes: ''
                  });
                  setFormErrors({});
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleCreateTask} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${formErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Nhập tiêu đề công việc"
                    required
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nhập mô tả chi tiết công việc"
                  />
                </div>

                {/* Damage Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Liên kết với hư hỏng
                  </label>
                  <select
                    value={formData.damage_id}
                    onChange={(e) => setFormData({ ...formData, damage_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Không liên kết</option>
                    {damages.map(damage => (
                      <option key={damage.id} value={damage.id}>
                        {damage.title || damage.type} - {damage.road?.name || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assign To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giao cho
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Chưa giao</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} ({worker.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức độ ưu tiên <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hạn hoàn thành
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Thêm ghi chú (nếu có)"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        title: '',
                        description: '',
                        damage_id: '',
                        assigned_to: '',
                        priority: 'medium',
                        due_date: '',
                        notes: ''
                      });
                      setFormErrors({});
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Đang tạo...' : 'Tạo công việc'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold">Chi tiết công việc</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">{selectedTask.title}</h4>
                  <p className="text-gray-600">{selectedTask.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Người thực hiện</div>
                    <div className="flex items-center gap-2">
                      {selectedTask.assigned_staff || selectedTask.assigned_user ? (
                        <>
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {(selectedTask.assigned_staff?.name || selectedTask.assigned_user?.name || '').charAt(0)}
                          </div>
                          <span className="font-medium">{selectedTask.assigned_staff?.name || selectedTask.assigned_user?.name}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Chưa giao</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Ưu tiên</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityBadge(selectedTask.priority).color}`}>
                      {getPriorityBadge(selectedTask.priority).text}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Ngày bắt đầu</div>
                    <div className="font-medium">
                      {selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleDateString('vi-VN') : 'Chưa có'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Hạn hoàn thành</div>
                    <div className="font-medium">
                      {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('vi-VN') : 'Chưa có'}
                    </div>
                  </div>
                  {selectedTask.damage && (
                    <div className="col-span-2">
                      <div className="text-sm text-gray-500 mb-1">Liên kết với hư hỏng</div>
                      <div className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {selectedTask.damage.title || selectedTask.damage.type} - {selectedTask.damage.road?.name || 'N/A'}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-2">Tiến độ</div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${calculateProgress(selectedTask)}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-semibold text-blue-600">
                      {Math.round(calculateProgress(selectedTask))}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                {selectedTask.damage_id && (
                  <button
                    onClick={() => navigate(`/damages/${selectedTask.damage_id}`)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Xem hư hỏng
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;