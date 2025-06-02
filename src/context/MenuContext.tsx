import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path?: string;
  separator?: boolean;
  subMenu?: MenuItem[];
}

interface MenuContextType {
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu doit être utilisé à l\'intérieur d\'un MenuProvider');
  }
  return context;
}

interface MenuProviderProps {
  children: ReactNode;
}

export function MenuProvider({ children }: MenuProviderProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  return (
    <MenuContext.Provider value={{ menuItems, setMenuItems }}>
      {children}
    </MenuContext.Provider>
  );
}