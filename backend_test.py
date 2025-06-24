#!/usr/bin/env python3
import requests
import json
import time
import unittest
import sys
import os
from typing import Dict, Any, Optional

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

class VideoDownloaderAPITest(unittest.TestCase):
    """Test suite for the Video Downloader API"""
    
    def setUp(self):
        """Set up test case"""
        self.test_youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Roll
        self.test_instagram_url = "https://www.instagram.com/p/sample/"  # Sample URL
        self.test_tiktok_url = "https://www.tiktok.com/@sample/video/123"  # Sample URL
        self.test_facebook_url = "https://www.facebook.com/watch/?v=123"  # Sample URL
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
    
    def test_02_validate_youtube_url(self):
        """Test validating a YouTube URL"""
        payload = {"url": self.test_youtube_url}
        response = requests.post(f"{API_URL}/video/validate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["valid"])
        self.assertEqual(data["platform"], "youtube")
        self.assertIn("video_info", data)
        self.assertIn("title", data["video_info"])
        print(f"YouTube video title: {data['video_info']['title']}")
    
    def test_03_validate_invalid_url(self):
        """Test validating an invalid URL"""
        payload = {"url": "https://example.com/not-a-video"}
        response = requests.post(f"{API_URL}/video/validate", json=payload)
        self.assertEqual(response.status_code, 400)
    
    def test_04_get_quality_options_youtube(self):
        """Test getting quality options for YouTube"""
        response = requests.get(f"{API_URL}/quality-options/youtube")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["platform"], "youtube")
        self.assertIn("options", data)
        self.assertTrue(len(data["options"]) > 0)
        
        # Check if common quality options are present
        quality_values = [opt["value"] for opt in data["options"]]
        self.assertIn("best", quality_values)
        self.assertIn("1080p", quality_values)
        self.assertIn("720p", quality_values)
    
    def test_05_get_quality_options_instagram(self):
        """Test getting quality options for Instagram"""
        response = requests.get(f"{API_URL}/quality-options/instagram")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["platform"], "instagram")
        self.assertIn("options", data)
        self.assertTrue(len(data["options"]) > 0)
    
    def test_06_get_quality_options_tiktok(self):
        """Test getting quality options for TikTok"""
        response = requests.get(f"{API_URL}/quality-options/tiktok")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["platform"], "tiktok")
        self.assertIn("options", data)
        self.assertTrue(len(data["options"]) > 0)
    
    def test_07_get_quality_options_facebook(self):
        """Test getting quality options for Facebook"""
        response = requests.get(f"{API_URL}/quality-options/facebook")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["platform"], "facebook")
        self.assertIn("options", data)
        self.assertTrue(len(data["options"]) > 0)
    
    def test_08_start_download_youtube(self):
        """Test starting a YouTube video download"""
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
        
        # Save download_id for cleanup
        self.download_ids.append(data["download_id"])
        
        # Return download_id for use in subsequent tests
        return data["download_id"]
    
    def test_09_check_download_progress(self):
        """Test checking download progress"""
        # Start a download first
        download_id = self.test_08_start_download_youtube()
        
        # Wait a moment for the download to start
        time.sleep(2)
        
        # Check progress
        response = requests.get(f"{API_URL}/download/progress/{download_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["download_id"], download_id)
        self.assertIn("status", data)
        self.assertIn("progress_percent", data)
        
        # Status should be one of: downloading, completed, failed
        self.assertIn(data["status"], ["pending", "downloading", "completed", "failed"])
        
        print(f"Download status: {data['status']}, Progress: {data['progress_percent']}%")
    
    def test_10_get_download_metadata(self):
        """Test getting download metadata"""
        # Start a download first
        download_id = self.test_08_start_download_youtube()
        
        # Wait a moment for the download to start
        time.sleep(2)
        
        # Get metadata
        response = requests.get(f"{API_URL}/download/metadata/{download_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["download_id"], download_id)
        self.assertIn("platform", data)
        self.assertEqual(data["platform"], "youtube")
        
        # Metadata might be None if download hasn't progressed enough
        if data["metadata"]:
            self.assertIn("title", data["metadata"])
            print(f"Video title: {data['metadata']['title']}")
    
    def test_11_get_download_history(self):
        """Test getting download history"""
        # Start a download first to ensure there's history
        self.test_08_start_download_youtube()
        
        # Get history
        response = requests.get(f"{API_URL}/download/history")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("downloads", data)
        self.assertIn("count", data)
        self.assertGreaterEqual(data["count"], 1)
        
        # Check filtering by user_id
        response = requests.get(f"{API_URL}/download/history?user_id=test_user_123")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("downloads", data)
        for download in data["downloads"]:
            self.assertEqual(download["user_id"], "test_user_123")
    
    def test_12_get_download_stats(self):
        """Test getting download statistics"""
        # Start a download first to ensure there are stats
        self.test_08_start_download_youtube()
        
        # Get stats
        response = requests.get(f"{API_URL}/download/stats")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_downloads", data)
        self.assertIn("completed_downloads", data)
        self.assertIn("failed_downloads", data)
        self.assertIn("success_rate", data)
        self.assertIn("platform_stats", data)
        
        # Check user-specific stats
        response = requests.get(f"{API_URL}/download/stats?user_id=test_user_123")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_downloads", data)
    
    def test_13_delete_download(self):
        """Test deleting a download"""
        # Start a download first
        download_id = self.test_08_start_download_youtube()
        
        # Wait a moment for the download to start
        time.sleep(2)
        
        # Delete the download
        response = requests.delete(f"{API_URL}/download/{download_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("deleted successfully", data["message"])
        
        # Verify it's gone
        response = requests.get(f"{API_URL}/download/metadata/{download_id}")
        self.assertEqual(response.status_code, 404)
        
        # Remove from cleanup list since we already deleted it
        self.download_ids.remove(download_id)
    
    def test_14_search_downloads(self):
        """Test searching downloads"""
        # Start a download first
        self.test_08_start_download_youtube()
        
        # Wait a moment for the download to start
        time.sleep(2)
        
        # Search for "Rick" (should match the Rick Roll video)
        response = requests.get(f"{API_URL}/download/search?q=Rick")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("downloads", data)
        self.assertIn("count", data)
        
        # Search with user filter
        response = requests.get(f"{API_URL}/download/search?q=Rick&user_id=test_user_123")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("downloads", data)
    
    def test_15_educational_purpose_required(self):
        """Test that educational purpose confirmation is required"""
        payload = {
            "url": self.test_youtube_url,
            "quality": "720p",
            "format": "mp4",
            "educational_purpose": False,  # Set to False to test requirement
            "user_id": "test_user_123"
        }
        response = requests.post(f"{API_URL}/download/start", json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("detail", data)
        self.assertIn("educational purposes", data["detail"].lower())
    
    def test_16_cancel_download(self):
        """Test cancelling an active download"""
        # Start a download first
        download_id = self.test_08_start_download_youtube()
        
        # Wait a moment for the download to start
        time.sleep(1)
        
        # Cancel the download
        response = requests.post(f"{API_URL}/download/cancel/{download_id}")
        
        # This might succeed or fail depending on how fast the download completes
        if response.status_code == 200:
            data = response.json()
            self.assertIn("message", data)
            self.assertIn("cancelled successfully", data["message"])
            
            # Check that status is updated
            response = requests.get(f"{API_URL}/download/progress/{download_id}")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            # Status might be cancelled or already completed
            self.assertIn(data["status"], ["cancelled", "completed"])
        else:
            print(f"Cancel download returned status {response.status_code} - this is expected if download completed quickly")

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)