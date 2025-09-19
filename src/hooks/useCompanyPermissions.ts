// ===============================================
// 📋 useCompanyPermissions Hook
// Implementação conforme documentação técnica seção 7.1
// Hook para verificação de permissões empresariais
// ===============================================

import { useState, useEffect, useCallback } from 'react';
import { EmployeeRoleService } from '../services/EmployeeRoleService';
import {
  CompanyUserPermissions,
  UseCompanyPermissionsReturn
} from '../types/company-roles';

/**
 * Hook customizado para verificação de permissões empresariais
 * Implementa funcionalidade da seção 7.1 da documentação
 */
export function useCompanyPermissions(
  companyId: number,
  userId: number,
  branchId?: number
): UseCompanyPermissionsReturn {

  // Estado local
  const [permissions, setPermissions] = useState<CompanyUserPermissions | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Instância do service
  const employeeService = new EmployeeRoleService();

  /**
   * Carregar permissões do usuário
   */
  const loadPermissions = useCallback(async () => {
    if (!companyId || !userId) return;

    setLoading(true);

    try {
      const response = await employeeService.getEmployeePermissions(
        companyId,
        userId,
        branchId
      );

      if (response.success && response.data) {
        setPermissions(response.data);
      } else {
        console.error('Failed to load permissions:', response.error);
        setPermissions(null);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, userId, branchId, employeeService]);

  /**
   * Verificar se usuário tem permissão específica
   * Implementa lógica conforme documentação seção 7.1
   */
  const hasPermission = useCallback((
    permission: string,
    contextBranchId?: number
  ): boolean => {
    if (!permissions) return false;

    // Parse da string de permissão (formato: "module.action")
    const [module, action] = permission.split('.');

    if (!module || !action) {
      console.warn(`Invalid permission format: ${permission}. Expected "module.action"`);
      return false;
    }

    // Verificar permissão nas permissões efetivas
    const modulePermissions = permissions.effectivePermissions[module];
    if (!modulePermissions) return false;

    // Se é uma verificação específica de filial
    if (contextBranchId) {
      // Verificar se tem role específico para esta filial
      const branchRole = permissions.roles.find(role =>
        role.contextType === 'BRANCH' &&
        role.contextId === contextBranchId
      );

      if (branchRole) {
        const branchModulePermissions = branchRole.permissions[module];
        return branchModulePermissions?.[action] === true;
      }
    }

    // Verificar permissão geral
    return modulePermissions[action] === true;
  }, [permissions]);

  /**
   * Refresh - recarregar permissões
   */
  const refreshPermissions = useCallback(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Effect para carregar permissões iniciais
  useEffect(() => {
    if (companyId && userId) {
      loadPermissions();
    }
  }, [companyId, userId, branchId, loadPermissions]);

  // Retorna interface conforme documentação
  return {
    permissions,
    loading,
    hasPermission,
    refreshPermissions
  };
}

/**
 * Hook simplificado para verificação rápida de permissão
 * Conforme seção 7.1 da documentação
 */
export function useCompanyPermission(
  permission: string | string[],
  companyId?: number,
  branchId?: number
): boolean {
  // TODO: Integrar com contexto de autenticação quando disponível
  // Por ora, retorna true para desenvolvimento
  // const { user, company, permissions: userPermissions } = useAuth();

  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    // Lógica temporária para desenvolvimento
    // Em produção, deve verificar com as permissões reais do usuário
    if (typeof permission === 'string') {
      // Verificar permissão única
      setHasPermission(true); // Temporário para desenvolvimento
    } else if (Array.isArray(permission)) {
      // Verificar se tem pelo menos uma das permissões (OR lógico)
      setHasPermission(true); // Temporário para desenvolvimento
    }
  }, [permission, companyId, branchId]);

  return hasPermission;
}