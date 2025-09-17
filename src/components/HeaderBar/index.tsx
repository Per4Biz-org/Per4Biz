import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, User, Building, ChevronDown, Globe } from 'lucide-react';
import PTFlag from 'country-flag-icons/react/3x2/PT';
import GBFlag from 'country-flag-icons/react/3x2/GB';
import FRFlag from 'country-flag-icons/react/3x2/FR';
import { useTranslation } from 'react-i18next';
import { useProfil } from '../../context/ProfilContext';
import { useEntite } from '../../context/EntiteContext';

interface HeaderBarProps {
  className?: string;
}

// Função para gerar breadcrumbs com traduções
const getRouteBreadcrumbs = (t: any): Record<string, Array<{ label: string; path?: string }>> => ({
  '/': [{ label: t('header.breadcrumbs.dashboard') }],
  '/finances': [{ label: t('header.breadcrumbs.finance.title') }],
  '/finances/mes-factures': [
    { label: t('header.breadcrumbs.finance.title'), path: '/finances' },
    { label: t('header.breadcrumbs.finance.invoices') }
  ],
  '/finances/fermeture-caisse': [
    { label: t('header.breadcrumbs.finance.title'), path: '/finances' },
    { label: t('header.breadcrumbs.finance.cashClosure') }
  ],
  '/finances/suivi-ca-reel': [
    { label: t('header.breadcrumbs.finance.title'), path: '/finances' },
    { label: t('header.breadcrumbs.finance.revenueTracking') }
  ],
  '/finances/suivi-ca-budget': [
    { label: t('header.breadcrumbs.finance.title'), path: '/finances' },
    { label: t('header.breadcrumbs.finance.budgetTracking') }
  ],
  '/finances/budget-depense': [
    { label: t('header.breadcrumbs.finance.title'), path: '/finances' },
    { label: t('header.breadcrumbs.finance.expenseBudget') }
  ],
  '/finances/parametres-finances': [
    { label: t('header.breadcrumbs.finance.title'), path: '/finances' },
    { label: t('header.breadcrumbs.finance.settings') }
  ],
  '/banques': [{ label: t('header.breadcrumbs.banking.title') }],
  '/banques/ecriture-bancaire': [
    { label: t('header.breadcrumbs.banking.title'), path: '/banques' },
    { label: t('header.breadcrumbs.banking.movements') }
  ],
  '/banques/import-releves-brut': [
    { label: t('header.breadcrumbs.banking.title'), path: '/banques' },
    { label: t('header.breadcrumbs.banking.importStatements') }
  ],
  '/banques/parametres-banque': [
    { label: t('header.breadcrumbs.banking.title'), path: '/banques' },
    { label: t('header.breadcrumbs.banking.settings') }
  ],
  '/employes': [{ label: t('header.breadcrumbs.employees.title') }],
  '/employes/mes-employes': [
    { label: t('header.breadcrumbs.employees.title'), path: '/employes' },
    { label: t('header.breadcrumbs.employees.myEmployees') }
  ],
  '/employes/budget-rh': [
    { label: t('header.breadcrumbs.employees.title'), path: '/employes' },
    { label: t('header.breadcrumbs.employees.budgetHR') }
  ],
  '/employes/parametres-employes': [
    { label: t('header.breadcrumbs.employees.title'), path: '/employes' },
    { label: t('header.breadcrumbs.employees.settings') }
  ],
  '/parametres-global': [{ label: t('header.breadcrumbs.globalSettings.title') }],
  '/parametres-global/tiers': [
    { label: t('header.breadcrumbs.globalSettings.title'), path: '/parametres-global' },
    { label: t('header.breadcrumbs.globalSettings.thirdParties') }
  ],
  '/parametres-global/type-tiers': [
    { label: t('header.breadcrumbs.globalSettings.title'), path: '/parametres-global' },
    { label: t('header.breadcrumbs.globalSettings.thirdPartyTypes') }
  ],
  '/parametres-global/type-facture': [
    { label: t('header.breadcrumbs.globalSettings.title'), path: '/parametres-global' },
    { label: t('header.breadcrumbs.globalSettings.invoiceTypes') }
  ],
  '/parametres-global/entites': [
    { label: t('header.breadcrumbs.globalSettings.title'), path: '/parametres-global' },
    { label: t('header.breadcrumbs.globalSettings.entities') }
  ],
  '/parametres-global/import': [
    { label: t('header.breadcrumbs.globalSettings.title'), path: '/parametres-global' },
    { label: t('header.breadcrumbs.globalSettings.import') }
  ],
  '/profil': [{ label: t('header.breadcrumbs.profile') }],
  '/contact': [{ label: t('header.breadcrumbs.contact') }]
});

const HeaderBar: React.FC<HeaderBarProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { profil } = useProfil();
  const { entites, selectedEntite, selectedEntiteId, setSelectedEntiteId, loading } = useEntite();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEntiteMenu, setShowEntiteMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Languages configuration
  const languages = [
    { code: 'pt', component: PTFlag, name: 'Português' },
    { code: 'en', component: GBFlag, name: 'English' },
    { code: 'fr', component: FRFlag, name: 'Français' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Obter breadcrumbs para a rota atual com traduções
  const routeBreadcrumbs = getRouteBreadcrumbs(t);
  const currentBreadcrumbs = routeBreadcrumbs[location.pathname] || [{ label: t('header.breadcrumbs.dashboard') }];

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowEntiteMenu(false);
    setShowLanguageMenu(false);
  };

  const handleEntiteClick = () => {
    setShowEntiteMenu(!showEntiteMenu);
    setShowProfileMenu(false);
    setShowLanguageMenu(false);
  };

  const handleLanguageClick = () => {
    setShowLanguageMenu(!showLanguageMenu);
    setShowProfileMenu(false);
    setShowEntiteMenu(false);
  };

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setShowLanguageMenu(false);
  };

  const handleEntiteSelect = (entiteId: string) => {
    setSelectedEntiteId(entiteId);
    setShowEntiteMenu(false);
  };

  return (
    <header className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Breadcrumb and Entity Selector */}
        <div className="flex items-center space-x-6">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm">
            {currentBreadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
                {crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Entity Selector */}
          {!loading && entites.length > 0 && (
            <div className="relative">
              <button
                onClick={handleEntiteClick}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors min-w-[180px]"
              >
                <Building size={16} className="text-gray-500" />
                <span className="flex-1 text-left truncate">
                  {selectedEntite ? `${selectedEntite.code} - ${selectedEntite.libelle}` : 'Selecionar entidade'}
                </span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform ${showEntiteMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown de entidades */}
              {showEntiteMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    {entites.map((entite) => (
                      <button
                        key={entite.id}
                        onClick={() => handleEntiteSelect(entite.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedEntiteId === entite.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Building size={14} className="text-gray-400" />
                          <span className="truncate">
                            <span className="font-medium">{entite.code}</span> - {entite.libelle}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={handleLanguageClick}
              className="flex items-center space-x-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={currentLanguage.name}
            >
              <currentLanguage.component 
                style={{ 
                  width: '20px', 
                  height: '15px',
                  borderRadius: '2px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }} 
              />
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {/* Language dropdown */}
            {showLanguageMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[140px]">
                <div className="p-1">
                  {languages.map((language) => {
                    const FlagComponent = language.component;
                    return (
                      <button
                        key={language.code}
                        onClick={() => changeLanguage(language.code)}
                        className={`
                          flex items-center gap-3 w-full px-3 py-2 text-sm cursor-pointer transition-colors duration-150 rounded-md
                          hover:bg-gray-50
                          ${i18n.language === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                        `}
                        title={language.name}
                      >
                        <FlagComponent 
                          style={{ 
                            width: '20px', 
                            height: '15px',
                            borderRadius: '2px',
                            border: '1px solid rgba(0,0,0,0.1)'
                          }} 
                        />
                        <span className="font-medium">
                          {language.name}
                        </span>
                        {i18n.language === language.code && (
                          <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            </button>

            {/* Dropdown do perfil */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">ADMIN</p>
                      <p className="text-sm text-gray-600">{profil?.email || 'admin@per4biz.com'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <Link
                    to="/profil"
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User size={16} />
                    <span>{t('header.profile')}</span>
                  </Link>
                  <button
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    onClick={() => {
                      setShowProfileMenu(false);
                      // Logout será implementado
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span>{t('header.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay para fechar dropdowns */}
      {(showProfileMenu || showEntiteMenu || showLanguageMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
            setShowEntiteMenu(false);
            setShowLanguageMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default HeaderBar;