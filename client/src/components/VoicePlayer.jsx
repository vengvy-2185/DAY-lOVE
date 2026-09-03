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

const BAR_COUNT = 28;
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const wobble = Math.sin(i * 0.8) * 0.35 + Math.sin(i * 2.1) * 0.25;
  return Math.round(30 + wobble * 45 + (i % 4) * 5);
});

export default function VoicePlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);

  const speeds = [1, 1.5, 2];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlaying(false);
    setCurrentTime(0);

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnd = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);

    if (audio.readyState >= 1) {
      setDuration(audio.duration || 0);
    }

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [src]);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setPlaying(false));
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

  function cycleSpeed() {
    const nextSpeed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  }

  const progressRatio = duration ? currentTime / duration : 0;
  const activeBarIndex = Math.floor(progressRatio * BAR_COUNT);

  return (
    <div className="flex items-center gap-3 min-w-[230px] max-w-[320px] p-2 rounded-2xl bg-base-800/40 border border-base-700/50 backdrop-blur-md shadow-sm select-none">
      {/* Play/Pause Button */}
      <button
        onClick={toggle}
        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-accent hover:bg-accent/90 text-white shadow-md active:scale-95 transition"
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? (
          <PauseIcon width={18} height={18} />
        ) : (
          <PlayIcon width={18} height={18} className="ml-0.5" />
        )}
      </button>

      {/* Waveform & Timing */}
      <div className="flex-1 min-w-0">
        <div
          className="flex items-center gap-[2.5px] h-7 cursor-pointer group py-1"
          onClick={seekTo}
          role="slider"
          aria-label="Seek voice message"
          aria-valuenow={currentTime}
          aria-valuemax={duration}
        >
          {BAR_HEIGHTS.map((h, i) => {
            const isActive = i <= activeBarIndex;
            const isCurrent = i === activeBarIndex;
            return (
              <span
                key={i}
                className={`w-[3.5px] rounded-full transition-all duration-150 ${isActive
                  ? "bg-accent"
                  : "bg-base-600/50 group-hover:bg-base-600"
                  } ${playing && isCurrent ? "animate-pulse scale-y-110" : ""}`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted mt-0.5 font-medium tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Speed Button */}
      <button
        onClick={cycleSpeed}
        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-base-700/60 hover:bg-base-700 text-muted hover:text-white transition active:scale-95 shrink-0"
        title="Change playback speed"
      >
        {speed}x
      </button>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}