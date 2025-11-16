// client/src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Download, AlertTriangle, CheckCircle,
  Clock, MapPin, FileText, ArrowUp, ArrowDown
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { supabase } from '../lib/supabase';

const Reports = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDamages: 0,
    damageTrend: 0,
    totalTasks: 0,
    taskTrend: 0,
    completionRate: 0,
    completionTrend: 0,
    avgResponseTime: 0,
    responseTrend: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [damagesByType, setDamagesByType] = useState([]);
  const [roadPerformance, setRoadPerformance] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch damages
      const { data: damages } = await supabase
        .from('damages')
        .select('*')
        .order('detected_at', { ascending: false });

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      // Calculate stats
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const totalTasks = tasks?.length || 0;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate response time
      const tasksWithDates = tasks?.filter(t => t.created_at && t.completed_at) || [];
      const avgResponseTime = tasksWithDates.length > 0
        ? tasksWithDates.reduce((acc, task) => {
            const created = new Date(task.created_at);
            const completed = new Date(task.completed_at);
            const days = (completed - created) / (1000 * 60 * 60 * 24);
            return acc + days;
          }, 0) / tasksWithDates.length
        : 0;

      setStats({
        totalDamages: damages?.length || 0,
        damageTrend: 12.5,
        totalTasks: totalTasks,
        taskTrend: -8.3,
        completionRate: Math.round(completionRate),
        completionTrend: 15.2,
        avgResponseTime: avgResponseTime.toFixed(1),
        responseTrend: -5.1,
      });

      // Process monthly data
      const monthlyStats = processMonthlyData(damages, tasks);
      setMonthlyData(monthlyStats);

      // Process damages by type
      const typeStats = processDamagesByType(damages);
      setDamagesByType(typeStats);

      // Fetch road performance
      await fetchRoadPerformance();

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (damages, tasks) => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
    const data = [];

    for (let i = 0; i < 6; i++) {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - (5 - i));
      const monthStart = new Date(monthAgo.getFullYear(), monthAgo.getMonth(), 1);
      const monthEnd = new Date(monthAgo.getFullYear(), monthAgo.getMonth() + 1, 0);

      const monthDamages = damages?.filter(d => {
        const date = new Date(d.detected_at);
        return date >= monthStart && date <= monthEnd;
      }).length || 0;

      const monthCompleted = tasks?.filter(t => {
        const date = new Date(t.completed_at);
        return t.status === 'completed' && date >= monthStart && date <= monthEnd;
      }).length || 0;

      const monthPending = tasks?.filter(t => {
        const date = new Date(t.created_at);
        return t.status === 'pending' && date >= monthStart && date <= monthEnd;
      }).length || 0;

      data.push({
        month: months[i],
        damages: monthDamages,
        completed: monthCompleted,
        pending: monthPending,
      });
    }

    return data;
  };

  const processDamagesByType = (damages) => {
    const types = {
      pothole: { name: 'Ổ gà', count: 0 },
      crack: { name: 'Nứt vỡ', count: 0 },
      raveling: { name: 'Bong tróc', count: 0 },
      rutting: { name: 'Rãnh bánh xe', count: 0 },
      other: { name: 'Khác', count: 0 },
    };

    damages?.forEach(damage => {
      if (types[damage.type]) {
        types[damage.type].count++;
      }
    });

    const total = Object.values(types).reduce((sum, t) => sum + t.count, 0);
    
    return Object.entries(types)
      .map(([key, value]) => ({
        type: value.name,
        count: value.count,
        percentage: total > 0 ? Math.round((value.count / total) * 100) : 0,
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  };

  const fetchRoadPerformance = async () => {
    const { data: roads } = await supabase
      .from('roads')
      .select(`
        id,
        name,
        damages:damages(id, status)
      `);

    const performance = roads?.map(road => {
      const total = road.damages?.length || 0;
      const fixed = road.damages?.filter(d => d.status === 'completed').length || 0;
      const rate = total > 0 ? Math.round((fixed / total) * 100) : 0;

      return {
        road: road.name,
        total,
        fixed,
        rate,
      };
    }).filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5) || [];

    setRoadPerformance(performance);
  };

  const StatCard = ({ title, value, trend, icon: Icon, color }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-xl border`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 text-white opacity-80" />
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-white/20' : 'bg-white/20'
          }`}>
            {trend > 0 ? (
              <ArrowUp className="w-4 h-4 text-white" />
            ) : (
              <ArrowDown className="w-4 h-4 text-white" />
            )}
            <span className="text-sm font-semibold text-white">
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-white/80 text-sm">{title}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải báo cáo...</p>
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
              <h2 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h2>
              <p className="text-gray-600">Phân tích dữ liệu và hiệu suất hệ thống</p>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">7 ngày qua</option>
                <option value="month">30 ngày qua</option>
                <option value="quarter">3 tháng qua</option>
                <option value="year">12 tháng qua</option>
              </select>
              <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="w-5 h-5" />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="p-8">
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Tổng hư hỏng"
              value={stats.totalDamages}
              trend={stats.damageTrend}
              icon={AlertTriangle}
              color="from-red-500 to-red-600 border-red-300"
            />
            <StatCard
              title="Tổng công việc"
              value={stats.totalTasks}
              trend={stats.taskTrend}
              icon={CheckCircle}
              color="from-blue-500 to-blue-600 border-blue-300"
            />
            <StatCard
              title="Tỷ lệ hoàn thành"
              value={`${stats.completionRate}%`}
              trend={stats.completionTrend}
              icon={TrendingUp}
              color="from-green-500 to-green-600 border-green-300"
            />
            <StatCard
              title="Thời gian phản hồi"
              value={`${stats.avgResponseTime} ngày`}
              trend={stats.responseTrend}
              icon={Clock}
              color="from-purple-500 to-purple-600 border-purple-300"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Xu hướng theo tháng</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64 flex items-end justify-between gap-2">
                {monthlyData.map((data, index) => {
                  const maxValue = Math.max(...monthlyData.map(d => d.completed + d.pending));
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col gap-1">
                        <div 
                          className="w-full bg-green-500 rounded-t hover:bg-green-600 transition cursor-pointer"
                          style={{ height: `${(data.completed / maxValue) * 200}px` }}
                          title={`Hoàn thành: ${data.completed}`}
                        ></div>
                        <div 
                          className="w-full bg-yellow-500 hover:bg-yellow-600 transition cursor-pointer"
                          style={{ height: `${(data.pending / maxValue) * 200}px` }}
                          title={`Chờ xử lý: ${data.pending}`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{data.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Hoàn thành</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-600">Chờ xử lý</span>
                </div>
              </div>
            </div>

            {/* Damage Types Distribution */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Phân loại hư hỏng</h3>
              </div>
              <div className="space-y-4">
                {damagesByType.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
                ) : (
                  damagesByType.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{item.type}</span>
                        <span className="text-sm text-gray-600">{item.count} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            index === 0 ? 'bg-red-500' :
                            index === 1 ? 'bg-yellow-500' :
                            index === 2 ? 'bg-blue-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Road Performance Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Hiệu suất theo tuyến đường</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tuyến đường</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Tổng hư hỏng</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Đã sửa</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tỷ lệ hoàn thành</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roadPerformance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  roadPerformance.map((road, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{road.road}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{road.total}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{road.fixed}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                road.rate >= 85 ? 'bg-green-500' :
                                road.rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${road.rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-12">{road.rate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          road.rate >= 85 ? 'bg-green-100 text-green-800' :
                          road.rate >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {road.rate >= 85 ? 'Tốt' : road.rate >= 75 ? 'Khá' : 'Cần cải thiện'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Export Options */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Xuất báo cáo chi tiết</h3>
                <p className="text-gray-600">Tải xuống báo cáo đầy đủ với biểu đồ và phân tích chuyên sâu</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FileText className="w-5 h-5" />
                  PDF
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FileText className="w-5 h-5" />
                  Excel
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-5 h-5" />
                  Tải tất cả
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;