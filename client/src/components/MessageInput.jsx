import { useRef, useState } from "react";
import api from "../api/axios.js";

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

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

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`p-3 border-t border-base-700/60 surface-panel flex items-end gap-2 ${
        dragging ? "bg-accent/10" : ""
      }`}
    >
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-9 h-9 shrink-0 rounded-full surface-raised border flex items-center justify-center hover:opacity-80 active:scale-95 transition"
        aria-label="Attach file"
        disabled={uploading}
      >
        📎
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
        className="flex-1 resize-none surface-raised border rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/50 transition max-h-32 placeholder:text-muted"
      />

      <button
        onClick={submitText}
        disabled={!text.trim()}
        className="w-9 h-9 shrink-0 rounded-full bg-brand-gradient text-white shadow-glow disabled:opacity-40 disabled:shadow-none flex items-center justify-center active:scale-95 transition"
        aria-label="Send message"
      >
        ➤
      </button>
    </div>
  );
}
