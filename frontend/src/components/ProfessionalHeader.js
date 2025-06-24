import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Download, 
  Globe, 
  Shield, 
  Zap,
  Star,
  CheckCircle,
  Users,
  TrendingUp,
  Activity
} from 'lucide-react';

export const ProfessionalHeader = () => {
  return (
    <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-6">
          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Online Video Downloader
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Lightning-fast downloads with advanced performance monitoring
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-2 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-gray-700">
              <Zap className="w-8 h-8 text-yellow-400" />
              <span className="text-sm font-medium text-gray-300">Lightning Fast</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-gray-700">
              <Shield className="w-8 h-8 text-green-400" />
              <span className="text-sm font-medium text-gray-300">Secure</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-gray-700">
              <Globe className="w-8 h-8 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Multi-Platform</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-gray-700">
              <Activity className="w-8 h-8 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Real-time Analytics</span>
            </div>
          </div>

          {/* Platform Support */}
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm border-0">
              <Download className="w-4 h-4 mr-2" />
              YouTube
            </Badge>
            <Badge className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 text-sm border-0">
              <Download className="w-4 h-4 mr-2" />
              Instagram
            </Badge>
            <Badge className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 text-sm border-0">
              <Download className="w-4 h-4 mr-2" />
              TikTok
            </Badge>
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm border-0">
              <Download className="w-4 h-4 mr-2" />
              Facebook
            </Badge>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">1M+</div>
              <div className="text-sm text-gray-400">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">99.9%</div>
              <div className="text-sm text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">50MB/s</div>
              <div className="text-sm text-gray-400">Peak Speed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">4.9/5</div>
              <div className="text-sm text-gray-400">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};