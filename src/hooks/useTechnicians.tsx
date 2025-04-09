// hooks/useTechnicians.ts
"use client";

import { useState, useEffect } from 'react';
import { useSSE } from '@/app/context/SSEContext';

export function useTechnicians() {
  const { technicians: contextTechnicians } = useSSE();
  
  const [technicians, setTechnicians] = useState<any[]>([]);
  
  // Set up a listener for localStorage changes
  useEffect(() => {
    // Initialize from context or localStorage
    if (contextTechnicians.length > 0) {
      setTechnicians(contextTechnicians);
    } else {
      // If context doesn't have data yet, try localStorage
      const storedTechnicians = localStorage.getItem('technicians');
      if (storedTechnicians) {
        try {
          setTechnicians(JSON.parse(storedTechnicians));
        } catch (error) {
          console.error('Error parsing stored technicians:', error);
        }
      }
    }
    
    // Function to handle storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'technicians' && event.newValue) {
        try {
          const newTechnicians = JSON.parse(event.newValue);
          setTechnicians(newTechnicians);
        } catch (error) {
          console.error('Error parsing updated technicians:', error);
        }
      }
    };
    
    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [contextTechnicians]);
  
  // Also update when context changes
  useEffect(() => {
    if (contextTechnicians.length > 0) {
      setTechnicians(contextTechnicians);
    }
  }, [contextTechnicians]);
  
  return technicians;
}