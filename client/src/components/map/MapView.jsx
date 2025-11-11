import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons cho các mức độ hư hại
const createCustomIcon = (severity) => {
  const colors = {
    low: '#10b981',      // green
    medium: '#f59e0b',   // orange
    high: '#ef4444',     // red
    critical: '#991b1b'  // dark red
  };

  const color = colors[severity] || colors.medium;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Component để fly đến vị trí
const FlyToLocation = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1 });
    }
  }, [position, map]);
  
  return null;
};

// Component DamageMarker
const DamageMarker = ({ damage, onSelect }) => {
  const position = [damage.latitude, damage.longitude];
  
  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      critical: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[severity] || colors.medium;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      in_progress: <AlertTriangle className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || icons.pending;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ xử lý',
      in_progress: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return texts[status] || 'Không xác định';
  };

  return (
    <Marker 
      position={position} 
      icon={createCustomIcon(damage.severity)}
      eventHandlers={{
        click: () => onSelect && onSelect(damage)
      }}
    >
      <Popup maxWidth={300}>
        <div className="p-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Hư hỏng #{damage.id}</h3>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(damage.severity)}`}>
              {damage.severity === 'low' && 'Nhẹ'}
              {damage.severity === 'medium' && 'Trung bình'}
              {damage.severity === 'high' && 'Cao'}
              {damage.severity === 'critical' && 'Nghiêm trọng'}
            </span>
          </div>

          {/* Image */}
          {damage.image_url && (
            <img 
              src={damage.image_url} 
              alt="Damage" 
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
          )}

          {/* Info */}
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Loại:</span>
              <span className="ml-2 font-medium text-gray-900">
                {damage.damage_type === 'pothole' && 'Ổ gà'}
                {damage.damage_type === 'crack' && 'Vết nứt'}
                {damage.damage_type === 'subsidence' && 'Lún'}
                {damage.damage_type === 'other' && 'Khác'}
              </span>
            </div>
            
            {damage.description && (
              <div>
                <span className="text-gray-600">Mô tả:</span>
                <p className="mt-1 text-gray-900">{damage.description}</p>
              </div>
            )}

            <div className="flex items-center gap-1">
              {getStatusIcon(damage.status)}
              <span className="text-gray-600">Trạng thái:</span>
              <span className="ml-1 font-medium text-gray-900">
                {getStatusText(damage.status)}
              </span>
            </div>

            {damage.road_name && (
              <div>
                <span className="text-gray-600">Tuyến đường:</span>
                <span className="ml-2 font-medium text-gray-900">{damage.road_name}</span>
              </div>
            )}

            <div className="text-xs text-gray-500 pt-2 border-t">
              Phát hiện: {new Date(damage.created_at).toLocaleDateString('vi-VN')}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 pt-3 border-t flex gap-2">
            <button 
              onClick={() => onSelect && onSelect(damage)}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      </Popup>

      {/* Circle để highlight vùng hư hại */}
      <Circle
        center={position}
        radius={10}
        pathOptions={{
          fillColor: getSeverityColor(damage.severity).includes('red') ? '#ef4444' : 
                     getSeverityColor(damage.severity).includes('orange') ? '#f59e0b' :
                     getSeverityColor(damage.severity).includes('yellow') ? '#eab308' : '#10b981',
          fillOpacity: 0.2,
          color: '#fff',
          weight: 2
        }}
      />
    </Marker>
  );
};

// Main MapView Component
const MapView = ({ 
  damages = [], 
  center = [10.8231, 106.6297], // Mặc định: TP.HCM
  zoom = 13,
  onDamageSelect,
  selectedDamage,
  height = '600px'
}) => {
  const [flyToPosition, setFlyToPosition] = useState(null);

  useEffect(() => {
    if (selectedDamage) {
      setFlyToPosition([selectedDamage.latitude, selectedDamage.longitude]);
    }
  }, [selectedDamage]);

  return (
    <div className="relative" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render tất cả các marker hư hại */}
        {damages.map((damage) => (
          <DamageMarker 
            key={damage.id} 
            damage={damage}
            onSelect={onDamageSelect}
          />
        ))}

        {/* Fly to selected location */}
        {flyToPosition && <FlyToLocation position={flyToPosition} />}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="font-semibold text-sm mb-2 text-gray-900">Mức độ hư hại</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
            <span>Nhẹ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white"></div>
            <span>Trung bình</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
            <span>Cao</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white"></div>
            <span>Nghiêm trọng</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-600">Tổng hư hại</p>
            <p className="text-lg font-bold text-gray-900">{damages.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;