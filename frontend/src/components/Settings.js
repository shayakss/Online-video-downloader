import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { toast } from './ui/toast';
import { 
  Settings as SettingsIcon, 
  Download, 
  Bell, 
  Smartphone, 
  HardDrive, 
  Wifi, 
  Shield,
  Trash2,
  RefreshCw
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
    darkMode: false
  });

  const [storageUsed, setStorageUsed] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(5000); // MB

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
      description: `${key.charAt(0).toUpperCase() + key.slice(1)} has been updated`,
    });
  };

  const clearCache = () => {
    // Mock cache clearing
    setStorageUsed(Math.floor(storageUsed * 0.3));
    toast({
      title: "Cache Cleared",
      description: "Temporary files have been removed",
    });
  };

  const clearAllDownloads = () => {
    if (window.confirm('Are you sure you want to clear all download history? This cannot be undone.')) {
      localStorage.removeItem('downloadedVideos');
      setStorageUsed(50); // Keep some base storage
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
    a.download = `video-downloader-backup-${new Date().toISOString().split('T')[0]}.json`;
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
    // This would be handled by the service worker in a real PWA
    toast({
      title: "Install PWA",
      description: "Use your browser's 'Add to Home Screen' option to install this app",
    });
  };

  const storagePercentage = (storageUsed / estimatedTotal) * 100;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          ⚙️ Settings
        </h1>
        <p className="text-gray-600">
          Customize your video downloading experience
        </p>
      </div>

      {/* PWA Installation */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Smartphone className="w-5 h-5" />
            Install as App
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-100 mb-4">
            Install this PWA on your device for a native app experience with offline support.
          </p>
          <Button 
            onClick={installPWA}
            variant="secondary"
            className="bg-white text-purple-600 hover:bg-gray-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Add to Home Screen
          </Button>
        </CardContent>
      </Card>

      {/* Download Settings */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Default Quality</label>
              <Select 
                value={settings.downloadQuality} 
                onValueChange={(value) => updateSetting('downloadQuality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best Available</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="360p">360p</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Storage Location</label>
              <Select 
                value={settings.storageLocation} 
                onValueChange={(value) => updateSetting('storageLocation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="downloads">Downloads Folder</SelectItem>
                  <SelectItem value="videos">Videos Folder</SelectItem>
                  <SelectItem value="custom">Custom Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Max Concurrent Downloads: {settings.maxConcurrentDownloads}
              </label>
              <Badge variant="outline">{settings.maxConcurrentDownloads} files</Badge>
            </div>
            <Slider
              value={[settings.maxConcurrentDownloads]}
              onValueChange={(value) => updateSetting('maxConcurrentDownloads', value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Download</p>
                <p className="text-sm text-gray-500">Start downloads immediately after validation</p>
              </div>
              <Switch
                checked={settings.autoDownload}
                onCheckedChange={(checked) => updateSetting('autoDownload', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Background Downloads</p>
                <p className="text-sm text-gray-500">Continue downloads when app is minimized</p>
              </div>
              <Switch
                checked={settings.backgroundDownload}
                onCheckedChange={(checked) => updateSetting('backgroundDownload', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">WiFi Only</p>
                <p className="text-sm text-gray-500">Only download when connected to WiFi</p>
              </div>
              <Switch
                checked={settings.wifiOnly}
                onCheckedChange={(checked) => updateSetting('wifiOnly', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Retry</p>
                <p className="text-sm text-gray-500">Automatically retry failed downloads</p>
              </div>
              <Switch
                checked={settings.autoRetry}
                onCheckedChange={(checked) => updateSetting('autoRetry', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
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

      {/* Storage Management */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Storage Used</span>
              <span className="text-sm text-gray-500">
                {storageUsed} MB / {estimatedTotal} MB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  storagePercentage > 80 ? 'bg-red-500' : 
                  storagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {(100 - storagePercentage).toFixed(1)}% available
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={clearCache}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
            <Button 
              variant="outline" 
              onClick={clearAllDownloads}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Downloads
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">✅ Educational Use Only</h4>
            <p className="text-sm text-green-700">
              This application is designed for educational purposes. Please respect platform terms of service and copyright laws.
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">🔒 Data Privacy</h4>
            <p className="text-sm text-blue-700">
              All data is stored locally on your device. No personal information is sent to external servers.
            </p>
          </div>

          <Button 
            onClick={exportData}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data Backup
          </Button>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>App Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-gray-500">Build</p>
              <p className="font-medium">2024.06.15</p>
            </div>
            <div>
              <p className="text-gray-500">Platform</p>
              <p className="font-medium">Progressive Web App</p>
            </div>
            <div>
              <p className="text-gray-500">Support</p>
              <p className="font-medium">Educational Use</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;