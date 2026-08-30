"use client";

import { createContext, useContext, useState } from "react";

// Lets SupportChatLauncher (a sibling of Header in the layout, not a
// descendant) know when the mobile nav panel is expanded, so it can get out
// of the way — see MobileMenu and SupportChatLauncher. A fixed bottom-right
// button and an inline-expanding mobile nav panel don't naturally know about
// each other; this is the minimal shared state that lets them coordinate
// without prop-drilling through Header.
const MobileNavOpenContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export function MobileNavOpenProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <MobileNavOpenContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MobileNavOpenContext.Provider>
  );
}

export function useMobileNavOpen() {
  const context = useContext(MobileNavOpenContext);
  if (!context) {
    throw new Error("useMobileNavOpen must be used within MobileNavOpenProvider");
  }
  return context;
}
