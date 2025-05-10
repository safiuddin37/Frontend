import { createContext, useContext, useRef } from 'react';

const CenterRefetchContext = createContext();

export const useCenterRefetch = () => useContext(CenterRefetchContext);

export const CenterRefetchProvider = ({ children }) => {
  const refetchRef = useRef(null);

  return (
    <CenterRefetchContext.Provider value={refetchRef}>
      {children}
    </CenterRefetchContext.Provider>
  );
}; 