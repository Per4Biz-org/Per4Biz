import React, { useState, useEffect } from 'react';
import { Menu, ChevronLeft, ChevronRight, Home, ClipboardList, Users, Settings } from 'lucide-react';

interface HeaderProps {
  onExpandChange?: (expanded: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ onExpandChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  const menuItems = [
    { icon: Home, label: 'Accueil' },
    { icon: ClipboardList, label: 'Commandes' },
    { icon: Users, label: 'Personnel' },
    { icon: Settings, label: 'Paramètres' }
  ];

  return (
    <nav className={`h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-16'
    } fixed left-0 top-0`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-end p-4 text-gray-500 hover:text-gray-700"
      >
        {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div className="px-2">
        {menuItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center px-2 py-3 mb-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <item.icon size={20} className="min-w-[20px]" />
            {isExpanded && (
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Header;