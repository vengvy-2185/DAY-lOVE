export default function TypingIndicator({ names = [] }) {
  if (names.length === 0) return null;
  const label = names.length === 1 ? `${names[0]} is typing` : `${names.join(", ")} are typing`;

  return (
    <div className="px-4 pb-1 flex items-center gap-2 text-xs text-muted">
      <span className="flex gap-[2px]">
        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
      </span>
      {label}
    </div>
  );
}
