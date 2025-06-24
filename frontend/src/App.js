import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import VideoDownloader from "./components/VideoDownloader";
import DownloadHistory from "./components/DownloadHistory";
import Settings from "./components/Settings";
import Navigation from "./components/Navigation";

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
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

  const handleDownloadComplete = (downloadId) => {
    // Trigger refresh of download history
    setRefreshTrigger(prev => prev + 1);
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
                  onDownloadComplete={handleDownloadComplete}
                />
              } 
            />
            <Route 
              path="/history" 
              element={
                <DownloadHistory 
                  refreshTrigger={refreshTrigger}
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