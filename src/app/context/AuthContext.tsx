'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [loading, setLoading] = useState<boolean>(true); // Initialize loading state

  const loadUserFromToken = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decodedToken = JSON.parse(jsonPayload);
        setUserName(decodedToken.name);
        setUserEmail(decodedToken.email);
        setUserRole(decodedToken.role);
        setUserPhone(decodedToken.phone);
        setUserId(decodedToken.admin_id);
      } catch (error) {
        console.error('Error decoding token:', error);
        setUserName(null);
        setUserEmail(null);
        setUserRole(null);
        setUserPhone(null);
        setUserId(null);
      }
    } else {
      console.log('No token found');
      setUserName(null);
    }
    setLoading(false); 
  };

  useEffect(() => {
    loadUserFromToken();
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    setUserName(null);
    setUserEmail(null);
    setUserRole(null);
    setUserPhone(null);
    setUserId(null);
    loadUserFromToken();
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};