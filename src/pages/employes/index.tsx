import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { menuItemsGestionRH } from '../../config/menuConfig';
import { supabase } from '../../lib/supabase';
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
  const [loading, setLoading] = useState(true);
  const [hrData, setHrData] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    monthlyBudget: 0,
    averageSalary: 0,
    monthlyData: []
  });

  useEffect(() => {
    setMenuItems(menuItemsGestionRH);
    fetchHRData();
  }, [setMenuItems, profil]);

  const fetchHRData = async () => {
    if (!profil?.com_contrat_client_id) {
      setLoading(false);
      return;
    }

    try {
      // Simulação de dados de RH - pode ser substituído por dados reais
      // Aqui você pode fazer queries para buscar:
      // - Número total de funcionários
      // - Funcionários ativos
      // - Orçamento mensal de RH
      // - Salário médio
      // - Dados dos últimos 6 meses

      setHrData({
        totalEmployees: 24,
        activeEmployees: 22,
        monthlyBudget: 45000,
        averageSalary: 2045,
        monthlyData: [
          { name: 'Jan', orcamento: 42000, funcionarios: 20 },
          { name: 'Fev', orcamento: 43500, funcionarios: 21 },
          { name: 'Mar', orcamento: 44200, funcionarios: 22 },
          { name: 'Abr', orcamento: 43800, funcionarios: 21 },
          { name: 'Mai', orcamento: 44800, funcionarios: 23 },
          { name: 'Jun', orcamento: 45000, funcionarios: 22 }
        ]
      });
    } catch (error) {
      console.error('Erro ao carregar dados de RH:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dados para o gráfico
  const chartSeries = [
    {
      id: 'orcamento',
      label: 'Orçamento RH',
      color: '#3b82f6',
      data: hrData.monthlyData.map(item => item.orcamento)
    },
    {
      id: 'funcionarios',
      label: 'Nº Funcionários',
      color: '#10b981',
      data: hrData.monthlyData.map(item => item.funcionarios * 1000) // Escalar para visualização
    }
  ];

  const chartCategories = hrData.monthlyData.map(item => item.name);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t('pages.employees.title', 'Gestão de Funcionários')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('pages.employees.subtitle', 'Visão geral dos recursos humanos')}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">A carregar dados de RH...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                icon={Users}
                label="Total Funcionários"
                value={hrData.totalEmployees.toString()}
                helper="Colaboradores registrados"
                trendLabel="+2 este mês"
                trendDirection="up"
                accent="blue"
                trendData={[20, 21, 22, 21, 23, 24]}
                chartColor="#3b82f6"
                chartFill="rgba(59, 130, 246, 0.1)"
              />

              <MetricCard
                icon={UserCheck}
                label="Funcionários Ativos"
                value={hrData.activeEmployees.toString()}
                helper="Colaboradores em atividade"
                trendLabel="91.7% taxa atividade"
                trendDirection="up"
                accent="green"
                trendData={[19, 20, 21, 20, 22, 22]}
                chartColor="#10b981"
                chartFill="rgba(16, 185, 129, 0.1)"
              />

              <MetricCard
                icon={DollarSign}
                label="Orçamento Mensal"
                value={`EUR ${(hrData.monthlyBudget / 1000).toFixed(0)}K`}
                helper="Total custos mensais RH"
                trendLabel="+5% vs mês anterior"
                trendDirection="up"
                accent="purple"
                trendData={[42, 43.5, 44.2, 43.8, 44.8, 45]}
                chartColor="#8b5cf6"
                chartFill="rgba(139, 92, 246, 0.1)"
              />

              <MetricCard
                icon={TrendingUp}
                label="Salário Médio"
                value={`EUR ${hrData.averageSalary}`}
                helper="Remuneração média mensal"
                trendLabel="+3.2% vs ano anterior"
                trendDirection="up"
                accent="amber"
                trendData={[1980, 2010, 2005, 2025, 2035, 2045]}
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
                      {hrData.activeEmployees} ativos
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Orçamento</span>
                    <span className="text-sm font-semibold text-purple-600">
                      EUR {(hrData.monthlyBudget / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Custo Médio</span>
                      <span className="text-sm font-bold text-gray-900">
                        EUR {Math.round(hrData.monthlyBudget / hrData.activeEmployees)}
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