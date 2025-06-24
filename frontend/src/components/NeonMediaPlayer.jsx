import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipForward, 
  SkipBack, 
  Maximize2, 
  Minimize2,
  Download,
  Share,
  Heart
} from 'lucide-react';

const NeonMediaPlayer = ({ 
  mediaUrl, 
  mediaType = 'video', 
  title = 'Media Player',
  onClose,
  isVisible = true 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const mediaRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateProgress = () => {
      setCurrentTime(media.currentTime);
      setDuration(media.duration || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(media.duration || 0);
    };

    media.addEventListener('timeupdate', updateProgress);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      media.removeEventListener('timeupdate', updateProgress);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [mediaUrl]);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value) => {
    const media = mediaRef.current;
    const newTime = (value[0] / 100) * duration;
    media.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    mediaRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (isMuted) {
      media.volume = volume;
      setIsMuted(false);
    } else {
      media.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds) => {
    const media = mediaRef.current;
    media.currentTime = Math.max(0, Math.min(duration, media.currentTime + seconds));
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card 
        ref={containerRef}
        className={`glass-card w-full transition-all duration-300 ${
          isFullscreen ? 'max-w-full h-full' : 'max-w-4xl'
        }`}
      >
        <CardHeader className="border-b border-cyan-400/20">
          <div className="flex items-center justify-between">
            <CardTitle className="neon-text text-lg flex items-center gap-2">
              {mediaType === 'video' ? '🎬' : '🎵'} {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className={`${isLiked ? 'text-pink-400' : 'text-gray-400'} hover:text-pink-400`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Share className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Download className="w-5 h-5" />
              </Button>
              {!isFullscreen && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Media Element */}
          <div className="relative bg-black">
            {mediaType === 'video' ? (
              <video
                ref={mediaRef}
                src={mediaUrl}
                className="w-full h-auto max-h-[60vh]"
                onClick={togglePlay}
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
                <audio ref={mediaRef} src={mediaUrl} />
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center animate-neon-pulse">
                    <span className="text-4xl">🎵</span>
                  </div>
                  <h3 className="neon-text text-xl">{title}</h3>
                </div>
              </div>
            )}
            
            {/* Play Button Overlay */}
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={togglePlay}
              >
                <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center animate-neon-glow">
                  <Play className="w-10 h-10 text-cyan-400 ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 space-y-4 bg-gradient-to-r from-gray-900/90 to-black/90">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(-10)}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={togglePlay}
                  className="text-cyan-400 hover:text-cyan-300 p-3 rounded-full bg-cyan-400/10 hover:bg-cyan-400/20"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(10)}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-gray-400 hover:text-white"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {/* Fullscreen */}
                {mediaType === 'video' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-gray-400 hover:text-white"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-5 h-5" />
                    ) : (
                      <Maximize2 className="w-5 h-5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NeonMediaPlayer;