import { PlayIcon, PauseIcon, SpeakerLoudIcon } from "@radix-ui/react-icons";
import { useState, useRef, useEffect } from "react";

const AudioPlayer = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    // Load saved volume from localStorage, default to 1 if not found
    const savedVolume = localStorage.getItem('audioPlayerVolume');
    return savedVolume ? parseFloat(savedVolume) : 1;
  });
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load audio file as data URL
  useEffect(() => {
    const loadAudio = async () => {
      console.log('[AudioPlayer] Loading audio:', audioSrc);
      try {
        const url = await window.electronAPI.getAudioDataUrl(audioSrc);
        if (url) {
          console.log('[AudioPlayer] Got data URL, length:', url.length);
          setDataUrl(url);
        } else {
          console.error('[AudioPlayer] Failed to get data URL');
        }
      } catch (error) {
        console.error('[AudioPlayer] Error loading audio:', error);
      }
    };

    if (audioSrc) {
      loadAudio();
    }

    // Cleanup: pause and reset when component unmounts
    return () => {
      const audio = audioRef.current;
      if (audio) {
        console.log('[AudioPlayer] Cleaning up - pausing audio');
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      }
    };
  }, [audioSrc]);

  // Apply saved volume to audio element when it loads
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [dataUrl, volume]);

  // Update time as audio plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        // Pause ALL other audio elements before playing this one
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach((otherAudio) => {
          if (otherAudio !== audioRef.current) {
            otherAudio.pause();
            otherAudio.currentTime = 0;
          }
        });

        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('[AudioPlayer] Play failed:', err);
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    // Save volume to localStorage
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
        width: "280px",
        padding: "12px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={dataUrl || ""} />

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
  );
};

export default AudioPlayer;
