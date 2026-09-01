import { useState } from "react";

export default function ImagePreview({ src }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt="Shared image"
        loading="lazy"
        onClick={() => setOpen(true)}
        className="rounded-lg max-w-[240px] max-h-[240px] object-cover cursor-pointer"
      />
      {open && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <img src={src} alt="Shared image full size" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </>
  );
}
