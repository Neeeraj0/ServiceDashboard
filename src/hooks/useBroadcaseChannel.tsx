import { useState, useEffect, useCallback } from 'react';

// Define an interface for your Technician
interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface TechnicianUpdateData {
  type: 'TECHNICIAN_ADDED' | 'TECHNICIAN_UPDATED' | 'TECHNICIAN_DELETED';
  technicians?: Technician[];
  technician?: Technician;
}

export const useBroadcastChannel = (channelName: string = 'technician-updates') => {
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);
  console.log('useBroadcastChannel', channelName);
  useEffect(() => {
    // Create the broadcast channel
    const broadcastChannel = new BroadcastChannel(channelName);
    setChannel(broadcastChannel);

    // Cleanup on unmount
    return () => {
      broadcastChannel.close();
    };
  }, [channelName]);

  const sendMessage = useCallback((message: TechnicianUpdateData) => {
    channel?.postMessage(message);
  }, [channel]);

  return { channel, sendMessage };
};