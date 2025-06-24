import React from 'react';
import { cn } from '../lib/utils';

export const LoadingSpinner = ({ 
  size = 'default', 
  className = '',
  text = '',
  variant = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'border-blue-500',
    secondary: 'border-purple-500',
    accent: 'border-cyan-500',
    white: 'border-white'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-transparent",
            sizeClasses[size],
            variantClasses[variant]
          )}
          style={{
            borderTopColor: 'currentColor',
            borderRightColor: 'currentColor'
          }}
        />
        <div
          className={cn(
            "absolute top-0 left-0 animate-spin rounded-full border-2 border-transparent opacity-30",
            sizeClasses[size]
          )}
          style={{
            borderBottomColor: 'currentColor',
            borderLeftColor: 'currentColor',
            animationDirection: 'reverse',
            animationDuration: '0.8s'
          }}
        />
      </div>
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export const SkeletonLoader = ({ className = '', children }) => {
  return (
    <div className={cn("animate-pulse", className)}>
      {children || (
        <div className="space-y-3">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded skeleton"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded skeleton w-5/6"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded skeleton w-4/6"></div>
        </div>
      )}
    </div>
  );
};