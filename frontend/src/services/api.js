import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Video API functions
export const videoApi = {
  // Validate video URL and get basic info
  validateUrl: async (url) => {
    try {
      const response = await api.post('/video/validate', { url });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to validate URL');
    }
  },

  // Get quality options for a platform
  getQualityOptions: async (platform) => {
    try {
      const response = await api.get(`/quality-options/${platform}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get quality options:', error);
      return { platform, options: [{ value: 'best', label: 'Best Available' }] };
    }
  },

  // Start video download
  startDownload: async (downloadRequest) => {
    try {
      const response = await api.post('/download/start', downloadRequest);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to start download');
    }
  },

  // Get download progress
  getProgress: async (downloadId) => {
    try {
      const response = await api.get(`/download/progress/${downloadId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get progress');
    }
  },

  // Get download metadata
  getMetadata: async (downloadId) => {
    try {
      const response = await api.get(`/download/metadata/${downloadId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get metadata');
    }
  },

  // Download file
  downloadFile: async (downloadId) => {
    try {
      const response = await api.get(`/download/file/${downloadId}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `video_${downloadId}.mp4`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to download file');
    }
  },

  // Get download history
  getHistory: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.user_id) queryParams.append('user_id', params.user_id);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.status) queryParams.append('status', params.status);
      if (params.platform) queryParams.append('platform', params.platform);
      
      const response = await api.get(`/download/history?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get download history');
    }
  },

  // Get download statistics
  getStats: async (userId = null) => {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await api.get(`/download/stats${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get statistics');
    }
  },

  // Delete download
  deleteDownload: async (downloadId) => {
    try {
      const response = await api.delete(`/download/${downloadId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete download');
    }
  },

  // Cancel download
  cancelDownload: async (downloadId) => {
    try {
      const response = await api.post(`/download/cancel/${downloadId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to cancel download');
    }
  },

  // Search downloads
  searchDownloads: async (query, userId = null, limit = 50) => {
    try {
      const params = new URLSearchParams({ q: query, limit });
      if (userId) params.append('user_id', userId);
      
      const response = await api.get(`/download/search?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to search downloads');
    }
  }
};

// Platform detection utility
export const detectPlatform = (url) => {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
  if (urlLower.includes('instagram.com')) return 'instagram';
  if (urlLower.includes('tiktok.com')) return 'tiktok';
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) return 'facebook';
  
  return null;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Format duration
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default api;