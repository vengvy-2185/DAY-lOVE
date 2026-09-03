import { useState } from "react";
import ImagePreview from "./ImagePreview.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import VoicePlayer from "./VoicePlayer.jsx";

// --- SVG Icons ---
function CheckIcon({ isRead }) {
  return (
    <span className={`text-[10px] font-semibold tracking-tighter ${isRead ? "text-sky-400" : "opacity-60 text-slate-300"}`}>
      {isRead ? "✓✓" : "✓"}
    </span>
  );
}

function ReplyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function EditIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

export default function ChatBubble({ message, isOwn, isRead, onReply, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || "");

  const [touchStartX, setTouchStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    onEdit?.(message.id, editText);
    setIsEditing(false);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    if (diff > 0 && diff < 80) {
      setTranslateX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (translateX > 45) {
      onReply?.(message);
    }
    setTranslateX(0);
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-2 sm:px-4 my-1.5 group animate-bubble-in`}>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${translateX}px)` }}
        className="relative flex items-center gap-1.5 max-w-[85%] sm:max-w-[70%] transition-transform duration-100 ease-out"
      >
        {/* Floating Action Bar */}
        <div
          className={`hidden group-hover:flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/60 backdrop-blur-md shadow-md shrink-0 transition-all ${isOwn ? "order-first" : "order-last"
            }`}
        >
          <button
            onClick={() => onReply?.(message)}
            className="p-1 text-slate-400 hover:text-sky-400 rounded-full transition"
            title="Reply"
          >
            <ReplyIcon className="w-3.5 h-3.5" />
          </button>
          {isOwn && (
            <>
              {message.type === "text" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-slate-400 hover:text-amber-400 rounded-full transition"
                  title="Edit"
                >
                  <EditIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => onDelete?.(message.id)}
                className="p-1 text-slate-400 hover:text-rose-400 rounded-full transition"
                title="Delete"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Message Bubble Base */}
        <div
          className={`w-full rounded-2xl px-3.5 py-2.5 shadow-sm transition-all duration-200 ${isOwn
            ? "bg-indigo-600/90 text-white rounded-br-xs border border-indigo-500/30"
            : "bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-700/50"
            }`}
        >
          {/* Sender Name */}
          {!isOwn && message.sender?.name && (
            <div className="text-[11.5px] font-semibold text-sky-400 mb-1 tracking-wide">
              {message.sender.name}
            </div>
          )}

          {/* Telegram Quote Box Standard */}
          {message.replyTo && (
            <div className="mb-2 pl-2.5 py-1 pr-2 rounded-r-lg bg-black/20 border-l-[3px] border-sky-400 flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-sky-300 tracking-wide">
                {message.replyTo.sender?.name || "User"}
              </span>
              <span className="text-[12px] text-slate-200 line-clamp-1 opacity-90 font-normal">
                {message.replyTo.content || `[${message.replyTo.type}]`}
              </span>
            </div>
          )}

          {/* Edit / View Mode */}
          {isEditing ? (
            <div className="flex flex-col gap-2 my-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-indigo-400/50 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-1.5 text-xs">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.type === "text" && (
                <p className="whitespace-pre-wrap break-words text-[14.5px] leading-relaxed">
                  {message.content}
                </p>
              )}
              {message.type === "image" && <ImagePreview src={message.mediaUrl} />}
              {message.type === "video" && <VideoPlayer src={message.mediaUrl} />}
              {message.type === "voice" && <VoicePlayer src={message.mediaUrl} />}
            </>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-300/80">
            {message.isEdited && <span className="italic opacity-80">edited</span>}
            <span>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isOwn && <CheckIcon isRead={isRead} />}
          </div>
        </div>
      </div>
    </div>
  );
}