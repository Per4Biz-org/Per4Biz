// ===============================================
// 🛡️ CompanyPermissionGuard Component
// Controle de acesso baseado em permissões da empresa
// Implementa seção 6.1 da documentação técnica
// ===============================================

import React from 'react';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { ModulePermissions, ContextType } from '../../types/company-roles';

interface CompanyPermissionGuardProps {
  children: React.ReactNode;
  companyId: number;
  contextType: ContextType;
  contextId: number;
  requiredPermissions: Partial<ModulePermissions>;
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

/**
 * Componente de proteção baseado em permissões
 * Renderiza children apenas se o usuário tiver as permissões necessárias
 */
export const CompanyPermissionGuard: React.FC<CompanyPermissionGuardProps> = ({
  children,
  companyId,
  contextType,
  contextId,
  requiredPermissions,
  requireAll = true,
  fallback = null,
  showLoading = true
}) => {
  const { hasPermissions, loading, error } = usePermissionGuard(
    companyId,
    contextType,
    contextId
  );

  // Mostrar loading se solicitado
  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se houver erro, não mostrar conteúdo protegido
  if (error) {
    return fallback ? <>{fallback}</> : null;
  }

  // Verificar permissões
  const hasAccess = hasPermissions(requiredPermissions, requireAll);

  // Renderizar children se tiver acesso, senão renderizar fallback
  return hasAccess ? <>{children}</> : (fallback ? <>{fallback}</> : null);
};

/**
 * Hook auxiliar para usar o guard de forma mais simples
 */
export const usePermissionGuardHelper = (
  companyId: number,
  contextType: ContextType,
  contextId: number,
  requiredPermissions: Partial<ModulePermissions>,
  requireAll: boolean = true
) => {
  const { hasPermissions, loading, error } = usePermissionGuard(
    companyId,
    contextType,
    contextId
  );

  return {
    hasAccess: hasPermissions(requiredPermissions, requireAll),
    loading,
    error
  };
};

/**
 * Higher-Order Component para proteção de rotas
 */
export const withPermissionGuard = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  guardProps: Omit<CompanyPermissionGuardProps, 'children'>
) => {
  return (props: P) => (
    <CompanyPermissionGuard {...guardProps}>
      <WrappedComponent {...props} />
    </CompanyPermissionGuard>
  );
};

export default CompanyPermissionGuard;