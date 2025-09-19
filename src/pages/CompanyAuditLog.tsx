// ===============================================
// 📋 Company Audit Log Page
// Implementação conforme documentação técnica seção 3.5
// Tela de auditoria de permissões empresariais
// ===============================================

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { CompanyPermissionGuard } from '../components/roles';
import { AuditQueryParams, AuditAction } from '../types/company-roles';

interface CompanyAuditLogProps {
  companyId: number;
}

/**
 * Página de auditoria de permissões empresariais
 * Implementa interface conforme documentação seção 3.5
 */
export function CompanyAuditLog({ companyId }: CompanyAuditLogProps) {
  const { t } = useTranslation();

  // Estados dos filtros
  const [filters, setFilters] = useState<AuditQueryParams>({
    startDate: '',
    endDate: '',
    userId: undefined,
    roleId: undefined,
    action: undefined,
    targetType: undefined,
    branchId: undefined,
    page: 1,
    size: 25
  });

  // Hook de auditoria
  const {
    logs,
    loading,
    error,
    pagination,
    stats,
    refetch,
    filterLogs,
    downloadCSV
  } = useAuditLogs(companyId, filters);

  // Aplicar filtros
  const handleFilterChange = useCallback((field: string, value: any) => {
    const newFilters = { ...filters, [field]: value, page: 1 };
    setFilters(newFilters);
    filterLogs(newFilters);
  }, [filters, filterLogs]);

  // Aplicar todos os filtros
  const handleApplyFilters = useCallback(() => {
    filterLogs(filters);
  }, [filters, filterLogs]);

  // Limpar filtros
  const handleClearFilters = useCallback(() => {
    const clearedFilters: AuditQueryParams = {
      page: 1,
      size: 25
    };
    setFilters(clearedFilters);
    filterLogs(clearedFilters);
  }, [filterLogs]);

  // Paginação
  const handlePageChange = useCallback((page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    filterLogs(newFilters);
  }, [filters, filterLogs]);

  // Formatação de data
  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatação de ação
  const formatAction = (action: AuditAction): string => {
    const actionMap = {
      'CREATE': t('companyRoles.audit.created'),
      'UPDATE': t('companyRoles.audit.updated'),
      'DELETE': t('companyRoles.audit.deleted'),
      'ASSIGN': t('companyRoles.audit.assigned'),
      'REMOVE': t('companyRoles.audit.removed')
    };
    return actionMap[action] || action;
  };

  // Ícone da ação
  const getActionIcon = (action: AuditAction): string => {
    switch (action) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'ASSIGN': return '👥';
      case 'REMOVE': return '❌';
      default: return '📝';
    }
  };

  // Cor da ação
  const getActionColor = (action: AuditAction): string => {
    switch (action) {
      case 'CREATE': return 'text-green-600';
      case 'UPDATE': return 'text-blue-600';
      case 'DELETE': return 'text-red-600';
      case 'ASSIGN': return 'text-purple-600';
      case 'REMOVE': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  // Estatísticas resumidas
  const summaryStats = useMemo(() => {
    if (!stats) return null;

    const totalActions = stats.totalActions;
    const topAction = Object.entries(stats.actionsByType)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      total: totalActions,
      mostCommon: topAction ? `${formatAction(topAction[0] as AuditAction)} (${topAction[1]})` : '-',
      activeUsers: stats.activeUsers,
      topUser: stats.mostActiveUsers[0]?.userName || '-'
    };
  }, [stats]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('companyRoles.audit.title')}
                </h1>
                <p className="text-gray-600 mt-1">
                  {t('companyRoles.descriptions.auditLog')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <CompanyPermissionGuard
                  permission="audit.export"
                  companyId={companyId}
                  userId={1} // TODO: Pegar do contexto de auth
                >
                  <button
                    onClick={() => downloadCSV(filters)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('companyRoles.audit.exportExcel')}
                  </button>
                </CompanyPermissionGuard>

                <button
                  onClick={refetch}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('companyRoles.dashboard.refresh')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Resumidas */}
      {summaryStats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-600">Total de Ações</div>
              <div className="text-2xl font-bold text-gray-900">{summaryStats.total}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-600">Ação Mais Comum</div>
              <div className="text-lg font-semibold text-gray-900">{summaryStats.mostCommon}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-600">Usuários Ativos</div>
              <div className="text-2xl font-bold text-gray-900">{summaryStats.activeUsers}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm font-medium text-gray-600">Usuário Mais Ativo</div>
              <div className="text-lg font-semibold text-gray-900 truncate">{summaryStats.topUser}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('companyRoles.audit.filters')}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpar
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {t('companyRoles.audit.filter')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('companyRoles.audit.period')}
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-gray-500 py-2">{t('companyRoles.audit.from')}</span>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Ação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('companyRoles.audit.action')}
              </label>
              <select
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{t('companyRoles.audit.all')}</option>
                <option value="CREATE">{t('companyRoles.audit.created')}</option>
                <option value="UPDATE">{t('companyRoles.audit.updated')}</option>
                <option value="DELETE">{t('companyRoles.audit.deleted')}</option>
                <option value="ASSIGN">{t('companyRoles.audit.assigned')}</option>
                <option value="REMOVE">{t('companyRoles.audit.removed')}</option>
              </select>
            </div>

            {/* Tipo de Alvo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.targetType || ''}
                onChange={(e) => handleFilterChange('targetType', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{t('companyRoles.audit.all')}</option>
                <option value="ROLE">Papel</option>
                <option value="USER_ROLE">Atribuição</option>
              </select>
            </div>

            {/* ID do Usuário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID do {t('companyRoles.audit.user')}
              </label>
              <input
                type="number"
                value={filters.userId || ''}
                onChange={(e) => handleFilterChange('userId', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Filtrar por usuário..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Logs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('companyRoles.messages.loading')}</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 mb-4">{error.message}</p>
              <button
                onClick={refetch}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {t('companyRoles.actions.retry')}
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum log encontrado
              </h3>
              <p className="text-gray-600">
                Não foram encontrados logs de auditoria para os filtros selecionados.
              </p>
            </div>
          ) : (
            <>
              {/* Cabeçalho da Tabela */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-2">{t('companyRoles.audit.dateTime')}</div>
                  <div className="col-span-2">{t('companyRoles.audit.user')}</div>
                  <div className="col-span-2">{t('companyRoles.audit.action')}</div>
                  <div className="col-span-6">{t('companyRoles.audit.details')}</div>
                </div>
              </div>

              {/* Linhas da Tabela */}
              <div className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50">
                    <div className="col-span-2 text-sm text-gray-900">
                      {formatDateTime(log.timestamp)}
                    </div>
                    <div className="col-span-2 text-sm text-gray-900">
                      {log.userName || 'Sistema'}
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${getActionColor(log.action)}`}>
                        <span>{getActionIcon(log.action)}</span>
                        {formatAction(log.action)}
                      </span>
                    </div>
                    <div className="col-span-6 text-sm text-gray-600">
                      <div className="max-w-md">
                        <p className="truncate" title={log.details}>
                          {log.details}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          {log.targetType} ID: {log.targetId}
                          {log.branchId && ` • Filial: ${log.branchId}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((pagination.page - 1) * pagination.size) + 1} a {Math.min(pagination.page * pagination.size, pagination.total)} de {pagination.total} resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('companyRoles.actions.previous')}
                    </button>
                    <span className="text-sm text-gray-700">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('companyRoles.actions.next')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}