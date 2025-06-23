import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from './ui/toast';
import { Download, Link, Play, Pause, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { detectPlatform, generateMockVideo, mockApiDelay } from '../data/mock';

const VideoDownloader = ({ videos, onAddVideo, onUpdateVideo, currentDownloads, setCurrentDownloads }) => {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('best');
  const [previewVideo, setPreviewVideo] = useState(null);

  const platformColors = {
    youtube: 'bg-red-500',
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    tiktok: 'bg-black',
    facebook: 'bg-blue-600'
  };

  const platformIcons = {
    youtube: '🎬',
    instagram: '📸',
    tiktok: '🎵',
    facebook: '👥'
  };

  const validateUrl = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a video URL",
        variant: "destructive"
      });
      return;
    }

    const platform = detectPlatform(url);
    if (!platform) {
      toast({
        title: "Unsupported Platform",
        description: "Please enter a valid YouTube, Instagram, TikTok, or Facebook video URL",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    
    try {
      // Mock API call to validate URL
      await mockApiDelay(1500, 3000);
      
      const mockVideo = generateMockVideo(url, platform);
      setPreviewVideo(mockVideo);
      
      toast({
        title: "Video Found!",
        description: `Ready to download from ${platform}`,
      });
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Could not fetch video information. Please check the URL.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const startDownload = async () => {
    if (!previewVideo) return;

    const videoWithQuality = {
      ...previewVideo,
      selectedQuality,
      status: 'downloading',
      downloadProgress: 0
    };

    onAddVideo(videoWithQuality);
    setCurrentDownloads(prev => [...prev, videoWithQuality.id]);
    setPreviewVideo(null);
    setUrl('');

    toast({
      title: "Download Started",
      description: `Downloading "${videoWithQuality.title}" in ${selectedQuality} quality`,
    });

    // Simulate download progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onUpdateVideo(videoWithQuality.id, {
          status: 'completed',
          downloadProgress: 100,
          downloadedAt: new Date().toISOString()
        });
        setCurrentDownloads(prev => prev.filter(id => id !== videoWithQuality.id));
        
        toast({
          title: "Download Complete!",
          description: `"${videoWithQuality.title}" has been downloaded successfully`,
        });
      } else {
        onUpdateVideo(videoWithQuality.id, { downloadProgress: Math.floor(progress) });
      }
    }, 500);
  };

  const cancelDownload = (videoId) => {
    onUpdateVideo(videoId, { status: 'cancelled', downloadProgress: 0 });
    setCurrentDownloads(prev => prev.filter(id => id !== videoId));
    
    toast({
      title: "Download Cancelled",
      description: "Download has been stopped",
      variant: "destructive"
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'downloading': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const activeDownloads = videos.filter(video => currentDownloads.includes(video.id));

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          📱 Video Downloader PWA
        </h1>
        <p className="text-gray-600 text-lg">
          Download videos from YouTube, Instagram, TikTok & Facebook
        </p>
        <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
          Educational Use Only
        </Badge>
      </div>

      {/* URL Input Section */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Enter Video URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Paste YouTube, Instagram, TikTok, or Facebook video URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && validateUrl()}
            />
            <Button 
              onClick={validateUrl} 
              disabled={isValidating}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </Button>
          </div>

          {/* Platform Support Indicators */}
          <div className="flex justify-center gap-4 mt-6">
            {Object.entries(platformIcons).map(([platform, icon]) => (
              <div key={platform} className="text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <span className="text-xs text-gray-500 capitalize">{platform}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {previewVideo && (
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Video Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <img 
                src={previewVideo.thumbnail} 
                alt={previewVideo.title}
                className="w-32 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{previewVideo.title}</h3>
                <p className="text-gray-600">{previewVideo.channel}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={platformColors[previewVideo.platform]}>
                    {previewVideo.platform}
                  </Badge>
                  <span className="text-sm text-gray-500">{previewVideo.duration}</span>
                  <span className="text-sm text-gray-500">{previewVideo.fileSize}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Quality</label>
                <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best">Best Available</SelectItem>
                    {previewVideo.qualityOptions.map(quality => (
                      <SelectItem key={quality} value={quality}>{quality}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={startDownload}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Downloads */}
      {activeDownloads.length > 0 && (
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Active Downloads ({activeDownloads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDownloads.map(video => (
              <div key={video.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(video.status)}
                    <div>
                      <h4 className="font-medium">{video.title}</h4>
                      <p className="text-sm text-gray-600">{video.channel}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelDownload(video.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {video.downloadProgress}%</span>
                    <span>{video.fileSize}</span>
                  </div>
                  <Progress value={video.downloadProgress} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Downloads */}
      {videos.length > 0 && (
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {videos.slice(0, 4).map(video => (
                <div key={video.id} className="flex gap-3 p-3 border rounded-lg bg-gray-50">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{video.title}</h4>
                    <p className="text-sm text-gray-600 truncate">{video.channel}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(video.status)}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${platformColors[video.platform]} text-white border-0`}
                      >
                        {video.platform}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoDownloader;