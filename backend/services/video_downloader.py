import os
import asyncio
import logging
import yt_dlp
import aiofiles
from typing import Dict, Optional, List, Any
from datetime import datetime
from pathlib import Path

from models.video import (
    VideoDownload, 
    VideoMetadata, 
    DownloadProgress, 
    DownloadStatus,
    PlatformType,
    VideoInfo,
    QualityOption
)

logger = logging.getLogger(__name__)

class VideoDownloaderService:
    def __init__(self):
        self.downloads_dir = Path("downloads")
        self.downloads_dir.mkdir(exist_ok=True)
        self.active_downloads: Dict[str, DownloadProgress] = {}
    
    def detect_platform(self, url: str) -> Optional[PlatformType]:
        """Detect the social media platform from URL"""
        url_lower = url.lower()
        if "youtube.com" in url_lower or "youtu.be" in url_lower:
            return PlatformType.YOUTUBE
        elif "instagram.com" in url_lower:
            return PlatformType.INSTAGRAM
        elif "tiktok.com" in url_lower:
            return PlatformType.TIKTOK
        elif "facebook.com" in url_lower or "fb.watch" in url_lower:
            return PlatformType.FACEBOOK
        return None
    
    async def get_video_info(self, url: str) -> VideoInfo:
        """Extract video information without downloading"""
        try:
            platform = self.detect_platform(url)
            if not platform:
                raise ValueError("Unsupported platform")
            
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
                'skip_download': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                # Check if video is available
                is_downloadable = True
                restriction_reason = None
                
                if info.get('availability') in ['private', 'premium_only', 'subscriber_only']:
                    is_downloadable = False
                    restriction_reason = f"Video is {info.get('availability')}"
                
                # Extract available formats and qualities
                available_qualities = self._extract_quality_options(info, platform)
                
                video_info = VideoInfo(
                    title=info.get('title', 'Unknown Title'),
                    description=info.get('description', '')[:500] if info.get('description') else None,
                    duration=info.get('duration'),
                    thumbnail_url=info.get('thumbnail'),
                    uploader=info.get('uploader') or info.get('channel'),
                    upload_date=info.get('upload_date'),
                    view_count=info.get('view_count'),
                    platform=platform,
                    available_qualities=available_qualities,
                    is_downloadable=is_downloadable,
                    restriction_reason=restriction_reason
                )
                
                return video_info
                
        except Exception as e:
            logger.error(f"Error extracting video info: {str(e)}")
            raise ValueError(f"Failed to extract video information: {str(e)}")
    
    def _extract_quality_options(self, info: dict, platform: PlatformType) -> List[QualityOption]:
        """Extract available quality options from video info"""
        qualities = []
        
        # Add default best quality option
        qualities.append(QualityOption(
            value="best",
            label="Best Available",
            resolution="Auto"
        ))
        
        # Extract specific qualities based on platform
        if platform == PlatformType.YOUTUBE:
            # YouTube-specific quality extraction
            formats = info.get('formats', [])
            height_qualities = set()
            
            for fmt in formats:
                if fmt.get('height'):
                    height_qualities.add(fmt['height'])
            
            # Common YouTube qualities
            common_qualities = [2160, 1440, 1080, 720, 480, 360, 240]
            for quality in common_qualities:
                if quality in height_qualities:
                    qualities.append(QualityOption(
                        value=f"{quality}p",
                        label=f"{quality}p {'4K' if quality == 2160 else 'HD' if quality >= 720 else 'SD'}",
                        resolution=f"{quality}p"
                    ))
        
        elif platform in [PlatformType.INSTAGRAM, PlatformType.TIKTOK]:
            # Instagram and TikTok usually have limited quality options
            qualities.extend([
                QualityOption(value="best", label="Original Quality", resolution="Original"),
                QualityOption(value="worst", label="Lower Quality", resolution="Compressed")
            ])
        
        elif platform == PlatformType.FACEBOOK:
            # Facebook quality options
            qualities.extend([
                QualityOption(value="720p", label="720p HD", resolution="720p"),
                QualityOption(value="480p", label="480p SD", resolution="480p"),
                QualityOption(value="360p", label="360p", resolution="360p")
            ])
        
        return qualities
    
    def create_progress_hook(self, download_id: str):
        """Create a progress hook for yt-dlp"""
        def progress_hook(d):
            if download_id in self.active_downloads:
                progress = self.active_downloads[download_id]
                
                if d['status'] == 'downloading':
                    progress.status = DownloadStatus.DOWNLOADING
                    
                    # Extract progress percentage
                    if 'downloaded_bytes' in d and 'total_bytes' in d:
                        progress.progress_percent = (d['downloaded_bytes'] / d['total_bytes']) * 100
                    elif '_percent_str' in d:
                        try:
                            progress.progress_percent = float(d['_percent_str'].replace('%', ''))
                        except:
                            pass
                    
                    progress.speed = d.get('_speed_str', '')
                    progress.eta = d.get('_eta_str', '')
                    progress.file_size = d.get('_total_bytes_str', '')
                    progress.current_file = d.get('filename', '')
                    
                elif d['status'] == 'finished':
                    progress.status = DownloadStatus.COMPLETED
                    progress.progress_percent = 100.0
                    progress.current_file = d.get('filename', '')
                    
                elif d['status'] == 'error':
                    progress.status = DownloadStatus.FAILED
                    progress.error_message = str(d.get('error', 'Unknown error'))
        
        return progress_hook
    
    async def download_video(self, download_request: VideoDownload) -> VideoDownload:
        """Download video from supported platforms with optimized speed"""
        download_id = download_request.download_id
        
        try:
            # Create download directory
            download_dir = self.downloads_dir / download_id
            download_dir.mkdir(exist_ok=True)
            
            # Initialize progress tracking
            self.active_downloads[download_id] = DownloadProgress(
                download_id=download_id,
                status=DownloadStatus.DOWNLOADING,
                progress_percent=0.0
            )
            
            # Optimized yt-dlp options for speed
            ydl_opts = {
                'format': self._get_format_selector(download_request.quality, download_request.platform),
                'outtmpl': str(download_dir / '%(title)s.%(ext)s'),
                'progress_hooks': [self.create_progress_hook(download_id)],
                'extractaudio': False,
                'embed_subs': False,
                'writesubtitles': False,
                'writeautomaticsub': False,
                'writedescription': False,
                'writethumbnail': False,
                'writeinfojson': False,
                'ignoreerrors': False,
                'no_warnings': True,
                'retries': 3,
                'fragment_retries': 3,
                'skip_unavailable_fragments': True,
                'concurrent_fragment_downloads': 8,  # Download 8 fragments concurrently
                'http_chunk_size': 10485760,  # 10MB chunks for faster downloads
                'extractor_retries': 2,
                'socket_timeout': 30,
                'keepvideo': False,
                'ratelimit': None,  # No rate limiting for max speed
            }
            
            # Platform-specific optimizations for speed
            if download_request.platform == PlatformType.YOUTUBE:
                ydl_opts.update({
                    'format': 'best[ext=mp4]/best',  # Prefer mp4 for faster processing
                    'http_headers': {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    'extractor_args': {
                        'youtube': {
                            'skip': ['hls', 'dash'],  # Skip slower streaming protocols
                            'player_client': ['android', 'web']  # Use fastest clients
                        }
                    }
                })
            elif download_request.platform == PlatformType.INSTAGRAM:
                ydl_opts.update({
                    'cookiefile': None,
                    'extractor_retries': 2,
                    'http_headers': {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
                    }
                })
            elif download_request.platform == PlatformType.FACEBOOK:
                ydl_opts.update({
                    'extractor_retries': 2,
                    'http_headers': {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                })
            elif download_request.platform == PlatformType.TIKTOK:
                ydl_opts.update({
                    'extractor_retries': 2,
                    'http_headers': {
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
                    }
                })
            
            # Run download in executor to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._perform_download, ydl_opts, download_request)
            
            return download_request
                
        except Exception as e:
            logger.error(f"Download failed for {download_id}: {str(e)}")
            
            download_request.status = DownloadStatus.FAILED
            download_request.error_message = str(e)
            
            # Update progress
            if download_id in self.active_downloads:
                self.active_downloads[download_id].status = DownloadStatus.FAILED
                self.active_downloads[download_id].error_message = str(e)
            
            return download_request
    
    def _get_format_selector(self, quality: str, platform: PlatformType) -> str:
        """Get yt-dlp format selector based on quality and platform"""
        if quality == "best":
            return "best[ext=mp4]/best"
        elif quality == "worst":
            return "worst[ext=mp4]/worst"
        elif quality.endswith('p'):
            # Specific resolution
            height = quality[:-1]
            return f"best[height<={height}][ext=mp4]/best[height<={height}]/best[ext=mp4]/best"
        else:
            return "best[ext=mp4]/best"
    
    def get_download_progress(self, download_id: str) -> Optional[DownloadProgress]:
        """Get current download progress"""
        return self.active_downloads.get(download_id)
    
    def cancel_download(self, download_id: str) -> bool:
        """Cancel an active download"""
        if download_id in self.active_downloads:
            self.active_downloads[download_id].status = DownloadStatus.CANCELLED
            # Note: yt-dlp doesn't have a direct cancel mechanism
            # In a production environment, you'd use a more sophisticated approach
            return True
        return False
    
    def cleanup_download(self, download_id: str) -> bool:
        """Clean up download files and progress"""
        try:
            # Remove from active downloads
            if download_id in self.active_downloads:
                del self.active_downloads[download_id]
            
            # Remove download directory
            download_dir = self.downloads_dir / download_id
            if download_dir.exists():
                import shutil
                shutil.rmtree(download_dir)
            
            return True
        except Exception as e:
            logger.error(f"Failed to cleanup download {download_id}: {str(e)}")
            return False
            
    def _perform_download(self, ydl_opts: dict, download_request: VideoDownload):
        """Perform the actual download in a separate thread"""
        download_id = download_request.download_id
        download_dir = self.downloads_dir / download_id
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first
            info = ydl.extract_info(download_request.url, download=False)
            
            # Check if video is accessible
            if info.get('availability') in ['private', 'premium_only', 'subscriber_only']:
                raise ValueError(f"Video is {info.get('availability')} and cannot be downloaded")
            
            # Create metadata
            metadata = VideoMetadata(
                title=info.get('title', 'Unknown Title'),
                description=info.get('description', '')[:500] if info.get('description') else None,
                duration=info.get('duration'),
                thumbnail_url=info.get('thumbnail'),
                uploader=info.get('uploader') or info.get('channel'),
                upload_date=info.get('upload_date'),
                view_count=info.get('view_count'),
                platform=download_request.platform,
                format=download_request.format,
                file_size=str(info.get('filesize_approx', '')) if info.get('filesize_approx') is not None else None
            )
            
            # Update download record with metadata
            download_request.metadata = metadata
            download_request.status = DownloadStatus.DOWNLOADING
            
            # Start actual download
            ydl.download([download_request.url])
            
            # Find downloaded file
            downloaded_files = list(download_dir.glob('*'))
            if downloaded_files:
                main_file = max(downloaded_files, key=lambda f: f.stat().st_size)
                download_request.file_path = str(main_file)
                
                # Update file size with actual size
                actual_size = main_file.stat().st_size
                download_request.metadata.file_size = f"{actual_size / (1024*1024):.1f} MB"
            
            download_request.status = DownloadStatus.COMPLETED
            download_request.completed_at = datetime.utcnow()
            
            # Update progress
            if download_id in self.active_downloads:
                self.active_downloads[download_id].status = DownloadStatus.COMPLETED
                self.active_downloads[download_id].progress_percent = 100.0
    
    def get_platform_quality_options(self, platform: PlatformType) -> List[QualityOption]:
        """Get available quality options for a platform"""
        quality_options = {
            PlatformType.YOUTUBE: [
                QualityOption(value="best", label="Best Available"),
                QualityOption(value="2160p", label="4K (2160p)", resolution="2160p"),
                QualityOption(value="1440p", label="1440p", resolution="1440p"),
                QualityOption(value="1080p", label="1080p HD", resolution="1080p"),
                QualityOption(value="720p", label="720p HD", resolution="720p"),
                QualityOption(value="480p", label="480p SD", resolution="480p"),
                QualityOption(value="360p", label="360p", resolution="360p"),
                QualityOption(value="240p", label="240p", resolution="240p"),
                QualityOption(value="worst", label="Lowest Quality"),
            ],
            PlatformType.INSTAGRAM: [
                QualityOption(value="best", label="Original Quality"),
                QualityOption(value="worst", label="Compressed Quality"),
            ],
            PlatformType.TIKTOK: [
                QualityOption(value="best", label="Original Quality"),
                QualityOption(value="worst", label="Compressed Quality"),
            ],
            PlatformType.FACEBOOK: [
                QualityOption(value="best", label="Best Available"),
                QualityOption(value="720p", label="720p HD", resolution="720p"),
                QualityOption(value="480p", label="480p SD", resolution="480p"),
                QualityOption(value="360p", label="360p", resolution="360p"),
                QualityOption(value="worst", label="Lowest Quality"),
            ]
        }
        
        return quality_options.get(platform, [
            QualityOption(value="best", label="Best Available"),
            QualityOption(value="worst", label="Lowest Quality")
        ])