// components/ProtectedRoute.jsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import jwt from 'jsonwebtoken';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login'); // Redirect to login if not authenticated
    }

    try {
      const decodedToken = jwt.decode(token);

      const isTokenExpired = decodedToken.exp * 1000 < Date.now();
      if (isTokenExpired) {
        localStorage.removeItem('token'); // Remove expired token
        router.push('/login'); // Redirect to login
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem('token'); // Clear invalid token
      router.push('/login'); // Redirect to login
    }
  }, [router, token]);

  // Render children only if token exists
  return token ? children : null;
};

export default ProtectedRoute;
