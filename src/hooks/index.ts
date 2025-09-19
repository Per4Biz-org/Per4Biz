// ===============================================
// 📋 Company Roles Hooks Export
// Índice de exportação de todos os hooks do sistema de roles
// ===============================================

// Hooks principais
export { useCompanyRoles } from './useCompanyRoles';
export { useCompanyPermissions, useCompanyPermission } from './useCompanyPermissions';
export { useEmployeeRoles } from './useEmployeeRoles';

// Hooks de auditoria
export { useAuditLogs, useAuditStats } from './useAuditLogs';

// Hooks de gestão de filiais
export { useBranchManagement, useBranchDetails, useBranchComparison } from './useBranchManagement';

// Re-exportar componentes para conveniência
export * from '../components/company-roles';

// Hooks específicos para desenvolvimento
export { useMockCompanyRoles } from './useMockCompanyRoles';
export { useMockEmployeeRoles } from './useMockEmployeeRoles';
export { usePermissionGuard } from './usePermissionGuard';

// Context hooks
export {
  useCompanyRoleContext,
  usePermission,
  useCompanyRoleState,
  useCompanyRoleActions
} from '../context/CompanyRolesContext';