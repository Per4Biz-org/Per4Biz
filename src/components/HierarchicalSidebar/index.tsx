import React, { useState, useEffect } from 'react';
import { Menu, ChevronDown, ChevronRight, Grid3X3, User, Globe, Shield, CreditCard, Users, Settings, FileText, Home, Landmark, Bell, Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import styles from './index.module.css';

interface HierarchicalSidebarProps {
  onExpandChange?: (expanded: boolean) => void;
}

// Estrutura de menu exata da imagem
interface MenuItem {
  id: string;
  label: string;
  icon?: any;
  path?: string;
  children?: MenuItem[];
  badge?: string;
  disabled?: boolean;
}

interface MenuSection {
  id: string;
  label: string;
  items: MenuItem[];
}

// Função para obter estrutura do menu com traduções
const getMenuStructure = (t: any): MenuSection[] => [
  {
    id: 'main',
    label: '',
    items: [
      {
        id: 'dashboards',
        label: t('sidebar.dashboards'),
        icon: Grid3X3,
        children: [
          { id: 'accueil', label: t('sidebar.home'), path: '/', icon: Home }
        ]
      }
    ]
  },
  {
    id: 'gestion-section',
    label: t('sidebar.sections.management'),
    items: [
      {
        id: 'gestion-financiere',
        label: t('sidebar.finance.title'),
        icon: CreditCard,
        children: [
          { id: 'finances-home', label: t('sidebar.finance.overview'), path: '/finances', icon: Home },
          { id: 'mes-factures', label: t('sidebar.finance.invoices'), path: '/finances/mes-factures', icon: FileText },
          { id: 'fermeture-caisse', label: t('sidebar.finance.cashClosure'), path: '/finances/fermeture-caisse', icon: CreditCard },
          { id: 'suivi-ca-reel', label: t('sidebar.finance.revenueTracking'), path: '/finances/suivi-ca-reel', icon: FileText },
          { id: 'suivi-ca-budget', label: t('sidebar.finance.budgetTracking'), path: '/finances/suivi-ca-budget', icon: FileText },
          { id: 'budget-depense', label: t('sidebar.finance.expenseBudget'), path: '/finances/budget-depense', icon: FileText },
          { 
            id: 'param-finances', 
            label: t('sidebar.finance.settings'), 
            icon: Settings,
            children: [
              { id: 'param-finances-home', label: t('sidebar.finance.parametersOverview', 'Vue d\'ensemble'), path: '/finances/parametres-finances', icon: Home },
              { id: 'ca-type-service', label: t('sidebar.finance.caTypeService', 'Types de Service CA'), path: '/finances/ca-type-service', icon: Settings },
              { id: 'nature-flux', label: t('sidebar.finance.natureFlux', 'Nature des Flux'), path: '/finances/nature-flux', icon: Settings },
              { id: 'categorie-flux', label: t('sidebar.finance.categorieFlux', 'Catégories des Flux'), path: '/finances/categorie-flux', icon: Settings },
              { id: 'sous-categorie-flux', label: t('sidebar.finance.sousCategorieFlux', 'Sous-catégories des Flux'), path: '/finances/sous-categorie-flux', icon: Settings },
              { id: 'param-jours', label: t('sidebar.finance.paramJours', 'Paramètres des Jours'), path: '/finances/param-jours', icon: Settings }
            ]
          }
        ]
      },
      {
        id: 'gestion-bancaire',
        label: t('sidebar.banking.title'),
        icon: Landmark,
        children: [
          { id: 'banques-home', label: t('sidebar.banking.overview'), path: '/banques', icon: Home },
          { id: 'ecriture-bancaire', label: t('sidebar.banking.movements'), path: '/banques/ecriture-bancaire', icon: CreditCard },
          { id: 'import-releves', label: t('sidebar.banking.importStatements'), path: '/banques/import-releves-brut', icon: FileText },
          { id: 'param-banque', label: t('sidebar.banking.settings'), path: '/banques/parametres-banque', icon: Settings }
        ]
      },
      {
        id: 'gestion-employes',
        label: t('sidebar.employees.title'),
        icon: Users,
        children: [
          { id: 'employes-home', label: t('sidebar.employees.overview'), path: '/employes', icon: Home },
          { id: 'mes-employes', label: t('sidebar.employees.myEmployees'), path: '/employes/mes-employes', icon: Users },
          { id: 'budget-rh', label: t('sidebar.employees.budgetHR'), path: '/employes/budget-rh', icon: FileText },
          { id: 'param-employes', label: t('sidebar.employees.settings'), path: '/employes/parametres-employes', icon: Settings }
        ]
      }
    ]
  },
  {
    id: 'config-section',
    label: t('sidebar.sections.configuration'),
    items: [
      {
        id: 'parametres-global',
        label: t('sidebar.globalSettings.title'),
        icon: Settings,
        children: [
          { id: 'param-home', label: t('sidebar.globalSettings.overview'), path: '/parametres-global', icon: Home },
          { id: 'tiers', label: t('sidebar.globalSettings.thirdParties'), path: '/parametres-global/tiers', icon: Users },
          { id: 'type-tiers', label: t('sidebar.globalSettings.thirdPartyTypes'), path: '/parametres-global/type-tiers', icon: Users },
          { id: 'type-facture', label: t('sidebar.globalSettings.invoiceTypes'), path: '/parametres-global/type-facture', icon: FileText },
          { id: 'entites', label: t('sidebar.globalSettings.entities'), path: '/parametres-global/entites', icon: Settings },
          { id: 'import', label: t('sidebar.globalSettings.import'), path: '/parametres-global/import', icon: FileText }
        ]
      }
    ]
  }
];

const HierarchicalSidebar: React.FC<HierarchicalSidebarProps> = ({ onExpandChange }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    dashboards: true, // Dashboards expandido
    'gestion-financiere': false, // Começar fechado 
    'gestion-bancaire': false,
    'gestion-employes': false,
    'parametres-global': false,
    'param-finances': false // Parâmetros financeiros fechados por padrão
  });
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obter estrutura do menu com traduções
  const menuStructure = getMenuStructure(t);
  
  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    
    if (item.children && item.children.length > 0) {
      toggleItem(item.id);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const renderMenuItem = (item: MenuItem, level: number = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.id];
    const indentClass = level === 0 ? 'pl-3' : level === 1 ? 'pl-8' : level === 2 ? 'pl-12' : 'pl-16';
    
    return (
      <div key={item.id}>
        <div
          onClick={() => handleItemClick(item)}
          className={`flex items-center py-2 px-3 ${indentClass} text-sm cursor-pointer hover:bg-[rgba(255,255,255,0.1)] rounded-md mx-2 ${
            isActive(item.path) ? 'bg-[rgba(255,255,255,0.2)] text-white' : 'text-white'
          } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {item.icon && level === 0 && (
            <item.icon size={16} className="mr-2 text-white" />
          )}
          
          {level > 0 && (
            <div className="w-4 h-4 mr-2" />
          )}
          
          <span className="flex-1 text-left">{item.label}</span>
          
          {item.badge && (
            <span className="text-xs px-2 py-1 bg-[rgba(255,255,255,0.2)] text-white rounded">
              {item.badge}
            </span>
          )}
          
          {hasChildren && (
            <div className="ml-2">
              {isExpanded ? (
                <ChevronDown size={14} className="text-white opacity-70" />
              ) : (
                <ChevronRight size={14} className="text-white opacity-70" />
              )}
            </div>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-0">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };


  if (!isExpanded) {
    return (
      <nav className="w-16 h-screen border-r border-blue-600 fixed left-0 top-0 bg-[#4169E1] shadow-sm">
        <div className="p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <Menu size={20} className="text-white" />
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-64 h-screen border-r border-blue-600 fixed left-0 top-0 bg-[#4169E1] shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-[rgba(255,255,255,0.2)] flex-shrink-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        >
          <Menu size={20} className="text-white" />
        </button>
        <Link to="/" className="ml-3 text-lg font-semibold text-white hover:text-gray-100 transition-colors">
          {t('navigation.appName')}
        </Link>
      </div>

      {/* Menu Content */}
      <div className={`flex-1 overflow-y-auto ${styles.scrollContainer}`}>
        <div className={`py-4 ${styles.scrollContent}`}>
        {menuStructure.map((section) => (
          <div key={section.id} className="mb-6">
            {/* Section Label */}
            {section.label && (
              <div className="px-4 mb-2">
                <span className="text-xs font-medium text-white opacity-60 uppercase tracking-wider">
                  {section.label}
                </span>
              </div>
            )}
            
            {/* Section Items */}
            <div className="px-2">
              {section.items.map(item => renderMenuItem(item, 0))}
            </div>
          </div>
        ))}
        
        </div>
      </div>
    </nav>
  );
};

export default HierarchicalSidebar;