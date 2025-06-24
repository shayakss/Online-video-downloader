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
  Save,
  FileDown,
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { videoApi, detectPlatform, formatDuration, formatDate } from '../services/api';
import { ProfessionalHeader } from './ProfessionalHeader';
import { BatchProcessor } from './BatchProcessor';
import { VideoPreviewCarousel } from './VideoPreviewCarousel';
import { LoadingSpinner } from './LoadingSpinner';
import NeonPlatformIcon from './NeonPlatformIcon';
import StickerLibrary from './StickerLibrary';
import NeonMediaPlayer from './NeonMediaPlayer';

const VideoDownloader = ({ onDownloadComplete }) => {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('best');
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [previewVideos, setPreviewVideos] = useState([]);
  const [qualityOptions, setQualityOptions] = useState([]);
  const [formatOptions] = useState([
    { value: 'mp4', label: 'MP4 Video', icon: '🎬', type: 'video' },
    { value: 'mp3', label: 'MP3 Audio', icon: '🎵', type: 'audio' },
    { value: 'webm', label: 'WebM Video', icon: '🎞️', type: 'video' },
    { value: 'm4a', label: 'M4A Audio', icon: '🎶', type: 'audio' },
    { value: 'wav', label: 'WAV Audio', icon: '🔊', type: 'audio' }
  ]);
  const [currentDownloads, setCurrentDownloads] = useState([]);
  const [activeTab, setActiveTab] = useState('single');
  const [showStickerLibrary, setShowStickerLibrary] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [showMediaPlayer, setShowMediaPlayer] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [downloadStats, setDownloadStats] = useState({
    totalDownloads: 0,
    activeDownloads: 0,
    completedToday: 0,
    averageSpeed: '0 MB/s'
  });

  const { toast } = useToast();

  const platformColors = {
    youtube: 'from-red-500 via-red-400 to-red-600',
    instagram: 'from-purple-500 via-pink-500 to-orange-400',
    tiktok: 'from-black via-gray-800 to-gray-900',
    facebook: 'from-blue-500 via-blue-400 to-blue-600'
  };

  const platformTextColors = {
    youtube: 'text-red-400',
    instagram: 'text-pink-400',
    tiktok: 'text-gray-400',
    facebook: 'text-blue-400'
  };

  // Update stats when downloads change
  useEffect(() => {
    const activeCount = currentDownloads.filter(d => d.status === 'downloading').length;
    const completedCount = currentDownloads.filter(d => d.status === 'completed').length;
    const speeds = currentDownloads
      .filter(d => d.speed && d.status === 'downloading')
      .map(d => parseFloat(d.speed.split(' ')[0]) || 0);
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    setDownloadStats({
      totalDownloads: currentDownloads.length,
      activeDownloads: activeCount,
      completedToday: completedCount,
      averageSpeed: avgSpeed > 0 ? `${avgSpeed.toFixed(1)} MB/s` : '0 MB/s'
    });
  }, [currentDownloads]);

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
    
    if (!targetVideo) {
      toast({
        title: "No Video Selected",
        description: "Please validate a URL first",
        variant: "destructive"
      });
      return;
    }

    try {
      const downloadRequest = {
        url: videoData ? videoData.url : url,
        quality: selectedQuality,
        format: selectedFormat,
        educational_purpose: true, // Always true for backend compatibility
        user_id: 'user_' + Date.now() // Generate unique user ID
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
        quality: selectedQuality,
        startTime: Date.now()
      };

      setCurrentDownloads(prev => [newDownload, ...prev]);
      
      // Start aggressive polling for faster updates
      pollProgress(response.download_id);
      
      // Clear form for single download
      if (!videoData) {
        setPreviewVideos([]);
        setUrl('');
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
            // Automatically start file download
            try {
              await downloadFileDirectly(downloadId);
              
              // Load full metadata
              const metadata = await videoApi.getMetadata(downloadId);
              setCurrentDownloads(prev => prev.map(download => 
                download.download_id === downloadId 
                  ? { ...download, metadata: metadata.metadata, downloadCompleted: true }
                  : download
              ));
              
              // Notify parent component
              if (onDownloadComplete) {
                onDownloadComplete(downloadId);
              }
              
              toast({
                title: "Download Complete! ✅",
                description: "Video has been downloaded to your device",
              });
            } catch (error) {
              console.error('Failed to download file:', error);
              toast({
                title: "Download Complete",
                description: "File ready for manual download",
              });
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
    }, 1000); // Faster polling - every 1 second

    // Cleanup interval after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 600000);
  };

  const downloadFileDirectly = async (downloadId) => {
    try {
      // Create a temporary link to trigger download
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/download/file/${downloadId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `video_${downloadId}`;
      
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Add extension based on format
      const download = currentDownloads.find(d => d.download_id === downloadId);
      if (download && download.format) {
        const ext = download.format.toLowerCase();
        if (!filename.includes('.')) {
          filename += `.${ext}`;
        }
      }

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Direct download failed:', error);
      throw error;
    }
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
      await downloadFileDirectly(downloadId);
      
      toast({
        title: "File Downloaded 📥",
        description: "Video file has been saved to your device",
      });
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
      setCurrentMedia({
        url: "placeholder.mp4", // Placeholder for demo
        type: download.format === 'mp3' || download.format === 'm4a' || download.format === 'wav' ? 'audio' : 'video',
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
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'downloading': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled': return <X className="w-4 h-4 text-gray-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return null;
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      {/* Professional Header */}
      <ProfessionalHeader />
      
      {/* Stats Dashboard */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Total Downloads</p>
                <p className="text-2xl font-bold text-white">{downloadStats.totalDownloads}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Download className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Active</p>
                <p className="text-2xl font-bold text-white">{downloadStats.activeDownloads}</p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Completed</p>
                <p className="text-2xl font-bold text-white">{downloadStats.completedToday}</p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Avg Speed</p>
                <p className="text-2xl font-bold text-white">{downloadStats.averageSpeed}</p>
              </div>
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Main Download Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mx-auto bg-gray-800/50 border border-gray-700 mb-8">
            <TabsTrigger value="single" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Download className="w-4 h-4" />
              Single Download
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="w-4 h-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Single Download Tab */}
          <TabsContent value="single" className="space-y-6">
            {/* URL Input Section */}
            <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Link className="w-5 h-5 text-white" />
                  </div>
                  <span>Smart URL Analyzer</span>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
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
                      className="flex-1 text-lg py-4 bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 rounded-xl"
                      onKeyPress={(e) => e.key === 'Enter' && validateUrl()}
                    />
                    <Button 
                      onClick={validateUrl} 
                      disabled={isValidating}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl"
                    >
                      {isValidating ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5 mr-2" />
                      )}
                      {isValidating ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>

                  {/* Sticker Section */}
                  {selectedStickers.length > 0 && (
                    <div className="p-4 bg-purple-900/30 rounded-xl border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-300">Selected Stickers:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedStickers.map((sticker, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-600/30 rounded text-sm text-purple-200">
                            {typeof sticker === 'string' ? sticker : '✨'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowStickerLibrary(true)}
                      variant="outline"
                      className="border-purple-500/50 hover:bg-purple-500/10 text-purple-300"
                    >
                      <Smile className="w-4 h-4 mr-2" />
                      Add Stickers
                    </Button>
                  </div>

                  {/* Platform Support Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {Object.keys(platformColors).map((platform) => (
                      <div key={platform} className="text-center p-4 rounded-xl bg-gray-800/30 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                        <div className="mb-3 flex justify-center">
                          <NeonPlatformIcon 
                            platform={platform} 
                            size="w-8 h-8" 
                            className={`${platformTextColors[platform]}`} 
                          />
                        </div>
                        <span className="text-sm font-medium capitalize text-gray-300">{platform}</span>
                        <div className="w-full h-2 bg-gray-700 rounded-full mt-2">
                          <div className={`h-full bg-gradient-to-r ${platformColors[platform]} rounded-full`}></div>
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
                <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Settings className="w-5 h-5" />
                      Download Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Quality Selection */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Quality
                        </label>
                        <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                          <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            {qualityOptions.map(option => (
                              <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700">
                                <div className="flex items-center gap-2">
                                  ⭐ {option.label}
                                  {option.resolution && (
                                    <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
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
                        <label className="block text-sm font-medium text-gray-300">
                          Format
                        </label>
                        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                          <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            {formatOptions.map(format => (
                              <SelectItem key={format.value} value={format.value} className="text-white hover:bg-gray-700">
                                <div className="flex items-center gap-2">
                                  {format.icon} {format.label}
                                  <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
                                    {format.type}
                                  </Badge>
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
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 flex-1 text-lg py-3 rounded-xl"
                        size="lg"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download Now
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.open(previewVideos[0]?.url, '_blank')}
                        className="border-gray-600 hover:bg-gray-700 text-gray-300 px-6"
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
          <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  Download Queue ({currentDownloads.length})
                  <Badge className="bg-blue-600 text-white border-0">
                    Live Updates
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentDownloads([])}
                  className="text-gray-400 hover:text-gray-200 border-gray-600"
                >
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentDownloads.map(download => (
                <div key={download.download_id} className="p-4 rounded-xl bg-gray-900/50 border border-gray-700 hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(download.status)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-white">
                          {download.title || 'Loading...'}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          {download.uploader && (
                            <span className="truncate">{download.uploader}</span>
                          )}
                          <Badge size="sm" className={`bg-gradient-to-r ${platformColors[download.platform]} text-white border-0`}>
                            {download.platform}
                          </Badge>
                          {download.format && (
                            <Badge variant="outline" size="sm" className="border-gray-600 text-gray-300">
                              {download.format.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {download.status === 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => playMedia(download.download_id)}
                            className="text-purple-400 hover:text-purple-300 border-purple-500/50 hover:bg-purple-500/10"
                          >
                            {download.format === 'mp3' || download.format === 'm4a' || download.format === 'wav' ? (
                              <Music className="w-4 h-4" />
                            ) : (
                              <Video className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(download.download_id)}
                            className="text-green-400 hover:text-green-300 border-green-500/50 hover:bg-green-500/10"
                          >
                            <FileDown className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {download.status === 'downloading' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelDownload(download.download_id)}
                          className="text-red-400 hover:text-red-300 border-red-500/50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromList(download.download_id)}
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {download.status === 'downloading' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-300">Progress: {Math.round(download.progress_percent || 0)}%</span>
                        <div className="flex gap-3 text-xs text-gray-500">
                          {download.speed && <span>📡 {download.speed}</span>}
                          {download.eta && <span>⏱️ {download.eta}</span>}
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={download.progress_percent || 0} className="h-3 bg-gray-700" />
                        <div 
                          className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-300 ${getProgressColor(download.progress_percent || 0)}`}
                          style={{ width: `${download.progress_percent || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {download.status === 'failed' && download.error_message && (
                    <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-red-300 text-sm">
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
      
      {/* Sticker Library Modal */}
      <StickerLibrary 
        isVisible={showStickerLibrary}
        onStickerSelect={handleStickerSelect}
        onClose={() => setShowStickerLibrary(false)}
      />
      
      {/* Media Player Modal */}
      {showMediaPlayer && currentMedia && (
        <NeonMediaPlayer
          mediaUrl={currentMedia.url}
          mediaType={currentMedia.type}
          title={currentMedia.title}
          isVisible={showMediaPlayer}
          onClose={() => setShowMediaPlayer(false)}
        />
      )}
    </div>
  );
};

export default VideoDownloader;