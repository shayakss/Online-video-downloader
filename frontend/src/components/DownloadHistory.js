import React, { useState } from 'react';
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
  TrendingUp
} from 'lucide-react';

const DownloadHistory = ({ videos, onDeleteVideo, stats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const platformColors = {
    youtube: 'bg-red-500',
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    tiktok: 'bg-black',
    facebook: 'bg-blue-600'
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

  const filteredVideos = videos
    .filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           video.channel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = selectedPlatform === 'all' || video.platform === selectedPlatform;
      const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
      
      return matchesSearch && matchesPlatform && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.downloadedAt || b.uploadDate) - new Date(a.downloadedAt || a.uploadDate);
        case 'oldest':
          return new Date(a.downloadedAt || a.uploadDate) - new Date(b.downloadedAt || b.uploadDate);
        case 'name':
          return a.title.localeCompare(b.title);
        case 'platform':
          return a.platform.localeCompare(b.platform);
        default:
          return 0;
      }
    });

  const handleShare = async (video) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Check out this video: ${video.title}`,
          url: video.url
        });
        toast({
          title: "Shared!",
          description: "Video shared successfully",
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          fallbackShare(video);
        }
      }
    } else {
      fallbackShare(video);
    }
  };

  const fallbackShare = (video) => {
    navigator.clipboard.writeText(video.url);
    toast({
      title: "Link Copied!",
      description: "Video URL has been copied to clipboard",
    });
  };

  const handleDelete = (videoId, videoTitle) => {
    if (window.confirm(`Are you sure you want to delete "${videoTitle}"?`)) {
      onDeleteVideo(videoId);
      toast({
        title: "Video Deleted",
        description: "Video has been removed from your downloads",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Downloads</p>
                <p className="text-2xl font-bold">{stats.totalDownloads}</p>
              </div>
              <Download className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Size</p>
                <p className="text-2xl font-bold">{stats.totalSize}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">This Month</p>
                <p className="text-2xl font-bold">{Math.floor(stats.totalDownloads * 0.3)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

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
              />
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

      {/* Platform Stats */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.platforms).map(([platform, count]) => (
              <div key={platform} className="text-center p-4 rounded-lg bg-gray-50">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${platformColors[platform]} flex items-center justify-center text-white font-bold`}>
                  {count}
                </div>
                <p className="text-sm font-medium capitalize">{platform}</p>
                <p className="text-xs text-gray-500">{((count / stats.totalDownloads) * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video List */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>
            Videos ({filteredVideos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No videos found</p>
              <p className="text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVideos.map(video => (
                <div key={video.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex gap-4">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{video.title}</h3>
                          <p className="text-gray-600 truncate">{video.channel}</p>
                          <div className="flex items-center gap-3 mt-2">
                            {getStatusIcon(video.status)}
                            <Badge 
                              className={`${platformColors[video.platform]} text-white border-0`}
                            >
                              {video.platform}
                            </Badge>
                            <span className="text-sm text-gray-500">{video.duration}</span>
                            <span className="text-sm text-gray-500">{video.fileSize}</span>
                          </div>
                          {video.downloadedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Downloaded: {formatDate(video.downloadedAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          {video.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleShare(video)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(video.id, video.title)}
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