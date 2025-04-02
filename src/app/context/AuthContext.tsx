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

  // const sendActiveUserEvent = async (userId: string | null, userRole: string | null) => {
  //   if (!userId) return;
  
  //   try {
  //     const track = await fetch('https://api.trench.dev/events', {
  //       method: 'POST',
  //       headers: { 
  //         'Content-Type': 'application/json',
  //         'Authorization': 'Bearer public-b219dab1-0330-4bac-9149-e0c3d2f04682',
  //       },
  //       body: JSON.stringify({
  //         events: [
  //           {
  //             userId: userId, // Matches expected format
  //             type: "track", // Add type field
  //             event: "active_user", // Matches the reference
  //             properties: {
  //               role: userRole,
  //               timestamp: new Date().toISOString(),
  //             },
  //           }
  //         ]
  //       }),
  //     });
  
  //     if (!track.ok) {
  //       const errorData = await track.json();
  //       console.error("Error tracking active user:", errorData);
  //     } else {
  //       console.log("Active user event sent successfully");
  //     }
  //   } catch (error) {
  //     console.error("Error tracking active user:", error);
  //   }
  // };  

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
    const token = localStorage.getItem("authToken");

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
    console.log(decodedToken.admin_id);
    console.log(decodedToken.name);
    if (decodedToken) {
      setUserName(decodedToken.name || null);
      setUserEmail(decodedToken.email || null);
      setUserRole(decodedToken.role || null);
      setUserPhone(decodedToken.phone || null);
      setUserId(decodedToken.admin_id || null);
      // sendActiveUserEvent(decodedToken.admin_id, decodedToken.role);

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

  useEffect(() => {
    loadUserFromToken();
  }, []);

  const logout = () => {
    localStorage.removeItem("authToken");
    setUserName(null);
    setUserEmail(null);
    setUserRole(null);
    setUserPhone(null);
    setUserId(null);
    window.location.reload();
  };

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (userId) {
  //       sendActiveUserEvent(userId, userRole);
  //     }
  //   }, 1800000 ); 
  
  //   return () => clearInterval(interval);
  // }, [userId, userRole]);

  return (
    <AuthContext.Provider value={{ userName, userEmail, userRole, userPhone, userId, loading, logout, loadUserFromToken }}>
      {!loading && children} {/* Prevents rendering until auth is loaded */}
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
