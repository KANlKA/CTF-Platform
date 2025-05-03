import React from 'react';
import { createContext, useContext, useState } from 'react';

const ChallengeContext = createContext();

export const ChallengeProvider = ({ children }) => {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  
  return (
    <ChallengeContext.Provider value={{ currentChallenge, setCurrentChallenge }}>
      {children}
    </ChallengeContext.Provider>
  );
};

// Make sure this hook is exported
export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (context === undefined) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return context;
};

export default ChallengeContext;