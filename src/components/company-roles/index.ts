// ===============================================
// 📋 Company Roles Components Export
// Índice de exportação de todos os componentes do sistema de roles
// ===============================================

// Componentes principais
export { default as CompanyPermissionGuard, usePermissionGuardHelper, withPermissionGuard } from './CompanyPermissionGuard';
export { default as RoleCard, RoleCardCompact, RoleCardGrid } from './RoleCard';
export { default as PermissionMatrix, PermissionMatrixCompact, PermissionViewer } from './PermissionMatrix';
export { default as RoleListingInterface } from './RoleListingInterface';
export { default as RoleModal } from './RoleModal';
export { default as EmployeeRoleAssignment } from './EmployeeRoleAssignment';

// Tipos relacionados aos componentes
export type {
  // Props dos componentes principais
  CompanyPermissionGuardProps,
  RoleCardProps,
  PermissionMatrixProps,
  RoleListingInterfaceProps,
  RoleModalProps,
  EmployeeRoleAssignmentProps
} from './types';

// Re-exportar tipos do sistema de roles para conveniência
export type {
  Role,
  UserRoleAssignment,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
  ModulePermissions,
  ContextType,
  RoleQueryParams,
  PaginatedResponse,
  ApiResponse,
  ApiError,
  Branch,
  BranchStats,
  BranchUser,
  TransferUserRequest,
  PermissionUsageReport,
  RoleEffectivenessReport,
  ComplianceReport,
  SecurityReport
} from '../../types/company-roles';