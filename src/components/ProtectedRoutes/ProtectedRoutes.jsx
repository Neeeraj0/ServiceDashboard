'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import jwt from 'jsonwebtoken';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    if (!token) {
      // Redirect to login if no token is found
      router.push('/login');
      return;
    }

    try {
      const decodedToken = jwt.decode(token);

      // Check if the token is valid and not expired
      if (!decodedToken || decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem('authToken'); // Remove invalid or expired token
        router.push('/login'); // Redirect to login
        return;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem('authToken'); // Clear invalid token
      router.push('/login'); // Redirect to login
    }
  }, [router, token]);

  // Render children only if token exists
  return token ? children : null;
};

export default ProtectedRoute;
