import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, History, Settings, Sparkles } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/',
      icon: Download,
      label: 'Download',
      color: 'from-blue-500 to-purple-600',
      bgColor: 'from-blue-50 to-purple-50',
      darkBgColor: 'from-blue-900/20 to-purple-900/20'
    },
    {
      path: '/history',
      icon: History,
      label: 'History',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      darkBgColor: 'from-green-900/20 to-emerald-900/20'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
      darkBgColor: 'from-orange-900/20 to-red-900/20'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/50 dark:border-gray-700/50">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl"></div>
      
      <div className="relative container-responsive py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'scale-110' 
                    : 'scale-100 hover:scale-105'
                }`}
              >
                {/* Active Background */}
                {isActive && (
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.bgColor} dark:bg-gradient-to-r dark:${item.darkBgColor} rounded-2xl opacity-80`}></div>
                    <div className="absolute inset-0 bg-white/30 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm"></div>
                  </>
                )}
                
                {/* Icon Container */}
                <div className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r ${item.color} shadow-lg` 
                    : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                }`}>
                  <Icon className={`w-5 h-5 transition-all duration-300 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-600 dark:text-gray-300'
                  }`} />
                  
                  {/* Sparkle effect for active */}
                  {isActive && (
                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 animate-pulse" />
                  )}
                </div>
                
                {/* Label */}
                <span className={`relative z-10 text-xs mt-1 font-medium transition-all duration-300 ${
                  isActive 
                    ? `text-transparent bg-gradient-to-r ${item.color} bg-clip-text font-semibold` 
                    : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100'
                }`}>
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <div className={`absolute -bottom-1 w-1 h-1 bg-gradient-to-r ${item.color} rounded-full animate-bounce`} 
                       style={{ animationDelay: '0.5s' }} />
                )}
                
                {/* Hover Glow */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r ${item.color}`}></div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;