"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface DecodedUser {
  id: number;
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

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded: DecodedUser = jwtDecode(token);
        // Check token expiration
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded);
        } 
        else {
          Cookies.remove("token");
          setUser(null);
        }
      } 
      catch (err) {
        console.error("Invalid token:", err);
        Cookies.remove("token");
        setUser(null);
      }
    }
  }, []);

  const login = (token: string) => {
    Cookies.set("token", token, { expires: 7 });
    const decoded: DecodedUser = jwtDecode(token);
    setUser(decoded);
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
