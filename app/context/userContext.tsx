"use client";
import { createContext, useState } from "react";

interface UserContextType {
  registeredUser: boolean;
  userIsRegistered: (value: boolean) => void;
}

export const userContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [registeredUser, setRegisteredUser] = useState(false);

  const userIsRegistered = (newValue: boolean) => {
    setRegisteredUser(newValue);
  };

  return (
    <userContext.Provider value={{ registeredUser, userIsRegistered }}>
      {children}
    </userContext.Provider>
  );
};
