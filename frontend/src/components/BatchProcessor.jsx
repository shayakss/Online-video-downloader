import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useToast } from '../hooks/use-toast';
import { 
  Upload, 
  X, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Download,
  List,
  RotateCcw,
  FileText
} from 'lucide-react';
import { videoApi, detectPlatform } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';

export const BatchProcessor = ({ onDownloadComplete }) => {
  const [urls, setUrls] = useState(['']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validatedVideos, setValidatedVideos] = useState([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [batchDownloads, setBatchDownloads] = useState([]);
  const fileInputRef = useRef();
  const { toast } = useToast();

  const addUrlField = () => {
    setUrls([...urls, '']);
  };

  const removeUrlField = (index) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  const updateUrl = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const fileUrls = content.split('\n')
          .map(url => url.trim())
          .filter(url => url && url.startsWith('http'));
        
        if (fileUrls.length > 0) {
          setUrls([...urls.filter(url => url.trim()), ...fileUrls]);
          toast({
            title: "URLs Imported",
            description: `Added ${fileUrls.length} URLs from file`,
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text');
    if (text && text.startsWith('http')) {
      const emptyIndex = urls.findIndex(url => !url.trim());
      if (emptyIndex !== -1) {
        updateUrl(emptyIndex, text);
      } else {
        setUrls([...urls, text]);
      }
    }
  };

  const validateAllUrls = async () => {
    const validUrls = urls.filter(url => url.trim());
    
    if (validUrls.length === 0) {
      toast({
        title: "No URLs",
        description: "Please enter at least one video URL",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setBatchProgress({ current: 0, total: validUrls.length });
    setValidatedVideos([]);

    const results = [];
    
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      setBatchProgress({ current: i + 1, total: validUrls.length });
      
      try {
        const platform = detectPlatform(url);
        if (!platform) {
          results.push({
            url,
            status: 'invalid',
            error: 'Unsupported platform'
          });
          continue;
        }

        const response = await videoApi.validateUrl(url);
        if (response.valid && response.video_info) {
          results.push({
            url,
            status: 'valid',
            platform: response.platform,
            videoInfo: response.video_info
          });
        } else {
          results.push({
            url,
            status: 'invalid',
            error: 'Invalid video URL'
          });
        }
      } catch (error) {
        results.push({
          url,
          status: 'error',
          error: error.message
        });
      }

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setValidatedVideos(results);
    setIsProcessing(false);
    
    const validCount = results.filter(r => r.status === 'valid').length;
    toast({
      title: "Validation Complete",
      description: `${validCount} out of ${validUrls.length} URLs are valid`,
    });
  };

  const startBatchDownload = async () => {
    const validVideos = validatedVideos.filter(v => v.status === 'valid');
    
    if (validVideos.length === 0) {
      toast({
        title: "No Valid URLs",
        description: "Please validate URLs first",
        variant: "destructive"
      });
      return;
    }

    setBatchDownloads([]);
    
    for (const video of validVideos) {
      try {
        const downloadRequest = {
          url: video.url,
          quality: 'best',
          format: 'mp4',
          educational_purpose: true,
          user_id: 'demo_user'
        };

        const response = await videoApi.startDownload(downloadRequest);
        
        const downloadInfo = {
          id: response.download_id,
          url: video.url,
          title: video.videoInfo.title,
          platform: video.platform,
          status: 'started',
          progress: 0
        };
        
        setBatchDownloads(prev => [...prev, downloadInfo]);
        
        // Notify parent
        if (onDownloadComplete) {
          onDownloadComplete(response.download_id);
        }

      } catch (error) {
        setBatchDownloads(prev => [...prev, {
          url: video.url,
          title: video.videoInfo.title,
          status: 'failed',
          error: error.message
        }]);
      }

      // Delay between downloads
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast({
      title: "Batch Download Started",
      description: `Started downloading ${validVideos.length} videos`,
    });
  };

  const resetBatch = () => {
    setUrls(['']);
    setValidatedVideos([]);
    setBatchDownloads([]);
    setBatchProgress({ current: 0, total: 0 });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'started': return <Play className="w-4 h-4 text-blue-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Card className="glass-card shadow-2xl border-0 animate-fade-in-scale">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
            <List className="w-5 h-5 text-white" />
          </div>
          Batch URL Processor
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Pro Feature
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Video URLs ({urls.filter(url => url.trim()).length})
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                Import File
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetBatch}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div 
            className="space-y-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-800/50"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <p className="text-xs text-gray-500 text-center mb-3">
              Drop URLs here or paste them in the fields below
            </p>
            
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Video URL ${index + 1}`}
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  className="input-professional flex-1"
                />
                {urls.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeUrlField(index)}
                    className="px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addUrlField}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another URL
            </Button>
          </div>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Validating URLs...</span>
              <span className="text-sm text-gray-500">
                {batchProgress.current} / {batchProgress.total}
              </span>
            </div>
            <Progress 
              value={(batchProgress.current / batchProgress.total) * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={validateAllUrls}
            disabled={isProcessing || urls.filter(url => url.trim()).length === 0}
            className="btn-primary flex-1"
          >
            {isProcessing ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Validate URLs
          </Button>
          
          <Button
            onClick={startBatchDownload}
            disabled={validatedVideos.filter(v => v.status === 'valid').length === 0}
            className="btn-success flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>

        {/* Validation Results */}
        {validatedVideos.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 dark:text-white">
              Validation Results ({validatedVideos.length})
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {validatedVideos.map((video, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                >
                  {getStatusIcon(video.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {video.videoInfo?.title || video.url}
                    </p>
                    {video.status === 'valid' && video.platform && (
                      <Badge size="sm" className="mt-1 capitalize">
                        {video.platform}
                      </Badge>
                    )}
                    {(video.status === 'invalid' || video.status === 'error') && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {video.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Batch Download Status */}
        {batchDownloads.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 dark:text-white">
              Download Status ({batchDownloads.length})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {batchDownloads.map((download, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                >
                  {getStatusIcon(download.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{download.title}</p>
                    <p className="text-xs text-gray-500 truncate">{download.url}</p>
                    {download.error && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {download.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};