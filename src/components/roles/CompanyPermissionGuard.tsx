// ===============================================
// 📋 Company Permission Guard Component
// Implementação conforme documentação técnica seção 6.3
// Componente para controle de acesso baseado em permissões
// ===============================================

import React from 'react';
import { useCompanyPermissions } from '../../hooks/useCompanyPermissions';

interface CompanyPermissionGuardProps {
  permission: string | string[];
  companyId: number;
  userId: number;
  branchId?: number;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  requireAll?: boolean;
}

/**
 * Guard component para controle de acesso baseado em permissões
 * Implementa lógica conforme documentação seção 6.3
 */
export function CompanyPermissionGuard({
  permission,
  companyId,
  userId,
  branchId,
  fallback = null,
  children,
  requireAll = false
}: CompanyPermissionGuardProps) {
  const { permissions, loading, hasPermission } = useCompanyPermissions(
    companyId,
    userId,
    branchId
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!permissions) {
    return <>{fallback}</>;
  }

  const checkPermissions = (): boolean => {
    if (typeof permission === 'string') {
      return hasPermission(permission, branchId);
    }

    if (Array.isArray(permission)) {
      if (requireAll) {
        // Todas as permissões devem estar presentes (AND lógico)
        return permission.every(perm => hasPermission(perm, branchId));
      } else {
        // Pelo menos uma permissão deve estar presente (OR lógico)
        return permission.some(perm => hasPermission(perm, branchId));
      }
    }

    return false;
  };

  const hasAccess = checkPermissions();

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook simplificado para verificação de permissão em componentes
 */
export function usePermissionCheck(
  permission: string | string[],
  companyId?: number,
  branchId?: number
): boolean {
  // TODO: Integrar com contexto de autenticação quando disponível
  // Por ora, usando valores hardcoded para desenvolvimento
  const { hasPermission } = useCompanyPermissions(
    companyId || 1, // Valor temporário
    1, // userId temporário
    branchId
  );

  if (typeof permission === 'string') {
    return hasPermission(permission, branchId);
  }

  if (Array.isArray(permission)) {
    return permission.some(perm => hasPermission(perm, branchId));
  }

  return false;
}