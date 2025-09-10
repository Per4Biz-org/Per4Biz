import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfil } from '../../context/ProfilContext';

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
  const { t } = useTranslation();
  const location = useLocation();
  const { profil } = useProfil();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Obter breadcrumbs para a rota atual com traduções
  const routeBreadcrumbs = getRouteBreadcrumbs(t);
  const currentBreadcrumbs = routeBreadcrumbs[location.pathname] || [{ label: t('header.breadcrumbs.dashboard') }];

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <header className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-4">
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
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
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
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default HeaderBar;