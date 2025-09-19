// ===============================================
// 🧭 Menu de Navegação - Company Roles
// Para adicionar ao menu principal existente
// ===============================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CompanyPermissionGuard } from '../company-roles';

interface CompanyRolesMenuProps {
  companyId: number;
  isCollapsed?: boolean;
}

export const CompanyRolesMenu: React.FC<CompanyRolesMenuProps> = ({
  companyId,
  isCollapsed = false
}) => {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    {
      title: t('company-roles.listing.title'),
      path: '/company/roles',
      icon: '🏢',
      description: 'Gerenciar papéis da empresa',
      permission: { configuracoes: { gerenciarEmpresa: true } }
    },
    {
      title: 'Dashboard de Permissões',
      path: '/company/permissions/dashboard',
      icon: '📊',
      description: 'Visão geral das permissões',
      permission: { configuracoes: { gerenciarEmpresa: true } }
    }
  ];

  const isActivePath = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="space-y-1">
      {/* Cabeçalho da seção */}
      <div className={`px-3 py-2 ${isCollapsed ? 'text-center' : ''}`}>
        <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider ${
          isCollapsed ? 'hidden' : ''
        }`}>
          Sistema de Permissões
        </h3>
        {isCollapsed && (
          <div className="w-6 h-6 mx-auto bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-sm">🔐</span>
          </div>
        )}
      </div>

      {/* Items do menu */}
      {menuItems.map((item) => (
        <CompanyPermissionGuard
          key={item.path}
          companyId={companyId}
          contextType="company"
          contextId={companyId}
          requiredPermissions={item.permission}
        >
          <Link
            to={item.path}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActivePath(item.path)
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={isCollapsed ? item.title : undefined}
          >
            <span className={`${isCollapsed ? 'mx-auto' : 'mr-3'} text-lg`}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>{item.title}</span>
                  {isActivePath(item.path) && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
            )}
          </Link>
        </CompanyPermissionGuard>
      ))}

      {/* Link rápido para funcionários */}
      <CompanyPermissionGuard
        companyId={companyId}
        contextType="company"
        contextId={companyId}
        requiredPermissions={{ usuarios: { gerenciarRoles: true } }}
      >
        <div className={`px-3 py-2 ${isCollapsed ? 'hidden' : ''}`}>
          <p className="text-xs text-gray-500 mb-2">Acesso Rápido:</p>
          <div className="space-y-1">
            <Link
              to="/employees"
              className="block text-xs text-blue-600 hover:text-blue-800"
            >
              → Gerenciar funcionários
            </Link>
            <Link
              to="/company/branches"
              className="block text-xs text-blue-600 hover:text-blue-800"
            >
              → Gerenciar filiais
            </Link>
          </div>
        </div>
      </CompanyPermissionGuard>
    </div>
  );
};

export default CompanyRolesMenu;