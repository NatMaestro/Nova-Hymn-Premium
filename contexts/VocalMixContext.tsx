import React, { createContext, useContext, useState, useCallback } from 'react';

interface SelectedPart {
  type: 'soprano' | 'alto' | 'tenor' | 'bass';
  url: string;
  title: string;
}

interface VocalMixContextType {
  selectedParts: Record<string, SelectedPart[]>; // hymnId -> selected parts
  togglePart: (hymnId: string, part: SelectedPart) => void;
  getSelectedParts: (hymnId: string) => SelectedPart[];
  clearParts: (hymnId: string) => void;
}

const VocalMixContext = createContext<VocalMixContextType | undefined>(undefined);

export const VocalMixProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedParts, setSelectedParts] = useState<Record<string, SelectedPart[]>>({});

  const togglePart = useCallback((hymnId: string, part: SelectedPart) => {
    setSelectedParts((prev) => {
      const current = prev[hymnId] || [];
      const existingIndex = current.findIndex((p) => p.type === part.type);
      
      if (existingIndex >= 0) {
        // Remove if already selected
        const updated = current.filter((_, index) => index !== existingIndex);
        return {
          ...prev,
          [hymnId]: updated.length > 0 ? updated : undefined,
        };
      } else {
        // Add if not selected
        return {
          ...prev,
          [hymnId]: [...current, part],
        };
      }
    });
  }, []);

  const getSelectedParts = useCallback((hymnId: string): SelectedPart[] => {
    return selectedParts[hymnId] || [];
  }, [selectedParts]);

  const clearParts = useCallback((hymnId: string) => {
    setSelectedParts((prev) => {
      const updated = { ...prev };
      delete updated[hymnId];
      return updated;
    });
  }, []);

  return (
    <VocalMixContext.Provider
      value={{
        selectedParts,
        togglePart,
        getSelectedParts,
        clearParts,
      }}
    >
      {children}
    </VocalMixContext.Provider>
  );
};

export const useVocalMix = () => {
  const context = useContext(VocalMixContext);
  if (!context) {
    throw new Error('useVocalMix must be used within VocalMixProvider');
  }
  return context;
};


