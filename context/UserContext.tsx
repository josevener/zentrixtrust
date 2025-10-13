// src/context/UserContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export interface DecodedUser {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  exp: number;
  iat: number;
  avatar?: string;
}

interface UserContextType {
  user: DecodedUser | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<DecodedUser | null>(null);

  /** Helper – decode & validate token */
  const setUserFromToken = (token: string) => {
    try {
      const decoded = jwtDecode<DecodedUser>(token);
      if (decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
        // keep cookie in sync (7-day expiry)
        Cookies.set("token", token, { expires: 7 });
      } else {
        throw new Error("expired");
      }
    } catch (e) {
      Cookies.remove("token");
      setUser(null);
    }
  };

  /** On mount – read existing cookie */
  useEffect(() => {
    const token = Cookies.get("token");
    if (token) setUserFromToken(token);
  }, []);

  const login = (token: string) => {
    setUserFromToken(token);
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);