import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  ExternalLink, 
  Eye, 
  Clock, 
  User,
  Heart,
  Share2,
  Download,
  Calendar
} from 'lucide-react';
import { formatDuration, formatDate } from '../services/api';

export const VideoPreviewCarousel = ({ videos = [], onDownload, onSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  useEffect(() => {
    if (isAutoPlay && videos.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % videos.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlay, videos.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!videos.length) return null;

  const currentVideo = videos[currentIndex];
  const platformColors = {
    youtube: 'from-red-500 to-red-600',
    instagram: 'from-purple-500 to-pink-500',
    tiktok: 'from-black to-gray-800',
    facebook: 'from-blue-500 to-blue-600'
  };

  const platformIcons = {
    youtube: '🎬',
    instagram: '📸',
    tiktok: '🎵',
    facebook: '👥'
  };

  return (
    <Card className="glass-card shadow-2xl border-0 overflow-hidden animate-fade-in-scale">
      <CardContent className="p-0">
        {/* Main Carousel */}
        <div className="relative">
          {/* Video Preview */}
          <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            {currentVideo.thumbnail_url ? (
              <img
                src={currentVideo.thumbnail_url}
                alt={currentVideo.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl opacity-50">
                  {platformIcons[currentVideo.platform] || '🎬'}
                </div>
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Platform Badge */}
            <div className="absolute top-4 left-4">
              <Badge className={`bg-gradient-to-r ${platformColors[currentVideo.platform]} text-white border-0 px-3 py-1`}>
                {platformIcons[currentVideo.platform]} {currentVideo.platform}
              </Badge>
            </div>

            {/* Duration */}
            {currentVideo.duration && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-black/50 text-white border-0">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(currentVideo.duration)}
                </Badge>
              </div>
            )}

            {/* Navigation Arrows */}
            {videos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/30 rounded-full p-4"
                onClick={() => window.open(currentVideo.url, '_blank')}
              >
                <Play className="w-8 h-8 fill-current" />
              </Button>
            </div>
          </div>

          {/* Video Info */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Title and Channel */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                  {currentVideo.title}
                </h3>
                {currentVideo.uploader && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{currentVideo.uploader}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                {currentVideo.view_count && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{currentVideo.view_count.toLocaleString()} views</span>
                  </div>
                )}
                {currentVideo.like_count && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{currentVideo.like_count.toLocaleString()}</span>
                  </div>
                )}
                {currentVideo.upload_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(currentVideo.upload_date)}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {currentVideo.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {currentVideo.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => onDownload && onDownload(currentVideo)}
                  className="btn-primary flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(currentVideo.url, '_blank')}
                  className="glass-effect"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: currentVideo.title,
                        url: currentVideo.url
                      });
                    } else {
                      navigator.clipboard.writeText(currentVideo.url);
                    }
                  }}
                  className="glass-effect"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {videos.length > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Videos ({videos.length})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className="text-xs px-2 py-1"
                >
                  {isAutoPlay ? 'Pause' : 'Auto'} Slideshow
                </Button>
              </div>
              
              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto flex-1">
                {videos.map((video, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      index === currentIndex 
                        ? 'border-blue-500 scale-110' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                        {platformIcons[video.platform]}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};