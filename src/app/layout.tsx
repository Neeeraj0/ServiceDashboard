"use client";

import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "./context/UserContext";
import jwt from "jsonwebtoken";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import "./module.style.css";
import { AuthProvider } from "./context/AuthContext";
import { RefreshProvider } from "./context/RefreshContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = pathname ? publicRoutes.includes(pathname) : false;

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          setIsAuthenticated(false);
          if (!isPublicRoute) {
            router.push("/login");
          }
          return;
        }

        const decodedToken = jwt.decode(token);

        if (
          decodedToken &&
          typeof decodedToken !== "string" &&
          decodedToken.exp &&
          decodedToken.exp * 1000 < Date.now()
        ) {
          localStorage.removeItem("authToken");
          setIsAuthenticated(false);
          if (!isPublicRoute) {
            router.push("/login");
          }
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error in checkAuth:", error);
        setIsAuthenticated(false);
        if (!isPublicRoute) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, isPublicRoute]);

  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <div id="app-root">
          <ReactQueryProvider>
            <UserProvider>
              <AuthProvider>
                <RefreshProvider>
                  {loading ? (
                    <Loader />
                  ) : isPublicRoute || isAuthenticated ? (
                    children
                  ) : null}
                </RefreshProvider>
              </AuthProvider>
            </UserProvider>
          </ReactQueryProvider>
          <Toaster position="top-center" />
        </div>
      </body>
    </html>
  );
}