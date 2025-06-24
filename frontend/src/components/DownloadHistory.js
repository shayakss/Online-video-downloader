import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from './ui/toast';
import { 
  Search, 
  Filter, 
  Download, 
  Play, 
  Share2, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  BarChart3,
  TrendingUp,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { videoApi, formatDate, formatDuration } from '../services/api';

const DownloadHistory = ({ refreshTrigger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [downloads, setDownloads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const platformColors = {
    youtube: 'bg-red-500',
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    tiktok: 'bg-black',
    facebook: 'bg-blue-600'
  };

  // Load data on component mount and when refreshTrigger changes
  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  // Handle search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        handleSearch();
      } else if (searchTerm.trim().length === 0) {
        loadDownloads();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle filters
  useEffect(() => {
    if (!searchTerm.trim()) {
      loadDownloads();
    }
  }, [selectedPlatform, statusFilter, sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDownloads(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDownloads = async () => {
    try {
      const params = {
        limit: 100,
        user_id: 'demo_user' // In real app, get from auth context
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (selectedPlatform !== 'all') {
        params.platform = selectedPlatform;
      }

      const response = await videoApi.getHistory(params);
      let downloadsList = response.downloads || [];

      // Apply sorting
      downloadsList = sortDownloads(downloadsList, sortBy);

      setDownloads(downloadsList);
    } catch (error) {
      console.error('Failed to load downloads:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load download history",
        variant: "destructive"
      });
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await videoApi.getStats('demo_user');
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set default stats if loading fails
      setStats({
        total_downloads: 0,
        completed_downloads: 0,
        failed_downloads: 0,
        success_rate: 0,
        platform_stats: {},
        recent_downloads: 0
      });
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) return;

    setSearchLoading(true);
    try {
      const response = await videoApi.searchDownloads(
        searchTerm.trim(),
        'demo_user',
        100
      );
      
      let searchResults = response.downloads || [];
      searchResults = sortDownloads(searchResults, sortBy);
      
      setDownloads(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const sortDownloads = (downloadsList, sortType) => {
    return [...downloadsList].sort((a, b) => {
      switch (sortType) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'name':
          return (a.metadata?.title || '').localeCompare(b.metadata?.title || '');
        case 'platform':
          return a.platform.localeCompare(b.platform);
        default:
          return 0;
      }
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'downloading': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const handleShare = async (download) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: download.metadata?.title || 'Downloaded Video',
          text: `Check out this video: ${download.metadata?.title || 'Downloaded Video'}`,
          url: download.url
        });
        toast({
          title: "Shared!",
          description: "Video shared successfully",
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          fallbackShare(download);
        }
      }
    } else {
      fallbackShare(download);
    }
  };

  const fallbackShare = (download) => {
    navigator.clipboard.writeText(download.url);
    toast({
      title: "Link Copied!",
      description: "Video URL has been copied to clipboard",
    });
  };

  const handleDelete = async (downloadId, videoTitle) => {
    if (window.confirm(`Are you sure you want to delete "${videoTitle}"?`)) {
      try {
        await videoApi.deleteDownload(downloadId);
        
        // Remove from local state
        setDownloads(prev => prev.filter(d => d.download_id !== downloadId));
        
        // Reload stats
        loadStats();
        
        toast({
          title: "Video Deleted",
          description: "Video has been removed from your downloads",
          variant: "destructive"
        });
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: error.message,
          variant: "destructive"
        });
      }
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading download history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          📊 Download History
        </h1>
        <p className="text-gray-600">
          Manage and organize your downloaded videos
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Downloads</p>
                  <p className="text-2xl font-bold">{stats.total_downloads}</p>
                </div>
                <Download className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed_downloads}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.success_rate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Recent</p>
                  <p className="text-2xl font-bold">{stats.recent_downloads}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={searchLoading}
              />
              {searchLoading && (
                <RefreshCw className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
              )}
            </div>

            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="downloading">Downloading</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="platform">Platform</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Platform Distribution */}
      {stats && Object.keys(stats.platform_stats).length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.platform_stats).map(([platform, count]) => (
                <div key={platform} className="text-center p-4 rounded-lg bg-gray-50">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${platformColors[platform]} flex items-center justify-center text-white font-bold`}>
                    {count}
                  </div>
                  <p className="text-sm font-medium capitalize">{platform}</p>
                  <p className="text-xs text-gray-500">
                    {stats.total_downloads > 0 ? ((count / stats.total_downloads) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video List */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Videos ({downloads.length})</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {downloads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No videos found</p>
              <p className="text-gray-400">
                {searchTerm ? 'Try adjusting your search terms' : 'Start downloading some videos!'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {downloads.map(download => (
                <div key={download.download_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex gap-4">
                    {download.metadata?.thumbnail_url && (
                      <img 
                        src={download.metadata.thumbnail_url} 
                        alt={download.metadata.title}
                        className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {download.metadata?.title || 'Unknown Title'}
                          </h3>
                          {download.metadata?.uploader && (
                            <p className="text-gray-600 truncate">{download.metadata.uploader}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {getStatusIcon(download.status)}
                            <Badge 
                              className={`${platformColors[download.platform]} text-white border-0`}
                            >
                              {download.platform}
                            </Badge>
                            {download.metadata?.duration && (
                              <span className="text-sm text-gray-500">
                                {formatDuration(download.metadata.duration)}
                              </span>
                            )}
                            {download.metadata?.file_size && (
                              <span className="text-sm text-gray-500">
                                {download.metadata.file_size}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span>Created: {formatDate(download.created_at)}</span>
                            {download.completed_at && (
                              <span>Completed: {formatDate(download.completed_at)}</span>
                            )}
                          </div>
                          {download.error_message && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                              Error: {download.error_message}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleShare(download)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <a 
                            href={download.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-300 hover:bg-gray-50"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(download.download_id, download.metadata?.title || 'Unknown Video')}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadHistory;