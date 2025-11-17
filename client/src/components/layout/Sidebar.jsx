// client/src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MapPin, AlertTriangle, CheckCircle,
  BarChart3, Users, Settings, LogOut, Menu, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/map', icon: MapPin, label: 'Map' },
    { path: '/damages', icon: AlertTriangle, label: 'Damage' },
    { path: '/tasks', icon: CheckCircle, label: 'Work' },
    { path: '/reports', icon: BarChart3, label: 'Report' },
    { path: '/workers', icon: Users, label: 'Staff' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 fixed h-full z-50`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {isOpen && (
          <h1 className="text-2xl font-bold text-blue-600">🛣️ BetterRoad</h1>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(item.path)
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {isOpen && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          {isOpen && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;