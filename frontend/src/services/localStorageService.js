// Local Storage Service for managing downloaded files in browser
class LocalStorageService {
  constructor() {
    this.storageKey = 'neon_downloader_files';
    this.maxStorageSize = 100 * 1024 * 1024; // 100MB limit for demo
  }

  // Get all stored files
  getStoredFiles() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading from local storage:', error);
      return [];
    }
  }

  // Store a file (as base64 for demo purposes)
  async storeFile(fileData, metadata) {
    try {
      const files = this.getStoredFiles();
      const fileId = this.generateFileId();
      
      // Check storage limit
      const estimatedSize = this.estimateFileSize(fileData);
      const currentSize = this.getCurrentStorageSize();
      
      if (currentSize + estimatedSize > this.maxStorageSize) {
        throw new Error('Storage limit exceeded. Please delete some files first.');
      }

      const fileRecord = {
        id: fileId,
        data: fileData,
        metadata: {
          ...metadata,
          storedAt: new Date().toISOString(),
          size: estimatedSize,
          type: metadata.format || 'mp4'
        }
      };

      files.push(fileRecord);
      localStorage.setItem(this.storageKey, JSON.stringify(files));
      
      return fileRecord;
    } catch (error) {
      console.error('Error storing file:', error);
      throw error;
    }
  }

  // Download file from server and store locally
  async downloadAndStore(downloadId, metadata) {
    try {
      // For demo purposes, we'll create a mock file
      // In a real implementation, you would fetch the actual file
      const mockFileData = this.createMockFileData(metadata);
      
      return await this.storeFile(mockFileData, {
        ...metadata,
        downloadId,
        title: metadata.title || 'Downloaded Video',
        platform: metadata.platform || 'unknown'
      });
    } catch (error) {
      console.error('Error downloading and storing file:', error);
      throw error;
    }
  }

  // Create a mock file for demo purposes
  createMockFileData(metadata) {
    // Create a simple data URL for demo
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 320, 240);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(0.5, '#8b5cf6');
    gradient.addColorStop(1, '#ff00ff');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 320, 240);
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(metadata.title || 'Downloaded Content', 160, 120);
    ctx.fillText(`Platform: ${metadata.platform || 'Unknown'}`, 160, 140);
    
    return canvas.toDataURL('image/png');
  }

  // Get a specific file by ID
  getFile(fileId) {
    const files = this.getStoredFiles();
    return files.find(file => file.id === fileId);
  }

  // Delete a file
  deleteFile(fileId) {
    try {
      const files = this.getStoredFiles();
      const filteredFiles = files.filter(file => file.id !== fileId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredFiles));
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Clear all files
  clearAllFiles() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing files:', error);
      return false;
    }
  }

  // Get current storage size
  getCurrentStorageSize() {
    const files = this.getStoredFiles();
    return files.reduce((total, file) => total + (file.metadata.size || 0), 0);
  }

  // Estimate file size (rough estimation for base64)
  estimateFileSize(dataUrl) {
    // Base64 encoding increases size by ~33%
    return Math.ceil(dataUrl.length * 0.75);
  }

  // Generate unique file ID
  generateFileId() {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get storage statistics
  getStorageStats() {
    const files = this.getStoredFiles();
    const totalSize = this.getCurrentStorageSize();
    const usagePercentage = (totalSize / this.maxStorageSize) * 100;

    return {
      totalFiles: files.length,
      totalSize,
      maxSize: this.maxStorageSize,
      usagePercentage: Math.min(usagePercentage, 100),
      availableSpace: Math.max(0, this.maxStorageSize - totalSize)
    };
  }

  // Get files by platform
  getFilesByPlatform(platform) {
    const files = this.getStoredFiles();
    return files.filter(file => file.metadata.platform === platform);
  }

  // Search files
  searchFiles(query) {
    const files = this.getStoredFiles();
    const lowercaseQuery = query.toLowerCase();
    
    return files.filter(file => 
      file.metadata.title?.toLowerCase().includes(lowercaseQuery) ||
      file.metadata.uploader?.toLowerCase().includes(lowercaseQuery) ||
      file.metadata.platform?.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Export files metadata (for backup)
  exportMetadata() {
    const files = this.getStoredFiles();
    const metadata = files.map(file => ({
      id: file.id,
      metadata: file.metadata
    }));
    
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon_downloader_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Get file URL for playback
  getFileUrl(fileId) {
    const file = this.getFile(fileId);
    if (!file) return null;
    
    // For demo purposes, return the data URL
    // In a real implementation, you might create object URLs for larger files
    return file.data;
  }

  // Check if file can be played in browser
  canPlayFile(fileId) {
    const file = this.getFile(fileId);
    if (!file) return false;
    
    const supportedVideoTypes = ['mp4', 'webm', 'ogg'];
    const supportedAudioTypes = ['mp3', 'wav', 'ogg', 'aac'];
    
    const fileType = file.metadata.type?.toLowerCase();
    return supportedVideoTypes.includes(fileType) || supportedAudioTypes.includes(fileType);
  }

  // Get file type (video/audio)
  getFileType(fileId) {
    const file = this.getFile(fileId);
    if (!file) return null;
    
    const videoTypes = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    const audioTypes = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
    
    const fileType = file.metadata.type?.toLowerCase();
    
    if (videoTypes.includes(fileType)) return 'video';
    if (audioTypes.includes(fileType)) return 'audio';
    return 'unknown';
  }
}

// Create singleton instance
const localStorageService = new LocalStorageService();

export default localStorageService;