// ===============================================
// 📋 RoleListingInterface Component
// Interface principal para listagem de roles da empresa
// Implementa seção 3.1 da documentação técnica
// ===============================================

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanyRoles } from '../../hooks/useCompanyRoles';
import { Role, ContextType, RoleQueryParams } from '../../types/company-roles';
import { RoleCardGrid } from './RoleCard';
import { CompanyPermissionGuard } from './CompanyPermissionGuard';

interface RoleListingInterfaceProps {
  companyId: number;
  onCreateRole?: () => void;
  onEditRole?: (role: Role) => void;
  onViewRole?: (role: Role) => void;
  onDeleteRole?: (roleId: number) => void;
  className?: string;
}

interface FilterState {
  search: string;
  contextType: ContextType | 'all';
  showSystemRoles: boolean;
}

/**
 * Interface principal para gerenciamento de roles da empresa
 * Segue o layout ASCII da documentação seção 3.1
 */
export const RoleListingInterface: React.FC<RoleListingInterfaceProps> = ({
  companyId,
  onCreateRole,
  onEditRole,
  onViewRole,
  onDeleteRole,
  className = ''
}) => {
  const { t } = useTranslation();

  // Estados locais
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    contextType: 'all',
    showSystemRoles: true
  });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Query parameters para o hook
  const queryParams = useMemo((): RoleQueryParams => ({
    search: filters.search || undefined,
    contextType: filters.contextType !== 'all' ? filters.contextType : undefined,
    includeSystemRoles: filters.showSystemRoles,
    page: 1,
    limit: 50
  }), [filters]);

  // Hook de roles
  const {
    roles,
    loading,
    error,
    pagination,
    createRole,
    updateRole,
    deleteRole,
    refetch
  } = useCompanyRoles(companyId, queryParams);

  // Filtros aplicados localmente
  const filteredRoles = useMemo(() => {
    if (!roles) return [];

    return roles.filter(role => {
      // Filtro de busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!role.name.toLowerCase().includes(searchLower) &&
            !role.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Filtro de contexto
      if (filters.contextType !== 'all' && role.contextType !== filters.contextType) {
        return false;
      }

      // Filtro de roles do sistema
      if (!filters.showSystemRoles && role.isSystemRole) {
        return false;
      }

      return true;
    });
  }, [roles, filters]);

  // Handlers
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleContextFilter = (contextType: ContextType | 'all') => {
    setFilters(prev => ({ ...prev, contextType }));
  };

  const handleSystemRolesToggle = (show: boolean) => {
    setFilters(prev => ({ ...prev, showSystemRoles: show }));
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!onDeleteRole) return;

    const confirmed = window.confirm(t('company-roles.confirmations.deleteRole'));
    if (confirmed) {
      onDeleteRole(roleId);
    }
  };

  // Componente de erro
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-red-800">{error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* =============================================== */}
      {/* HEADER - Título e Ações Principais             */}
      {/* =============================================== */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('company-roles.listing.title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('company-roles.listing.subtitle')}
            </p>
          </div>

          {/* Ações principais */}
          <div className="flex items-center gap-3">
            <CompanyPermissionGuard
              companyId={companyId}
              contextType="company"
              contextId={companyId}
              requiredPermissions={{
                configuracoes: { gerenciarEmpresa: true }
              }}
            >
              <button
                onClick={onCreateRole}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('company-roles.actions.createRole')}
              </button>
            </CompanyPermissionGuard>

            <button
              onClick={refetch}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('company-roles.actions.refresh')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* =============================================== */}
      {/* FILTROS E CONTROLES                           */}
      {/* =============================================== */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Barra de busca */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t('company-roles.listing.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-4">
            {/* Filtro de contexto */}
            <select
              value={filters.contextType}
              onChange={(e) => handleContextFilter(e.target.value as ContextType | 'all')}
              className="block w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('company-roles.filters.allContexts')}</option>
              <option value="company">{t('company-roles.filters.company')}</option>
              <option value="branch">{t('company-roles.filters.branch')}</option>
              <option value="department">{t('company-roles.filters.department')}</option>
              <option value="team">{t('company-roles.filters.team')}</option>
            </select>

            {/* Toggle roles do sistema */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.showSystemRoles}
                onChange={(e) => handleSystemRolesToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              {t('company-roles.filters.showSystemRoles')}
            </label>

            {/* Modo de visualização */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                title={t('company-roles.viewModes.grid')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                title={t('company-roles.viewModes.table')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mt-3 text-sm text-gray-600">
          {filteredRoles.length} {t('company-roles.listing.resultsCount')}
          {filters.search && (
            <span className="ml-2">
              {t('company-roles.listing.searchResults', { term: filters.search })}
            </span>
          )}
        </div>
      </div>

      {/* =============================================== */}
      {/* CONTEÚDO PRINCIPAL - Lista/Grid de Roles       */}
      {/* =============================================== */}
      <div className="p-6">
        {viewMode === 'grid' ? (
          <RoleCardGrid
            roles={filteredRoles}
            onEdit={onEditRole}
            onDelete={handleDeleteRole}
            onView={onViewRole}
            loading={loading}
            emptyMessage={
              filters.search
                ? t('company-roles.listing.noSearchResults')
                : t('company-roles.listing.noRoles')
            }
          />
        ) : (
          // Table view (implementação futura)
          <div className="text-center py-12 text-gray-500">
            {t('company-roles.listing.tableViewComingSoon')}
          </div>
        )}
      </div>

      {/* =============================================== */}
      {/* FOOTER - Paginação e Estatísticas             */}
      {/* =============================================== */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t('company-roles.pagination.showing', {
                from: (pagination.currentPage - 1) * pagination.limit + 1,
                to: Math.min(pagination.currentPage * pagination.limit, pagination.total),
                total: pagination.total
              })}
            </div>

            {/* Implementar controles de paginação aqui */}
            <div className="text-sm text-gray-500">
              {t('company-roles.pagination.page')} {pagination.currentPage} {t('company-roles.pagination.of')} {pagination.totalPages}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleListingInterface;