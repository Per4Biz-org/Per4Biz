// ===============================================
// 📋 Company Permissions Dashboard
// Implementação conforme documentação técnica seção 3.4
// Dashboard executivo de permissões empresariais
// ===============================================

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanyRoles } from '../hooks/useCompanyRoles';
import { CompanyPermissionGuard, PermissionMatrix } from '../components/roles';
import { Role, ContextType } from '../types/company-roles';

interface CompanyPermissionsDashboardProps {
  companyId: number;
}

/**
 * Dashboard executivo de permissões empresariais
 * Implementa interface conforme documentação seção 3.4
 */
export function CompanyPermissionsDashboard({ companyId }: CompanyPermissionsDashboardProps) {
  const { t } = useTranslation();
  const [selectedContext, setSelectedContext] = useState<ContextType | 'ALL'>('ALL');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Carregar todos os roles da empresa
  const { roles, loading, error, refetch } = useCompanyRoles(companyId, {
    active: true,
    size: 100 // Carregar mais roles para o dashboard
  });

  // Estatísticas calculadas
  const statistics = useMemo(() => {
    const stats = {
      totalRoles: roles.length,
      activeRoles: roles.filter(r => !r.isSystemRole).length,
      systemRoles: roles.filter(r => r.isSystemRole).length,
      byContext: {
        COMPANY: roles.filter(r => r.contextType === 'COMPANY').length,
        BRANCH: roles.filter(r => r.contextType === 'BRANCH').length,
        APPLICATION: roles.filter(r => r.contextType === 'APPLICATION').length
      },
      totalPermissions: 0,
      mostUsedPermissions: [] as Array<{ permission: string; count: number }>
    };

    // Calcular total de permissões únicas
    const allPermissions = new Set<string>();
    const permissionCounts = new Map<string, number>();

    roles.forEach(role => {
      Object.entries(role.permissions).forEach(([module, modulePermissions]) => {
        if (typeof modulePermissions === 'object') {
          Object.entries(modulePermissions).forEach(([action, enabled]) => {
            if (enabled) {
              const permissionKey = `${module}.${action}`;
              allPermissions.add(permissionKey);
              permissionCounts.set(permissionKey, (permissionCounts.get(permissionKey) || 0) + 1);
            }
          });
        }
      });
    });

    stats.totalPermissions = allPermissions.size;

    // Top 5 permissões mais usadas
    stats.mostUsedPermissions = Array.from(permissionCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([permission, count]) => ({ permission, count }));

    return stats;
  }, [roles]);

  // Filtrar roles por contexto
  const filteredRoles = useMemo(() => {
    if (selectedContext === 'ALL') return roles;
    return roles.filter(role => role.contextType === selectedContext);
  }, [roles, selectedContext]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('companyRoles.messages.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            {t('companyRoles.errors.loadFailed')}
          </h3>
          <p className="text-red-600 mb-4">{error.message}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
          >
            {t('companyRoles.actions.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('companyRoles.titles.permissionsDashboard')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('companyRoles.descriptions.permissionsDashboard')}
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Roles */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('companyRoles.dashboard.totalRoles')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalRoles}</p>
              </div>
            </div>
          </div>

          {/* Roles Personalizados */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('companyRoles.dashboard.customRoles')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{statistics.activeRoles}</p>
              </div>
            </div>
          </div>

          {/* Roles de Sistema */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('companyRoles.dashboard.systemRoles')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{statistics.systemRoles}</p>
              </div>
            </div>
          </div>

          {/* Total de Permissões */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t('companyRoles.dashboard.totalPermissions')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalPermissions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Controles */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('companyRoles.dashboard.rolesOverview')}
            </h2>
            <div className="flex items-center gap-4">
              <select
                value={selectedContext}
                onChange={(e) => setSelectedContext(e.target.value as ContextType | 'ALL')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">{t('companyRoles.filters.allContexts')}</option>
                <option value="COMPANY">{t('companyRoles.contextTypes.company')}</option>
                <option value="BRANCH">{t('companyRoles.contextTypes.branch')}</option>
                <option value="APPLICATION">{t('companyRoles.contextTypes.application')}</option>
              </select>
            </div>
          </div>

          {/* Distribuição por Contexto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{statistics.byContext.COMPANY}</div>
              <div className="text-sm text-blue-800">{t('companyRoles.contextTypes.company')}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statistics.byContext.BRANCH}</div>
              <div className="text-sm text-green-800">{t('companyRoles.contextTypes.branch')}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{statistics.byContext.APPLICATION}</div>
              <div className="text-sm text-purple-800">{t('companyRoles.contextTypes.application')}</div>
            </div>
          </div>

          {/* Lista de Roles */}
          <div className="space-y-3">
            {filteredRoles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('companyRoles.messages.noRolesInContext')}</p>
              </div>
            ) : (
              filteredRoles.map(role => {
                const permissionCount = Object.values(role.permissions).reduce((count, modulePermissions) => {
                  if (typeof modulePermissions === 'object') {
                    return count + Object.values(modulePermissions).filter(Boolean).length;
                  }
                  return count;
                }, 0);

                return (
                  <div
                    key={role.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRole?.id === role.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{role.name}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            role.contextType === 'COMPANY'
                              ? 'bg-blue-100 text-blue-800'
                              : role.contextType === 'BRANCH'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {t(`companyRoles.contextTypes.${role.contextType.toLowerCase()}`)}
                          </span>
                          {role.isSystemRole && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {t('companyRoles.labels.systemRole')}
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {permissionCount} {t('companyRoles.labels.permissions')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(role.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detalhes do Role Selecionado */}
        {selectedRole && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('companyRoles.dashboard.roleDetails')}: {selectedRole.name}
              </h2>
              <button
                onClick={() => setSelectedRole(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <PermissionMatrix
              permissions={selectedRole.permissions}
              readOnly={true}
              showModuleHeaders={true}
              className="border border-gray-200 rounded-lg"
            />
          </div>
        )}

        {/* Permissões Mais Utilizadas */}
        {statistics.mostUsedPermissions.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('companyRoles.dashboard.mostUsedPermissions')}
            </h2>
            <div className="space-y-3">
              {statistics.mostUsedPermissions.map(({ permission, count }) => (
                <div key={permission} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {t(`companyRoles.permissions.${permission}`, permission)}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / statistics.totalRoles) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}