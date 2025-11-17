// client/src/pages/RoadMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Search, Filter, AlertTriangle, X, ChevronDown
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import api from '../lib/axios';

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
  const [searchQuery, setSearchQuery] = useState('');
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
    if (!loading && !mapInstanceRef.current && mapRef.current) {
      initializeMap();
    }
  }, [loading, damages]);

  const fetchDamages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/damages');

      if (data.success && data.data) {
        // Filter damages with valid coordinates (using location JSONB format)
        const validDamages = (data.data || []).filter(d => {
          const location = d.location;
          return location &&
            typeof location.lat === 'number' &&
            typeof location.lng === 'number' &&
            !isNaN(location.lat) &&
            !isNaN(location.lng);
        });

        setDamages(validDamages);
      } else {
        setDamages([]);
      }
    } catch (error) {
      console.error('Error fetching damages:', error);
      setDamages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoads = async () => {
    try {
      const { data } = await api.get('/damages/roads');
      if (data.success && data.data) {
        setRoads(data.data || []);
      } else {
        setRoads([]);
      }
    } catch (error) {
      console.error('Error fetching roads:', error);
      setRoads([]);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default center (Vietnam - Ho Chi Minh City)
    const defaultCenter = [10.8231, 106.6297];
    const zoom = 10;

    // Try to get center from first damage if available
    let center = defaultCenter;
    if (damages.length > 0 && damages[0].location) {
      const firstDamage = damages[0];
      if (firstDamage.location.lat && firstDamage.location.lng) {
        center = [firstDamage.location.lat, firstDamage.location.lng];
      }
    }

    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Markers will be added by the useEffect that handles filteredDamages
  };

  // Helper function to create popup content (used by both initializeMap and useEffect)
  const createPopupContent = (damage) => {
    // Build images HTML
    const imagesHtml = damage.images && damage.images.length > 0
      ? `
        <div style="margin-bottom: 8px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Hình ảnh:</div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${damage.images.slice(0, 3).map((img, idx) => `
              <img 
                src="${img}" 
                alt="Damage image ${idx + 1}"
                style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #e5e7eb;"
                onclick="window.openImageModal('${img.replace(/'/g, "\\'")}')"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'60\\'%3E%3Crect width=\\'60\\' height=\\'60\\' fill=\\'%23f3f4f6\\'/%3E%3Ctext x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%239ca3af\\' font-size=\\'10\\'%3EImage%3C/text%3E%3C/svg%3E'"
              />
            `).join('')}
            ${damage.images.length > 3 ? `<div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280;">+${damage.images.length - 3}</div>` : ''}
          </div>
        </div>
      `
      : '';

    return `
      <div style="min-width: 250px; max-width: 300px; padding: 8px;">
        <div style="font-weight: 600; margin-bottom: 4px; font-size: 16px;">${(damage.title || getTypeLabel(damage.type) || 'Hư hỏng').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
          <span style="display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${(damage.road?.name || damage.location?.address || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </span>
        </div>
        ${imagesHtml}
        <div style="margin-bottom: 8px;">
          <span style="font-size: 12px; padding: 4px 10px; border-radius: 9999px; background-color: ${damage.status === 'pending' ? '#fef3c7' :
        damage.status === 'in_progress' ? '#dbeafe' :
          damage.status === 'completed' ? '#d1fae5' : '#f3f4f6'
      }; color: ${damage.status === 'pending' ? '#92400e' :
        damage.status === 'in_progress' ? '#1e40af' :
          damage.status === 'completed' ? '#065f46' : '#374151'
      }">
            ${getStatusLabel(damage.status)}
          </span>
        </div>
        <button 
          onclick="window.handleDamageDetail('${damage.id}')"
          style="width: 100%; background-color: #2563eb; color: white; padding: 8px 12px; border-radius: 6px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s;"
          onmouseover="this.style.backgroundColor='#1d4ed8'"
          onmouseout="this.style.backgroundColor='#2563eb'"
        >
          Xem chi tiết
        </button>
      </div>
    `;
  };


  useEffect(() => {
    window.handleDamageDetail = (damageId) => {
      const damage = damages.find(d => d.id === damageId);
      if (damage) {
        setSelectedDamage(damage);
      }
    };

    // Image modal handler
    window.openImageModal = (imageUrl) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
      `;

      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
      `;

      modal.appendChild(img);
      document.body.appendChild(modal);

      modal.onclick = () => {
        document.body.removeChild(modal);
      };
    };

    return () => {
      delete window.handleDamageDetail;
      delete window.openImageModal;
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
    if (mapInstanceRef.current && damage.location) {
      const lat = damage.location.lat;
      const lng = damage.location.lng;

      if (lat && lng) {
        mapInstanceRef.current.flyTo([lat, lng], 15, {
          duration: 1
        });

        const markerData = markersRef.current.find(m => m.damage.id === damage.id);
        if (markerData) {
          markerData.marker.openPopup();
        }
      }
    }
  };

  const filteredDamages = damages.filter(damage => {
    // Convert severity to number for comparison
    const severityNum = typeof damage.severity === 'string'
      ? (damage.severity === 'critical' ? 5 : damage.severity === 'high' ? 4 : damage.severity === 'medium' ? 3 : 2)
      : damage.severity;

    const matchSeverity = filters.severity === 'all' || severityNum === parseInt(filters.severity);
    const matchStatus = filters.status === 'all' || damage.status === filters.status;
    const matchType = filters.type === 'all' || damage.type === filters.type;

    // Search filter
    const matchSearch = !searchQuery ||
      (damage.title && damage.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (damage.description && damage.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (damage.road?.name && damage.road.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (damage.location?.address && damage.location.address.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchSeverity && matchStatus && matchType && matchSearch;
  });

  // Handle search and update map markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker }) => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add filtered markers
    filteredDamages.forEach(damage => {
      if (!damage.location || !damage.location.lat || !damage.location.lng) return;

      const lat = damage.location.lat;
      const lng = damage.location.lng;

      const severityNum = typeof damage.severity === 'string'
        ? (damage.severity === 'critical' ? 5 : damage.severity === 'high' ? 4 : damage.severity === 'medium' ? 3 : 2)
        : damage.severity;

      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(severityNum)
      }).addTo(mapInstanceRef.current);

      L.circle([lat, lng], {
        radius: 15,
        fillColor: severityNum >= 4 ? '#ef4444' :
          severityNum === 3 ? '#f59e0b' : '#10b981',
        fillOpacity: 0.2,
        color: '#fff',
        weight: 2
      }).addTo(mapInstanceRef.current);

      const popupContent = createPopupContent(damage);
      marker.bindPopup(popupContent);
      markersRef.current.push({ marker, damage });
    });
  }, [filteredDamages, searchQuery]);

  const stats = {
    high: damages.filter(d => {
      const severityNum = typeof d.severity === 'string'
        ? (d.severity === 'critical' ? 5 : d.severity === 'high' ? 4 : 3)
        : d.severity;
      return severityNum >= 4;
    }).length,
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
                placeholder="Tìm kiếm tuyến đường, địa điểm, tiêu đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
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
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
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
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
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
                  <div className={`w-3 h-3 rounded-full mt-1 ${(() => {
                    const severityNum = typeof damage.severity === 'string'
                      ? (damage.severity === 'critical' ? 5 : damage.severity === 'high' ? 4 : damage.severity === 'medium' ? 3 : 2)
                      : damage.severity;
                    return getSeverityColor(severityNum);
                  })()}`}></div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{damage.title || getTypeLabel(damage.type) || 'Hư hỏng'}</div>
                    <div className="text-sm text-gray-500">{damage.road?.name || damage.location?.address || 'N/A'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(damage.status).color}`}>
                        {getStatusBadge(damage.status).text}
                      </span>
                      <span className="text-xs text-gray-400">
                        {damage.created_at ? new Date(damage.created_at).toLocaleDateString('vi-VN') : 'N/A'}
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