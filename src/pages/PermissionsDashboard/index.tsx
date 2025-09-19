// ===============================================
// 📊 Dashboard de Permissões da Empresa
// Rota: /company/permissions/dashboard
// ===============================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMockCompanyRoles } from '../../hooks/useMockCompanyRoles';

const PermissionsDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  // TODO: Obter companyId do contexto de autenticação
  const companyId = 1;

  const { roles, loading } = useMockCompanyRoles(companyId);

  // Estatísticas gerais - Conforme seção 3.4
  const [stats, setStats] = useState({
    totalEmployees: 157,
    activeRoles: 12,
    branches: 5,
    uniquePermissions: 48
  });

  // Distribuição por filial - Conforme ASCII Art seção 3.4
  const branchDistribution = [
    { branch: 'Matriz (SP)', admin: 2, manager: 5, supervisor: 8, operator: 25 },
    { branch: 'Rio de Janeiro', admin: 1, manager: 3, supervisor: 5, operator: 18 },
    { branch: 'Belo Horizonte', admin: 1, manager: 2, supervisor: 4, operator: 15 },
    { branch: 'Porto Alegre', admin: 1, manager: 2, supervisor: 3, operator: 12 },
    { branch: 'Recife', admin: 1, manager: 2, supervisor: 3, operator: 10 }
  ];

  // Alertas e recomendações - Conforme seção 3.4
  const alerts = [
    { type: 'warning', message: '3 papéis temporários expiram nos próximos 7 dias' },
    { type: 'warning', message: '5 funcionários sem papel atribuído' },
    { type: 'info', message: 'Papel "Assistente" não utilizado há 90 dias' }
  ];

  // Papéis mais utilizados com percentuais
  const roleUsage = [
    { name: '👷 Operador', users: 80, percentage: 51 },
    { name: '📊 Supervisor', users: 23, percentage: 15 },
    { name: '💼 Gerente', users: 15, percentage: 10 },
    { name: '💰 Financeiro', users: 12, percentage: 8 },
    { name: '👑 Administrador', users: 6, percentage: 4 }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular atualização
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExportReport = () => {
    alert('Funcionalidade de exportar relatório será implementada');
  };

  const handleConfigure = () => {
    alert('Funcionalidade de configurar será implementada');
  };

  const handleFullReport = () => {
    alert('Funcionalidade de relatório completo será implementada');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Página - Seção 3.4 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🔐 Dashboard de Permissões - ABC Tecnologia
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Visão geral das permissões e roles da empresa
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              🔄 Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Estatísticas Gerais - Conforme Seção 3.4 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total de Funcionários</h3>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">💼</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Papéis Ativos</h3>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeRoles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🏬</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Filiais</h3>
                <p className="text-2xl font-semibold text-gray-900">{stats.branches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔐</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Permissões Únicas</h3>
                <p className="text-2xl font-semibold text-gray-900">{stats.uniquePermissions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Distribuição por Filial - Conforme ASCII Art seção 3.4 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              📈 Distribuição de Papéis por Filial
            </h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filial</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gerente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operador</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branchDistribution.map((branch, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {branch.branch.includes('Matriz') ? '🏢' : '🏬'} {branch.branch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.admin}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.manager}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.supervisor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Grid inferior - Papéis Mais Utilizados e Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Papéis Mais Utilizados - Conforme Seção 3.4 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                🎯 Papéis Mais Utilizados
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {roleUsage.map((role, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {role.name} ({role.users} usuários)
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-blue-600' :
                            index === 1 ? 'bg-green-600' :
                            index === 2 ? 'bg-purple-600' :
                            index === 3 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${role.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">{role.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alertas e Recomendações - Conforme Seção 3.4 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                ⚠️ Alertas e Recomendações
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <p className={`text-sm ${
                      alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                    }`}>
                      {alert.type === 'warning' ? '⚠️' : 'ℹ️'} {alert.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação - Conforme Seção 3.4 */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
          >
            📥 Exportar Relatório
          </button>
          <button
            onClick={handleConfigure}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
          >
            ⚙️ Configurar
          </button>
          <button
            onClick={handleFullReport}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            📊 Relatório Completo
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsDashboardPage;