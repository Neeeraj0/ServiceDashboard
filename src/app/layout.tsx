"use client";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { UserProvider } from "./context/UserContext";
import ProtectedRoute from "@/components/ProtectedRoutes/ProtectedRoutes";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
