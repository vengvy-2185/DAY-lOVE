import { useRef, useState } from "react";

// Lightweight static "waveform" preview (CSS bars) plus a native <audio>
// element for playback — no heavy audio-analysis library required.
export default function VoicePlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const bars = Array.from({ length: 24 }, (_, i) => 6 + ((i * 37) % 20));

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 shrink-0"
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="flex items-end gap-[2px] h-6 flex-1">
        {bars.map((h, i) => (
          <span key={i} className="w-[3px] bg-white/60 rounded-sm" style={{ height: `${h}px` }} />
        ))}
      </div>
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
}
