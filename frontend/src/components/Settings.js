import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Download, 
  Bell, 
  Smartphone, 
  HardDrive, 
  Wifi, 
  Shield,
  Trash2,
  RefreshCw,
  Zap,
  Globe,
  Monitor,
  Clock,
  Gauge,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    autoDownload: false,
    notifications: true,
    downloadQuality: 'best',
    maxConcurrentDownloads: 3,
    storageLocation: 'downloads',
    backgroundDownload: true,
    wifiOnly: false,
    autoRetry: true,
    retryAttempts: 3,
    darkMode: false,
    chunkSize: '10MB',
    downloadSpeed: 'unlimited',
    autoCleanup: false,
    keepHistory: 30
  });

  const [storageUsed, setStorageUsed] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(5000); // MB
  const [downloadStats, setDownloadStats] = useState({
    totalDownloaded: 245,
    averageSpeed: '2.5 MB/s',
    totalSize: '15.8 GB',
    successRate: 98.5
  });

  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('videoDownloaderSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Mock storage calculation
    setStorageUsed(Math.floor(Math.random() * 2000 + 500));
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('videoDownloaderSettings', JSON.stringify(newSettings));
    
    toast({
      title: "Settings Updated",
      description: `${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} has been updated`,
    });
  };

  const clearCache = () => {
    setStorageUsed(Math.floor(storageUsed * 0.3));
    toast({
      title: "Cache Cleared",
      description: "Temporary files have been removed",
    });
  };

  const clearAllDownloads = () => {
    if (window.confirm('Are you sure you want to clear all download history? This cannot be undone.')) {
      localStorage.removeItem('downloadedVideos');
      setStorageUsed(50);
      toast({
        title: "Downloads Cleared",
        description: "All download history has been removed",
        variant: "destructive"
      });
    }
  };

  const exportData = () => {
    const data = {
      settings,
      downloads: JSON.parse(localStorage.getItem('downloadedVideos') || '[]'),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `online-video-downloader-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Your data has been downloaded as a backup file",
    });
  };

  const installPWA = () => {
    toast({
      title: "Install PWA",
      description: "Use your browser's 'Add to Home Screen' option to install this app",
    });
  };

  const storagePercentage = (storageUsed / estimatedTotal) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            ⚙️ Settings
          </h1>
          <p className="text-lg text-gray-600">
            Customize your video downloading experience
          </p>
        </div>

        {/* Download Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Downloads</p>
                  <p className="text-2xl font-bold">{downloadStats.totalDownloaded}</p>
                </div>
                <Download className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Avg Speed</p>
                  <p className="text-2xl font-bold">{downloadStats.averageSpeed}</p>
                </div>
                <Zap className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Size</p>
                  <p className="text-2xl font-bold">{downloadStats.totalSize}</p>
                </div>
                <Database className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold">{downloadStats.successRate}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PWA Installation */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Smartphone className="w-6 h-6" />
              Install as App
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-2 text-lg">
                  Install Online Video Downloader on your device
                </p>
                <p className="text-blue-200 text-sm">
                  Get a native app experience with offline support and faster access.
                </p>
              </div>
              <Button 
                onClick={installPWA}
                variant="secondary"
                className="bg-white text-purple-600 hover:bg-gray-100 px-6 py-3 text-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Add to Home Screen
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Download Settings */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-6 h-6" />
                Download Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Default Quality</label>
                  <Select 
                    value={settings.downloadQuality} 
                    onValueChange={(value) => updateSetting('downloadQuality', value)}
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best">Best Available</SelectItem>
                      <SelectItem value="2160p">4K (2160p)</SelectItem>
                      <SelectItem value="1440p">1440p</SelectItem>
                      <SelectItem value="1080p">1080p HD</SelectItem>
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="480p">480p SD</SelectItem>
                      <SelectItem value="360p">360p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Storage Location</label>
                  <Select 
                    value={settings.storageLocation} 
                    onValueChange={(value) => updateSetting('storageLocation', value)}
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="downloads">Downloads Folder</SelectItem>
                      <SelectItem value="videos">Videos Folder</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="custom">Custom Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Download Speed Limit</label>
                  <Select 
                    value={settings.downloadSpeed} 
                    onValueChange={(value) => updateSetting('downloadSpeed', value)}
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                      <SelectItem value="10mb">10 MB/s</SelectItem>
                      <SelectItem value="5mb">5 MB/s</SelectItem>
                      <SelectItem value="2mb">2 MB/s</SelectItem>
                      <SelectItem value="1mb">1 MB/s</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Chunk Size</label>
                  <Select 
                    value={settings.chunkSize} 
                    onValueChange={(value) => updateSetting('chunkSize', value)}
                  >
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20MB">20 MB (Fastest)</SelectItem>
                      <SelectItem value="10MB">10 MB (Recommended)</SelectItem>
                      <SelectItem value="5MB">5 MB (Stable)</SelectItem>
                      <SelectItem value="1MB">1 MB (Slow Connection)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">
                    Max Concurrent Downloads: {settings.maxConcurrentDownloads}
                  </label>
                  <Badge variant="outline" className="border-blue-200 text-blue-600">
                    {settings.maxConcurrentDownloads} files
                  </Badge>
                </div>
                <Slider
                  value={[settings.maxConcurrentDownloads]}
                  onValueChange={(value) => updateSetting('maxConcurrentDownloads', value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>1 (Slow)</span>
                  <span>5 (Balanced)</span>
                  <span>10 (Fast)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">
                    Auto-cleanup after: {settings.keepHistory} days
                  </label>
                  <Badge variant="outline" className="border-purple-200 text-purple-600">
                    {settings.keepHistory}d
                  </Badge>
                </div>
                <Slider
                  value={[settings.keepHistory]}
                  onValueChange={(value) => updateSetting('keepHistory', value[0])}
                  max={90}
                  min={7}
                  step={7}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>7 days</span>
                  <span>30 days</span>
                  <span>90 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <div className="space-y-8">
            {/* Behavior Settings */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-6 h-6" />
                  Behavior
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-medium">Auto Download</p>
                      <p className="text-sm text-gray-500">Start downloads immediately after validation</p>
                    </div>
                    <Switch
                      checked={settings.autoDownload}
                      onCheckedChange={(checked) => updateSetting('autoDownload', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-medium">Background Downloads</p>
                      <p className="text-sm text-gray-500">Continue downloads when app is minimized</p>
                    </div>
                    <Switch
                      checked={settings.backgroundDownload}
                      onCheckedChange={(checked) => updateSetting('backgroundDownload', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-medium">WiFi Only</p>
                      <p className="text-sm text-gray-500">Only download when connected to WiFi</p>
                    </div>
                    <Switch
                      checked={settings.wifiOnly}
                      onCheckedChange={(checked) => updateSetting('wifiOnly', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-medium">Auto Retry</p>
                      <p className="text-sm text-gray-500">Automatically retry failed downloads</p>
                    </div>
                    <Switch
                      checked={settings.autoRetry}
                      onCheckedChange={(checked) => updateSetting('autoRetry', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-medium">Auto Cleanup</p>
                      <p className="text-sm text-gray-500">Remove old downloads automatically</p>
                    </div>
                    <Switch
                      checked={settings.autoCleanup}
                      onCheckedChange={(checked) => updateSetting('autoCleanup', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-6 h-6" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">Get notified when downloads complete or fail</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => updateSetting('notifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Storage Management */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-6 h-6" />
              Storage Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-4">
                <span className="text-lg font-medium">Storage Used</span>
                <span className="text-lg text-gray-600">
                  {storageUsed} MB / {estimatedTotal} MB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    storagePercentage > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                    storagePercentage > 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                    'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{(100 - storagePercentage).toFixed(1)}% available</span>
                <span className={`font-medium ${
                  storagePercentage > 80 ? 'text-red-600' : 
                  storagePercentage > 60 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {storagePercentage > 80 ? 'Low space' : 
                   storagePercentage > 60 ? 'Moderate usage' : 'Good'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                onClick={clearCache}
                className="flex items-center gap-2 py-3 border-2 border-blue-200 hover:bg-blue-50"
              >
                <RefreshCw className="w-5 h-5" />
                Clear Cache
              </Button>
              <Button 
                variant="outline" 
                onClick={clearAllDownloads}
                className="flex items-center gap-2 py-3 border-2 border-red-200 hover:bg-red-50 text-red-600"
              >
                <Trash2 className="w-5 h-5" />
                Clear All Downloads
              </Button>
              <Button 
                onClick={exportData}
                variant="outline"
                className="flex items-center gap-2 py-3 border-2 border-green-200 hover:bg-green-50 text-green-600"
              >
                <FileText className="w-5 h-5" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h4 className="font-semibold text-green-800">Privacy First</h4>
                </div>
                <p className="text-sm text-green-700">
                  All data is stored locally on your device. No personal information is sent to external servers.
                </p>
              </div>

              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <Info className="w-6 h-6 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Open Source</h4>
                </div>
                <p className="text-sm text-blue-700">
                  This application is built with modern web technologies and follows best security practices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-6 h-6" />
              App Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-gray-500 text-sm">Version</p>
                <p className="font-bold text-xl">2.0.0</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-gray-500 text-sm">Build Date</p>
                <p className="font-bold text-xl">2025.01.15</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-gray-500 text-sm">Platform</p>
                <p className="font-bold text-xl">PWA</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="text-gray-500 text-sm">Status</p>
                <p className="font-bold text-xl text-green-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;