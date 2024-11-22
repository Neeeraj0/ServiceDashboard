"use client";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { UserProvider } from "./context/UserContext";
// import jwt from 'jsonwebtoken';

import ProtectedRoute from "@/components/ProtectedRoutes/ProtectedRoutes";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  const publicRoutes = ["/login", "/register"]; // Define public routes
  const isPublicRoute =
    typeof window !== "undefined" && publicRoutes.includes(window.location.pathname);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // const pathname = usePathname();

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // useEffect(() => {
  //   const checkTokenExpiry = () => {
  //     const token = localStorage.getItem('token');
  //     if (token) {
  //       const decodedToken = jwt.decode(token);
  //       if (decodedToken.exp * 1000 < Date.now()) {
  //         localStorage.removeItem('token'); // Remove expired token
  //         router.push('/login'); // Redirect to login
  //       }
  //     }
  //   };
  
  //   // Run check every 5 minutes
  //   const intervalId = setInterval(checkTokenExpiry, 300000);
  //   return () => clearInterval(intervalId); // Cleanup on component unmount
  // }, []);

  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <UserProvider>
          {loading ? ( 
            <Loader /> 
          ): isPublicRoute ? (
            children
          ) : (
            <ProtectedRoute>{children}</ProtectedRoute>
          )}
        </UserProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
