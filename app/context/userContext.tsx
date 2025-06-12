"use client";
import { createContext, useState } from "react";

interface UserContextType {
  registeredUser: boolean;
  userIsRegistered: (value: boolean) => void;
  userData: {
    username: string;
    profilePic: string | null;
  } | null;
  setUserData: (
    data: { username: string; profilePic: string | null } | null
  ) => void;
}

export const userContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [registeredUser, setRegisteredUser] = useState(false);
  const [userData, setUserData] = useState<{
    username: string;
    profilePic: string | null;
  } | null>(null);

  const userIsRegistered = (newValue: boolean) => {
    setRegisteredUser(newValue);
  };

  return (
    <userContext.Provider
      value={{ registeredUser, userIsRegistered, userData, setUserData }}
    >
      {children}
    </userContext.Provider>
  );
};
