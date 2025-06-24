#!/usr/bin/env python3
import requests
import json
import time
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

def test_health_check():
    """Test the API health check endpoint"""
    print("\n1. Testing Health Check Endpoint (GET /api/)...")
    try:
        response = requests.get(f"{API_URL}/")
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "Video Downloader API" in data["message"]:
                print("✅ Health check endpoint is working correctly")
                print(f"   Response: {data}")
                return True
            else:
                print("❌ Health check endpoint returned unexpected data")
                print(f"   Response: {data}")
                return False
        else:
            print(f"❌ Health check endpoint returned status code {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing health check endpoint: {e}")
        return False

def test_validate_youtube_url():
    """Test validating a YouTube URL"""
    print("\n2. Testing Video URL Validation (POST /api/video/validate)...")
    try:
        test_youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Roll
        payload = {"url": test_youtube_url}
        response = requests.post(f"{API_URL}/video/validate", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("valid") and data.get("platform") == "youtube" and "video_info" in data:
                print("✅ Video URL validation endpoint is working correctly")
                print(f"   Video title: {data['video_info'].get('title', 'N/A')}")
                return True
            else:
                print("❌ Video URL validation endpoint returned unexpected data")
                print(f"   Response: {data}")
                return False
        else:
            print(f"❌ Video URL validation endpoint returned status code {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing video URL validation endpoint: {e}")
        return False

def test_quality_options_youtube():
    """Test getting quality options for YouTube"""
    print("\n3. Testing Quality Options Retrieval (GET /api/quality-options/youtube)...")
    try:
        response = requests.get(f"{API_URL}/quality-options/youtube")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("platform") == "youtube" and "options" in data and len(data["options"]) > 0:
                print("✅ Quality options retrieval endpoint is working correctly")
                print(f"   Available options: {[opt.get('value') for opt in data['options']]}")
                return True
            else:
                print("❌ Quality options retrieval endpoint returned unexpected data")
                print(f"   Response: {data}")
                return False
        else:
            print(f"❌ Quality options retrieval endpoint returned status code {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing quality options retrieval endpoint: {e}")
        return False

def test_start_download():
    """Test starting a YouTube video download"""
    print("\n4. Testing Download Initiation (POST /api/download/start)...")
    try:
        test_youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Roll
        payload = {
            "url": test_youtube_url,
            "quality": "720p",
            "format": "mp4",
            "educational_purpose": True,
            "user_id": "test_user_123"
        }
        response = requests.post(f"{API_URL}/download/start", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if "download_id" in data and data.get("platform") == "youtube" and data.get("status") == "started":
                print("✅ Download initiation endpoint is working correctly")
                print(f"   Download ID: {data['download_id']}")
                return data["download_id"]
            else:
                print("❌ Download initiation endpoint returned unexpected data")
                print(f"   Response: {data}")
                return None
        else:
            print(f"❌ Download initiation endpoint returned status code {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error testing download initiation endpoint: {e}")
        return None

def test_download_progress(download_id):
    """Test checking download progress"""
    print("\n5. Testing Download Progress Tracking (GET /api/download/progress/{download_id})...")
    if not download_id:
        print("❌ Cannot test download progress without a valid download_id")
        return False
    
    try:
        # Wait a moment for the download to start
        time.sleep(2)
        
        response = requests.get(f"{API_URL}/download/progress/{download_id}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("download_id") == download_id and "status" in data and "progress_percent" in data:
                print("✅ Download progress tracking endpoint is working correctly")
                print(f"   Status: {data['status']}, Progress: {data['progress_percent']}%")
                return True
            else:
                print("❌ Download progress tracking endpoint returned unexpected data")
                print(f"   Response: {data}")
                return False
        else:
            print(f"❌ Download progress tracking endpoint returned status code {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing download progress tracking endpoint: {e}")
        return False

def cleanup_download(download_id):
    """Clean up by deleting the test download"""
    if download_id:
        try:
            requests.delete(f"{API_URL}/download/{download_id}")
            print(f"\nCleanup: Deleted test download {download_id}")
        except Exception as e:
            print(f"\nError cleaning up download {download_id}: {e}")

def run_tests():
    """Run all tests and return results"""
    results = {}
    
    # Test 1: Health Check
    results["health_check"] = test_health_check()
    
    # Test 2: Video URL Validation
    results["video_validation"] = test_validate_youtube_url()
    
    # Test 3: Quality Options
    results["quality_options"] = test_quality_options_youtube()
    
    # Test 4: Download Initiation
    download_id = test_start_download()
    results["download_initiation"] = bool(download_id)
    
    # Test 5: Download Progress
    results["download_progress"] = test_download_progress(download_id)
    
    # Cleanup
    cleanup_download(download_id)
    
    # Print summary
    print("\n=== TEST SUMMARY ===")
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    # Overall result
    all_passed = all(results.values())
    print(f"\nOVERALL RESULT: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    return all_passed

if __name__ == "__main__":
    run_tests()