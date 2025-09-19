// ===============================================
// 📋 Company Roles Components Types
// Tipos TypeScript para componentes do sistema de roles
// ===============================================

import { Role, UserRoleAssignment, CreateRoleRequest, UpdateRoleRequest, AssignRoleRequest, ModulePermissions, ContextType } from '../../types/company-roles';

// CompanyPermissionGuard Props
export interface CompanyPermissionGuardProps {
  children: React.ReactNode;
  companyId: number;
  contextType: ContextType;
  contextId: number;
  requiredPermissions: Partial<ModulePermissions>;
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

// RoleCard Props
export interface RoleCardProps {
  role: Role;
  onEdit?: (role: Role) => void;
  onDelete?: (roleId: number) => void;
  onView?: (role: Role) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

// PermissionMatrix Props
export interface PermissionMatrixProps {
  permissions: ModulePermissions;
  onChange?: (permissions: ModulePermissions) => void;
  readOnly?: boolean;
  compact?: boolean;
  showModuleHeaders?: boolean;
  highlightChanges?: boolean;
  className?: string;
}

// RoleListingInterface Props
export interface RoleListingInterfaceProps {
  companyId: number;
  onCreateRole?: () => void;
  onEditRole?: (role: Role) => void;
  onViewRole?: (role: Role) => void;
  onDeleteRole?: (roleId: number) => void;
  className?: string;
}

// RoleModal Props
export interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  role?: Role | null;
  companyId: number;
  loading?: boolean;
}

// EmployeeRoleAssignment Props
export interface EmployeeRoleAssignmentProps {
  companyId: number;
  employeeId: number;
  employeeName?: string;
  onAssignmentChange?: () => void;
  className?: string;
}