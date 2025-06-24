from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, File, UploadFile
from fastapi.responses import StreamingResponse, FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import asyncio
import aiofiles
from typing import Optional, List

# Import our models and services
from models.video import (
    VideoDownloadRequest, 
    VideoDownload, 
    DownloadProgress, 
    DownloadStatus,
    PlatformType,
    VideoInfo,
    QualityOption
)
from services.video_downloader import VideoDownloaderService
from database.video_repository import VideoRepository

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
video_downloader = VideoDownloaderService()
video_repository = VideoRepository(db)

# Create the main app without a prefix
app = FastAPI(title="Video Downloader API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@api_router.get("/")
async def root():
    return {"message": "Video Downloader API - Educational Use Only"}

@api_router.post("/video/validate")
async def validate_video_url(request: dict):
    """Validate video URL and extract basic information"""
    try:
        url = request.get('url')
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Detect platform
        platform = video_downloader.detect_platform(url)
        if not platform:
            raise HTTPException(status_code=400, detail="Unsupported platform")
        
        # Get video information
        video_info = await video_downloader.get_video_info(url)
        
        if not video_info.is_downloadable:
            raise HTTPException(
                status_code=403, 
                detail=video_info.restriction_reason or "Video is not downloadable"
            )
        
        return {
            "valid": True,
            "platform": platform,
            "video_info": video_info.model_dump()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Video validation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to validate video URL")

@api_router.get("/quality-options/{platform}")
async def get_quality_options(platform: PlatformType):
    """Get available quality options for a platform"""
    try:
        quality_options = video_downloader.get_platform_quality_options(platform)
        return {"platform": platform, "options": [opt.model_dump() for opt in quality_options]}
    except Exception as e:
        logger.error(f"Error getting quality options: {str(e)}")
        return {"platform": platform, "options": [{"value": "best", "label": "Best Available"}]}

@api_router.post("/download/start")
async def start_download(request: VideoDownloadRequest, background_tasks: BackgroundTasks):
    """Start video download process"""
    try:
        # Validate educational purpose
        if not request.educational_purpose:
            raise HTTPException(
                status_code=400, 
                detail="Downloads are only permitted for educational purposes"
            )
        
        # Detect platform
        platform = video_downloader.detect_platform(str(request.url))
        if not platform:
            raise HTTPException(status_code=400, detail="Unsupported platform")
        
        # Generate unique download ID
        import uuid
        from datetime import datetime
        download_id = f"dl_{int(datetime.utcnow().timestamp())}_{str(uuid.uuid4())[:8]}"
        
        # Create download record
        download_record = VideoDownload(
            download_id=download_id,
            url=str(request.url),
            platform=platform,
            quality=request.quality or "best",
            format=request.format or "mp4",
            user_id=request.user_id,
            educational_purpose=request.educational_purpose,
            status=DownloadStatus.PENDING
        )
        
        # Save to database
        await video_repository.create_download(download_record)
        
        # Start download in background
        background_tasks.add_task(
            process_download,
            download_record
        )
        
        return {
            "download_id": download_id,
            "platform": platform,
            "status": "started",
            "message": "Download started. Use the download_id to check progress."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download start error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start download")

async def process_download(download_record: VideoDownload):
    """Background task to process video download"""
    try:
        logger.info(f"Starting download process for {download_record.download_id}")
        
        # Update status to downloading
        download_record.status = DownloadStatus.DOWNLOADING
        await video_repository.update_download(download_record)
        
        # Perform actual download
        updated_record = await video_downloader.download_video(download_record)
        
        # Update database with final status
        await video_repository.update_download(updated_record)
        
        logger.info(f"Download completed for {download_record.download_id}: {updated_record.status}")
        
    except Exception as e:
        logger.error(f"Download process error for {download_record.download_id}: {str(e)}")
        
        # Update status to failed
        download_record.status = DownloadStatus.FAILED
        download_record.error_message = str(e)
        await video_repository.update_download(download_record)

@api_router.get("/download/progress/{download_id}")
async def get_download_progress(download_id: str):
    """Get download progress"""
    try:
        # Check active downloads first
        active_progress = video_downloader.get_download_progress(download_id)
        if active_progress:
            return active_progress.model_dump()
        
        # Check database for completed/failed downloads
        download_record = await video_repository.get_download_by_id(download_id)
        if not download_record:
            raise HTTPException(status_code=404, detail="Download not found")
        
        progress = DownloadProgress(
            download_id=download_id,
            status=download_record.status,
            progress_percent=100.0 if download_record.status == DownloadStatus.COMPLETED else 0.0,
            error_message=download_record.error_message
        )
        
        return progress.model_dump()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Progress check error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get download progress")

@api_router.get("/download/metadata/{download_id}")
async def get_download_metadata(download_id: str):
    """Get video metadata for a download"""
    try:
        download_record = await video_repository.get_download_by_id(download_id)
        if not download_record:
            raise HTTPException(status_code=404, detail="Download not found")
        
        return {
            "download_id": download_id,
            "metadata": download_record.metadata.model_dump() if download_record.metadata else None,
            "platform": download_record.platform,
            "status": download_record.status,
            "created_at": download_record.created_at,
            "completed_at": download_record.completed_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Metadata retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get download metadata")

@api_router.get("/download/file/{download_id}")
async def download_file(download_id: str):
    """Download the processed video file"""
    try:
        download_record = await video_repository.get_download_by_id(download_id)
        if not download_record:
            raise HTTPException(status_code=404, detail="Download not found")
        
        if download_record.status != DownloadStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Download not completed yet")
        
        if not download_record.file_path or not os.path.exists(download_record.file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Return file for download
        filename = os.path.basename(download_record.file_path)
        return FileResponse(
            path=download_record.file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File download error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download file")

@api_router.get("/download/history")
async def get_download_history(
    user_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    status: Optional[DownloadStatus] = None,
    platform: Optional[PlatformType] = None
):
    """Get download history"""
    try:
        if user_id:
            downloads = await video_repository.get_user_downloads(
                user_id=user_id,
                limit=limit,
                offset=offset,
                status=status,
                platform=platform
            )
        else:
            downloads = await video_repository.get_all_downloads(
                limit=limit,
                offset=offset,
                status=status,
                platform=platform
            )
        
        # Convert to serializable format
        downloads_data = []
        for download in downloads:
            download_dict = download.model_dump()
            downloads_data.append(download_dict)
        
        return {
            "downloads": downloads_data,
            "count": len(downloads_data),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"History retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get download history")

@api_router.get("/download/stats")
async def get_download_stats(user_id: Optional[str] = None):
    """Get download statistics"""
    try:
        stats = await video_repository.get_download_stats(user_id)
        return stats
    except Exception as e:
        logger.error(f"Stats retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get download statistics")

@api_router.delete("/download/{download_id}")
async def delete_download(download_id: str):
    """Delete download and associated files"""
    try:
        download_record = await video_repository.get_download_by_id(download_id)
        if not download_record:
            raise HTTPException(status_code=404, detail="Download not found")
        
        # Clean up files
        video_downloader.cleanup_download(download_id)
        
        # Remove from database
        await video_repository.delete_download(download_id)
        
        return {"message": "Download deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete download")

@api_router.post("/download/cancel/{download_id}")
async def cancel_download(download_id: str):
    """Cancel an active download"""
    try:
        success = video_downloader.cancel_download(download_id)
        if not success:
            raise HTTPException(status_code=404, detail="Download not found or not active")
        
        # Update database status
        download_record = await video_repository.get_download_by_id(download_id)
        if download_record:
            download_record.status = DownloadStatus.CANCELLED
            await video_repository.update_download(download_record)
        
        return {"message": "Download cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cancel error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel download")

@api_router.get("/download/search")
async def search_downloads(
    q: str,
    user_id: Optional[str] = None,
    limit: int = 50
):
    """Search downloads by title, uploader, or URL"""
    try:
        if not q or len(q.strip()) < 2:
            raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
        
        downloads = await video_repository.search_downloads(
            query=q.strip(),
            user_id=user_id,
            limit=limit
        )
        
        # Convert to serializable format
        downloads_data = []
        for download in downloads:
            download_dict = download.model_dump()
            downloads_data.append(download_dict)
        
        return {
            "downloads": downloads_data,
            "count": len(downloads_data),
            "query": q
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search downloads")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()