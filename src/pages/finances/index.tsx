import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { menuItemsGestionFinanciere } from '../../config/menuConfig';
import { supabase } from '../../lib/supabase';
import MetricCard from '../../components/dashboard/MetricCard';
import ModernLineChart from '../../components/dashboard/ModernLineChart';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  DollarSign,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const Finances: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();
  const { profil } = useProfil();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    invoiceCount: 0,
    pendingInvoices: 0,
    monthlyData: []
  });

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
    fetchFinancialData();
  }, [setMenuItems, profil]);

  const fetchFinancialData = async () => {
    if (!profil?.com_contrat_client_id) {
      setLoading(false);
      return;
    }

    try {
      // Simulação de dados - pode ser substituído por dados reais
      // Aqui você pode fazer queries para buscar:
      // - Total de receitas do mês
      // - Total de despesas do mês
      // - Número de faturas
      // - Faturas pendentes
      // - Dados dos últimos 6 meses

      setFinancialData({
        totalRevenue: 125000,
        totalExpenses: 87500,
        invoiceCount: 47,
        pendingInvoices: 8,
        monthlyData: [
          { name: 'Jan', receitas: 95000, despesas: 65000 },
          { name: 'Fev', receitas: 105000, despesas: 72000 },
          { name: 'Mar', receitas: 115000, despesas: 78000 },
          { name: 'Abr', receitas: 108000, despesas: 81000 },
          { name: 'Mai', receitas: 118000, despesas: 85000 },
          { name: 'Jun', receitas: 125000, despesas: 87500 }
        ]
      });
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular KPIs
  const netProfit = financialData.totalRevenue - financialData.totalExpenses;
  const profitMargin = financialData.totalRevenue > 0 ? (netProfit / financialData.totalRevenue) * 100 : 0;

  // Dados para o gráfico
  const chartData = financialData.monthlyData.map(item => ({
    name: item.name,
    receitas: item.receitas,
    despesas: item.despesas
  }));

  const chartSeries = [
    {
      id: 'receitas',
      label: 'Receitas',
      color: '#10b981',
      data: financialData.monthlyData.map(item => item.receitas)
    },
    {
      id: 'despesas',
      label: 'Despesas',
      color: '#ef4444',
      data: financialData.monthlyData.map(item => item.despesas)
    }
  ];

  const chartCategories = financialData.monthlyData.map(item => item.name);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t('pages.finances.title', 'Gestão Financeira')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('pages.finances.subtitle', 'Visão geral da situação financeira')}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">A carregar dados financeiros...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                icon={DollarSign}
                label="Receitas do Mês"
                value={`EUR ${(financialData.totalRevenue / 1000).toFixed(0)}K`}
                helper="Volume de negócios mensal"
                trendLabel="+12% vs mês anterior"
                trendDirection="up"
                accent="green"
                trendData={[95, 105, 115, 108, 118, 125]}
                chartColor="#10b981"
                chartFill="rgba(16, 185, 129, 0.1)"
              />

              <MetricCard
                icon={TrendingDown}
                label="Despesas do Mês"
                value={`EUR ${(financialData.totalExpenses / 1000).toFixed(0)}K`}
                helper="Total de gastos mensais"
                trendLabel="+8% vs mês anterior"
                trendDirection="up"
                accent="amber"
                trendData={[65, 72, 78, 81, 85, 87.5]}
                chartColor="#f59e0b"
                chartFill="rgba(245, 158, 11, 0.1)"
              />

              <MetricCard
                icon={TrendingUp}
                label="Lucro Líquido"
                value={`EUR ${(netProfit / 1000).toFixed(0)}K`}
                helper={`Margem: ${profitMargin.toFixed(1)}%`}
                trendLabel="+18% vs mês anterior"
                trendDirection="up"
                accent="blue"
                trendData={[30, 33, 37, 27, 33, 37.5]}
                chartColor="#3b82f6"
                chartFill="rgba(59, 130, 246, 0.1)"
              />

              <MetricCard
                icon={FileText}
                label="Faturas"
                value={financialData.invoiceCount.toString()}
                helper={`${financialData.pendingInvoices} pendentes`}
                trendLabel="3 novas esta semana"
                trendDirection="neutral"
                accent="purple"
                trendData={[42, 45, 43, 46, 44, 47]}
                chartColor="#8b5cf6"
                chartFill="rgba(139, 92, 246, 0.1)"
              />
            </div>

            {/* Gráfico de evolução */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ModernLineChart
                title="Evolução Financeira"
                subtitle="Receitas vs Despesas nos últimos 6 meses"
                categories={chartCategories}
                series={chartSeries}
              />
            </div>

            {/* Resumo e ações rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status financeiro */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Status Financeiro</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-700">Receitas em dia</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <span className="text-sm text-gray-700">Faturas pendentes</span>
                    </div>
                    <span className="text-sm font-semibold text-amber-600">{financialData.pendingInvoices}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-700">Próximo relatório</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">5 dias</span>
                  </div>
                </div>
              </div>

              {/* Ações rápidas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Nova Fatura</p>
                        <p className="text-xs text-gray-600">Criar nova fatura de compra</p>
                      </div>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Fermeture Caisse</p>
                        <p className="text-xs text-gray-600">Fechar caixa do dia</p>
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
                    <span className="text-sm text-gray-600">Receitas</span>
                    <span className="text-sm font-semibold text-green-600">
                      EUR {(financialData.totalRevenue / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Despesas</span>
                    <span className="text-sm font-semibold text-red-600">
                      EUR {(financialData.totalExpenses / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Resultado</span>
                      <span className={`text-sm font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        EUR {(netProfit / 1000).toFixed(0)}K
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

export default Finances;