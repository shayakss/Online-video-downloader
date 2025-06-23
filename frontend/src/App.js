import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import VideoDownloader from "./components/VideoDownloader";
import DownloadHistory from "./components/DownloadHistory";
import Settings from "./components/Settings";
import Navigation from "./components/Navigation";
import { mockVideos, mockDownloadStats } from "./data/mock";

function App() {
  const [videos, setVideos] = useState([]);
  const [downloadStats, setDownloadStats] = useState(mockDownloadStats);
  const [currentDownloads, setCurrentDownloads] = useState([]);

  useEffect(() => {
    // Load mock data on app start
    const savedVideos = localStorage.getItem('downloadedVideos');
    if (savedVideos) {
      setVideos(JSON.parse(savedVideos));
    } else {
      setVideos(mockVideos);
      localStorage.setItem('downloadedVideos', JSON.stringify(mockVideos));
    }

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  const addVideo = (video) => {
    const updatedVideos = [video, ...videos];
    setVideos(updatedVideos);
    localStorage.setItem('downloadedVideos', JSON.stringify(updatedVideos));
  };

  const updateVideo = (videoId, updates) => {
    const updatedVideos = videos.map(video => 
      video.id === videoId ? { ...video, ...updates } : video
    );
    setVideos(updatedVideos);
    localStorage.setItem('downloadedVideos', JSON.stringify(updatedVideos));
  };

  const deleteVideo = (videoId) => {
    const updatedVideos = videos.filter(video => video.id !== videoId);
    setVideos(updatedVideos);
    localStorage.setItem('downloadedVideos', JSON.stringify(updatedVideos));
  };

  return (
    <div className="App min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <BrowserRouter>
        <div className="pb-20">
          <Routes>
            <Route 
              path="/" 
              element={
                <VideoDownloader 
                  videos={videos}
                  onAddVideo={addVideo}
                  onUpdateVideo={updateVideo}
                  currentDownloads={currentDownloads}
                  setCurrentDownloads={setCurrentDownloads}
                />
              } 
            />
            <Route 
              path="/history" 
              element={
                <DownloadHistory 
                  videos={videos}
                  onDeleteVideo={deleteVideo}
                  stats={downloadStats}
                />
              } 
            />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
        <Navigation />
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;