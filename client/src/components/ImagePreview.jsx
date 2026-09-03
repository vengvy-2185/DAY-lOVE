import { useState, useEffect } from "react";

export default function ImagePreview({ src }) {
  const [open, setOpen] = useState(false);

  // ចុច key Esc ដើម្បីបិទ Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      {/* Thumbnail Image */}
      <div className="relative group overflow-hidden rounded-xl cursor-pointer my-1 max-w-[260px] max-h-[260px]">
        <img
          src={src}
          alt="Shared content"
          loading="lazy"
          onClick={() => setOpen(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl border border-white/10"
        />
        <div
          onClick={() => setOpen(true)}
          className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white/80 text-xs font-medium"
        >
          Click to view
        </div>
      </div>

      {/* Lightbox Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/10"
            aria-label="Close preview"
          >
            ✕
          </button>

          {/* Full-size Image */}
          <img
            src={src}
            alt="Shared content full size"
            onClick={(e) => e.stopPropagation()} // បង្ការការចុចលើរូបរួចបិទ
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-up"
          />
        </div>
      )}
    </>
  );
}