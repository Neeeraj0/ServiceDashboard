'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the shape of the context
interface AuthContextType {
  userName: string | null;
  loading: boolean; // To indicate loading state
  loadUserFromToken: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userName, setUserName] = useState<string | null>(null);
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
      } catch (error) {
        console.error('Error decoding token:', error);
        setUserName(null);
      }
    } else {
      console.log('No token found');
      setUserName(null);
    }
    setLoading(false); // Set loading to false after attempting to load user
  };

  useEffect(() => {
    loadUserFromToken();
  }, []);

  return (
    <AuthContext.Provider value={{ userName, loading, loadUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};