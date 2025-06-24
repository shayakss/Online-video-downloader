import { useState, useEffect } from "react";
import "./App.css";
import "./styles/globals.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./contexts/ThemeContext";
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
    <ThemeProvider>
      <div className="App min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        {/* Neon Grid Background */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        {/* Animated Neon Particles */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
        </div>
        
        <BrowserRouter>
          <div className="pb-20 relative z-10">
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
    </ThemeProvider>
  );
}

export default App;