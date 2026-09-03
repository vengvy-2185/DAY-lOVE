import { useState } from "react";
import ImagePreview from "./ImagePreview.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import VoicePlayer from "./VoicePlayer.jsx";

export default function ChatBubble({ message, isOwn, isRead, onReply, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || "");

  // State សម្រាប់គ្រប់គ្រង Touch Gesture (Swipe-to-Reply)
  const [touchStartX, setTouchStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    onEdit(message.id, editText);
    setIsEditing(false);
  };

  // ចាប់ផ្តើមប៉ះអេក្រង់
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  // ពេលកំពុងអូស
  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    // អនុញ្ញាតឱ្យអូសបានតែទៅខាងស្តាំ (diff > 0) និងអតិបរមា 80px
    if (diff > 0 && diff < 80) {
      setTranslateX(diff);
    }
  };

  // ពេលលែងដៃ
  const handleTouchEnd = () => {
    if (translateX > 45) { // បើអូសលើសពី 45px វានឹង trigger មុខងារ Reply
      onReply(message);
    }
    setTranslateX(0); // ត្រឡប់មកទីតាំងដើមវិញ
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-3 sm:px-4 animate-bubble-in group`}>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${translateX}px)` }}
        className="flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%] transition-transform duration-100 ease-out"
      >

        {/* Actions Menu (បង្ហាញរាល់ពេល Hover) */}
        <div className={`hidden group-hover:flex items-center gap-1 text-xs shrink-0 ${isOwn ? "order-first" : "order-last"}`}>
          <button
            onClick={() => onReply(message)}
            className="p-1.5 rounded-lg surface-hover text-muted hover:text-white transition"
            title="Reply"
          >
            ↩️
          </button>
          {isOwn && (
            <>
              {message.type === "text" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg surface-hover text-muted hover:text-white transition"
                  title="Edit"
                >
                  ✏️
                </button>
              )}
              <button
                onClick={() => onDelete(message.id)}
                className="p-1.5 rounded-lg surface-hover text-muted hover:text-red-400 transition"
                title="Delete"
              >
                🗑️
              </button>
            </>
          )}
        </div>

        {/* Message Bubble Body */}
        <div
          className={`w-full rounded-2xl px-3.5 py-2.5 mb-2 shadow-sm ${isOwn
            ? "bg-brand-gradient text-white rounded-br-md"
            : "surface-raised border rounded-bl-md"
            }`}
        >
          {/* ឈ្មោះអ្នកផ្ញើ (ចំពោះសារអ្នកដទៃ) */}
          {!isOwn && message.sender?.name && (
            <div className="text-xs font-semibold text-accent mb-1">{message.sender.name}</div>
          )}

          {/* ផ្នែកបង្ហាញ Quote/Reply (ប្រសិនបើជាសារ Reply លើសារផ្សេង) */}
          {message.replyTo && (
            <div className="mb-2 p-2 rounded-lg bg-black/20 text-xs border-l-2 border-white/60">
              <span className="font-semibold block opacity-90">
                {message.replyTo.sender?.name || "User"}
              </span>
              <span className="opacity-75 line-clamp-1">
                {message.replyTo.content || `[${message.replyTo.type}]`}
              </span>
            </div>
          )}

          {/* Mode កំពុង Edit */}
          {isEditing ? (
            <div className="flex flex-col gap-2 my-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 bg-black/30 border border-white/30 rounded-lg text-sm text-white focus:outline-none focus:border-white resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 rounded bg-black/20 hover:bg-black/40 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2 py-1 rounded bg-white text-black font-semibold hover:bg-opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Media & Text Views */}
              {message.type === "text" && (
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.content}</p>
              )}
              {message.type === "image" && <ImagePreview src={message.mediaUrl} />}
              {message.type === "video" && <VideoPlayer src={message.mediaUrl} />}
              {message.type === "voice" && <VoicePlayer src={message.mediaUrl} />}
            </>
          )}

          {/* Footer (Time, Edited tag, Read Receipts) */}
          <div className="flex items-center justify-end gap-1 mt-1">
            {message.isEdited && (
              <span className={`text-[10px] ${isOwn ? "opacity-75" : "opacity-60"}`}>(edited)</span>
            )}
            <span className={`text-[10px] ${isOwn ? "opacity-75" : "opacity-60"}`}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isOwn && (
              <span className={`text-[10px] ${isRead ? "text-sky-300" : "opacity-60"}`}>
                {isRead ? "✓✓" : "✓"}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}