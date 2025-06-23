// Mock data for video downloader PWA - Educational purposes only

export const mockVideos = [
  {
    id: 'yt_1',
    platform: 'youtube',
    title: 'Learn React in 10 Minutes',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration: '10:23',
    uploadDate: '2024-01-15',
    channel: 'React Tutorials',
    qualityOptions: ['720p', '480p', '360p', '240p'],
    status: 'completed',
    downloadProgress: 100,
    fileSize: '45.2 MB',
    downloadedAt: '2024-06-15T10:30:00Z'
  },
  {
    id: 'ig_1',
    platform: 'instagram',
    title: 'Beautiful Sunset Timelapse',
    thumbnail: 'https://picsum.photos/400/300?random=1',
    url: 'https://www.instagram.com/p/ABC123/',
    duration: '0:30',
    uploadDate: '2024-06-10',
    channel: '@naturephotography',
    qualityOptions: ['HD', 'SD'],
    status: 'downloading',
    downloadProgress: 65,
    fileSize: '12.8 MB'
  },
  {
    id: 'tt_1',
    platform: 'tiktok',
    title: 'Funny Cat Compilation',
    thumbnail: 'https://picsum.photos/400/300?random=2',
    url: 'https://www.tiktok.com/@user/video/123456789',
    duration: '0:15',
    uploadDate: '2024-06-12',
    channel: '@funnycats',
    qualityOptions: ['HD', 'SD'],
    status: 'pending',
    downloadProgress: 0,
    fileSize: '8.5 MB'
  },
  {
    id: 'fb_1',
    platform: 'facebook',
    title: 'Wedding Ceremony Highlights',
    thumbnail: 'https://picsum.photos/400/300?random=3',
    url: 'https://www.facebook.com/watch/?v=123456789',
    duration: '5:42',
    uploadDate: '2024-06-08',
    channel: 'John & Jane Smith',
    qualityOptions: ['1080p', '720p', '480p'],
    status: 'failed',
    downloadProgress: 0,
    fileSize: '28.3 MB',
    error: 'Video is private or unavailable'
  }
];

export const mockDownloadStats = {
  totalDownloads: 47,
  totalSize: '2.3 GB',
  successRate: '94%',
  platforms: {
    youtube: 25,
    instagram: 12,
    tiktok: 8,
    facebook: 2
  }
};

export const mockRecentActivity = [
  {
    id: 'activity_1',
    action: 'download_completed',
    videoTitle: 'Learn React in 10 Minutes',
    platform: 'youtube',
    timestamp: '2024-06-15T10:30:00Z'
  },
  {
    id: 'activity_2',
    action: 'download_started',
    videoTitle: 'Beautiful Sunset Timelapse',
    platform: 'instagram',
    timestamp: '2024-06-15T09:45:00Z'
  },
  {
    id: 'activity_3',
    action: 'download_failed',
    videoTitle: 'Wedding Ceremony Highlights',
    platform: 'facebook',
    timestamp: '2024-06-15T09:20:00Z'
  }
];

// Platform detection utility
export const detectPlatform = (url) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('facebook.com')) return 'facebook';
  return null;
};

// Mock API simulation
export const mockApiDelay = (min = 1000, max = 3000) => {
  return new Promise(resolve => {
    setTimeout(resolve, Math.random() * (max - min) + min);
  });
};

export const generateMockVideo = (url, platform) => {
  const titles = {
    youtube: ['Tutorial: Advanced JavaScript', 'Music Video: Top Hits 2024', 'Documentary: Ocean Life'],
    instagram: ['Story Highlights', 'IGTV Episode', 'Reel Collection'],
    tiktok: ['Dance Challenge', 'Cooking Tips', 'Life Hacks'],
    facebook: ['Live Stream Highlights', 'Event Coverage', 'Personal Vlog']
  };

  const channels = {
    youtube: ['TechChannel', 'MusicWorld', 'EduTube'],
    instagram: ['@lifestyle', '@foodie', '@travel'],
    tiktok: ['@dancer', '@chef', '@lifehacker'],
    facebook: ['Personal Page', 'Event Page', 'Business Page']
  };

  return {
    id: `${platform}_${Date.now()}`,
    platform,
    title: titles[platform][Math.floor(Math.random() * titles[platform].length)],
    thumbnail: `https://picsum.photos/400/300?random=${Date.now()}`,
    url,
    duration: `${Math.floor(Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    uploadDate: new Date().toISOString().split('T')[0],
    channel: channels[platform][Math.floor(Math.random() * channels[platform].length)],
    qualityOptions: platform === 'youtube' ? ['1080p', '720p', '480p', '360p'] : ['HD', 'SD'],
    status: 'pending',
    downloadProgress: 0,
    fileSize: `${(Math.random() * 100 + 10).toFixed(1)} MB`
  };
};