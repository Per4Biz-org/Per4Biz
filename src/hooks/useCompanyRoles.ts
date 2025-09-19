// ===============================================
// 📋 useCompanyRoles Hook
// Implementação conforme documentação técnica seção 7.2
// Hook para gerenciamento de roles empresariais
// ===============================================

import { useState, useEffect, useCallback } from 'react';
import { CompanyRoleService } from '../services/CompanyRoleService';
import {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  CloneRoleRequest,
  RoleQueryParams,
  ApiError,
  UseCompanyRolesReturn
} from '../types/company-roles';

/**
 * Hook customizado para gerenciamento de roles empresariais
 * Implementa todas as funcionalidades da seção 7.2 da documentação
 */
export function useCompanyRoles(
  companyId: number,
  initialParams?: RoleQueryParams
): UseCompanyRolesReturn {

  // Estado local
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 25,
    total: 0,
    totalPages: 0
  });

  // Instância do service
  const roleService = new CompanyRoleService();

  /**
   * Fetch roles da empresa
   */
  const fetchRoles = useCallback(async (params?: RoleQueryParams) => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await roleService.listCompanyRoles(companyId, params);

      if (response.success && response.data) {
        setRoles(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Erro desconhecido ao carregar roles'
        });
        setRoles([]);
      }
    } catch (err) {
      setError({
        code: 'FETCH_ERROR',
        message: 'Erro ao comunicar com o servidor',
        details: err
      });
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, roleService]);

  /**
   * Refetch - recarregar dados
   */
  const refetch = useCallback(() => {
    fetchRoles(initialParams);
  }, [fetchRoles, initialParams]);

  /**
   * Criar novo role
   */
  const createRole = useCallback(async (data: CreateRoleRequest): Promise<Role> => {
    setLoading(true);
    setError(null);

    try {
      const response = await roleService.createCompanyRole(companyId, data);

      if (response.success && response.data) {
        // Atualizar lista local
        setRoles(prevRoles => [response.data!, ...prevRoles]);
        return response.data;
      } else {
        const errorToThrow = response.error || {
          code: 'CREATE_FAILED',
          message: 'Falha ao criar role'
        };
        setError(errorToThrow);
        throw new Error(errorToThrow.message);
      }
    } catch (err) {
      const error = {
        code: 'CREATE_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao criar role',
        details: err
      };
      setError(error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [companyId, roleService]);

  /**
   * Atualizar role existente
   */
  const updateRole = useCallback(async (
    roleId: number,
    data: UpdateRoleRequest
  ): Promise<Role> => {
    setLoading(true);
    setError(null);

    try {
      const response = await roleService.updateCompanyRole(companyId, roleId, data);

      if (response.success && response.data) {
        // Atualizar na lista local
        setRoles(prevRoles =>
          prevRoles.map(role =>
            role.id === roleId ? response.data! : role
          )
        );
        return response.data;
      } else {
        const errorToThrow = response.error || {
          code: 'UPDATE_FAILED',
          message: 'Falha ao atualizar role'
        };
        setError(errorToThrow);
        throw new Error(errorToThrow.message);
      }
    } catch (err) {
      const error = {
        code: 'UPDATE_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao atualizar role',
        details: err
      };
      setError(error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [companyId, roleService]);

  /**
   * Deletar role
   */
  const deleteRole = useCallback(async (roleId: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await roleService.deleteCompanyRole(companyId, roleId);

      if (response.success) {
        // Remover da lista local
        setRoles(prevRoles =>
          prevRoles.filter(role => role.id !== roleId)
        );
      } else {
        const errorToThrow = response.error || {
          code: 'DELETE_FAILED',
          message: 'Falha ao deletar role'
        };
        setError(errorToThrow);
        throw new Error(errorToThrow.message);
      }
    } catch (err) {
      const error = {
        code: 'DELETE_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao deletar role',
        details: err
      };
      setError(error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [companyId, roleService]);

  /**
   * Clonar role existente
   */
  const cloneRole = useCallback(async (
    roleId: number,
    data: CloneRoleRequest
  ): Promise<Role> => {
    setLoading(true);
    setError(null);

    try {
      const response = await roleService.cloneRole(companyId, roleId, data);

      if (response.success && response.data) {
        // Adicionar à lista local
        setRoles(prevRoles => [response.data!, ...prevRoles]);
        return response.data;
      } else {
        const errorToThrow = response.error || {
          code: 'CLONE_FAILED',
          message: 'Falha ao clonar role'
        };
        setError(errorToThrow);
        throw new Error(errorToThrow.message);
      }
    } catch (err) {
      const error = {
        code: 'CLONE_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao clonar role',
        details: err
      };
      setError(error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [companyId, roleService]);

  // Effect para carregar dados iniciais
  useEffect(() => {
    if (companyId) {
      fetchRoles(initialParams);
    }
  }, [companyId, fetchRoles, initialParams]);

  // Retorna interface conforme documentação
  return {
    roles,
    loading,
    error,
    pagination,
    createRole,
    updateRole,
    deleteRole,
    refetch
  };
}