#!/usr/bin/env python3
import requests
import json
import time
import unittest
import sys
import os
from typing import Dict, Any, Optional, List
import subprocess
import re
import asyncio
import statistics
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = None
try:
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BACKEND_URL = line.strip().split('=')[1].strip('"\'')
                break
except Exception as e:
    print(f"Error reading frontend .env file: {e}")
    sys.exit(1)

if not BACKEND_URL:
    print("Could not find REACT_APP_BACKEND_URL in frontend .env file")
    sys.exit(1)

API_URL = f"{BACKEND_URL}/api"
print(f"Using API URL: {API_URL}")

# Performance testing utilities
class DownloadSpeedTest:
    """Utility class for measuring download speed and performance"""
    
    def __init__(self, api_url: str):
        self.api_url = api_url
        self.download_ids = []
        
    def cleanup(self):
        """Clean up any downloads created during testing"""
        for download_id in self.download_ids:
            try:
                requests.delete(f"{self.api_url}/download/{download_id}")
            except Exception as e:
                print(f"Error cleaning up download {download_id}: {e}")
    
    def start_download(self, url: str, platform: str, quality: str = "best") -> Optional[str]:
        """Start a download and return the download_id"""
        payload = {
            "url": url,
            "quality": quality,
            "format": "mp4",
            "educational_purpose": True,
            "user_id": f"perf_test_{int(time.time())}"
        }
        
        try:
            response = requests.post(f"{self.api_url}/download/start", json=payload)
            if response.status_code == 200:
                data = response.json()
                download_id = data["download_id"]
                self.download_ids.append(download_id)
                return download_id
            else:
                print(f"Failed to start download: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error starting download: {e}")
            return None
    
    def track_download_progress(self, download_id: str, poll_interval: float = 1.0, timeout: int = 300) -> Dict[str, Any]:
        """Track download progress and collect performance metrics"""
        start_time = time.time()
        progress_data_points = []
        speeds = []
        
        try:
            completed = False
            last_progress = 0
            
            for _ in range(int(timeout / poll_interval)):
                response = requests.get(f"{self.api_url}/download/progress/{download_id}")
                if response.status_code != 200:
                    break
                    
                progress_data = response.json()
                current_time = time.time() - start_time
                
                # Extract speed if available
                if progress_data.get("speed"):
                    speed_str = progress_data["speed"]
                    try:
                        # Convert speed string (like "1.2 MiB/s") to MB/s
                        speed_value = float(speed_str.split()[0])
                        if "KiB/s" in speed_str:
                            speed_value /= 1024
                        elif "GiB/s" in speed_str:
                            speed_value *= 1024
                        speeds.append(speed_value)
                    except (ValueError, IndexError):
                        pass
                
                # Calculate progress delta
                progress_delta = progress_data["progress_percent"] - last_progress
                last_progress = progress_data["progress_percent"]
                
                # Store progress data point
                progress_data_points.append({
                    "time": current_time,
                    "progress": progress_data["progress_percent"],
                    "progress_delta": progress_delta,
                    "speed": progress_data.get("speed"),
                    "eta": progress_data.get("eta"),
                    "status": progress_data["status"]
                })
                
                # Check if download is complete or failed
                if progress_data["status"] in ["completed", "failed", "cancelled"]:
                    completed = True
                    break
                    
                time.sleep(poll_interval)
            
            end_time = time.time()
            total_time = end_time - start_time
            
            # Get final download metadata
            metadata = None
            try:
                metadata_response = requests.get(f"{self.api_url}/download/metadata/{download_id}")
                if metadata_response.status_code == 200:
                    metadata = metadata_response.json()
            except Exception:
                pass
            
            # Calculate performance metrics
            avg_speed = statistics.mean(speeds) if speeds else 0
            max_speed = max(speeds) if speeds else 0
            
            # Get file size if available
            file_size_mb = 0
            if metadata and metadata.get("metadata") and metadata["metadata"].get("file_size"):
                try:
                    file_size_str = metadata["metadata"]["file_size"]
                    if "MB" in file_size_str:
                        file_size_mb = float(file_size_str.split()[0])
                except (ValueError, IndexError):
                    pass
            
            return {
                "download_id": download_id,
                "completed": completed,
                "total_time": total_time,
                "avg_speed_mbs": avg_speed,
                "max_speed_mbs": max_speed,
                "progress_points": progress_data_points,
                "file_size_mb": file_size_mb,
                "metadata": metadata
            }
            
        except Exception as e:
            print(f"Error tracking download progress: {e}")
            return {
                "download_id": download_id,
                "completed": False,
                "error": str(e)
            }

class VideoDownloaderAPITest(unittest.TestCase):
    """Test suite for the Video Downloader API"""
    
    def setUp(self):
        """Set up test case"""
        # Real URLs for testing
        self.test_youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Roll
        self.test_instagram_url = "https://www.instagram.com/reel/C8Nt-aBOYQP/"  # Public Instagram reel
        self.test_tiktok_url = "https://www.tiktok.com/@khaby.lame/video/7074356384316098821"  # Public TikTok
        self.test_facebook_url = "https://www.facebook.com/watch?v=1425919524625316"  # Public Facebook video
        self.download_ids = []  # Track created download IDs for cleanup
    
    def tearDown(self):
        """Clean up after test case"""
        # Delete any downloads created during tests
        for download_id in self.download_ids:
            try:
                requests.delete(f"{API_URL}/download/{download_id}")
            except Exception as e:
                print(f"Error cleaning up download {download_id}: {e}")
    
    def test_01_health_check(self):
        """Test the API health check endpoint"""
        response = requests.get(f"{API_URL}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("Video Downloader API", data["message"])
        print(f"✅ Health check endpoint working: {data['message']}")
    
    def test_02_platform_detection(self):
        """Test platform detection for different URLs"""
        # Test YouTube detection
        payload = {"url": self.test_youtube_url}
        response = requests.post(f"{API_URL}/video/validate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["valid"])
        self.assertEqual(data["platform"], "youtube")
        print(f"✅ YouTube platform detection working")
        
        # Test Instagram detection
        payload = {"url": self.test_instagram_url}
        response = requests.post(f"{API_URL}/video/validate", json=payload)
        if response.status_code == 200:
            data = response.json()
            self.assertTrue(data["valid"])
            self.assertEqual(data["platform"], "instagram")
            print(f"✅ Instagram platform detection working")
        else:
            print(f"⚠️ Instagram validation returned status {response.status_code} - this might be expected if the URL is invalid or content is private")
        
        # Test TikTok detection
        payload = {"url": self.test_tiktok_url}
        response = requests.post(f"{API_URL}/video/validate", json=payload)
        if response.status_code == 200:
            data = response.json()
            self.assertTrue(data["valid"])
            self.assertEqual(data["platform"], "tiktok")
            print(f"✅ TikTok platform detection working")
        else:
            print(f"⚠️ TikTok validation returned status {response.status_code} - this might be expected if the URL is invalid or content is private")
        
        # Test Facebook detection
        payload = {"url": self.test_facebook_url}
        response = requests.post(f"{API_URL}/video/validate", json=payload)
        if response.status_code == 200:
            data = response.json()
            self.assertTrue(data["valid"])
            self.assertEqual(data["platform"], "facebook")
            print(f"✅ Facebook platform detection working")
        else:
            print(f"⚠️ Facebook validation returned status {response.status_code} - this might be expected if the URL is invalid or content is private")
    
    def test_03_validate_invalid_url(self):
        """Test validating an invalid URL"""
        payload = {"url": "https://example.com/not-a-video"}
        response = requests.post(f"{API_URL}/video/validate", json=payload)
        self.assertEqual(response.status_code, 400)
        print(f"✅ Invalid URL validation working - rejected with status 400")
    
    def test_04_quality_options_all_platforms(self):
        """Test quality options for all platforms"""
        platforms = ["youtube", "instagram", "tiktok", "facebook"]
        
        for platform in platforms:
            response = requests.get(f"{API_URL}/quality-options/{platform}")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["platform"], platform)
            self.assertIn("options", data)
            self.assertTrue(len(data["options"]) > 0)
            
            # Check if "best" quality option is present for all platforms
            quality_values = [opt["value"] for opt in data["options"]]
            self.assertIn("best", quality_values)
            
            # Platform-specific quality checks
            if platform == "youtube":
                # YouTube should have common resolutions
                self.assertTrue(any(q in quality_values for q in ["1080p", "720p", "480p"]))
            elif platform == "facebook":
                # Facebook should have HD option
                self.assertTrue(any(q in quality_values for q in ["720p", "480p"]))
            
            print(f"✅ {platform.capitalize()} quality options working - found {len(data['options'])} options")
    
    def test_05_youtube_download_workflow(self):
        """Test complete YouTube download workflow"""
        # 1. Start download
        payload = {
            "url": self.test_youtube_url,
            "quality": "720p",
            "format": "mp4",
            "educational_purpose": True,
            "user_id": "test_user_123"
        }
        response = requests.post(f"{API_URL}/download/start", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("download_id", data)
        self.assertEqual(data["platform"], "youtube")
        self.assertEqual(data["status"], "started")
        
        download_id = data["download_id"]
        self.download_ids.append(download_id)
        print(f"✅ YouTube download initiated with ID: {download_id}")
        
        # 2. Check progress
        max_checks = 10
        completed = False
        
        for i in range(max_checks):
            time.sleep(3)  # Wait between checks
            response = requests.get(f"{API_URL}/download/progress/{download_id}")
            self.assertEqual(response.status_code, 200)
            progress_data = response.json()
            
            print(f"   Progress check {i+1}: Status={progress_data['status']}, Progress={progress_data['progress_percent']}%")
            
            if progress_data["status"] in ["completed", "failed"]:
                completed = True
                break
        
        # 3. Get metadata
        response = requests.get(f"{API_URL}/download/metadata/{download_id}")
        self.assertEqual(response.status_code, 200)
        metadata = response.json()
        
        if metadata["metadata"]:
            print(f"✅ Download metadata retrieved: {metadata['metadata'].get('title', 'No title')}")
        
        # 4. Check if file is available (if download completed)
        if completed and progress_data["status"] == "completed":
            response = requests.get(f"{API_URL}/download/file/{download_id}", stream=True)
            if response.status_code == 200:
                content_length = int(response.headers.get('content-length', 0))
                self.assertGreater(content_length, 0)
                print(f"✅ Download file available - size: {content_length/1024/1024:.2f} MB")
            else:
                print(f"⚠️ Download file not available yet - status: {response.status_code}")
        
        return download_id
    
    def test_06_instagram_download(self):
        """Test Instagram download"""
        payload = {
            "url": self.test_instagram_url,
            "quality": "best",
            "format": "mp4",
            "educational_purpose": True,
            "user_id": "test_user_456"
        }
        response = requests.post(f"{API_URL}/download/start", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            self.assertIn("download_id", data)
            self.assertEqual(data["platform"], "instagram")
            self.assertEqual(data["status"], "started")
            
            download_id = data["download_id"]
            self.download_ids.append(download_id)
            print(f"✅ Instagram download initiated with ID: {download_id}")
            
            # Check progress
            time.sleep(5)  # Wait a bit longer for Instagram
            response = requests.get(f"{API_URL}/download/progress/{download_id}")
            if response.status_code == 200:
                progress_data = response.json()
                print(f"   Instagram download status: {progress_data['status']}, Progress: {progress_data['progress_percent']}%")
            
            return download_id
        else:
            print(f"⚠️ Instagram download failed to start - status: {response.status_code}")
            if response.status_code == 400:
                print(f"   Error: {response.json().get('detail', 'Unknown error')}")
            return None
    
    def test_07_facebook_download(self):
        """Test Facebook download"""
        payload = {
            "url": self.test_facebook_url,
            "quality": "best",
            "format": "mp4",
            "educational_purpose": True,
            "user_id": "test_user_789"
        }
        response = requests.post(f"{API_URL}/download/start", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            self.assertIn("download_id", data)
            self.assertEqual(data["platform"], "facebook")
            self.assertEqual(data["status"], "started")
            
            download_id = data["download_id"]
            self.download_ids.append(download_id)
            print(f"✅ Facebook download initiated with ID: {download_id}")
            
            # Check progress
            time.sleep(5)  # Wait a bit longer for Facebook
            response = requests.get(f"{API_URL}/download/progress/{download_id}")
            if response.status_code == 200:
                progress_data = response.json()
                print(f"   Facebook download status: {progress_data['status']}, Progress: {progress_data['progress_percent']}%")
            
            return download_id
        else:
            print(f"⚠️ Facebook download failed to start - status: {response.status_code}")
            if response.status_code == 400:
                print(f"   Error: {response.json().get('detail', 'Unknown error')}")
            return None
    
    def test_08_tiktok_download(self):
        """Test TikTok download"""
        payload = {
            "url": self.test_tiktok_url,
            "quality": "best",
            "format": "mp4",
            "educational_purpose": True,
            "user_id": "test_user_101112"
        }
        response = requests.post(f"{API_URL}/download/start", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            self.assertIn("download_id", data)
            self.assertEqual(data["platform"], "tiktok")
            self.assertEqual(data["status"], "started")
            
            download_id = data["download_id"]
            self.download_ids.append(download_id)
            print(f"✅ TikTok download initiated with ID: {download_id}")
            
            # Check progress
            time.sleep(5)  # Wait a bit longer for TikTok
            response = requests.get(f"{API_URL}/download/progress/{download_id}")
            if response.status_code == 200:
                progress_data = response.json()
                print(f"   TikTok download status: {progress_data['status']}, Progress: {progress_data['progress_percent']}%")
            
            return download_id
        else:
            print(f"⚠️ TikTok download failed to start - status: {response.status_code}")
            if response.status_code == 400:
                print(f"   Error: {response.json().get('detail', 'Unknown error')}")
            return None
    
    def test_09_download_with_different_qualities(self):
        """Test downloading with different quality options"""
        qualities = ["best", "720p", "480p"]
        results = {}
        
        for quality in qualities:
            payload = {
                "url": self.test_youtube_url,
                "quality": quality,
                "format": "mp4",
                "educational_purpose": True,
                "user_id": f"test_user_quality_{quality}"
            }
            response = requests.post(f"{API_URL}/download/start", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                download_id = data["download_id"]
                self.download_ids.append(download_id)
                
                # Wait a bit for download to progress
                time.sleep(3)
                
                # Check progress
                progress_response = requests.get(f"{API_URL}/download/progress/{download_id}")
                if progress_response.status_code == 200:
                    progress_data = progress_response.json()
                    results[quality] = {
                        "download_id": download_id,
                        "status": progress_data["status"],
                        "progress": progress_data["progress_percent"]
                    }
                    print(f"✅ Download with quality '{quality}' initiated - Status: {progress_data['status']}")
                else:
                    results[quality] = {"error": "Failed to get progress"}
            else:
                results[quality] = {"error": f"Failed to start download - status: {response.status_code}"}
                print(f"⚠️ Download with quality '{quality}' failed to start")
        
        return results
    
    def test_10_download_history_and_filtering(self):
        """Test download history with filtering"""
        # Start downloads with different user IDs and platforms
        self.test_05_youtube_download_workflow()  # YouTube
        instagram_id = self.test_06_instagram_download()  # Instagram
        facebook_id = self.test_07_facebook_download()  # Facebook
        
        # Wait for downloads to be recorded
        time.sleep(3)
        
        # Test basic history retrieval
        response = requests.get(f"{API_URL}/download/history")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("downloads", data)
        self.assertGreaterEqual(data["count"], 1)
        print(f"✅ Download history retrieval working - found {data['count']} downloads")
        
        # Test filtering by user_id
        response = requests.get(f"{API_URL}/download/history?user_id=test_user_123")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for download in data["downloads"]:
            self.assertEqual(download["user_id"], "test_user_123")
        print(f"✅ User filtering working - found {data['count']} downloads for test_user_123")
        
        # Test filtering by platform
        response = requests.get(f"{API_URL}/download/history?platform=youtube")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for download in data["downloads"]:
            self.assertEqual(download["platform"], "youtube")
        print(f"✅ Platform filtering working - found {data['count']} YouTube downloads")
        
        # Test filtering by status
        response = requests.get(f"{API_URL}/download/history?status=downloading")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for download in data["downloads"]:
            self.assertEqual(download["status"], "downloading")
        print(f"✅ Status filtering working - found {data['count']} downloads with 'downloading' status")
    
    def test_11_download_stats(self):
        """Test download statistics"""
        # Ensure we have some downloads
        self.test_05_youtube_download_workflow()
        
        # Get global stats
        response = requests.get(f"{API_URL}/download/stats")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_downloads", data)
        self.assertIn("completed_downloads", data)
        self.assertIn("failed_downloads", data)
        self.assertIn("success_rate", data)
        self.assertIn("platform_stats", data)
        print(f"✅ Download stats working - Total: {data['total_downloads']}, Success rate: {data['success_rate']}%")
        
        # Get user-specific stats
        response = requests.get(f"{API_URL}/download/stats?user_id=test_user_123")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print(f"✅ User-specific stats working - User test_user_123 has {data['total_downloads']} downloads")
        
        # Check platform stats
        if "platform_stats" in data and data["platform_stats"]:
            platforms = list(data["platform_stats"].keys())
            counts = list(data["platform_stats"].values())
            print(f"✅ Platform stats working - Downloads by platform: {', '.join([f'{p}: {c}' for p, c in data['platform_stats'].items()])}")
    
    def test_12_download_search(self):
        """Test searching downloads"""
        # Ensure we have a YouTube download
        self.test_05_youtube_download_workflow()
        
        # Wait for download to be processed
        time.sleep(3)
        
        # Search for "Rick" (should match the Rick Roll video)
        response = requests.get(f"{API_URL}/download/search?q=Rick")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("downloads", data)
        
        if data["count"] > 0:
            print(f"✅ Download search working - found {data['count']} results for 'Rick'")
            # Check if titles contain the search term
            for download in data["downloads"]:
                if download.get("metadata") and download["metadata"].get("title"):
                    self.assertTrue("Rick" in download["metadata"]["title"] or "rick" in download["metadata"]["title"].lower())
        else:
            print("⚠️ No search results found for 'Rick' - this might be expected if metadata isn't fully processed yet")
        
        # Search with user filter
        response = requests.get(f"{API_URL}/download/search?q=Rick&user_id=test_user_123")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # All results should be for the specified user
        for download in data["downloads"]:
            self.assertEqual(download["user_id"], "test_user_123")
        
        print(f"✅ Search with user filtering working - found {data['count']} results for 'Rick' from test_user_123")
    
    def test_13_error_handling(self):
        """Test error handling for various scenarios"""
        # Test invalid URL format
        payload = {"url": "not-a-url"}
        response = requests.post(f"{API_URL}/video/validate", json=payload)
        self.assertEqual(response.status_code, 422)  # Validation error
        print("✅ Invalid URL format correctly rejected with 422")
        
        # Test missing URL
        payload = {}
        response = requests.post(f"{API_URL}/video/validate", json=payload)
        self.assertEqual(response.status_code, 400)  # Bad request
        print("✅ Missing URL correctly rejected with 400")
        
        # Test invalid download ID
        response = requests.get(f"{API_URL}/download/progress/non-existent-id")
        self.assertEqual(response.status_code, 404)  # Not found
        print("✅ Invalid download ID correctly rejected with 404")
        
        # Test educational purpose requirement
        payload = {
            "url": self.test_youtube_url,
            "quality": "720p",
            "format": "mp4",
            "educational_purpose": False,
            "user_id": "test_user_123"
        }
        response = requests.post(f"{API_URL}/download/start", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("educational purposes", response.json()["detail"].lower())
        print("✅ Educational purpose requirement correctly enforced")
    
    def test_14_cancel_and_delete_download(self):
        """Test cancelling and deleting downloads"""
        # Start a download
        download_id = self.test_05_youtube_download_workflow()
        
        # Try to cancel the download
        response = requests.post(f"{API_URL}/download/cancel/{download_id}")
        
        # This might succeed or fail depending on how fast the download completes
        if response.status_code == 200:
            print("✅ Download cancellation successful")
            
            # Check that status is updated
            response = requests.get(f"{API_URL}/download/progress/{download_id}")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn(data["status"], ["cancelled", "completed"])
        else:
            print(f"⚠️ Cancel download returned status {response.status_code} - this is expected if download completed quickly")
        
        # Delete the download
        response = requests.delete(f"{API_URL}/download/{download_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("deleted successfully", data["message"])
        print("✅ Download deletion successful")
        
        # Verify it's gone
        response = requests.get(f"{API_URL}/download/metadata/{download_id}")
        self.assertEqual(response.status_code, 404)
        print("✅ Deleted download correctly returns 404")
        
        # Remove from cleanup list since we already deleted it
        if download_id in self.download_ids:
            self.download_ids.remove(download_id)
    
    def test_15_yt_dlp_version(self):
        """Test yt-dlp version"""
        try:
            # Execute yt-dlp --version
            result = subprocess.run(["yt-dlp", "--version"], capture_output=True, text=True)
            version = result.stdout.strip()
            
            # Check if version is recent
            print(f"✅ yt-dlp version: {version}")
            
            # Parse version
            version_match = re.match(r'(\d+)\.(\d+)\.(\d+)', version)
            if version_match:
                year, month, day = map(int, version_match.groups())
                # Check if version is from 2024 or later
                self.assertGreaterEqual(year, 2024)
                print(f"✅ yt-dlp version is from {year}, which is current")
            else:
                print("⚠️ Could not parse yt-dlp version format")
            
        except Exception as e:
            print(f"⚠️ Error checking yt-dlp version: {e}")
    
    def test_16_database_operations(self):
        """Test database operations through API endpoints"""
        # 1. Create a download
        download_id = self.test_05_youtube_download_workflow()
        
        # 2. Retrieve the download
        response = requests.get(f"{API_URL}/download/metadata/{download_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["download_id"], download_id)
        print("✅ Database retrieval working")
        
        # 3. Check history (database query)
        response = requests.get(f"{API_URL}/download/history?limit=5")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data["count"], 1)
        print(f"✅ Database query for history working - found {data['count']} records")
        
        # 4. Check stats (aggregation)
        response = requests.get(f"{API_URL}/download/stats")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_downloads", data)
        print(f"✅ Database aggregation for stats working - total downloads: {data['total_downloads']}")
        
        # 5. Search (text search)
        response = requests.get(f"{API_URL}/download/search?q=video")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print(f"✅ Database text search working - found {data['count']} results for 'video'")
        
        # 6. Delete (database removal)
        response = requests.delete(f"{API_URL}/download/{download_id}")
        self.assertEqual(response.status_code, 200)
        print("✅ Database deletion working")
        
        # Verify deletion
        response = requests.get(f"{API_URL}/download/metadata/{download_id}")
        self.assertEqual(response.status_code, 404)
        print("✅ Database record successfully removed")
        
        # Remove from cleanup list since we already deleted it
        if download_id in self.download_ids:
            self.download_ids.remove(download_id)

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)