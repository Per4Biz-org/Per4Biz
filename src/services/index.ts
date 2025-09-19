// ===============================================
// 📋 Company Roles Services Export
// Índice de exportação de todos os serviços do sistema de roles
// ===============================================

// Serviços principais
export { CompanyRoleService } from './CompanyRoleService';
export { EmployeeRoleService } from './EmployeeRoleService';

// Serviços de auditoria e relatórios
export { AuditService } from './AuditService';
export { ReportsService } from './ReportsService';

// Serviços de gestão de filiais
export { BranchService } from './BranchService';
export type { Branch, BranchStats, BranchUser } from './BranchService';

// Context e utilidades
export { CompanyRolesContextProvider, useCompanyRoleContext } from '../context/CompanyRolesContext';

// Tipos de relatórios
export type {
  PermissionUsageReport,
  RoleEffectivenessReport,
  ComplianceReport,
  SecurityReport
} from './ReportsService';