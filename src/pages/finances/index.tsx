import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { useEntite } from '../../context/EntiteContext';
import { menuItemsGestionFinanciere } from '../../config/menuConfig';
import { useFinancialDashboard } from '../../hooks/useFinancialDashboard';
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
  const { selectedEntite, selectedEntiteId } = useEntite();
  const navigate = useNavigate();

  // Usar o hook personalizado para dados financeiros reais
  // Agora filtrando por entidade selecionada
  const { data, loading, error, metrics, monthlyData, refetch } = useFinancialDashboard({
    companyId: profil?.com_contrat_client_id || '',
    entiteId: selectedEntiteId || '', // Filtro por entidade
    autoFetch: true
  });

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
  }, [setMenuItems]);

  // Recarregar dados quando a entidade mudar
  useEffect(() => {
    if (selectedEntiteId && refetch) {
      console.log(`🏢 Entidade alterada para: ${selectedEntite?.libelle} (${selectedEntiteId})`);
      refetch();
    }
  }, [selectedEntiteId, refetch, selectedEntite]);

  // Usar dados reais ou valores padrão se ainda estiver carregando
  const totalRevenue = metrics?.totalRevenue || 0;
  const totalExpenses = metrics?.totalExpenses || 0;
  const invoiceCount = metrics?.invoiceCount || 0;
  const pendingInvoices = metrics?.pendingInvoices || 0;
  const netProfit = metrics?.netProfit || 0;
  const profitMargin = metrics?.profitMargin || 0;

  // Dados para o gráfico usando dados reais
  const chartSeries = [
    {
      id: 'receitas',
      label: 'Receitas',
      color: '#10b981',
      data: monthlyData.map(item => item.receitas)
    },
    {
      id: 'despesas',
      label: 'Despesas',
      color: '#ef4444',
      data: monthlyData.map(item => item.despesas)
    }
  ];

  const chartCategories = monthlyData.map(item => item.monthName || item.month);

  // Handlers para ações rápidas
  const handleNovaFatura = () => {
    navigate('/finances/mes-factures');
  };

  const handleFermetureCaisse = () => {
    navigate('/finances/fermeture-caisse');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {t('pages.finances.title', 'Gestão Financeira')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('pages.finances.subtitle', 'Visão geral da situação financeira')}
              </p>
            </div>
            {selectedEntite && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Dados filtrados por:</p>
                <p className="text-sm font-semibold text-blue-600">
                  {selectedEntite.code} - {selectedEntite.libelle}
                </p>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando dados financeiros do banco...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Erro ao carregar dados</p>
              <p className="text-gray-500 text-sm mt-2">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                icon={DollarSign}
                label="Receitas do Mês"
                value={totalRevenue > 0 ? `EUR ${(totalRevenue / 1000).toFixed(0)}K` : 'EUR 0K'}
                helper="Volume de negócios mensal"
                trendLabel={totalRevenue > 0 ? "Dados do banco" : "Aguardando dados"}
                trendDirection="neutral"
                accent="green"
                trendData={monthlyData.slice(-6).map(item => item.receitas / 1000)}
                chartColor="#10b981"
                chartFill="rgba(16, 185, 129, 0.1)"
              />

              <MetricCard
                icon={TrendingDown}
                label="Despesas do Mês"
                value={totalExpenses > 0 ? `EUR ${(totalExpenses / 1000).toFixed(0)}K` : 'EUR 0K'}
                helper="Total de gastos mensais"
                trendLabel={totalExpenses > 0 ? "Dados do banco" : "Aguardando dados"}
                trendDirection="neutral"
                accent="amber"
                trendData={monthlyData.slice(-6).map(item => item.despesas / 1000)}
                chartColor="#f59e0b"
                chartFill="rgba(245, 158, 11, 0.1)"
              />

              <MetricCard
                icon={TrendingUp}
                label="Lucro Líquido"
                value={netProfit !== 0 ? `EUR ${(netProfit / 1000).toFixed(0)}K` : 'EUR 0K'}
                helper={profitMargin > 0 ? `Margem: ${profitMargin.toFixed(1)}%` : 'Margem: 0%'}
                trendLabel={netProfit !== 0 ? "Calculado automaticamente" : "Aguardando dados"}
                trendDirection={netProfit > 0 ? "up" : netProfit < 0 ? "down" : "neutral"}
                accent="blue"
                trendData={monthlyData.slice(-6).map(item => (item.receitas - item.despesas) / 1000)}
                chartColor="#3b82f6"
                chartFill="rgba(59, 130, 246, 0.1)"
              />

              <MetricCard
                icon={FileText}
                label="Faturas"
                value={invoiceCount.toString()}
                helper={`${pendingInvoices} pendentes`}
                trendLabel={invoiceCount > 0 ? "Total do mês" : "Nenhuma fatura"}
                trendDirection="neutral"
                accent="purple"
                trendData={monthlyData.slice(-6).map((_, index) => invoiceCount - index * 2)}
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
                    <span className="text-sm font-semibold text-amber-600">{pendingInvoices}</span>
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
                  <button
                    onClick={handleNovaFatura}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Nova Fatura</p>
                        <p className="text-xs text-gray-600">Criar nova fatura de compra</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handleFermetureCaisse}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-green-300 transition-all duration-200 hover:shadow-sm"
                  >
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
                      EUR {(totalRevenue / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Despesas</span>
                    <span className="text-sm font-semibold text-red-600">
                      EUR {(totalExpenses / 1000).toFixed(0)}K
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