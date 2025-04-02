import { useState, useEffect } from 'react';
import axios from 'axios';
import { useBroadcastChannel } from './useBroadcaseChannel';

// Define an interface for your Technician
interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export const useTechnicianSync = () => {
  // Explicitly type the state as an array of Technicians
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const { channel } = useBroadcastChannel();
  // Fetch initial technicians
  const fetchTechnicians = async () => {
    try {
      const response = await axios.get<Technician[]>('http://localhost:8000/api/technicians/getTechnicians');
      const fetchedTechnicians = response.data;
      
      setTechnicians(fetchedTechnicians);
      localStorage.setItem('technicians', JSON.stringify(fetchedTechnicians));
      console.log('technicians synced', technicians);
    } catch (error) {
      console.error('Failed to fetch technicians', error);
      
      // Fallback to localStorage
      const storedTechnicians = JSON.parse(localStorage.getItem('technicians') || '[]') as Technician[];
      setTechnicians(storedTechnicians);
    }
  };

  // Handle broadcast messages
  useEffect(() => {
    if (!channel) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, technician, technicians: broadcastTechnicians } = event.data;

      switch (type) {
        case 'TECHNICIAN_ADDED':
          const updatedTechnicians = [...technicians, technician as Technician];
          setTechnicians(updatedTechnicians);
          localStorage.setItem('technicians', JSON.stringify(updatedTechnicians));
          break;
        
        case 'TECHNICIAN_UPDATED':
          setTechnicians(broadcastTechnicians as Technician[]);
          localStorage.setItem('technicians', JSON.stringify(broadcastTechnicians));
          break;
        
        case 'TECHNICIAN_DELETED':
          const filteredTechnicians = technicians.filter(t => t.id !== (technician as Technician).id);
          setTechnicians(filteredTechnicians);
          localStorage.setItem('technicians', JSON.stringify(filteredTechnicians));
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
    };
  }, [channel, technicians]);

  // Initial fetch
  useEffect(() => {
    fetchTechnicians();
  }, []);

  return { 
    technicians, 
    refetch: fetchTechnicians 
  };
};