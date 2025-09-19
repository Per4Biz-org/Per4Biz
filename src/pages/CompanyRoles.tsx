// ===============================================
// 📋 Company Roles Management Page
// Implementação conforme documentação técnica seção 3.1
// Tela principal de gestão de roles empresariais
// ===============================================

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanyRoles } from '../hooks/useCompanyRoles';
import { RoleCard, CompanyPermissionGuard } from '../components/roles';
import { Role, ContextType, RoleQueryParams } from '../types/company-roles';

interface CompanyRolesProps {
  companyId: number;
}

/**
 * Página principal de gestão de roles empresariais
 * Implementa layout conforme ASCII art da documentação seção 3.1
 */
export function CompanyRoles({ companyId }: CompanyRolesProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContext, setSelectedContext] = useState<ContextType | 'ALL'>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Query params baseados nos filtros
  const queryParams: RoleQueryParams = {
    search: searchTerm || undefined,
    contextType: selectedContext !== 'ALL' ? selectedContext : undefined,
    branchId: selectedBranch || undefined,
    active: !showInactive,
    page: 1,
    size: 25
  };

  const {
    roles,
    loading,
    error,
    refetch,
    createRole,
    updateRole,
    deleteRole,
    cloneRole
  } = useCompanyRoles(companyId, queryParams);

  // Handlers para ações dos cards
  const handleCreateRole = useCallback(() => {
    // TODO: Abrir modal de criação
    console.log('Create role clicked');
  }, []);

  const handleEditRole = useCallback((role: Role) => {
    // TODO: Abrir modal de edição
    console.log('Edit role:', role);
  }, []);

  const handleDeleteRole = useCallback(async (roleId: number) => {
    if (window.confirm(t('companyRoles.confirmations.deleteRole'))) {
      try {
        await deleteRole(roleId);
        // TODO: Mostrar toast de sucesso
      } catch (error) {
        // TODO: Mostrar toast de erro
        console.error('Delete role error:', error);
      }
    }
  }, [deleteRole, t]);

  const handleCloneRole = useCallback((role: Role) => {
    // TODO: Abrir modal de clonagem
    console.log('Clone role:', role);
  }, []);

  const handleViewAssignments = useCallback((roleId: number) => {
    // TODO: Navegar para tela de atribuições
    console.log('View assignments for role:', roleId);
  }, []);

  // Filtrar roles baseado nos critérios de busca
  const filteredRoles = roles.filter(role => {
    if (searchTerm && !role.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !role.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Página */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('companyRoles.titles.management')}
                </h1>
                <p className="text-gray-600 mt-1">
                  {t('companyRoles.descriptions.management')}
                </p>
              </div>

              <CompanyPermissionGuard
                permission="roles.create"
                companyId={companyId}
                userId={1} // TODO: Pegar do contexto de auth
              >
                <button
                  onClick={handleCreateRole}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('companyRoles.actions.createRole')}
                </button>
              </CompanyPermissionGuard>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('companyRoles.placeholders.searchRoles')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtro de Contexto */}
            <div className="w-full lg:w-48">
              <select
                value={selectedContext}
                onChange={(e) => setSelectedContext(e.target.value as ContextType | 'ALL')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">{t('companyRoles.filters.allContexts')}</option>
                <option value="COMPANY">{t('companyRoles.contextTypes.company')}</option>
                <option value="BRANCH">{t('companyRoles.contextTypes.branch')}</option>
                <option value="APPLICATION">{t('companyRoles.contextTypes.application')}</option>
              </select>
            </div>

            {/* Toggle de Inativos */}
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  {t('companyRoles.filters.showInactive')}
                </span>
              </label>
            </div>

            {/* Seletor de Visualização */}
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'grid'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'list'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Estado de Carregamento */}
        {loading && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {[...Array(6)].map((_, index) => (
              <RoleCard
                key={index}
                role={{} as Role}
                isLoading={true}
                showActions={false}
              />
            ))}
          </div>
        )}

        {/* Estado de Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              {t('companyRoles.errors.loadFailed')}
            </h3>
            <p className="text-red-600 mb-4">
              {error.message}
            </p>
            <button
              onClick={refetch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {t('companyRoles.actions.retry')}
            </button>
          </div>
        )}

        {/* Lista de Roles */}
        {!loading && !error && (
          <>
            {filteredRoles.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm
                    ? t('companyRoles.messages.noRolesFound')
                    : t('companyRoles.messages.noRoles')
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? t('companyRoles.messages.tryDifferentSearch')
                    : t('companyRoles.messages.createFirstRole')
                  }
                </p>
                {!searchTerm && (
                  <CompanyPermissionGuard
                    permission="roles.create"
                    companyId={companyId}
                    userId={1} // TODO: Pegar do contexto de auth
                  >
                    <button
                      onClick={handleCreateRole}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {t('companyRoles.actions.createFirstRole')}
                    </button>
                  </CompanyPermissionGuard>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {filteredRoles.map(role => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    onEdit={handleEditRole}
                    onDelete={handleDeleteRole}
                    onClone={handleCloneRole}
                    onViewAssignments={handleViewAssignments}
                    className={viewMode === 'list' ? 'max-w-none' : ''}
                  />
                ))}
              </div>
            )}

            {/* Info de Resultados */}
            {filteredRoles.length > 0 && (
              <div className="mt-6 text-center text-sm text-gray-600">
                {t('companyRoles.messages.showingResults', {
                  count: filteredRoles.length,
                  total: roles.length
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}