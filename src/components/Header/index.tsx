import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import LanguageSwitch from '../LanguageSwitch';

interface HeaderProps {
  onExpandChange?: (expanded: boolean) => void;
}

interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  separator?: boolean;
  onClick?: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ onExpandChange }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const { menuItems } = useMenu();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  const isActive = (path?: string) => {
    if (!path) return false;
    
    // Si nous sommes sur un sous-chemin (ex: /finances/parametres-finances)
    // et que nous vérifions le chemin parent (ex: /finances)
    // nous ne voulons pas que le parent soit considéré comme actif
    if (location.pathname.startsWith(`${path}/`)) {
      return false;
    }
    
    // Sinon, nous vérifions l'égalité exacte des chemins
    return location.pathname === path;
  };

  return (
    <nav className={`h-screen border-r border-gray-200 transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-16'
    } fixed left-0 top-0 text-white bg-[#4169E1]`}>
      <div className="p-4 flex items-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.1)]"
        >
          <Menu size={24} />
        </button>
        {isExpanded && (
          <Link to="/" className="ml-4 text-xl font-semibold whitespace-nowrap hover:text-gray-100 hover:bg-[rgba(255,255,255,0.1)] transition-all px-3 py-1 rounded-lg">
            {t('navigation.appName')}
          </Link>
        )}
      </div>

      <div className="px-4">
        {menuItems.map((item, index) => (
          <React.Fragment key={item.label}>
            {item.separator && index > 0 && (
              <div className="mx-3 my-2 border-t border-[rgba(255,255,255,0.5)]" />
            )}
            <div
              onClick={async () => {
                if (item.onClick) {
                  await item.onClick();
                }
                if (item.path) {
                  navigate(item.path);
                }
              }}
              className={`flex items-center px-3 py-3 mb-2 rounded-lg cursor-pointer ${
                isActive(item.path)
                  ? 'bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.25)]'
                  : 'hover:bg-[rgba(255,255,255,0.1)]'
              }`}
            >
              <item.icon size={20} className="min-w-[20px]" />
              {isExpanded && (
                <span className="ml-3 text-base font-medium">{item.label}</span>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
      
      <div className="px-4 mt-4 border-t border-[rgba(255,255,255,0.2)] pt-4">
        <LanguageSwitch />
      </div>
    </nav>
  );
};

export default Header;