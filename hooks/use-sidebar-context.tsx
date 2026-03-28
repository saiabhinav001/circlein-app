'use client';

import { createContext, useContext } from 'react';

// Sidebar context for sharing collapsed state across components
export const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useNavSidebarContext = () => useContext(SidebarContext);
