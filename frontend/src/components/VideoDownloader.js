import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';
import { 
  Download, 
  Link, 
  Play, 
  Pause, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Sparkles,
  Zap,
  Users,
  BarChart3,
  Settings,
  Globe,
  Smartphone,
  Star,
  Heart,
  Smile,
  Music,
  Video,
  Save
} from 'lucide-react';
import { videoApi, detectPlatform, formatDuration, formatDate } from '../services/api';
import { ProfessionalHeader } from './ProfessionalHeader';
import { BatchProcessor } from './BatchProcessor';
import { VideoPreviewCarousel } from './VideoPreviewCarousel';
import { LoadingSpinner } from './LoadingSpinner';
import NeonPlatformIcon from './NeonPlatformIcon';
import StickerLibrary from './StickerLibrary';
import NeonMediaPlayer from './NeonMediaPlayer';
import localStorageService from '../services/localStorageService';

const VideoDownloader = ({ onDownloadComplete }) => {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('best');
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [previewVideos, setPreviewVideos] = useState([]);
  const [qualityOptions, setQualityOptions] = useState([]);
  const [formatOptions] = useState([
    { value: 'mp4', label: 'MP4 Video', icon: '🎬' },
    { value: 'mp3', label: 'MP3 Audio', icon: '🎵' },
    { value: 'webm', label: 'WebM Video', icon: '🎞️' },
    { value: 'best', label: 'Best Quality', icon: '⭐' }
  ]);
  const [currentDownloads, setCurrentDownloads] = useState([]);
  const [educationalConfirm, setEducationalConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [showStickerLibrary, setShowStickerLibrary] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [useLocalStorage, setUseLocalStorage] = useState(true);

  const { toast } = useToast();

  const platformColors = {
    youtube: 'from-red-500 via-red-400 to-red-600',
    instagram: 'from-purple-500 via-pink-500 to-orange-400',
    tiktok: 'from-black via-gray-800 to-gray-900',
    facebook: 'from-blue-500 via-blue-400 to-blue-600'
  };

  const neonPlatformColors = {
    youtube: 'text-red-400',
    instagram: 'text-pink-400',
    tiktok: 'text-purple-400',
    facebook: 'text-blue-400'
  };

  // Load quality options when platform changes
  useEffect(() => {
    if (previewVideos.length > 0 && previewVideos[0]?.platform) {
      loadQualityOptions(previewVideos[0].platform);
    }
  }, [previewVideos]);

  const loadQualityOptions = async (platform) => {
    try {
      const response = await videoApi.getQualityOptions(platform);
      setQualityOptions(response.options || []);
    } catch (error) {
      console.error('Failed to load quality options:', error);
      setQualityOptions([{ value: 'best', label: 'Best Available' }]);
    }
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
      const response = await videoApi.validateUrl(url);
      
      if (response.valid && response.video_info) {
        const videoData = {
          ...response.video_info,
          url: url,
          platform: response.platform
        };
        setPreviewVideos([videoData]);
        
        toast({
          title: "Video Found! 🎉",
          description: `Ready to download from ${response.platform}`,
        });
      }
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive"
      });
      setPreviewVideos([]);
    } finally {
      setIsValidating(false);
    }
  };

  const startDownload = async (videoData = null) => {
    const targetVideo = videoData || previewVideos[0];
    
    if (!targetVideo || !educationalConfirm) {
      toast({
        title: "Requirements Not Met",
        description: "Please validate a URL and confirm educational use",
        variant: "destructive"
      });
      return;
    }

    try {
      const downloadRequest = {
        url: videoData ? videoData.url : url,
        quality: selectedQuality,
        format: selectedFormat,
        educational_purpose: educationalConfirm,
        user_id: 'demo_user' // In a real app, get from auth context
      };

      const response = await videoApi.startDownload(downloadRequest);
      
      const newDownload = {
        id: response.download_id,
        download_id: response.download_id,
        url: downloadRequest.url,
        platform: response.platform,
        status: 'pending',
        progress_percent: 0,
        title: targetVideo.title,
        thumbnail_url: targetVideo.thumbnail_url,
        uploader: targetVideo.uploader,
        duration: targetVideo.duration,
        format: selectedFormat,
        quality: selectedQuality
      };

      setCurrentDownloads(prev => [newDownload, ...prev]);
      
      // Start polling for progress
      pollProgress(response.download_id);
      
      // Clear form for single download
      if (!videoData) {
        setPreviewVideos([]);
        setUrl('');
        setEducationalConfirm(false);
        setSelectedQuality('best');
      }

      toast({
        title: "Download Started! 🚀",
        description: `Downloading "${targetVideo.title}"`,
      });

    } catch (error) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const pollProgress = async (downloadId) => {
    const pollInterval = setInterval(async () => {
      try {
        const progressData = await videoApi.getProgress(downloadId);
        
        setCurrentDownloads(prev => prev.map(download => 
          download.download_id === downloadId 
            ? { 
                ...download, 
                status: progressData.status,
                progress_percent: progressData.progress_percent || 0,
                speed: progressData.speed,
                eta: progressData.eta,
                error_message: progressData.error_message
              }
            : download
        ));
        
        // Stop polling if completed or failed
        if (progressData.status === 'completed' || progressData.status === 'failed') {
          clearInterval(pollInterval);
          
          if (progressData.status === 'completed') {
            // Load full metadata
            try {
              const metadata = await videoApi.getMetadata(downloadId);
              setCurrentDownloads(prev => prev.map(download => 
                download.download_id === downloadId 
                  ? { ...download, metadata: metadata.metadata }
                  : download
              ));
              
              // Notify parent component
              if (onDownloadComplete) {
                onDownloadComplete(downloadId);
              }
              
              toast({
                title: "Download Complete! ✅",
                description: "Video has been downloaded successfully",
              });
            } catch (error) {
              console.error('Failed to load metadata:', error);
            }
          } else if (progressData.status === 'failed') {
            toast({
              title: "Download Failed",
              description: progressData.error_message || "Download failed",
              variant: "destructive"
            });
          }
        }
        
      } catch (error) {
        console.error('Failed to get progress:', error);
        clearInterval(pollInterval);
      }
    }, 2000);

    // Cleanup interval after 10 minutes to prevent memory leaks
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 600000);
  };

  const cancelDownload = async (downloadId) => {
    try {
      await videoApi.cancelDownload(downloadId);
      
      setCurrentDownloads(prev => prev.map(download => 
        download.download_id === downloadId 
          ? { ...download, status: 'cancelled' }
          : download
      ));
      
      toast({
        title: "Download Cancelled",
        description: "Download has been stopped",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Cancel Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const downloadFile = async (downloadId) => {
    try {
      if (useLocalStorage) {
        // Store in local storage instead of direct download
        const download = currentDownloads.find(d => d.download_id === downloadId);
        if (download && download.metadata) {
          await localStorageService.downloadAndStore(downloadId, download.metadata);
          
          toast({
            title: "Saved to Local Storage! 💾",
            description: "Video has been saved to your local storage",
          });
        }
      } else {
        // Traditional file download
        await videoApi.downloadFile(downloadId);
        
        toast({
          title: "File Downloaded 📥",
          description: "Video file has been saved to your device",
        });
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStickerSelect = (sticker) => {
    setSelectedStickers(prev => [...prev, sticker]);
    setShowStickerLibrary(false);
    toast({
      title: "Sticker Added! ✨",
      description: "Sticker has been added to your collection",
    });
  };

  const playMedia = (downloadId) => {
    const download = currentDownloads.find(d => d.download_id === downloadId);
    if (download) {
      // For demo purposes, we'll use a placeholder URL
      // In real implementation, this would be the actual file URL
      setCurrentMedia({
        url: localStorageService.getFileUrl(downloadId) || "placeholder.mp4",
        type: localStorageService.getFileType(downloadId) || 'video',
        title: download.title || 'Downloaded Media'
      });
      setShowMediaPlayer(true);
    }
  };

  const removeFromList = (downloadId) => {
    setCurrentDownloads(prev => prev.filter(d => d.download_id !== downloadId));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'downloading': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-gray-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen">
      {/* Professional Header */}
      <ProfessionalHeader />
      
      <div className="container-responsive py-8 space-y-8">
        {/* Main Download Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mx-auto glass-effect mb-8">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Single Download
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Single Download Tab */}
          <TabsContent value="single" className="space-y-6">
            {/* URL Input Section */}
            <Card className="glass-card shadow-2xl border-0 animate-fade-in-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Link className="w-5 h-5 text-white" />
                  </div>
                  Smart URL Analyzer
                  <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0">
                    AI Powered
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="🔗 Paste your video URL here (YouTube, Instagram, TikTok, Facebook)..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 input-professional text-lg py-4"
                      onKeyPress={(e) => e.key === 'Enter' && validateUrl()}
                    />
                    <Button 
                      onClick={validateUrl} 
                      disabled={isValidating}
                      size="lg"
                      className="btn-primary px-8 py-4"
                    >
                      {isValidating ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Sparkles className="w-5 h-5 mr-2" />
                      )}
                      {isValidating ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>

                  {/* Educational Purpose Confirmation */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                    <input
                      type="checkbox"
                      id="educational"
                      checked={educationalConfirm}
                      onChange={(e) => setEducationalConfirm(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-green-300 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="educational" className="text-sm text-green-800 dark:text-green-300 cursor-pointer flex-1">
                      ✅ I confirm this download is for educational purposes only and I respect the platform's terms of service
                    </label>
                  </div>

                  {/* Platform Support Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {Object.keys(neonPlatformColors).map((platform) => (
                      <div key={platform} className="text-center p-4 rounded-xl glass-effect hover:scale-105 transition-all duration-300 hover:shadow-neon-md">
                        <div className="mb-3 flex justify-center">
                          <NeonPlatformIcon 
                            platform={platform} 
                            size="w-8 h-8" 
                            className={`${neonPlatformColors[platform]} animate-neon-pulse`} 
                          />
                        </div>
                        <span className="text-sm font-medium capitalize neon-text">{platform}</span>
                        <div className="w-full h-1 bg-gray-700 rounded-full mt-2">
                          <div className={`h-full bg-gradient-to-r ${platformColors[platform]} rounded-full animate-neon-glow`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Preview */}
            {previewVideos.length > 0 && (
              <div className="space-y-6">
                <VideoPreviewCarousel 
                  videos={previewVideos}
                  onDownload={startDownload}
                />

                {/* Download Options */}
                <Card className="glass-card shadow-xl border-0 animate-fade-in-up">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Download Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Quality Selection */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Quality
                        </label>
                        <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                          <SelectTrigger className="input-professional">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-card border-0">
                            {qualityOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  ⭐ {option.label}
                                  {option.resolution && (
                                    <Badge variant="outline" className="text-xs">
                                      {option.resolution}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Format Selection */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Format
                        </label>
                        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                          <SelectTrigger className="input-professional">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-card border-0">
                            {formatOptions.map(format => (
                              <SelectItem key={format.value} value={format.value}>
                                <div className="flex items-center gap-2">
                                  {format.icon} {format.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button 
                        onClick={() => startDownload()}
                        disabled={!educationalConfirm}
                        className="btn-success flex-1 text-lg py-3"
                        size="lg"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download Now
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.open(previewVideos[0]?.url, '_blank')}
                        className="glass-effect px-6"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent value="batch" className="space-y-6">
            <BatchProcessor onDownloadComplete={onDownloadComplete} />
          </TabsContent>
        </Tabs>

        {/* Active Downloads */}
        {currentDownloads.length > 0 && (
          <Card className="glass-card shadow-2xl border-0 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  Download Queue ({currentDownloads.length})
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Live Updates
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDownloads([])}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentDownloads.map(download => (
                <div key={download.download_id} className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(download.status)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-gray-900 dark:text-white">
                          {download.title || 'Loading...'}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {download.uploader && (
                            <span className="truncate">{download.uploader}</span>
                          )}
                          <Badge size="sm" className={`bg-gradient-to-r ${platformColors[download.platform]} text-white border-0`}>
                            {download.platform}
                          </Badge>
                          {download.format && (
                            <Badge variant="outline" size="sm">
                              {download.format.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {download.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(download.download_id)}
                          className="text-green-600 hover:text-green-700 glass-effect"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {download.status === 'downloading' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelDownload(download.download_id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromList(download.download_id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {download.status === 'downloading' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Progress: {Math.round(download.progress_percent || 0)}%</span>
                        <div className="flex gap-3 text-xs text-gray-500">
                          {download.speed && <span>📡 {download.speed}</span>}
                          {download.eta && <span>⏱️ {download.eta}</span>}
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={download.progress_percent || 0} className="h-3" />
                        <div 
                          className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-300 ${getProgressColor(download.progress_percent || 0)}`}
                          style={{ width: `${download.progress_percent || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {download.status === 'failed' && download.error_message && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Error: {download.error_message}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideoDownloader;