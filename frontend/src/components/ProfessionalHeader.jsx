import React from 'react';
import { ThemeToggle } from './ui/theme-toggle';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Download, 
  Sparkles, 
  Shield, 
  Zap,
  Star,
  TrendingUp
} from 'lucide-react';

export const ProfessionalHeader = ({ 
  title = "VideoFlow Pro", 
  subtitle = "Professional Video Downloader",
  showStats = true 
}) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%236366f1" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
      </div>
      
      {/* Content */}
      <div className="relative container-responsive py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Main Title Section */}
          <div className="text-center lg:text-left flex-1">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text animate-fade-in-up">
                  {title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                    {subtitle}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 mb-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Download videos from YouTube, Instagram, TikTok & Facebook with professional quality and lightning speed.
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                <Shield className="w-3 h-3 mr-1" />
                Educational Use Only
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                <Zap className="w-3 h-3 mr-1" />
                Lightning Fast
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                Professional Quality
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <Button size="lg" className="btn-primary px-8 py-3 text-lg font-semibold rounded-xl">
                <Download className="w-5 h-5 mr-2" />
                Start Downloading
              </Button>
              <Button size="lg" variant="outline" className="glass-effect border-2 px-8 py-3 text-lg font-semibold rounded-xl hover:scale-105 transition-all duration-300">
                <TrendingUp className="w-5 h-5 mr-2" />
                View Features
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          {showStats && (
            <div className="lg:flex-shrink-0 animate-slide-in-right">
              <div className="glass-card p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">
                  Platform Support
                </h3>
                <div className="grid grid-cols-2 gap-4 min-w-[200px]">
                  <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                    <div className="text-2xl mb-1">🎬</div>
                    <div className="text-sm font-medium text-red-700 dark:text-red-300">YouTube</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                    <div className="text-2xl mb-1">📸</div>
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Instagram</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-black/5 dark:bg-white/5">
                    <div className="text-2xl mb-1">🎵</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">TikTok</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-2xl mb-1">👥</div>
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Facebook</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle - Positioned absolutely */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};