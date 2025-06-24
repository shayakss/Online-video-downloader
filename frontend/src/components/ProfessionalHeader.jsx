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
import NeonPlatformIcon from './NeonPlatformIcon';

export const ProfessionalHeader = ({ 
  title = "NEON DOWNLOADER", 
  subtitle = "Cyberpunk Video Downloader",
  showStats = true 
}) => {
  return (
    <div className="relative overflow-hidden">
      {/* Neon Background with animated elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Animated neon grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        
        {/* Glowing orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl animate-ping"></div>
      </div>
      
      {/* Content */}
      <div className="relative container-responsive py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Main Title Section */}
          <div className="text-center lg:text-left flex-1">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-neon-lg animate-neon-glow">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse shadow-neon-sm"></div>
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold neon-text animate-fade-in-up animate-neon-pulse">
                  {title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-lg text-cyan-300 font-medium animate-cyberpunk-flicker">
                    {subtitle}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 mb-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Download videos from social platforms with <span className="neon-text-accent">neon-powered</span> technology and <span className="neon-text-secondary">cyberpunk aesthetics</span>.
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <Badge className="bg-green-400/20 text-green-300 border-green-400/50 px-3 py-1 animate-neon-glow">
                <Shield className="w-3 h-3 mr-1" />
                Educational Use Only
              </Badge>
              <Badge className="bg-cyan-400/20 text-cyan-300 border-cyan-400/50 px-3 py-1">
                <Zap className="w-3 h-3 mr-1" />
                Lightning Fast
              </Badge>
              <Badge className="bg-purple-400/20 text-purple-300 border-purple-400/50 px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                Neon Quality
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <Button size="lg" className="btn-neon px-8 py-3 text-lg font-semibold rounded-xl">
                <Download className="w-5 h-5 mr-2" />
                Start Downloading
              </Button>
              <Button size="lg" variant="outline" className="btn-neon border-2 px-8 py-3 text-lg font-semibold rounded-xl">
                <TrendingUp className="w-5 h-5 mr-2" />
                View Features
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          {showStats && (
            <div className="lg:flex-shrink-0 animate-slide-in-right">
              <div className="glass-card p-6 sm:p-8 border border-cyan-400/30">
                <h3 className="text-lg font-semibold neon-text mb-4 text-center">
                  Platform Support
                </h3>
                <div className="grid grid-cols-2 gap-4 min-w-[200px]">
                  <div className="text-center p-3 rounded-xl bg-red-900/20 border border-red-400/30 hover:shadow-neon-md transition-all">
                    <div className="mb-2 flex justify-center">
                      <NeonPlatformIcon platform="youtube" className="text-red-400 w-6 h-6" />
                    </div>
                    <div className="text-sm font-medium text-red-300">YouTube</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-purple-900/20 border border-purple-400/30 hover:shadow-neon-md transition-all">
                    <div className="mb-2 flex justify-center">
                      <NeonPlatformIcon platform="instagram" className="text-purple-400 w-6 h-6" />
                    </div>
                    <div className="text-sm font-medium text-purple-300">Instagram</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-800/20 border border-gray-400/30 hover:shadow-neon-md transition-all">
                    <div className="mb-2 flex justify-center">
                      <NeonPlatformIcon platform="tiktok" className="text-gray-300 w-6 h-6" />
                    </div>
                    <div className="text-sm font-medium text-gray-300">TikTok</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-blue-900/20 border border-blue-400/30 hover:shadow-neon-md transition-all">
                    <div className="mb-2 flex justify-center">
                      <NeonPlatformIcon platform="facebook" className="text-blue-400 w-6 h-6" />
                    </div>
                    <div className="text-sm font-medium text-blue-300">Facebook</div>
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