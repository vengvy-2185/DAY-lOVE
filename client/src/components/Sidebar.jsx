import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useNavigate } from "react-router-dom";

function SunIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

const AVATAR_TONES = [
  "from-accent to-accent2",
  "from-pink-500 to-accent",
  "from-accent2 to-emerald-400",
  "from-amber-400 to-pink-500",
  "from-sky-400 to-accent",
];

function toneForName(name = "") {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
}

export default function Sidebar({ rooms = [], activeRoomId, onSelectRoom, onCreateRoom, onDeleteRoom }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [newRoomName, setNewRoomName] = useState("");
  const [query, setQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  const filteredRooms = useMemo(() => {
    if (!query.trim()) return rooms;
    return rooms.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [rooms, query]);

  function handleCreate() {
    if (!newRoomName.trim()) return;
    onCreateRoom(newRoomName.trim());
    setNewRoomName("");
  }

  function handleDeleteClick(e, roomId) {
    e.stopPropagation();
    if (confirmingId === roomId) {
      onDeleteRoom?.(roomId);
      setConfirmingId(null);
    } else {
      setConfirmingId(roomId);
    }
  }

  return (
    <aside className="w-full sm:w-80 shrink-0 surface-panel border-r border-base-700/60 flex flex-col h-full safe-top select-none">
      {/* Header Profile Section */}
      <div className="relative bg-brand-gradient px-4 pt-5 pb-6 overflow-hidden shadow-sm">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-black/10 blur-xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white text-lg shadow-glow shrink-0 border border-white/20">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white leading-tight truncate">Day Life</div>
              <div className="text-xs text-white/80 leading-tight truncate">{user?.name || "User"}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle Theme"
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition text-white flex items-center justify-center backdrop-blur-sm"
            >
              {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
            </button>
            {user?.isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition text-white font-medium backdrop-blur-sm"
              >
                Admin
              </button>
            )}
            <button
              onClick={logout}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition text-white font-medium backdrop-blur-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* New conversation Box */}
      <div className="p-3 flex gap-2 border-b border-base-700/60">
        <input
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New conversation name"
          className="flex-1 surface-raised border rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50 transition placeholder:text-muted"
        />
        <button
          onClick={handleCreate}
          disabled={!newRoomName.trim()}
          className="w-10 h-10 rounded-xl bg-brand-gradient text-white flex items-center justify-center shadow-glow hover:opacity-90 active:scale-95 transition disabled:opacity-50 shrink-0"
          title="Create Room"
        >
          <PlusIcon width={18} height={18} />
        </button>
      </div>

      {/* Search Input Box */}
      {rooms.length > 3 && (
        <div className="px-3 pt-3">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              className="w-full surface-raised border rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50 transition placeholder:text-muted"
            />
          </div>
        </div>
      )}

      {/* Room list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filteredRooms.map((room) => {
          const isActive = activeRoomId === room.id;
          const isConfirming = confirmingId === room.id;
          return (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`group w-full text-left px-3 py-2.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer ${isActive
                ? "bg-brand-gradient-soft border-accent/40 shadow-glow"
                : "border-transparent surface-hover"
                }`}
            >
              <div
                className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${toneForName(
                  room.name
                )} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}
              >
                {room.name?.[0]?.toUpperCase() || "#"}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`font-medium text-sm truncate ${isActive ? "text-accent font-semibold" : ""}`}>
                  {room.name}
                </div>
                <div className="text-xs text-muted truncate">Tap to open</div>
              </div>

              {onDeleteRoom && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, room.id)}
                  onBlur={() => setTimeout(() => setConfirmingId(null), 200)}
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition ${isConfirming
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-muted hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    }`}
                  title={isConfirming ? "Tap again to confirm delete" : "Delete conversation"}
                >
                  <TrashIcon width={15} height={15} />
                </button>
              )}
            </div>
          );
        })}

        {filteredRooms.length === 0 && rooms.length > 0 && (
          <div className="p-4 text-sm text-muted text-center">No matching conversations.</div>
        )}

        {rooms.length === 0 && (
          <div className="p-6 text-sm text-muted text-center leading-relaxed">
            No conversations yet.
            <br />
            Create one above to get started.
          </div>
        )}
      </div>
    </aside>
  );
}