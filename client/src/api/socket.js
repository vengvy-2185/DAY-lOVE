import { io } from "socket.io-client";

let socket = null;

export function connectSocket(token) {
  if (socket) socket.disconnect();
  socket = io(import.meta.env.VITE_API_URL || "https://day-life-server.onrender.com", {
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
