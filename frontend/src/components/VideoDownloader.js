import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { Download, Link, Play, Pause, X, CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { videoApi, detectPlatform, formatDuration, formatDate } from '../services/api';

const VideoDownloader = ({ onDownloadComplete }) => {
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('best');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [qualityOptions, setQualityOptions] = useState([]);
  const [currentDownloads, setCurrentDownloads] = useState([]);
  const [educationalConfirm, setEducationalConfirm] = useState(false);

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

  // Load quality options when platform changes
  useEffect(() => {
    if (previewVideo?.platform) {
      loadQualityOptions(previewVideo.platform);
    }
  }, [previewVideo?.platform]);

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
        setPreviewVideo({
          ...response.video_info,
          url: url,
          platform: response.platform
        });
        
        toast({
          title: "Video Found!",
          description: `Ready to download from ${response.platform}`,
        });
      }
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive"
      });
      setPreviewVideo(null);
    } finally {
      setIsValidating(false);
    }
  };

  const startDownload = async () => {
    if (!previewVideo || !educationalConfirm) {
      toast({
        title: "Requirements Not Met",
        description: "Please validate a URL and confirm educational use",
        variant: "destructive"
      });
      return;
    }

    try {
      const downloadRequest = {
        url: url,
        quality: selectedQuality,
        format: 'mp4',
        educational_purpose: educationalConfirm,
        user_id: 'demo_user' // In a real app, get from auth context
      };

      const response = await videoApi.startDownload(downloadRequest);
      
      const newDownload = {
        id: response.download_id,
        download_id: response.download_id,
        url: url,
        platform: response.platform,
        status: 'pending',
        progress_percent: 0,
        title: previewVideo.title,
        thumbnail_url: previewVideo.thumbnail_url,
        uploader: previewVideo.uploader,
        duration: previewVideo.duration
      };

      setCurrentDownloads(prev => [newDownload, ...prev]);
      
      // Start polling for progress
      pollProgress(response.download_id);
      
      // Clear form
      setPreviewVideo(null);
      setUrl('');
      setEducationalConfirm(false);
      setSelectedQuality('best');

      toast({
        title: "Download Started",
        description: `Downloading "${previewVideo.title}"`,
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
                title: "Download Complete!",
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
      await videoApi.downloadFile(downloadId);
      
      toast({
        title: "File Downloaded",
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

          {/* Educational Purpose Confirmation */}
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <input
              type="checkbox"
              id="educational"
              checked={educationalConfirm}
              onChange={(e) => setEducationalConfirm(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="educational" className="text-sm text-green-800 cursor-pointer">
              I confirm this download is for educational purposes only and I respect the platform's terms of service
            </label>
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
              {previewVideo.thumbnail_url && (
                <img 
                  src={previewVideo.thumbnail_url} 
                  alt={previewVideo.title}
                  className="w-32 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{previewVideo.title}</h3>
                {previewVideo.uploader && (
                  <p className="text-gray-600">{previewVideo.uploader}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={platformColors[previewVideo.platform] + ' text-white'}>
                    {previewVideo.platform}
                  </Badge>
                  {previewVideo.duration && (
                    <span className="text-sm text-gray-500">
                      {formatDuration(previewVideo.duration)}
                    </span>
                  )}
                  {previewVideo.view_count && (
                    <span className="text-sm text-gray-500">
                      {previewVideo.view_count.toLocaleString()} views
                    </span>
                  )}
                </div>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Original
                </a>
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
                    {qualityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                        {option.resolution && ` (${option.resolution})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={startDownload}
                  disabled={!educationalConfirm}
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
      {currentDownloads.length > 0 && (
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Current Downloads ({currentDownloads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentDownloads.map(download => (
              <div key={download.download_id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(download.status)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{download.title || 'Loading...'}</h4>
                      {download.uploader && (
                        <p className="text-sm text-gray-600 truncate">{download.uploader}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {download.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(download.download_id)}
                        className="text-green-600 hover:text-green-700"
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
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {download.status === 'downloading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress: {Math.round(download.progress_percent || 0)}%</span>
                      <div className="flex gap-2">
                        {download.speed && <span>Speed: {download.speed}</span>}
                        {download.eta && <span>ETA: {download.eta}</span>}
                      </div>
                    </div>
                    <Progress value={download.progress_percent || 0} className="h-2" />
                  </div>
                )}
                
                {download.status === 'failed' && download.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    Error: {download.error_message}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoDownloader;