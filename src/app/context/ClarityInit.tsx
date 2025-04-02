"use client";

import Script from 'next/script';
import { useEffect } from 'react';

// Extend the Window interface to include clarity
declare global {
  interface Window {
    clarity: {
      (method: string, ...args: any[]): void;
      q?: any[];
    };
  }
}

// Microsoft Clarity Configuration Component
export const ClarityTracking = () => {
  useEffect(() => {
    // Initialize clarity if not already defined
    window.clarity = window.clarity || function() {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
  }, []);

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "qu7rdw8lj6");
        `
      }}
    />
  );
};