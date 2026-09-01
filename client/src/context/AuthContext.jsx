import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../api/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("day_life_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("day_life_token"));

  useEffect(() => {
    if (token) connectSocket(token);
    else disconnectSocket();
  }, [token]);

  function login(newToken, newUser) {
    localStorage.setItem("day_life_token", newToken);
    localStorage.setItem("day_life_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("day_life_token");
    localStorage.removeItem("day_life_user");
    disconnectSocket();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
