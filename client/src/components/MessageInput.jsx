import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";

// --- Custom Modern SVG Icons ---

function PaperclipIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function MicIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function SendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

function ReplyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

// --- Helper Functions ---

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function pickRecorderMime() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return "";
}

// --- Main Component ---

export default function MessageInput({
  onSend = () => { },
  onTyping = () => { },
  replyingTo = null,
  editingMessage = null,
  onCancelAction = () => { },
}) {
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micDenied, setMicDenied] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeout = useRef(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || "");
      textareaRef.current?.focus();
    } else if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [editingMessage, replyingTo]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  useEffect(() => stopRecordingCleanup, []);

  function stopRecordingCleanup() {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function handleTextChange(e) {
    setText(e.target.value);
    onTyping?.(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping?.(false), 1500);
  }

  function submitText() {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingMessage) {
      onSend?.({ type: "edit", id: editingMessage.id, content: trimmed });
    } else {
      onSend?.({
        type: "text",
        content: trimmed,
        replyToId: replyingTo ? replyingTo.id : null,
      });
    }

    setText("");
    onCancelAction?.();
    onTyping?.(false);
  }

  async function uploadFile(file) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSend?.({
        type: data.type,
        mediaUrl: data.url,
        replyToId: replyingTo ? replyingTo.id : null,
      });
      onCancelAction?.();
    } catch (err) {
      alert(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function startRecording() {
    if (recording || uploading) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicDenied(false);
      streamRef.current = stream;
      chunksRef.current = [];
      cancelledRef.current = false;

      const mimeType = pickRecorderMime();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopRecordingCleanup();
        if (!cancelledRef.current && chunksRef.current.length) {
          const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
          const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
          const file = new File([blob], `voice-message.${ext}`, { type: blob.type });
          uploadFile(file);
        }
        chunksRef.current = [];
      };

      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (err) {
      setMicDenied(true);
    }
  }

  function finishRecording(cancel) {
    cancelledRef.current = cancel;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  if (recording) {
    return (
      <div className="p-3 border-t border-slate-700/60 bg-slate-900 flex items-center gap-3">
        <button
          onClick={() => finishRecording(true)}
          className="w-10 h-10 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 active:scale-95 transition"
          aria-label="Cancel recording"
        >
          <TrashIcon className="w-5 h-5" />
        </button>

        <div className="flex-1 flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/60 rounded-2xl px-4 py-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
          <span className="text-sm font-medium tabular-nums text-white shrink-0">{formatDuration(recordSeconds)}</span>
          <div className="flex-1 flex items-end gap-[3px] h-5 overflow-hidden">
            {Array.from({ length: 28 }, (_, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-sky-400/80 animate-pulse shrink-0"
                style={{ height: "40%", animationDelay: `${(i % 7) * 0.08}s` }}
              />
            ))}
          </div>
          <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">Recording…</span>
        </div>

        <button
          onClick={() => finishRecording(false)}
          className="w-10 h-10 shrink-0 rounded-full bg-sky-500 hover:bg-sky-400 text-white shadow-md flex items-center justify-center active:scale-95 transition"
          aria-label="Send voice message"
        >
          <CheckIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-slate-900">
      {/* Telegram-style Reply / Edit Banner (ប្រអប់ Banner ខាងលើ Input) */}
      {(replyingTo || editingMessage) && (
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-x border-slate-700/60 bg-slate-900/95 rounded-t-2xl text-xs backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0 border-l-[3px] border-sky-400 pl-2.5">
            <div className="flex flex-col min-w-0">
              <span className="text-sky-400 font-bold flex items-center gap-1.5 text-[11.5px]">
                {editingMessage ? (
                  <>
                    <EditIcon className="w-3.5 h-3.5" /> Editing Message
                  </>
                ) : (
                  <>
                    <ReplyIcon className="w-3.5 h-3.5" /> Reply to {replyingTo?.sender?.name || "User"}
                  </>
                )}
              </span>
              <span className="text-slate-300 truncate max-w-[220px] sm:max-w-[480px] text-[12px] opacity-90">
                {editingMessage ? editingMessage.content : replyingTo?.content || `[${replyingTo?.type}]`}
              </span>
            </div>
          </div>
          <button
            onClick={() => onCancelAction?.()}
            className="p-1 text-slate-400 hover:text-white rounded-full transition shrink-0"
            aria-label="Cancel action"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Input Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`p-3 border-t border-slate-700/60 flex items-end gap-2 transition-colors ${dragging ? "bg-sky-500/10" : ""
          } ${replyingTo || editingMessage ? "rounded-b-2xl border-t-0" : ""}`}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 shrink-0 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center hover:bg-slate-700/60 active:scale-95 transition text-slate-400"
          aria-label="Attach file"
          disabled={uploading || !!editingMessage}
        >
          <PaperclipIcon className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = "";
          }}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitText();
            }
          }}
          rows={1}
          placeholder={
            dragging
              ? "Drop file to send…"
              : uploading
                ? "Uploading…"
                : editingMessage
                  ? "Edit message..."
                  : "Message"
          }
          disabled={uploading}
          className="flex-1 resize-none bg-slate-800 border border-slate-700/60 rounded-2xl px-4 py-2.5 text-[14.5px] leading-6 text-white outline-none focus:ring-1 focus:ring-sky-400/50 transition max-h-32 placeholder:text-slate-400 disabled:opacity-60"
        />

        {text.trim() ? (
          <button
            onClick={submitText}
            className="w-10 h-10 shrink-0 rounded-full bg-sky-500 hover:bg-sky-400 text-white shadow-md flex items-center justify-center active:scale-95 transition"
            aria-label="Send message"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={uploading || !!editingMessage}
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-40 ${micDenied
              ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
              : "bg-sky-500 hover:bg-sky-400 text-white shadow-md"
              }`}
            aria-label="Record voice message"
            title={
              micDenied
                ? "Microphone access denied — check browser permissions"
                : "Record voice message"
            }
          >
            <MicIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}