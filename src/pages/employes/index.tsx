import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { useEntite } from '../../context/EntiteContext';
import { menuItemsGestionRH } from '../../config/menuConfig';
import { useHRDashboard } from '../../hooks/useHRDashboard';
import MetricCard from '../../components/dashboard/MetricCard';
import ModernLineChart from '../../components/dashboard/ModernLineChart';
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  CreditCard
} from 'lucide-react';

const Employes: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();
  const { profil } = useProfil();
  const { selectedEntite, selectedEntiteId } = useEntite();

  // Usar o hook personalizado para dados RH reais
  const { data, loading, error, metrics, monthlyData, refetch } = useHRDashboard({
    companyId: profil?.com_contrat_client_id || '',
    entiteId: selectedEntiteId || '',
    autoFetch: true
  });

  useEffect(() => {
    setMenuItems(menuItemsGestionRH);
  }, [setMenuItems]);

  // Recarregar dados quando a entidade mudar
  useEffect(() => {
    if (selectedEntiteId && refetch) {
      console.log(`🏢 Entidade RH alterada para: ${selectedEntite?.libelle} (${selectedEntiteId})`);
      refetch();
    }
  }, [selectedEntiteId, refetch, selectedEntite]);

  // Usar dados reais ou valores padrão se ainda estiver carregando
  const totalEmployees = metrics?.totalEmployees || 0;
  const activeEmployees = metrics?.activeEmployees || 0;
  const monthlyBudget = metrics?.monthlyBudget || 0;
  const averageSalary = metrics?.averageSalary || 0;

  // Dados para o gráfico usando dados reais
  const chartSeries = [
    {
      id: 'orcamento',
      label: 'Orçamento RH',
      color: '#3b82f6',
      data: monthlyData.map(item => item.orcamento)
    },
    {
      id: 'funcionarios',
      label: 'Nº Funcionários',
      color: '#10b981',
      data: monthlyData.map(item => item.funcionarios * 1000) // Escalar para visualização
    }
  ];

  const chartCategories = monthlyData.map(item => item.monthName || item.month);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {t('pages.employees.title', 'Gestão de Funcionários')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('pages.employees.subtitle', 'Visão geral dos recursos humanos')}
              </p>
            </div>
            {selectedEntite && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Dados filtrados por:</p>
                <p className="text-sm font-semibold text-purple-600">
                  {selectedEntite.code} - {selectedEntite.libelle}
                </p>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando dados RH do banco...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Erro ao carregar dados RH</p>
              <p className="text-gray-500 text-sm mt-2">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                icon={Users}
                label="Total Funcionários"
                value={totalEmployees.toString()}
                helper="Colaboradores registrados"
                trendLabel={totalEmployees > 0 ? "Dados do banco" : "Aguardando dados"}
                trendDirection="neutral"
                accent="blue"
                trendData={monthlyData.slice(-6).map(item => item.funcionarios)}
                chartColor="#3b82f6"
                chartFill="rgba(59, 130, 246, 0.1)"
              />

              <MetricCard
                icon={UserCheck}
                label="Funcionários Ativos"
                value={activeEmployees.toString()}
                helper="Colaboradores em atividade"
                trendLabel={activeEmployees > 0 ? "Dados reais" : "Nenhum ativo"}
                trendDirection={activeEmployees > 0 ? "up" : "neutral"}
                accent="green"
                trendData={monthlyData.slice(-6).map(item => Math.max(0, item.funcionarios - 1))}
                chartColor="#10b981"
                chartFill="rgba(16, 185, 129, 0.1)"
              />

              <MetricCard
                icon={DollarSign}
                label="Orçamento Mensal"
                value={monthlyBudget > 0 ? `EUR ${(monthlyBudget / 1000).toFixed(0)}K` : 'EUR 0K'}
                helper="Total custos mensais RH"
                trendLabel={monthlyBudget > 0 ? "Calculado automaticamente" : "Sem dados"}
                trendDirection="neutral"
                accent="purple"
                trendData={monthlyData.slice(-6).map(item => item.orcamento / 1000)}
                chartColor="#8b5cf6"
                chartFill="rgba(139, 92, 246, 0.1)"
              />

              <MetricCard
                icon={TrendingUp}
                label="Salário Médio"
                value={averageSalary > 0 ? `EUR ${averageSalary.toFixed(0)}` : 'EUR 0'}
                helper="Remuneração média mensal"
                trendLabel={averageSalary > 0 ? "Baseado em contratos" : "Sem dados salariais"}
                trendDirection="neutral"
                accent="amber"
                trendData={monthlyData.slice(-6).map(item => item.orcamento / Math.max(1, item.funcionarios))}
                chartColor="#f59e0b"
                chartFill="rgba(245, 158, 11, 0.1)"
              />
            </div>

            {/* Gráfico de evolução */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ModernLineChart
                title="Evolução dos Recursos Humanos"
                subtitle="Orçamento RH e número de funcionários nos últimos 6 meses"
                categories={chartCategories}
                series={chartSeries}
              />
            </div>

            {/* Resumo e ações rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status RH */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Status RH</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-700">Folha em dia</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <span className="text-sm text-gray-700">Contratos a renovar</span>
                    </div>
                    <span className="text-sm font-semibold text-amber-600">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-700">Próxima avaliação</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">2 semanas</span>
                  </div>
                </div>
              </div>

              {/* Ações rápidas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Novo Funcionário</p>
                        <p className="text-xs text-gray-600">Adicionar colaborador</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Gerar Relatório</p>
                        <p className="text-xs text-gray-600">Relatório mensal RH</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Resumo do mês */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo do Mês</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Funcionários</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {activeEmployees} ativos
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Orçamento</span>
                    <span className="text-sm font-semibold text-purple-600">
                      EUR {(monthlyBudget / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Custo Médio</span>
                      <span className="text-sm font-bold text-gray-900">
                        EUR {activeEmployees > 0 ? Math.round(monthlyBudget / activeEmployees) : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employes;