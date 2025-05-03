"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  userPhone: string | null;
  userId: string | null;
  loading: boolean;
  loadUserFromToken: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = atob(base64);

      console.log("Decoded JWT Payload:", jsonPayload);

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const loadUserFromToken = () => {
    setLoading(true);
    // Get the token from localStorage
    const token = localStorage.getItem("authToken");
    setAuthToken(token); // Update the authToken state

    if (!token) {
      console.log("No token found in localStorage");
      setUserName(null);
      setUserEmail(null);
      setUserRole(null);
      setUserPhone(null);
      setUserId(null);
      setLoading(false);
      return;
    }

    const decodedToken = decodeToken(token);
    console.log(decodedToken);
    if (decodedToken) {
      setUserName(decodedToken.name || null);
      setUserEmail(decodedToken.email || null);
      setUserRole(decodedToken.role || null);
      setUserPhone(decodedToken.phone || null);
      setUserId(decodedToken.admin_id || null);
    } else {
      console.warn("Invalid token or decoding failed");
      setUserName(null);
      setUserEmail(null);
      setUserRole(null);
      setUserPhone(null);
      setUserId(null);
    }

    setLoading(false);
  };

  // Add event listener for localStorage changes
  useEffect(() => {
    // Initial load of user data
    loadUserFromToken();

    // Setup storage event listener for cross-tab sync
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "authToken") {
        loadUserFromToken();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Watch for token changes within the same tab
  useEffect(() => {
    const checkToken = setInterval(() => {
      const currentToken = localStorage.getItem("authToken");
      if (currentToken !== authToken) {
        loadUserFromToken();
      }
    }, 1000); // Check every second

    return () => clearInterval(checkToken);
  }, [authToken]);

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem('technicians');
    setUserName(null);
    setUserEmail(null);
    setUserRole(null);
    setUserPhone(null);
    setUserId(null);
    setAuthToken(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ userName, userEmail, userRole, userPhone, userId, loading, logout, loadUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};