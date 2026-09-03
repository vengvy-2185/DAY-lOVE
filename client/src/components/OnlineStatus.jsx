export default function OnlineStatus({ online, lastSeen, className = "" }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs text-muted ${className}`}>
      {/* Indicator Dot ជាមួយ Pulse Animation ពេល Online */}
      <span className="relative flex h-2 w-2">
        {online && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            online
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              : "bg-slate-500"
          }`}
        />
      </span>

      {/* Text Status */}
      <span className="font-medium text-[12px]">
        {online ? (
          <span className="text-emerald-400">Online</span>
        ) : lastSeen ? (
          <span className="opacity-75">
            Last seen {new Date(lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : (
          <span className="opacity-60">Offline</span>
        )}
      </span>
    </div>
  );
}