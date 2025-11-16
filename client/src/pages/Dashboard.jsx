// client/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Clock, Users, TrendingUp, MapPin
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { supabase } from '../lib/supabase';
import api from '../lib/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRoads: 0,
    totalDamages: 0,
    pendingTasks: 0,
    completedTasks: 0,
    activeCrew: 0,
  });
  const [recentDamages, setRecentDamages] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchDashboardData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Try to get company data from localStorage first
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setCompany(userData);
      }

      // Fetch fresh data from API
      const { data } = await api.get('/auth/me');
      if (data.success && data.data && data.data.user) {
        setUser(data.data.user);
        setCompany(data.data.user);
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to localStorage if API fails
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setCompany(userData);
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('email', user.email)
        .single();

      const companyId = userData?.company_id;

      // Fetch roads count
      const { count: roadsCount } = await supabase
        .from('roads')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Fetch damages count
      const { count: damagesCount } = await supabase
        .from('damages')
        .select('*', { count: 'exact', head: true });

      // Fetch tasks stats
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status');

      const pendingTasks = tasks?.filter(t => t.status === 'pending' || t.status === 'assigned').length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;

      // Fetch active workers
      const { count: workersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('role', 'worker')
        .eq('is_active', true);

      // Fetch recent damages
      const { data: damages } = await supabase
        .from('damages')
        .select(`
          *,
          road:roads(name, code)
        `)
        .order('detected_at', { ascending: false })
        .limit(3);

      setStats({
        totalRoads: roadsCount || 0,
        totalDamages: damagesCount || 0,
        pendingTasks,
        completedTasks,
        activeCrew: workersCount || 0,
      });

      setRecentDamages(damages || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, trend }) => (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center text-green-600 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend}%
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );

  const getSeverityColor = (severity) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-red-100 text-red-800',
    };
    return colors[severity] || colors[3];
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600">
                Chào mừng trở lại, {company?.name || user?.name || 'Admin'}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{company?.name || user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{company?.email || user?.email}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {(company?.name || user?.name)?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              icon={MapPin}
              title="Tổng tuyến đường"
              value={stats.totalRoads}
              color="bg-blue-600"
              trend={8}
            />
            <StatCard
              icon={AlertTriangle}
              title="Hư hỏng phát hiện"
              value={stats.totalDamages}
              color="bg-red-600"
            />
            <StatCard
              icon={Clock}
              title="Công việc chờ xử lý"
              value={stats.pendingTasks}
              color="bg-yellow-600"
            />
            <StatCard
              icon={CheckCircle}
              title="Đã hoàn thành"
              value={stats.completedTasks}
              color="bg-green-600"
              trend={12}
            />
            <StatCard
              icon={Users}
              title="Đội thi công"
              value={stats.activeCrew}
              color="bg-purple-600"
            />
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Damages */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Hư hỏng gần đây</h3>
                <button
                  onClick={() => navigate('/damages')}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  Xem tất cả →
                </button>
              </div>
              <div className="space-y-4">
                {recentDamages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Chưa có hư hỏng nào</p>
                ) : (
                  recentDamages.map((damage) => (
                    <div key={damage.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                      onClick={() => navigate(`/damages/${damage.id}`)}>
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{damage.type}</h4>
                          <p className="text-sm text-gray-600">{damage.road?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(damage.detected_at).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(damage.severity)}`}>
                        Mức {damage.severity}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Hành động nhanh</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/damages?action=new')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  + Báo cáo hư hỏng mới
                </button>
                <button
                  onClick={() => navigate('/tasks?action=new')}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  + Tạo công việc mới
                </button>
                <button
                  onClick={() => navigate('/map')}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  🗺️ Xem bản đồ
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
                >
                  📊 Xuất báo cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;