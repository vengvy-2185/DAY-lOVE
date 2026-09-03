import { useEffect, useRef, useState } from "react";

function PlayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Deterministic pseudo-waveform (no audio-analysis library needed) — each
// bar's height is derived from its index so it stays stable across renders.
const BAR_COUNT = 26;
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const wobble = Math.sin(i * 0.9) * 0.35 + Math.sin(i * 2.3) * 0.25;
  return Math.round(35 + wobble * 40 + (i % 5) * 4);
});

export default function VoicePlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnd = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }

  function seekTo(e) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }

  const progressRatio = duration ? currentTime / duration : 0;
  const activeBarIndex = Math.floor(progressRatio * BAR_COUNT);

  return (
    <div className="flex items-center gap-2.5 min-w-[210px]">
      <button
        onClick={toggle}
        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/25 active:scale-95 transition"
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? <PauseIcon width={16} height={16} /> : <PlayIcon width={16} height={16} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div
          className="flex items-end gap-[2px] h-7 cursor-pointer"
          onClick={seekTo}
          role="slider"
          aria-label="Seek voice message"
        >
          {BAR_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-sm transition-colors ${
                i <= activeBarIndex ? "bg-white" : "bg-white/35"
              } ${playing && i === activeBarIndex ? "animate-pulse-bar" : ""}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="text-[10px] opacity-75 mt-0.5 tabular-nums">
          {formatTime(playing || currentTime > 0 ? currentTime : duration)}
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}
