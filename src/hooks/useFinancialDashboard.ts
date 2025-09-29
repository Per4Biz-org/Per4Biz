// ===============================================
// 📊 Hook Dashboard Financeiro - Dados Reais
// Hook personalizado para buscar dados financeiros do banco
// ===============================================

import { useState, useEffect, useCallback } from 'react';
import { financeService, FinancialDashboardData, FinancialMetrics, MonthlyData } from '../services/financeService';

interface UseFinancialDashboardResult {
  data: FinancialDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  // Dados específicos para fácil acesso
  metrics: FinancialMetrics | null;
  monthlyData: MonthlyData[];
  recentInvoices: any[];
}

interface UseFinancialDashboardOptions {
  companyId: string;
  entiteId?: string; // Filtro por entidade (opcional)
  autoFetch?: boolean;
  refreshInterval?: number; // em ms
}

export const useFinancialDashboard = (
  options: UseFinancialDashboardOptions
): UseFinancialDashboardResult => {
  const { companyId, entiteId, autoFetch = true, refreshInterval } = options;

  const [data, setData] = useState<FinancialDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar dados
  const fetchData = useCallback(async () => {
    if (!companyId) {
      setError('Company ID é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Buscando dados financeiros do banco para company:', companyId, 'entidade:', entiteId);

      const dashboardData = await financeService.getDashboardData(companyId, entiteId);

      console.log('✅ Dados financeiros carregados:', {
        receitas: dashboardData.metrics.totalRevenue,
        despesas: dashboardData.metrics.totalExpenses,
        faturas: dashboardData.metrics.invoiceCount,
        mesesCarregados: dashboardData.monthlyData.length
      });

      setData(dashboardData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao carregar dados financeiros:', errorMessage);
      setError(`Erro ao carregar dados financeiros: ${errorMessage}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, entiteId]);

  // Buscar dados automaticamente quando o hook é inicializado ou entidade muda
  useEffect(() => {
    if (autoFetch && companyId) {
      fetchData();
    }
  }, [autoFetch, companyId, entiteId, fetchData]);

  // Configurar refresh automático se especificado
  useEffect(() => {
    if (!refreshInterval || refreshInterval < 1000) return;

    const interval = setInterval(() => {
      console.log('🔄 Refresh automático dos dados financeiros...');
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,

    // Dados específicos para fácil acesso
    metrics: data?.metrics || null,
    monthlyData: data?.monthlyData || [],
    recentInvoices: data?.recentInvoices || []
  };
};