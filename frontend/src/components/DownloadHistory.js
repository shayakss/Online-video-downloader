import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
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
  RefreshCw,
  Grid3X3,
  List,
  FileDown,
  Calendar,
  User,
  Globe,
  Eye
} from 'lucide-react';
import { videoApi, formatDate, formatDuration } from '../services/api';

const DownloadHistory = ({ refreshTrigger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [downloads, setDownloads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const { toast } = useToast();

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
        user_id: 'demo_user'
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
        
        setDownloads(prev => prev.filter(d => d.download_id !== downloadId));
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading download history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            📊 Download History
          </h1>
          <p className="text-lg text-gray-600">
            Manage and organize your downloaded videos
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Downloads</p>
                    <p className="text-3xl font-bold">{stats.total_downloads}</p>
                    <p className="text-blue-200 text-xs mt-1">All time</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <Download className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold">{stats.completed_downloads}</p>
                    <p className="text-green-200 text-xs mt-1">Successfully downloaded</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Success Rate</p>
                    <p className="text-3xl font-bold">{stats.success_rate}%</p>
                    <p className="text-purple-200 text-xs mt-1">Download efficiency</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <TrendingUp className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Recent</p>
                    <p className="text-3xl font-bold">{stats.recent_downloads}</p>
                    <p className="text-orange-200 text-xs mt-1">Last 24 hours</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <Clock className="w-8 h-8 text-orange-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Filters */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-6 h-6" />
                Filters & Search
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="p-2"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="p-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search videos, channels, or URLs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  disabled={searchLoading}
                />
                {searchLoading && (
                  <RefreshCw className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
                )}
              </div>

              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 rounded-xl">
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
                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 rounded-xl">
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
                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 rounded-xl">
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
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Platform Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(stats.platform_stats).map(([platform, count]) => (
                  <div key={platform} className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${platformColors[platform]} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {count}
                    </div>
                    <p className="text-lg font-semibold capitalize text-gray-800">{platform}</p>
                    <p className="text-sm text-gray-500">
                      {stats.total_downloads > 0 ? ((count / stats.total_downloads) * 100).toFixed(1) : 0}% of total
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video List/Grid */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Videos ({downloads.length})
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadData}
                disabled={loading}
                className="border-2 border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {downloads.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <Download className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-xl text-gray-500 mb-2">No videos found</p>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start downloading some videos!'}
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {downloads.map(download => (
                  <div key={download.download_id} className={`
                    border rounded-xl hover:shadow-lg transition-all duration-300 bg-white overflow-hidden
                    ${viewMode === 'grid' ? 'p-0' : 'p-6'}
                  `}>
                    {viewMode === 'grid' ? (
                      // Grid View
                      <div className="space-y-4">
                        {download.metadata?.thumbnail_url && (
                          <div className="relative">
                            <img 
                              src={download.metadata.thumbnail_url} 
                              alt={download.metadata.title}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-3 left-3">
                              <Badge className={`${platformColors[download.platform]} text-white border-0`}>
                                {download.platform}
                              </Badge>
                            </div>
                            <div className="absolute top-3 right-3">
                              {getStatusIcon(download.status)}
                            </div>
                          </div>
                        )}
                        <div className="p-4 space-y-3">
                          <h3 className="font-semibold text-lg line-clamp-2">
                            {download.metadata?.title || 'Unknown Title'}
                          </h3>
                          {download.metadata?.uploader && (
                            <p className="text-gray-600 flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {download.metadata.uploader}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(download.created_at)}
                            </span>
                            {download.metadata?.duration && (
                              <span>{formatDuration(download.metadata.duration)}</span>
                            )}
                          </div>
                          <div className="flex gap-2 pt-2">
                            {download.status === 'completed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => downloadFile(download.download_id)}
                                className="flex-1 text-green-600 hover:text-green-700 border-green-200"
                              >
                                <FileDown className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleShare(download)}
                              className="flex-1"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(download.download_id, download.metadata?.title || 'Unknown Video')}
                              className="text-red-500 hover:text-red-700 border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // List View  
                      <div className="flex gap-4">
                        {download.metadata?.thumbnail_url && (
                          <img 
                            src={download.metadata.thumbnail_url} 
                            alt={download.metadata.title}
                            className="w-40 h-28 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xl truncate mb-2">
                                {download.metadata?.title || 'Unknown Title'}
                              </h3>
                              {download.metadata?.uploader && (
                                <p className="text-gray-600 truncate mb-3 flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  {download.metadata.uploader}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mb-3">
                                {getStatusIcon(download.status)}
                                <Badge 
                                  className={`${platformColors[download.platform]} text-white border-0`}
                                >
                                  {download.platform}
                                </Badge>
                                {download.metadata?.duration && (
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatDuration(download.metadata.duration)}
                                  </span>
                                )}
                                {download.metadata?.file_size && (
                                  <span className="text-sm text-gray-500">
                                    {download.metadata.file_size}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-6 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Created: {formatDate(download.created_at)}
                                </span>
                                {download.completed_at && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    Completed: {formatDate(download.completed_at)}
                                  </span>
                                )}
                              </div>
                              {download.error_message && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-center gap-2 text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    Error: {download.error_message}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-6">
                              {download.status === 'completed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => downloadFile(download.download_id)}
                                  className="text-green-600 hover:text-green-700 border-green-200"
                                >
                                  <FileDown className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleShare(download)}
                                className="border-gray-200 hover:bg-gray-50"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <a 
                                href={download.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-9 h-9 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(download.download_id, download.metadata?.title || 'Unknown Video')}
                                className="text-red-500 hover:text-red-700 border-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DownloadHistory;