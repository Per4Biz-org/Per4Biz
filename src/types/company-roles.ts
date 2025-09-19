// ===============================================
// 📋 Company Roles & Permissions System Types
// Seguindo rigorosamente a documentação técnica senior
// Compatível com sistema existente Per4Biz
// ===============================================

// ===== ENUMS =====
export enum ContextType {
  COMPANY = 'COMPANY',
  BRANCH = 'BRANCH'
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ASSIGN = 'ASSIGN',
  REMOVE = 'REMOVE'
}

// ===== PERMISSION STRUCTURES =====
export interface PermissionSet {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
  [key: string]: boolean | undefined;
}

export interface ModulePermissions {
  users?: PermissionSet;
  roles?: PermissionSet;
  branches?: PermissionSet;
  reports?: {
    view?: boolean;
    export?: boolean;
    create?: boolean;
  };
  settings?: {
    company?: boolean;
    billing?: boolean;
    integrations?: boolean;
  };
  sales?: PermissionSet & {
    approve?: boolean;
    viewAllTeams?: boolean;
  };
  finance?: PermissionSet;
  inventory?: PermissionSet;
  [module: string]: any;
}

// ===== CORE DTOs (conforme documentação) =====

/**
 * 2.1 Role DTO - Estrutura principal de um papel empresarial
 */
export interface Role {
  id: number;
  applicationId: number;
  contextType: ContextType;
  contextId: number;
  name: string;
  description: string;
  permissions: ModulePermissions;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 2.2 UserRole Assignment DTO
 */
export interface UserRoleAssignment {
  id: number;
  userId: number;
  roleId: number;
  contextType: ContextType;
  contextId: number;
  companyId: number;
  branchId?: number | null;
  assignedBy: number;
  assignedByName: string;
  assignedAt: string;
  isActive: boolean;
  expiresAt?: string | null;
}

/**
 * 2.3 Create Role Request DTO
 */
export interface CreateRoleRequest {
  applicationId: number;
  contextType: ContextType;
  contextId: number;
  name: string;
  description: string;
  permissions: ModulePermissions;
}

/**
 * 2.4 Assign Role Request DTO
 */
export interface AssignRoleRequest {
  userId: number;
  roleId: number;
  contextType: ContextType;
  contextId: number;
  branchId?: number | null;
  expiresAt?: string | null;
  justification?: string;
}

/**
 * 2.5 Update Role Request DTO
 */
export interface UpdateRoleRequest {
  name: string;
  description: string;
  permissions: ModulePermissions;
}

/**
 * 2.6 Company User Permissions Response DTO
 */
export interface CompanyUserPermissions {
  userId: number;
  userName: string;
  companyId: number;
  companyName: string;
  effectivePermissions: ModulePermissions;
  roles: {
    roleId: number;
    roleName: string;
    contextType: ContextType;
    contextId: number;
    contextName: string;
    permissions: ModulePermissions;
  }[];
}

// ===== ENTITIES =====
export interface Company {
  id: number;
  name: string;
  domain?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Branch {
  id: number;
  companyId: number;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface Employee {
  id: number;
  companyId: number;
  branchId?: number;
  name: string;
  email: string;
  isActive: boolean;
  joinedAt: string;
}

// ===== HOOK RETURN TYPES =====
export interface UseCompanyPermissionsReturn {
  permissions: CompanyUserPermissions | null;
  loading: boolean;
  hasPermission: (permission: string, contextBranchId?: number) => boolean;
  refreshPermissions: () => void;
}

export interface UseCompanyRolesReturn {
  roles: Role[];
  loading: boolean;
  error: ApiError | null;
  pagination: PaginatedResponse<Role>['pagination'] | null;
  createRole: (data: CreateRoleRequest) => Promise<Role | null>;
  updateRole: (roleId: number, data: UpdateRoleRequest) => Promise<Role | null>;
  deleteRole: (roleId: number) => Promise<boolean>;
  refetch: () => void;
}

// ===== QUERY PARAMS =====
export interface RoleQueryParams {
  contextType?: ContextType;
  branchId?: number;
  page?: number;
  size?: number;
  search?: string;
  active?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

// ===== AUDIT & METRICS =====
export interface AuditLogEntry {
  id: number;
  companyId: number;
  branchId?: number;
  userId: number;
  userName: string;
  action: AuditAction;
  targetType: 'ROLE' | 'USER_ROLE';
  targetId: number;
  details: string;
  timestamp: string;
}

export interface CompanyMetrics {
  totalEmployees: number;
  activeRoles: number;
  rolesPerEmployee: number;
  branchDistribution: {
    branchId: number;
    branchName: string;
    employeeCount: number;
    roleCount: number;
  }[];
  roleGrowth: {
    period: string;
    created: number;
    deleted: number;
    modified: number;
  }[];
  expiringRoles: UserRoleAssignment[];
  unusedRoles: Role[];
  employeesWithoutRoles: Employee[];
}

export interface DashboardPermissions {
  totalUsers: number;
  totalRoles: number;
  roleDistribution: Record<string, number>;
  unusedRoles: Role[];
  expiringRoles: UserRoleAssignment[];
}

// ===== CLONE & TRANSFER =====
export interface CloneRoleRequest {
  name: string;
  contextType?: ContextType;
  branchId?: number;
}

export interface TransferUserRequest {
  userId: number;
  fromBranchId: number;
  toBranchId: number;
  transferRoles: boolean;
}

// ===== AUDIT QUERY PARAMS =====
export interface AuditQueryParams {
  startDate?: string;
  endDate?: string;
  userId?: number;
  roleId?: number;
  action?: AuditAction;
  targetType?: 'ROLE' | 'USER_ROLE';
  branchId?: number;
  page?: number;
  size?: number;
}

// ===== API RESPONSES =====
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}