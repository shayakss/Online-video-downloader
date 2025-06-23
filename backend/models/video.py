from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class PlatformType(str, Enum):
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    FACEBOOK = "facebook"

class DownloadStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class VideoMetadata(BaseModel):
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None  # in seconds
    thumbnail_url: Optional[str] = None
    uploader: Optional[str] = None
    upload_date: Optional[str] = None
    view_count: Optional[int] = None
    platform: PlatformType
    file_size: Optional[str] = None
    format: Optional[str] = None

class VideoDownloadRequest(BaseModel):
    url: HttpUrl
    quality: Optional[str] = "best"
    format: Optional[str] = "mp4"
    educational_purpose: bool = True
    user_id: Optional[str] = None

class DownloadProgress(BaseModel):
    download_id: str
    status: DownloadStatus
    progress_percent: float = 0.0
    speed: Optional[str] = None
    eta: Optional[str] = None
    file_size: Optional[str] = None
    error_message: Optional[str] = None
    current_file: Optional[str] = None

class VideoDownload(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    download_id: str
    url: str
    platform: PlatformType
    quality: str
    format: str
    user_id: Optional[str] = None
    educational_purpose: bool = True
    status: DownloadStatus = DownloadStatus.PENDING
    metadata: Optional[VideoMetadata] = None
    file_path: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class QualityOption(BaseModel):
    value: str
    label: str
    resolution: Optional[str] = None
    file_size_estimate: Optional[str] = None

class VideoInfo(BaseModel):
    title: str
    description: Optional[str] = None
    duration: Optional[int] = None
    thumbnail_url: Optional[str] = None
    uploader: Optional[str] = None
    upload_date: Optional[str] = None
    view_count: Optional[int] = None
    platform: PlatformType
    available_qualities: List[QualityOption] = []
    is_downloadable: bool = True
    restriction_reason: Optional[str] = None