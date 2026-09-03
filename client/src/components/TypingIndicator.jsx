export default function TypingIndicator({ names = [] }) {
  if (!names || names.length === 0) return null;

  // រៀបចំ Text បង្ហាញតាមចំនួនអ្នកកំពុង Type
  let label = "";
  if (names.length === 1) {
    label = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    label = `${names[0]} and ${names[1]} are typing...`;
  } else {
    label = `${names[0]}, ${names[1]} and ${names.length - 2} other${names.length - 2 > 1 ? "s" : ""
      } are typing...`;
  }

  return (
    <div className="px-4 py-1.5 flex items-center gap-2 text-xs text-muted animate-fade-in transition-all">
      {/* Dynamic Animated Dots */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-base-800/60 border border-base-700/40 backdrop-blur-sm shadow-sm">
        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.32s]" />
        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.16s]" />
        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
      </div>

      {/* Label Text */}
      <span className="italic opacity-85 font-medium truncate max-w-[250px] sm:max-w-[400px]">
        {label}
      </span>
    </div>
  );
}