"use client"

import React, { useState, useEffect, createContext, useContext } from 'react';
import useSupraMultiWallet from '@/hooks/useSupraMultiWallet';
import { WALLET_EVENTS } from '@/hooks/useSupraMultiWallet';

// Create a context to hold the wallet state and a force update function
const SupraContext = createContext<any>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const starkey = useSupraMultiWallet();
  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletConnected = () => {
        if(starkey.accounts[0] == null) {
            // Force a re-render of the component tree
            setForceUpdateKey(prev => prev + 1);
        }
    };
    
    window.addEventListener(WALLET_EVENTS.CONNECTED, handleWalletConnected);
    
    return () => {
      window.removeEventListener(WALLET_EVENTS.CONNECTED, handleWalletConnected);
    };
  }, []);
  
  // The key prop forces the component to re-mount when the wallet connects
  return (
    <SupraContext.Provider value={null} key={forceUpdateKey}>
      {children}
    </SupraContext.Provider>
  );
}

// Custom hook that combines the StarkeyProvider with useStarkeyWallet
export function useSupraMultiWalletWithRefresh() {
  const starkey = useSupraMultiWallet();
  return starkey;
} 