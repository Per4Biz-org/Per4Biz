// ===============================================
// 📋 useEmployeeRoles Hook
// Hook para gerenciamento de roles de funcionários específicos
// Complementa a funcionalidade dos hooks de empresa
// ===============================================

import { useState, useEffect, useCallback } from 'react';
import { EmployeeRoleService } from '../services/EmployeeRoleService';
import {
  UserRoleAssignment,
  AssignRoleRequest,
  ApiError
} from '../types/company-roles';

/**
 * Hook para gerenciamento de roles de um funcionário específico
 */
export function useEmployeeRoles(companyId: number, userId: number) {

  // Estado local
  const [roles, setRoles] = useState<UserRoleAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Instância do service
  const employeeService = new EmployeeRoleService();

  /**
   * Carregar roles do funcionário
   */
  const fetchEmployeeRoles = useCallback(async () => {
    if (!companyId || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await employeeService.getEmployeeRoles(companyId, userId);

      if (response.success && response.data) {
        setRoles(response.data);
      } else {
        setError(response.error || {
          code: 'FETCH_FAILED',
          message: 'Erro ao carregar roles do funcionário'
        });
        setRoles([]);
      }
    } catch (err) {
      setError({
        code: 'FETCH_ERROR',
        message: 'Erro de comunicação',
        details: err
      });
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, userId, employeeService]);

  /**
   * Atribuir novo role ao funcionário
   */
  const assignRole = useCallback(async (
    assignmentData: AssignRoleRequest
  ): Promise<UserRoleAssignment> => {
    setLoading(true);
    setError(null);

    try {
      const response = await employeeService.assignRoleToEmployee(
        companyId,
        userId,
        assignmentData
      );

      if (response.success && response.data) {
        // Atualizar lista local
        setRoles(prevRoles => [response.data!, ...prevRoles]);
        return response.data;
      } else {
        const errorToThrow = response.error || {
          code: 'ASSIGN_FAILED',
          message: 'Falha ao atribuir role'
        };
        setError(errorToThrow);
        throw new Error(errorToThrow.message);
      }
    } catch (err) {
      const error = {
        code: 'ASSIGN_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao atribuir role',
        details: err
      };
      setError(error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [companyId, userId, employeeService]);

  /**
   * Remover role do funcionário
   */
  const removeRole = useCallback(async (userRoleId: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await employeeService.removeEmployeeRole(
        companyId,
        userId,
        userRoleId
      );

      if (response.success) {
        // Remover da lista local
        setRoles(prevRoles =>
          prevRoles.filter(role => role.id !== userRoleId)
        );
      } else {
        const errorToThrow = response.error || {
          code: 'REMOVE_FAILED',
          message: 'Falha ao remover role'
        };
        setError(errorToThrow);
        throw new Error(errorToThrow.message);
      }
    } catch (err) {
      const error = {
        code: 'REMOVE_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao remover role',
        details: err
      };
      setError(error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [companyId, userId, employeeService]);

  /**
   * Atualizar atribuição de role
   */
  const updateAssignment = useCallback(async (
    userRoleId: number,
    updateData: {
      isActive: boolean;
      expiresAt?: string | null;
      branchId?: number;
    }
  ): Promise<UserRoleAssignment> => {
    setLoading(true);
    setError(null);

    try {
      const response = await employeeService.updateEmployeeRoleAssignment(
        companyId,
        userId,
        userRoleId,
        updateData
      );

      if (response.success && response.data) {
        // Atualizar na lista local
        setRoles(prevRoles =>
          prevRoles.map(role =>
            role.id === userRoleId ? response.data! : role
          )
        );
        return response.data;
      } else {
        const errorToThrow = response.error || {
          code: 'UPDATE_FAILED',
          message: 'Falha ao atualizar atribuição'
        };
        setError(errorToThrow);
        throw new Error(errorToThrow.message);
      }
    } catch (err) {
      const error = {
        code: 'UPDATE_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao atualizar atribuição',
        details: err
      };
      setError(error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [companyId, userId, employeeService]);

  /**
   * Refetch - recarregar dados
   */
  const refetch = useCallback(() => {
    fetchEmployeeRoles();
  }, [fetchEmployeeRoles]);

  // Effect para carregar dados iniciais
  useEffect(() => {
    if (companyId && userId) {
      fetchEmployeeRoles();
    }
  }, [companyId, userId, fetchEmployeeRoles]);

  return {
    roles,
    loading,
    error,
    assignRole,
    removeRole,
    updateAssignment,
    refetch
  };
}