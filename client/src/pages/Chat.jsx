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
  const [mobileView, setMobileView] = useState("list"); // "list" | "chat"
  const scrollRef = useRef(null);

  useEffect(() => {
    api.get("/rooms").then(({ data }) => {
      setRooms(data);
      if (data[0]) setActiveRoomId(data[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeRoomId) return;
    const socket = getSocket();
    socket?.emit("join_room", activeRoomId);

    api.get(`/messages/${activeRoomId}`)
      .then(({ data }) => setMessages(data))
      .catch(console.error);

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

  // Sync state ពេលរងការលុប Room ពី Device ផ្សេង
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

  // Auto-scroll ទៅបាតក្រោមបង្អស់ពេលមានសារថ្មី
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // មុខងារផ្ញើសារ (Text ឬ Media ដូចជា Image, Video, Voice)
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
    try {
      const { data } = await api.post("/rooms", { name });
      setRooms((prev) => [data, ...prev]);
      selectRoom(data.id);
    } catch (err) {
      alert("Failed to create room");
    }
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
    <div className="h-screen flex overflow-hidden bg-base-900 text-base-100">
      {/* Sidebar List */}
      <div className={`${mobileView === "chat" ? "hidden" : "flex"} sm:flex h-full w-full sm:w-80 shrink-0 border-r border-base-700/60`}>
        <Sidebar
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={selectRoom}
          onCreateRoom={createRoom}
          onDeleteRoom={deleteRoom}
        />
      </div>

      {/* Main Chat Panel */}
      <div className={`${mobileView === "list" ? "hidden" : "flex"} sm:flex flex-1 flex-col min-w-0 h-full`}>
        {activeRoom ? (
          <>
            {/* Header */}
            <div className="px-3 sm:px-4 py-3 border-b border-base-700/60 surface-panel flex items-center justify-between gap-2 safe-top shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setMobileView("list")}
                  className="sm:hidden w-8 h-8 rounded-lg surface-hover flex items-center justify-center shrink-0"
                  aria-label="Back to conversations"
                >
                  <BackIcon width={18} height={18} />
                </button>
                <div className="min-w-0">
                  <div className="font-medium truncate text-sm sm:text-base">{activeRoom.name}</div>
                  <div className="text-xs text-muted sm:hidden">{peerOnline ? "Online" : "Offline"}</div>
                </div>
              </div>
              <OnlineStatus online={peerOnline} />
            </div>

            {/* Messages Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 px-2 sm:px-4 space-y-3">
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} isOwn={m.senderId === user?.id} />
              ))}
            </div>

            {/* Typing Indicator */}
            <TypingIndicator names={typingUsers} />

            {/* Input Footer */}
            <div className="safe-bottom p-2 sm:p-3 border-t border-base-700/60 bg-base-900 shrink-0">
              <MessageInput onSend={sendMessage} onTyping={handleTyping} />
            </div>
          </>
        ) : (
          /* Placeholder ពេលមិនទាន់ជ្រើស Room */
          <div className="flex-1 flex flex-col items-center justify-center text-muted text-sm gap-3 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-gradient-soft flex items-center justify-center text-3xl shadow-lg">
              💬
            </div>
            <div>Select or create a conversation to get started.</div>
          </div>
        )}
      </div>
    </div>
  );
}