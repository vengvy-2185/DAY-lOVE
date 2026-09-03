import { useState, useEffect } from "react";

export default function VideoPlayer({ src }) {
  const [isOpen, setIsOpen] = useState(false);

  // ចុច key Esc ដើម្បីបិទ Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Video Thumbnail Box */}
      <div className="relative group my-1 rounded-xl overflow-hidden max-w-[260px] max-h-[300px] border border-white/10 bg-black/40">
        <video
          src={src}
          controls
          preload="metadata"
          className="w-full h-full rounded-xl object-cover"
        />

        {/* Fullscreen Expansion Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition duration-200 backdrop-blur-sm text-xs"
          title="Watch Fullscreen"
        >
          ⤢
        </button>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/10"
            aria-label="Close video modal"
          >
            ✕
          </button>

          {/* Expanded Video Player */}
          <div
            className="max-w-4xl w-full max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={src}
              controls
              autoPlay
              className="w-full h-full max-h-[85vh] rounded-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}