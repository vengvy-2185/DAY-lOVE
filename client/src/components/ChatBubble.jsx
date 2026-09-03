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

  // Support ទាំង id និង _id
  const messageId = message.id || message._id;

  const isMedia = message.type === "image" || message.type === "video";
  const isVoice = message.type === "voice";

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (!editText.trim()) return;
    onEdit?.(messageId, editText);
    setIsEditing(false);
  };

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);

  const handleTouchMove = (e) => {
    const diff = e.touches[0].clientX - touchStartX;
    if (diff > 0 && diff < 80) setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    if (translateX > 45) onReply?.(message);
    setTranslateX(0);
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-2 sm:px-4 my-1 group animate-bubble-in`}>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${translateX}px)` }}
        className="relative flex items-center gap-1.5 max-w-[85%] sm:max-w-[65%] transition-transform duration-100 ease-out"
      >
        {/* Floating Action Menu */}
        <div
          className={`z-20 hidden group-hover:flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/60 backdrop-blur-md shadow-md shrink-0 transition-all ${isOwn ? "order-first" : "order-last"
            }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply?.(message);
            }}
            className="p-1 text-slate-400 hover:text-sky-400 rounded-full transition"
            title="Reply"
          >
            <ReplyIcon className="w-3.5 h-3.5" />
          </button>

          {isOwn && (
            <>
              {message.type === "text" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditText(message.content || "");
                    setIsEditing(true);
                  }}
                  className="p-1 text-slate-400 hover:text-amber-400 rounded-full transition"
                  title="Edit"
                >
                  <EditIcon className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(messageId);
                }}
                className="p-1 text-slate-400 hover:text-rose-400 rounded-full transition"
                title="Delete"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Message Bubble Box */}
        <div
          className={`relative overflow-hidden transition-all duration-200 ${isMedia
              ? "p-0 rounded-2xl border-0 bg-transparent shadow-none"
              : isVoice
                ? "p-2 rounded-2xl border border-sky-500/20 bg-sky-950/30 w-fit"
                : "px-3.5 py-2 rounded-2xl w-fit shadow-sm border"
            } ${!isMedia &&
            !isVoice &&
            (isOwn
              ? "bg-sky-950/70 text-sky-50 border-sky-700/50 rounded-br-xs"
              : "bg-slate-800/80 text-slate-100 border-slate-700/50 rounded-bl-xs")
            }`}
        >
          {/* Sender Name */}
          {!isOwn && message.sender?.name && !isMedia && (
            <div className="text-[11.5px] font-semibold text-sky-400 mb-1 tracking-wide">
              {message.sender.name}
            </div>
          )}

          {/* Reply Quote Box */}
          {message.replyTo && (
            <div className={`mb-1.5 pl-2 py-0.5 pr-2 rounded-r bg-black/30 border-l-[3px] border-sky-400 flex flex-col ${isMedia ? "m-2" : ""}`}>
              <span className="text-[10.5px] font-bold text-sky-300">
                {message.replyTo.sender?.name || "User"}
              </span>
              <span className="text-[11.5px] text-slate-200 line-clamp-1 opacity-90">
                {message.replyTo.content || `[${message.replyTo.type}]`}
              </span>
            </div>
          )}

          {/* Content Rendering */}
          {isEditing ? (
            <div className="flex flex-col gap-2 my-1 min-w-[200px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-sky-500/50 rounded-xl text-sm text-white focus:outline-none resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-1.5 text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium transition"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.type === "text" && (
                <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
                  {message.content}
                </p>
              )}

              {message.type === "image" && (
                <div className="relative overflow-hidden rounded-2xl max-w-[280px] sm:max-w-[320px]">
                  <ImagePreview src={message.mediaUrl} />
                </div>
              )}

              {message.type === "video" && (
                <div className="relative overflow-hidden rounded-2xl max-w-[280px] sm:max-w-[320px]">
                  <VideoPlayer src={message.mediaUrl} />
                </div>
              )}

              {message.type === "voice" && (
                <div className="w-fit min-w-[200px] max-w-[260px]">
                  <VoicePlayer src={message.mediaUrl} />
                </div>
              )}
            </>
          )}

          {/* Time & Status Overlay */}
          <div
            className={`flex items-center justify-end gap-1 text-[10px] ${isMedia
                ? "absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white/90 backdrop-blur-xs"
                : "mt-1 text-slate-400"
              }`}
          >
            {message.isEdited && <span className="italic opacity-80">edited</span>}
            <span>
              {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
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