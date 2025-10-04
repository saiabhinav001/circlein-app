'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredAmenities: any[];
  setFilteredAmenities: (amenities: any[]) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAmenities, setFilteredAmenities] = useState<any[]>([]);

  return (
    <SearchContext.Provider 
      value={{ 
        searchQuery, 
        setSearchQuery, 
        filteredAmenities, 
        setFilteredAmenities 
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}