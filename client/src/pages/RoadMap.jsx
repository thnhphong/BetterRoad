// client/src/pages/RoadMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, Search, Filter, AlertTriangle, X, ChevronDown
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { supabase } from '../lib/supabase';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (severity) => {
  const colors = {
    1: '#10b981',
    2: '#10b981',
    3: '#f59e0b',
    4: '#ef4444',
    5: '#ef4444',
  };

  const color = colors[severity] || colors[3];

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    className: 'custom-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const RoadMap = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [damages, setDamages] = useState([]);
  const [roads, setRoads] = useState([]);
  const [filters, setFilters] = useState({
    severity: 'all',
    status: 'all',
    type: 'all'
  });

  useEffect(() => {
    fetchDamages();
    fetchRoads();
  }, []);

  useEffect(() => {
    if (damages.length > 0 && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [damages]);

  const fetchDamages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('damages')
        .select(`
          *,
          road:roads(name, code)
        `)
        .order('detected_at', { ascending: false });

      if (error) throw error;
      
      // Filter damages with valid coordinates
      const validDamages = (data || []).filter(d => {
        const coords = d.geom?.coordinates;
        return coords && coords.length === 2 && 
               !isNaN(coords[0]) && !isNaN(coords[1]);
      });
      
      setDamages(validDamages);
    } catch (error) {
      console.error('Error fetching damages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoads = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('email', user.email)
      .single();

    const { data } = await supabase
      .from('roads')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('name');
    
    setRoads(data || []);
  };

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default center (Vietnam)
    const defaultCenter = [10.8231, 106.6297];
    const center = damages.length > 0 && damages[0].geom?.coordinates
      ? [damages[0].geom.coordinates[1], damages[0].geom.coordinates[0]]
      : defaultCenter;

    const map = L.map(mapRef.current).setView(center, 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add damage markers
    damages.forEach(damage => {
      if (!damage.geom?.coordinates) return;
      
      const [lng, lat] = damage.geom.coordinates;
      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(damage.severity)
      }).addTo(map);

      // Add circle
      L.circle([lat, lng], {
        radius: 15,
        fillColor: damage.severity >= 4 ? '#ef4444' : 
                   damage.severity === 3 ? '#f59e0b' : '#10b981',
        fillOpacity: 0.2,
        color: '#fff',
        weight: 2
      }).addTo(map);

      const popupContent = `
        <div style="min-width: 200px; padding: 8px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${getTypeLabel(damage.type)}</div>
          <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${damage.road?.name || 'N/A'}</div>
          <div style="margin-bottom: 8px;">
            <span style="font-size: 12px; padding: 2px 8px; border-radius: 9999px; background-color: ${
              damage.status === 'pending' ? '#fef3c7' : 
              damage.status === 'in_progress' ? '#dbeafe' : '#d1fae5'
            }; color: ${
              damage.status === 'pending' ? '#92400e' : 
              damage.status === 'in_progress' ? '#1e40af' : '#065f46'
            }">
              ${getStatusLabel(damage.status)}
            </span>
          </div>
          <button 
            onclick="window.handleDamageDetail(${damage.id})"
            style="width: 100%; background-color: #2563eb; color: white; padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 14px;"
          >
            Xem chi tiết
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push({ marker, damage });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  };

  useEffect(() => {
    window.handleDamageDetail = (damageId) => {
      const damage = damages.find(d => d.id === damageId);
      if (damage) {
        setSelectedDamage(damage);
      }
    };

    return () => {
      delete window.handleDamageDetail;
    };
  }, [damages]);

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

  const getStatusLabel = (status) => {
    const statuses = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      in_progress: 'Đang sửa',
      completed: 'Hoàn thành',
      rejected: 'Từ chối',
    };
    return statuses[status] || status;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      1: 'bg-green-500',
      2: 'bg-green-500',
      3: 'bg-yellow-500',
      4: 'bg-red-500',
      5: 'bg-red-500',
    };
    return colors[severity] || colors[3];
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

  const handleDamageCardClick = (damage) => {
    if (mapInstanceRef.current && damage.geom?.coordinates) {
      const [lng, lat] = damage.geom.coordinates;
      mapInstanceRef.current.flyTo([lat, lng], 15, {
        duration: 1
      });
      
      const markerData = markersRef.current.find(m => m.damage.id === damage.id);
      if (markerData) {
        markerData.marker.openPopup();
      }
    }
  };

  const filteredDamages = damages.filter(damage => {
    const matchSeverity = filters.severity === 'all' || damage.severity === parseInt(filters.severity);
    const matchStatus = filters.status === 'all' || damage.status === filters.status;
    const matchType = filters.type === 'all' || damage.type === filters.type;
    return matchSeverity && matchStatus && matchType;
  });

  const stats = {
    high: damages.filter(d => d.severity >= 4).length,
    pending: damages.filter(d => d.status === 'pending').length,
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
              <p className="mt-4 text-gray-600">Đang tải bản đồ...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tuyến đường, địa điểm..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              <span>Bộ lọc</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-6 ml-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.high}</div>
              <div className="text-xs text-gray-500">Nghiêm trọng</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-gray-500">Chờ xử lý</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-gray-500">Hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mức độ nghiêm trọng
                </label>
                <select 
                  value={filters.severity}
                  onChange={(e) => setFilters({...filters, severity: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">Tất cả</option>
                  <option value="5">Rất cao</option>
                  <option value="4">Cao</option>
                  <option value="3">Trung bình</option>
                  <option value="2">Thấp</option>
                  <option value="1">Rất thấp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="in_progress">Đang sửa</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại hư hỏng
                </label>
                <select 
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">Tất cả</option>
                  <option value="pothole">Ổ gà</option>
                  <option value="crack">Nứt vỡ</option>
                  <option value="raveling">Bong tróc</option>
                  <option value="rutting">Rãnh bánh xe</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-200">
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

          {/* Damage Preview */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-[1000]">
            <h4 className="font-semibold mb-3">Hư hỏng gần đây</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredDamages.slice(0, 5).map(damage => (
                <div 
                  key={damage.id}
                  onClick={() => handleDamageCardClick(damage)}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                >
                  <div className={`w-3 h-3 rounded-full mt-1 ${getSeverityColor(damage.severity)}`}></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{getTypeLabel(damage.type)}</div>
                    <div className="text-sm text-gray-500">{damage.road?.name || 'N/A'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(damage.status).color}`}>
                        {getStatusBadge(damage.status).text}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(damage.detected_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/damages')}
              className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem tất cả →
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
            <h4 className="font-semibold mb-3 text-sm">Chú thích</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Nghiêm trọng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Trung bình</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Nhẹ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Damage Detail Modal */}
      {selectedDamage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold">Chi tiết hư hỏng</h3>
              <button
                onClick={() => setSelectedDamage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Loại hư hỏng</div>
                  <div className="font-semibold">{getTypeLabel(selectedDamage.type)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Mức độ</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-white text-sm ${getSeverityColor(selectedDamage.severity)}`}>
                    Mức {selectedDamage.severity}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Vị trí</div>
                  <div className="font-semibold">{selectedDamage.road?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Trạng thái</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusBadge(selectedDamage.status).color}`}>
                    {getStatusBadge(selectedDamage.status).text}
                  </span>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-500 mb-1">Mô tả</div>
                  <div className="text-gray-900">{selectedDamage.description || 'Không có mô tả'}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate(`/tasks?damage=${selectedDamage.id}`)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Tạo công việc sửa chữa
                </button>
                <button 
                  onClick={() => setSelectedDamage(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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

export default RoadMap;