from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from models.video import VideoDownload, DownloadStatus, PlatformType

class VideoRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.video_downloads
    
    async def create_download(self, download: VideoDownload) -> VideoDownload:
        """Create a new download record"""
        download_dict = download.model_dump()
        download_dict['created_at'] = datetime.utcnow()
        download_dict['updated_at'] = datetime.utcnow()
        
        result = await self.collection.insert_one(download_dict)
        download.id = str(result.inserted_id)
        return download
    
    async def get_download_by_id(self, download_id: str) -> Optional[VideoDownload]:
        """Get download by ID"""
        doc = await self.collection.find_one({"download_id": download_id})
        if doc:
            doc['id'] = str(doc.pop('_id'))
            return VideoDownload(**doc)
        return None
    
    async def get_download_by_object_id(self, object_id: str) -> Optional[VideoDownload]:
        """Get download by MongoDB ObjectId"""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(object_id)})
            if doc:
                doc['id'] = str(doc.pop('_id'))
                return VideoDownload(**doc)
        except:
            pass
        return None
    
    async def update_download(self, download: VideoDownload) -> VideoDownload:
        """Update download record"""
        download.updated_at = datetime.utcnow()
        download_dict = download.model_dump()
        download_dict.pop('id', None)  # Remove id field for update
        
        await self.collection.update_one(
            {"download_id": download.download_id},
            {"$set": download_dict}
        )
        return download
    
    async def delete_download(self, download_id: str) -> bool:
        """Delete download record"""
        result = await self.collection.delete_one({"download_id": download_id})
        return result.deleted_count > 0
    
    async def get_user_downloads(
        self, 
        user_id: str, 
        limit: int = 50, 
        offset: int = 0,
        status: Optional[DownloadStatus] = None,
        platform: Optional[PlatformType] = None
    ) -> List[VideoDownload]:
        """Get downloads for a specific user"""
        query = {"user_id": user_id}
        
        if status:
            query["status"] = status
        
        if platform:
            query["platform"] = platform
        
        cursor = self.collection.find(query).sort("created_at", -1)
        
        if offset:
            cursor = cursor.skip(offset)
        
        if limit:
            cursor = cursor.limit(limit)
        
        docs = await cursor.to_list(length=limit)
        
        downloads = []
        for doc in docs:
            doc['id'] = str(doc.pop('_id'))
            downloads.append(VideoDownload(**doc))
        
        return downloads
    
    async def get_all_downloads(
        self, 
        limit: int = 50, 
        offset: int = 0,
        status: Optional[DownloadStatus] = None,
        platform: Optional[PlatformType] = None
    ) -> List[VideoDownload]:
        """Get all downloads with optional filters"""
        query = {}
        
        if status:
            query["status"] = status
        
        if platform:
            query["platform"] = platform
        
        cursor = self.collection.find(query).sort("created_at", -1)
        
        if offset:
            cursor = cursor.skip(offset)
        
        if limit:
            cursor = cursor.limit(limit)
        
        docs = await cursor.to_list(length=limit)
        
        downloads = []
        for doc in docs:
            doc['id'] = str(doc.pop('_id'))
            downloads.append(VideoDownload(**doc))
        
        return downloads
    
    async def get_download_stats(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Get download statistics"""
        query = {}
        if user_id:
            query["user_id"] = user_id
        
        # Total downloads
        total_downloads = await self.collection.count_documents(query)
        
        # Completed downloads
        completed_query = {**query, "status": DownloadStatus.COMPLETED}
        completed_downloads = await self.collection.count_documents(completed_query)
        
        # Failed downloads
        failed_query = {**query, "status": DownloadStatus.FAILED}
        failed_downloads = await self.collection.count_documents(failed_query)
        
        # Downloads by platform
        platform_pipeline = [
            {"$match": query},
            {"$group": {"_id": "$platform", "count": {"$sum": 1}}}
        ]
        
        platform_stats = {}
        async for doc in self.collection.aggregate(platform_pipeline):
            platform_stats[doc['_id']] = doc['count']
        
        # Recent downloads (last 30 days)
        recent_query = {
            **query,
            "created_at": {"$gte": datetime.utcnow() - timedelta(days=30)}
        }
        recent_downloads = await self.collection.count_documents(recent_query)
        
        # Success rate
        success_rate = 0.0
        if total_downloads > 0:
            success_rate = (completed_downloads / total_downloads) * 100
        
        return {
            "total_downloads": total_downloads,
            "completed_downloads": completed_downloads,
            "failed_downloads": failed_downloads,
            "success_rate": round(success_rate, 1),
            "platform_stats": platform_stats,
            "recent_downloads": recent_downloads
        }
    
    async def cleanup_old_downloads(self, days: int = 30) -> int:
        """Clean up downloads older than specified days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Find old downloads
        old_downloads = await self.collection.find({
            "created_at": {"$lt": cutoff_date},
            "status": {"$in": [DownloadStatus.COMPLETED, DownloadStatus.FAILED]}
        }).to_list(length=None)
        
        # Delete old downloads
        if old_downloads:
            old_ids = [doc["download_id"] for doc in old_downloads]
            result = await self.collection.delete_many({
                "download_id": {"$in": old_ids}
            })
            return result.deleted_count
        
        return 0
    
    async def search_downloads(
        self, 
        query: str, 
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> List[VideoDownload]:
        """Search downloads by title or uploader"""
        search_query = {
            "$or": [
                {"metadata.title": {"$regex": query, "$options": "i"}},
                {"metadata.uploader": {"$regex": query, "$options": "i"}},
                {"url": {"$regex": query, "$options": "i"}}
            ]
        }
        
        if user_id:
            search_query["user_id"] = user_id
        
        cursor = self.collection.find(search_query).sort("created_at", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        
        downloads = []
        for doc in docs:
            doc['id'] = str(doc.pop('_id'))
            downloads.append(VideoDownload(**doc))
        
        return downloads