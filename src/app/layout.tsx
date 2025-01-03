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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname(); // Use Next.js hook to get the current path
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const publicRoutes = ["/login", "/register"]; // Define public routes
  const isPublicRoute = pathname ? publicRoutes.includes(pathname) : false; // Use pathname for route checking

  useEffect(() => {
    console.log("Running Authentication Check");
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("authToken");
        console.log("Token:", token);

        if (!token) {
          setIsAuthenticated(false);
          if (!isPublicRoute) {
            console.log("Redirecting to /login (No Token)");
            router.push("/login");
          }
          return;
        }

        const decodedToken = jwt.decode(token);
        console.log("Decoded Token:", decodedToken);

        if (
          decodedToken &&
          typeof decodedToken !== "string" &&
          decodedToken.exp &&
          decodedToken.exp * 1000 < Date.now()
        ) {
          localStorage.removeItem("authToken"); // Remove expired token
          setIsAuthenticated(false);
          if (!isPublicRoute) {
            console.log("Redirecting to /login (Token Expired)");
            router.push("/login");
          }
        } else {
          console.log("User Authenticated");
          setIsAuthenticated(true); // User is authenticated
        }
      } catch (error) {
        console.error("Error in checkAuth:", error);
        setIsAuthenticated(false);
        if (!isPublicRoute) {
          router.push("/login");
        }
      }
    };

    checkAuth();
    setLoading(false); // Ensure loading is set to false
  }, [router, isPublicRoute]);

  // Show loader while checking authentication
  if (loading) {
    console.log("Loading...");
    return <Loader />;
  }

  console.log("Render Children or Redirect");
  console.log("isPublicRoute:", isPublicRoute, "isAuthenticated:", isAuthenticated);

  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <ReactQueryProvider>
          <UserProvider>
            {isPublicRoute || isAuthenticated ? (
              children
            ) : (
              <Loader /> // Fallback loader while waiting for redirect
            )}
          </UserProvider>
        </ReactQueryProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
