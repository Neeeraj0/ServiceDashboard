// components/ProtectedRoute.jsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login'); // Redirect to login if not authenticated
    }
  }, [router, token]);

  // Render children only if token exists
  return token ? children : null;
};

export default ProtectedRoute;
