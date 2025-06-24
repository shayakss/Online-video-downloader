import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Home, 
  Download, 
  History, 
  Settings, 
  BarChart3 
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/',
      icon: Download,
      label: 'Download',
      isActive: location.pathname === '/'
    },
    {
      path: '/history',
      icon: History,
      label: 'History',
      isActive: location.pathname === '/history'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      isActive: location.pathname === '/settings'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-md mx-auto">
        <Card className="bg-gray-800/95 backdrop-blur-lg shadow-2xl border border-gray-700 rounded-2xl p-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-300
                    ${item.isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                      : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${item.isActive ? 'animate-pulse' : ''}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                  {item.isActive && (
                    <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Navigation;