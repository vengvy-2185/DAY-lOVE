import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";

function PaperclipIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.67 3.67 0 0 1 5.19 5.19L9.66 17.65a1.83 1.83 0 0 1-2.6-2.6l8.29-8.28" />
    </svg>
  );
}

function MicIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3M8 22h8" />
    </svg>
  );
}

function SendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3.4 20.6 22 12 3.4 3.4 3 10l13 2-13 2z" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Pick a mime type the browser's MediaRecorder can actually produce.
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

export default function MessageInput({ onSend, onTyping }) {
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
    // Auto-grow the textarea up to a sane max height.
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
    onSend({ type: "text", content: trimmed });
    setText("");
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
      onSend({ type: data.type, mediaUrl: data.url });
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
      <div className="p-3 border-t border-base-700/60 surface-panel flex items-center gap-3">
        <button
          onClick={() => finishRecording(true)}
          className="w-10 h-10 shrink-0 rounded-full surface-raised border flex items-center justify-center text-red-500 hover:bg-red-500/10 active:scale-95 transition"
          aria-label="Cancel recording"
        >
          <TrashIcon width={17} height={17} />
        </button>

        <div className="flex-1 flex items-center gap-2.5 surface-raised border rounded-2xl px-4 py-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-sm font-medium tabular-nums shrink-0">{formatDuration(recordSeconds)}</span>
          <div className="flex-1 flex items-end gap-[3px] h-5 overflow-hidden">
            {Array.from({ length: 28 }, (_, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-accent/70 animate-recording-bar shrink-0"
                style={{ height: "40%", animationDelay: `${(i % 7) * 0.08}s` }}
              />
            ))}
          </div>
          <span className="text-xs text-muted shrink-0 hidden sm:inline">Recording…</span>
        </div>

        <button
          onClick={() => finishRecording(false)}
          className="w-10 h-10 shrink-0 rounded-full bg-brand-gradient text-white shadow-glow flex items-center justify-center active:scale-95 transition"
          aria-label="Send voice message"
        >
          <CheckIcon width={18} height={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`p-3 border-t border-base-700/60 surface-panel flex items-end gap-2 transition-colors ${
        dragging ? "bg-accent/10" : ""
      }`}
    >
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-10 h-10 shrink-0 rounded-full surface-raised border flex items-center justify-center hover:opacity-80 active:scale-95 transition text-muted"
        aria-label="Attach file"
        disabled={uploading}
      >
        <PaperclipIcon width={18} height={18} />
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
        placeholder={dragging ? "Drop file to send…" : uploading ? "Uploading…" : "Message"}
        disabled={uploading}
        className="flex-1 resize-none surface-raised border rounded-2xl px-4 py-2.5 text-[15px] leading-6 outline-none focus:ring-2 focus:ring-accent/50 transition max-h-32 placeholder:text-muted disabled:opacity-60"
      />

      {text.trim() ? (
        <button
          onClick={submitText}
          className="w-10 h-10 shrink-0 rounded-full bg-brand-gradient text-white shadow-glow flex items-center justify-center active:scale-95 transition"
          aria-label="Send message"
        >
          <SendIcon width={18} height={18} />
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={uploading}
          className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-40 ${
            micDenied
              ? "bg-red-500/15 text-red-500 border border-red-500/30"
              : "bg-brand-gradient text-white shadow-glow"
          }`}
          aria-label="Record voice message"
          title={micDenied ? "Microphone access denied — check browser permissions" : "Record voice message"}
        >
          <MicIcon width={18} height={18} />
        </button>
      )}
    </div>
  );
}
