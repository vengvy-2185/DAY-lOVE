export default function OnlineStatus({ online }) {
  return (
    <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted">
      <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-slate-500"}`} />
      {online ? "Online" : "Offline"}
    </span>
  );
}
