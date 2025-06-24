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
  TrendingUp
} from 'lucide-react';

export const ProfessionalHeader = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-6">
          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              Online Video Downloader
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Fast, reliable, and secure video downloading from multiple platforms
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-2 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Zap className="w-8 h-8 text-yellow-300" />
              <span className="text-sm font-medium">Lightning Fast</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Shield className="w-8 h-8 text-green-300" />
              <span className="text-sm font-medium">Secure</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Globe className="w-8 h-8 text-blue-300" />
              <span className="text-sm font-medium">Multi-Platform</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Star className="w-8 h-8 text-purple-300" />
              <span className="text-sm font-medium">High Quality</span>
            </div>
          </div>

          {/* Platform Support */}
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm">
              <Download className="w-4 h-4 mr-2" />
              YouTube
            </Badge>
            <Badge className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 text-sm">
              <Download className="w-4 h-4 mr-2" />
              Instagram
            </Badge>
            <Badge className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 text-sm">
              <Download className="w-4 h-4 mr-2" />
              TikTok
            </Badge>
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm">
              <Download className="w-4 h-4 mr-2" />
              Facebook
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex justify-center space-x-8 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-yellow-300">1M+</div>
              <div className="text-sm text-blue-200">Downloads</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-300">99.9%</div>
              <div className="text-sm text-blue-200">Uptime</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-300">4.9/5</div>
              <div className="text-sm text-blue-200">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};