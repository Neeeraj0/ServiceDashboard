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
import { ClarityTracking } from "./context/ClarityInit";
import Script from 'next/script';
import { SSEProvider } from "./context/SSEContext";

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
                  {isAuthenticated ? (
                      <SSEProvider>
                        {loading ? <Loader /> : children}
                      </SSEProvider>
                    ) : (
                      loading ? <Loader /> : isPublicRoute ? children : null
                    )}
                </RefreshProvider>
              </AuthProvider>
            </UserProvider>
          </ReactQueryProvider>
          <Toaster position="top-center" />
        </div>
        {/* <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "qu7rdw8lj6");
          `}
        </Script> */}
      </body>
    </html>
  );
}