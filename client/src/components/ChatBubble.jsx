import ImagePreview from "./ImagePreview.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import VoicePlayer from "./VoicePlayer.jsx";

export default function ChatBubble({ message, isOwn, isRead }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-3 sm:px-4 animate-bubble-in`}>
      <div
        className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 mb-2 shadow-sm ${
          isOwn
            ? "bg-brand-gradient text-white rounded-br-md"
            : "surface-raised border rounded-bl-md"
        }`}
      >
        {!isOwn && message.sender?.name && (
          <div className="text-xs font-semibold text-accent mb-1">{message.sender.name}</div>
        )}

        {message.type === "text" && (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.content}</p>
        )}
        {message.type === "image" && <ImagePreview src={message.mediaUrl} />}
        {message.type === "video" && <VideoPlayer src={message.mediaUrl} />}
        {message.type === "voice" && <VoicePlayer src={message.mediaUrl} />}

        <div className="flex items-center justify-end gap-1 mt-1">
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
  );
}
