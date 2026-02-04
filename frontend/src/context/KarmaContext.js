import React, { createContext, useState, useContext } from 'react';

const KarmaContext = createContext();

export function KarmaProvider({ children }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerKarmaUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <KarmaContext.Provider value={{ refreshTrigger, triggerKarmaUpdate }}>
      {children}
    </KarmaContext.Provider>
  );
}

export function useKarma() {
  return useContext(KarmaContext);
}
