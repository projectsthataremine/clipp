import { PlayIcon, PauseIcon, SpeakerLoudIcon } from "@radix-ui/react-icons";
import { useState, useRef, useEffect } from "react";

const VideoPlayer = ({ videoSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    // Load saved volume from localStorage, default to 1 if not found
    const savedVolume = localStorage.getItem('audioPlayerVolume');
    return savedVolume ? parseFloat(savedVolume) : 1;
  });
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video file as data URL
  useEffect(() => {
    const loadVideo = async () => {
      console.log('[VideoPlayer] Loading video:', videoSrc);
      try {
        const url = await window.electronAPI.getVideoDataUrl(videoSrc);
        if (url) {
          console.log('[VideoPlayer] Got data URL, length:', url.length);
          setDataUrl(url);
        } else {
          console.error('[VideoPlayer] Failed to get data URL');
        }
      } catch (error) {
        console.error('[VideoPlayer] Error loading video:', error);
      }
    };

    if (videoSrc) {
      loadVideo();
    }

    // Cleanup: pause and reset when component unmounts
    return () => {
      const video = videoRef.current;
      if (video) {
        console.log('[VideoPlayer] Cleaning up - pausing video');
        video.pause();
        video.currentTime = 0;
        setIsPlaying(false);
      }
    };
  }, [videoSrc]);

  // Apply saved volume to video element when it loads
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [dataUrl, volume]);

  // Update time as video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  const togglePlay = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        // Pause ALL other video and audio elements before playing this one
        const allVideoElements = document.querySelectorAll('video');
        const allAudioElements = document.querySelectorAll('audio');

        allVideoElements.forEach((otherVideo) => {
          if (otherVideo !== videoRef.current) {
            otherVideo.pause();
            otherVideo.currentTime = 0;
          }
        });

        allAudioElements.forEach((audio) => {
          audio.pause();
          audio.currentTime = 0;
        });

        await videoRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('[VideoPlayer] Play failed:', err);
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    // Save volume to localStorage (shared with audio player)
    localStorage.setItem('audioPlayerVolume', newVolume.toString());
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Video Display */}
      <video
        ref={videoRef}
        src={dataUrl || ""}
        style={{
          width: "280px",
          height: "158px",
          backgroundColor: "#000",
          borderRadius: "4px",
        }}
      />

      {/* Controls */}
      <div
        style={{
          width: "280px",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "white",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          {isPlaying ? (
            <PauseIcon width={20} height={20} style={{ fill: "white" }} />
          ) : (
            <PlayIcon width={20} height={20} style={{ fill: "white" }} />
          )}
        </button>

        {/* Seek Bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          style={{
            flex: 1,
            cursor: "pointer",
          }}
        />

        {/* Volume Slider */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          style={{
            width: "40px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
