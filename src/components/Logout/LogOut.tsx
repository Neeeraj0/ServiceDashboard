"use client"; 

import { useRouter } from 'next/navigation'; 
import { LogOutIcon } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

const LogoutButton = () => {
  const {logout} = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <LogOutIcon 
      className="h-7 w-7 text-black rounded-xl bg-white shadow-sm cursor-pointer" 
      onClick={handleLogout} 
    />
  );
};

export default LogoutButton;