// ===============================================
// 📊 Dashboard de Permissões da Empresa
// Rota: /company/permissions/dashboard
// ===============================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { menuItemsAdministracao } from '../../config/menuConfig';
import { useMockCompanyRoles } from '../../hooks/useMockCompanyRoles';
import {
  BarChart3,
  Users,
  Shield,
  Building,
  AlertTriangle,
  Info,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const PermissionsDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setMenuItems(menuItemsAdministracao);
  }, [setMenuItems]);

  // TODO: Obter companyId do contexto de autenticação
  const companyId = 1;

  const { roles, loading } = useMockCompanyRoles(companyId);

  // Estatísticas principais
  const stats = [
    {
      icon: Users,
      label: 'Colaboradores',
      value: '157',
      change: '+12%',
      changeType: 'positive' as const,
      gradient: 'from-blue-600 to-blue-700',
      bgGradient: 'from-blue-50 to-blue-100'
    },
    {
      icon: Shield,
      label: 'Papéis Ativos',
      value: '12',
      change: '+2',
      changeType: 'positive' as const,
      gradient: 'from-emerald-600 to-emerald-700',
      bgGradient: 'from-emerald-50 to-emerald-100'
    },
    {
      icon: Building,
      label: 'Filiais',
      value: '5',
      change: 'estável',
      changeType: 'neutral' as const,
      gradient: 'from-violet-600 to-violet-700',
      bgGradient: 'from-violet-50 to-violet-100'
    },
    {
      icon: Activity,
      label: 'Permissões Únicas',
      value: '48',
      change: '+8%',
      changeType: 'positive' as const,
      gradient: 'from-amber-600 to-amber-700',
      bgGradient: 'from-amber-50 to-amber-100'
    }
  ];

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
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Simples */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard de Permissões</h1>
              <p className="text-gray-600 mt-1">Visão geral das permissões da empresa</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Métricas - Compactos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid de Conteúdo Compacto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Distribuição de Papéis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Papéis</h3>
            <div className="space-y-3">
              {roleUsage.map((role, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{role.name.split(' ')[0]}</span>
                    <span className="text-sm text-gray-700">{role.name.substring(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${role.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {role.users}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas</h3>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    alert.type === 'warning'
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela de Filiais */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Distribuição por Filiais</h3>
          </div>
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
                      {branch.branch}
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
    </div>
  );
};

export default PermissionsDashboardPage;