// ===============================================
// 📋 useAuditLogs Hook
// Hook para gerenciamento de logs de auditoria
// Complementa a funcionalidade dos hooks existentes
// ===============================================

import { useState, useEffect, useCallback } from 'react';
import { AuditService } from '../services/AuditService';
import {
  AuditLogEntry,
  AuditQueryParams,
  AuditAction,
  ApiError
} from '../types/company-roles';

/**
 * Hook para gerenciamento de logs de auditoria
 */
export function useAuditLogs(companyId: number, initialParams?: AuditQueryParams) {
  // Estado local
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 25,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState<{
    totalActions: number;
    actionsByType: Record<AuditAction, number>;
    activeUsers: number;
    mostActiveUsers: Array<{ userId: number; userName: string; count: number }>;
    recentActivity: AuditLogEntry[];
  } | null>(null);

  // Instância do service
  const auditService = new AuditService();

  /**
   * Carregar logs de auditoria
   */
  const fetchAuditLogs = useCallback(async (params?: AuditQueryParams) => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await auditService.getAuditLogs(companyId, params);

      if (response.success && response.data) {
        setLogs(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || {
          code: 'FETCH_FAILED',
          message: 'Erro ao carregar logs de auditoria'
        });
        setLogs([]);
      }
    } catch (err) {
      setError({
        code: 'FETCH_ERROR',
        message: 'Erro de comunicação',
        details: err
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, auditService]);

  /**
   * Carregar estatísticas de auditoria
   */
  const fetchAuditStats = useCallback(async (startDate?: string, endDate?: string) => {
    if (!companyId) return;

    try {
      const response = await auditService.getAuditStats(companyId, startDate, endDate);

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        console.error('Failed to load audit stats:', response.error);
      }
    } catch (err) {
      console.error('Error loading audit stats:', err);
    }
  }, [companyId, auditService]);

  /**
   * Exportar logs para CSV
   */
  const exportLogs = useCallback(async (
    params?: AuditQueryParams,
    format: 'CSV' | 'EXCEL' = 'CSV'
  ): Promise<string | null> => {
    if (!companyId) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await auditService.exportAuditLogs(companyId, params, format);

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || {
          code: 'EXPORT_FAILED',
          message: 'Erro ao exportar logs'
        });
        return null;
      }
    } catch (err) {
      setError({
        code: 'EXPORT_ERROR',
        message: 'Erro ao exportar logs',
        details: err
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [companyId, auditService]);

  /**
   * Criar entrada manual de auditoria
   */
  const createAuditEntry = useCallback(async (data: {
    userId: number;
    action: AuditAction;
    targetType: 'ROLE' | 'USER_ROLE';
    targetId: number;
    details: string;
    branchId?: number;
  }): Promise<AuditLogEntry | null> => {
    if (!companyId) return null;

    try {
      const response = await auditService.createAuditEntry({
        companyId,
        ...data
      });

      if (response.success && response.data) {
        // Adicionar nova entrada no início da lista
        setLogs(prevLogs => [response.data!, ...prevLogs]);
        return response.data;
      } else {
        setError(response.error || {
          code: 'CREATE_FAILED',
          message: 'Erro ao criar entrada de auditoria'
        });
        return null;
      }
    } catch (err) {
      setError({
        code: 'CREATE_ERROR',
        message: 'Erro ao criar entrada de auditoria',
        details: err
      });
      return null;
    }
  }, [companyId, auditService]);

  /**
   * Refetch - recarregar dados
   */
  const refetch = useCallback(() => {
    fetchAuditLogs(initialParams);
    fetchAuditStats();
  }, [fetchAuditLogs, fetchAuditStats, initialParams]);

  /**
   * Filtrar logs localmente
   */
  const filterLogs = useCallback((filterParams: Partial<AuditQueryParams>) => {
    fetchAuditLogs({ ...initialParams, ...filterParams });
  }, [fetchAuditLogs, initialParams]);

  /**
   * Baixar arquivo CSV
   */
  const downloadCSV = useCallback(async (params?: AuditQueryParams) => {
    const csvContent = await exportLogs(params, 'CSV');
    if (csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `auditoria-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }, [exportLogs]);

  // Effect para carregar dados iniciais
  useEffect(() => {
    if (companyId) {
      fetchAuditLogs(initialParams);
      fetchAuditStats();
    }
  }, [companyId, fetchAuditLogs, fetchAuditStats, initialParams]);

  return {
    logs,
    loading,
    error,
    pagination,
    stats,
    refetch,
    filterLogs,
    exportLogs,
    downloadCSV,
    createAuditEntry
  };
}

/**
 * Hook simplificado para estatísticas de auditoria
 */
export function useAuditStats(companyId: number, dateRange?: { start: string; end: string }) {
  const [stats, setStats] = useState<{
    totalActions: number;
    actionsByType: Record<AuditAction, number>;
    activeUsers: number;
    mostActiveUsers: Array<{ userId: number; userName: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const auditService = new AuditService();

  useEffect(() => {
    if (!companyId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await auditService.getAuditStats(
          companyId,
          dateRange?.start,
          dateRange?.end
        );

        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error loading audit stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [companyId, dateRange?.start, dateRange?.end]);

  return { stats, loading };
}