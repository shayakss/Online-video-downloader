import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, History, Settings } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/',
      icon: Download,
      label: 'Download',
      color: 'text-purple-600'
    },
    {
      path: '/history',
      icon: History,
      label: 'History',
      color: 'text-blue-600'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      color: 'text-green-600'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? `${item.color} bg-gradient-to-t from-gray-100 to-white shadow-lg scale-110` 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                <span className={`text-xs mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-current rounded-full mt-1 animate-bounce" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;