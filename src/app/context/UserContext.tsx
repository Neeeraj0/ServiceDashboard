'use client'

import { createContext, useContext, useState, ReactNode } from 'react';
import { UserData } from '../../types/user';

interface UserContextType {
  userData: UserData;
  setUserData: (data: Partial<UserData> | ((prevUserData: UserData) => Partial<UserData>)) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData>({});

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}