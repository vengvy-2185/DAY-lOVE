import { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";
import { getSocket } from "../api/socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import ChatBubble from "../components/ChatBubble.jsx";
import TypingIndicator from "../components/TypingIndicator.jsx";
import MessageInput from "../components/MessageInput.jsx";
import OnlineStatus from "../components/OnlineStatus.jsx";

function BackIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [peerOnline, setPeerOnline] = useState(false);
  const [mobileView, setMobileView] = useState("list"); // "list" | "chat" — mobile-only
  const scrollRef = useRef(null);

  useEffect(() => {
    api.get("/rooms").then(({ data }) => {
      setRooms(data);
      if (data[0]) setActiveRoomId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!activeRoomId) return;
    const socket = getSocket();
    socket?.emit("join_room", activeRoomId);

    api.get(`/messages/${activeRoomId}`).then(({ data }) => setMessages(data));
    setTypingUsers([]);

    function onReceive(message) {
      if (message.roomId !== activeRoomId) return;
      setMessages((prev) => [...prev, message]);
    }
    function onTyping({ roomId, name, isTyping }) {
      if (roomId !== activeRoomId) return;
      setTypingUsers((prev) =>
        isTyping ? Array.from(new Set([...prev, name])) : prev.filter((n) => n !== name)
      );
    }
    function onOnline({ online }) {
      setPeerOnline(online);
    }

    socket?.on("receive_message", onReceive);
    socket?.on("typing", onTyping);
    socket?.on("online", onOnline);

    return () => {
      socket?.emit("leave_room", activeRoomId);
      socket?.off("receive_message", onReceive);
      socket?.off("typing", onTyping);
      socket?.off("online", onOnline);
    };
  }, [activeRoomId]);

  // Keep the room list in sync if a room is deleted elsewhere (e.g. another device/tab).
  useEffect(() => {
    const socket = getSocket();
    function onRoomDeleted({ roomId }) {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      setActiveRoomId((prev) => {
        if (prev !== roomId) return prev;
        setMobileView("list");
        return null;
      });
    }
    socket?.on("room_deleted", onRoomDeleted);
    return () => socket?.off("room_deleted", onRoomDeleted);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function sendMessage(payload) {
    if (!activeRoomId) return;
    const socket = getSocket();
    socket?.emit("send_message", { roomId: activeRoomId, ...payload }, (ack) => {
      if (!ack?.ok) alert(ack?.error || "Failed to send message");
    });
  }

  function handleTyping(isTyping) {
    if (!activeRoomId) return;
    getSocket()?.emit("typing", { roomId: activeRoomId, isTyping });
  }

  async function createRoom(name) {
    const { data } = await api.post("/rooms", { name });
    setRooms((prev) => [data, ...prev]);
    selectRoom(data.id);
  }

  async function deleteRoom(roomId) {
    const previousRooms = rooms;
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    if (activeRoomId === roomId) {
      setActiveRoomId(null);
      setMobileView("list");
    }
    try {
      await api.delete(`/rooms/${roomId}`);
    } catch (err) {
      // roll back on failure
      setRooms(previousRooms);
      alert("Failed to delete conversation. Please try again.");
    }
  }

  function selectRoom(roomId) {
    setActiveRoomId(roomId);
    setMobileView("chat");
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  return (
    <div className="h-screen flex overflow-hidden">
      <div className={`${mobileView === "chat" ? "hidden" : "flex"} sm:flex h-full`}>
        <Sidebar
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={selectRoom}
          onCreateRoom={createRoom}
          onDeleteRoom={deleteRoom}
        />
      </div>

      <div className={`${mobileView === "list" ? "hidden" : "flex"} sm:flex flex-1 flex-col min-w-0`}>
        {activeRoom ? (
          <>
            <div className="px-3 sm:px-4 py-3 border-b border-base-700/60 surface-panel flex items-center justify-between gap-2 safe-top">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setMobileView("list")}
                  className="sm:hidden w-8 h-8 rounded-lg surface-hover flex items-center justify-center shrink-0"
                  aria-label="Back to conversations"
                >
                  <BackIcon width={18} height={18} />
                </button>
                <div className="min-w-0">
                  <div className="font-medium truncate">{activeRoom.name}</div>
                  <div className="text-xs text-muted sm:hidden">{peerOnline ? "Online" : "Offline"}</div>
                </div>
              </div>
              <OnlineStatus online={peerOnline} />
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 px-1 sm:px-0">
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} isOwn={m.senderId === user.id} />
              ))}
            </div>

            <TypingIndicator names={typingUsers} />
            <div className="safe-bottom">
              <MessageInput onSend={sendMessage} onTyping={handleTyping} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted text-sm gap-3 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient-soft flex items-center justify-center text-3xl">
              💬
            </div>
            <div>Select or create a conversation to get started.</div>
          </div>
        )}
      </div>
    </div>
  );
}
