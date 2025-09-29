// ===============================================
// 👥 Hook Dashboard RH - Dados Reais
// Hook personalizado para buscar dados de funcionários do banco
// ===============================================

import { useState, useEffect, useCallback } from 'react';
import { hrService, HRDashboardData, HRMetrics, MonthlyHRData } from '../services/hrService';

interface UseHRDashboardResult {
  data: HRDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  // Dados específicos para fácil acesso
  metrics: HRMetrics | null;
  monthlyData: MonthlyHRData[];
}

interface UseHRDashboardOptions {
  companyId: string;
  entiteId?: string; // Filtro por entidade (opcional)
  autoFetch?: boolean;
  refreshInterval?: number; // em ms
}

export const useHRDashboard = (
  options: UseHRDashboardOptions
): UseHRDashboardResult => {
  const { companyId, entiteId, autoFetch = true, refreshInterval } = options;

  const [data, setData] = useState<HRDashboardData | null>(null);
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
      console.log('🔄 Buscando dados RH do banco para company:', companyId, 'entidade:', entiteId);

      const hrData = await hrService.getHRDashboardData(companyId, entiteId);

      console.log('✅ Dados RH carregados:', {
        funcionarios: hrData.metrics.totalEmployees,
        ativos: hrData.metrics.activeEmployees,
        orcamento: hrData.metrics.monthlyBudget,
        mesesCarregados: hrData.monthlyData.length
      });

      setData(hrData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao carregar dados RH:', errorMessage);
      setError(`Erro ao carregar dados RH: ${errorMessage}`);
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
      console.log('🔄 Refresh automático dos dados RH...');
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
    monthlyData: data?.monthlyData || []
  };
};