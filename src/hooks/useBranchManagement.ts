// ===============================================
// 📋 useBranchManagement Hook
// Hook para gerenciamento de filiais empresariais
// Complementa os hooks existentes de roles
// ===============================================

import { useState, useEffect, useCallback } from 'react';
import { BranchService, Branch, BranchStats, BranchUser } from '../services/BranchService';
import { Role, TransferUserRequest, ApiError } from '../types/company-roles';

/**
 * Hook para gerenciamento completo de filiais
 */
export function useBranchManagement(companyId: number) {
  // Estado local
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Instância do service
  const branchService = new BranchService();

  /**
   * Carregar filiais da empresa
   */
  const fetchBranches = useCallback(async (includeStats: boolean = false) => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await branchService.listCompanyBranches(companyId, includeStats);

      if (response.success && response.data) {
        setBranches(response.data);
      } else {
        setError(response.error || {
          code: 'FETCH_FAILED',
          message: 'Erro ao carregar filiais'
        });
        setBranches([]);
      }
    } catch (err) {
      setError({
        code: 'FETCH_ERROR',
        message: 'Erro de comunicação',
        details: err
      });
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, branchService]);

  /**
   * Transferir funcionário entre filiais
   */
  const transferUser = useCallback(async (
    transferData: TransferUserRequest
  ): Promise<{ success: boolean; transferredRoles: number } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await branchService.transferUser(companyId, transferData);

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || {
          code: 'TRANSFER_FAILED',
          message: 'Erro ao transferir funcionário'
        });
        return null;
      }
    } catch (err) {
      setError({
        code: 'TRANSFER_ERROR',
        message: 'Erro ao transferir funcionário',
        details: err
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [companyId, branchService]);

  /**
   * Comparar roles entre filiais
   */
  const compareRoles = useCallback(async (branchIds: number[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await branchService.compareBranchRoles(companyId, branchIds);

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || {
          code: 'COMPARE_FAILED',
          message: 'Erro ao comparar roles'
        });
        return null;
      }
    } catch (err) {
      setError({
        code: 'COMPARE_ERROR',
        message: 'Erro ao comparar roles',
        details: err
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [companyId, branchService]);

  /**
   * Refetch - recarregar dados
   */
  const refetch = useCallback(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Effect para carregar dados iniciais
  useEffect(() => {
    if (companyId) {
      fetchBranches();
    }
  }, [companyId, fetchBranches]);

  return {
    branches,
    loading,
    error,
    selectedBranch,
    setSelectedBranch,
    transferUser,
    compareRoles,
    refetch
  };
}

/**
 * Hook específico para uma filial
 */
export function useBranchDetails(companyId: number, branchId: number) {
  const [branchStats, setBranchStats] = useState<BranchStats | null>(null);
  const [branchRoles, setBranchRoles] = useState<Role[]>([]);
  const [branchUsers, setBranchUsers] = useState<BranchUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const branchService = new BranchService();

  /**
   * Carregar dados completos da filial
   */
  const fetchBranchDetails = useCallback(async () => {
    if (!companyId || !branchId) return;

    setLoading(true);
    setError(null);

    try {
      // Carregar dados em paralelo
      const [statsResponse, rolesResponse, usersResponse] = await Promise.all([
        branchService.getBranchStats(companyId, branchId),
        branchService.getBranchRoles(companyId, branchId),
        branchService.getBranchUsers(companyId, branchId, true)
      ]);

      // Processar estatísticas
      if (statsResponse.success && statsResponse.data) {
        setBranchStats(statsResponse.data);
      }

      // Processar roles
      if (rolesResponse.success && rolesResponse.data) {
        setBranchRoles(rolesResponse.data);
      }

      // Processar usuários
      if (usersResponse.success && usersResponse.data) {
        setBranchUsers(usersResponse.data);
      }

      // Se algum request falhou, definir erro
      if (!statsResponse.success || !rolesResponse.success || !usersResponse.success) {
        setError({
          code: 'PARTIAL_LOAD_FAILED',
          message: 'Alguns dados da filial não puderam ser carregados'
        });
      }
    } catch (err) {
      setError({
        code: 'FETCH_ERROR',
        message: 'Erro ao carregar dados da filial',
        details: err
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, branchId, branchService]);

  /**
   * Refetch específico da filial
   */
  const refetch = useCallback(() => {
    fetchBranchDetails();
  }, [fetchBranchDetails]);

  // Effect para carregar dados da filial
  useEffect(() => {
    if (companyId && branchId) {
      fetchBranchDetails();
    }
  }, [companyId, branchId, fetchBranchDetails]);

  return {
    branchStats,
    branchRoles,
    branchUsers,
    loading,
    error,
    refetch
  };
}

/**
 * Hook para comparação entre filiais
 */
export function useBranchComparison(companyId: number) {
  const [comparison, setComparison] = useState<{
    commonRoles: Role[];
    uniqueRoles: Record<number, Role[]>;
    recommendations: string[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const branchService = new BranchService();

  /**
   * Comparar filiais selecionadas
   */
  const compareBranches = useCallback(async (branchIds: number[]) => {
    if (!companyId || branchIds.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const response = await branchService.compareBranchRoles(companyId, branchIds);

      if (response.success && response.data) {
        setComparison(response.data);
      } else {
        setError(response.error || {
          code: 'COMPARE_FAILED',
          message: 'Erro ao comparar filiais'
        });
        setComparison(null);
      }
    } catch (err) {
      setError({
        code: 'COMPARE_ERROR',
        message: 'Erro ao comparar filiais',
        details: err
      });
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, branchService]);

  /**
   * Limpar comparação
   */
  const clearComparison = useCallback(() => {
    setComparison(null);
    setError(null);
  }, []);

  return {
    comparison,
    loading,
    error,
    compareBranches,
    clearComparison
  };
}