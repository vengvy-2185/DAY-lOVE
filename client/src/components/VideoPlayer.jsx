export default function VideoPlayer({ src }) {
  return (
    <video
      src={src}
      controls
      preload="metadata"
      className="rounded-lg max-w-[260px] max-h-[300px]"
    />
  );
}
