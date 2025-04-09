"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';

type SSEContextType = {
  technicians: any[]; 
};

const SSEContext = createContext<SSEContextType>({ technicians: [] });

type SSEProviderProps = {
  children: ReactNode;
};

export function SSEProvider({ children }: SSEProviderProps) {
  const [technicians, setTechnicians] = useState<any[]>([]); 
  
  useEffect(() => {
    const storedTechnicians = localStorage.getItem('technicians');
    if (storedTechnicians) {
      try {
        setTechnicians(JSON.parse(storedTechnicians));
      } catch (error) {
        console.error('Error parsing stored technicians:', error);
      }
    }
    
    const eventSource = new EventSource('http://localhost:8000/api/technicians/updates');
    
    eventSource.onopen = () => {
      console.log('SSE connection opened successfully');
    };
    
    eventSource.onmessage = (event) => {
      try {
        console.log('Received SSE message:', event.data);
        const data = JSON.parse(event.data);
        
        if (data.message === 'CONNECTION_ESTABLISHED') {
          console.log('SSE connection is active');
        } else if (data.message === 'TECHNICIAN_UPDATED') {
          console.log('Updating technicians list:', data.technicians);
          // Update localStorage
          localStorage.setItem('technicians', JSON.stringify(data.technicians));
          // Update context state
          setTechnicians(data.technicians);
          toast.success("Technicians list updated");
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      
      // Attempt to reconnect
      setTimeout(() => {
        console.log('Attempting to reconnect SSE...');
        eventSource.close();
        // The useEffect will run again on component remount
      }, 5000);
    };
    
    // Clean up on unmount
    return () => {
      console.log('Closing SSE connection');
      eventSource.close();
    };
  }, []);
  
  return (
    <SSEContext.Provider value={{ technicians }}>
      {children}
    </SSEContext.Provider>
  );
}

export const useSSE = () => useContext(SSEContext);