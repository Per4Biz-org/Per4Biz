// ===============================================
// 📋 Reports Service
// Implementação dos endpoints de relatórios avançados
// Seção 4.4 - Endpoints de Dashboard e Relatórios
// ===============================================

import { supabase } from '../lib/supabase';
import {
  CompanyMetrics,
  DashboardPermissions,
  Role,
  UserRoleAssignment,
  ApiResponse,
  ApiError
} from '../types/company-roles';

// Interfaces específicas para relatórios
export interface PermissionUsageReport {
  permission: string;
  module: string;
  action: string;
  usageCount: number;
  affectedUsers: number;
  affectedRoles: number;
  percentage: number;
}

export interface RoleEffectivenessReport {
  roleId: number;
  roleName: string;
  assignmentCount: number;
  activeAssignments: number;
  averageUsageDays: number;
  lastUsed: string | null;
  effectiveness: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendations: string[];
}

export interface ComplianceReport {
  companyId: number;
  companyName: string;
  auditPeriod: {
    startDate: string;
    endDate: string;
  };
  totalUsers: number;
  usersWithRoles: number;
  usersWithoutRoles: number;
  temporaryRoles: number;
  expiredRoles: number;
  systemRolesModified: number;
  complianceScore: number;
  issues: Array<{
    type: 'WARNING' | 'ERROR' | 'INFO';
    description: string;
    affectedUsers: number;
    recommendation: string;
  }>;
}

export interface SecurityReport {
  privilegedUsers: Array<{
    userId: number;
    userName: string;
    roleCount: number;
    highRiskPermissions: string[];
    lastActivity: string;
  }>;
  orphanedRoles: Role[];
  overPermissionedUsers: Array<{
    userId: number;
    userName: string;
    unnecessaryPermissions: string[];
  }>;
  securityRecommendations: string[];
}

/**
 * Service para relatórios avançados do sistema
 * Implementa endpoints da seção 4.4 da documentação
 */
export class ReportsService {

  /**
   * Relatório de estatísticas de uso de roles
   * GET /api/company/{companyId}/stats/roles
   */
  async getRoleUsageStats(
    companyId: number
  ): Promise<ApiResponse<DashboardPermissions>> {
    try {
      // Buscar todos os roles da empresa
      const { data: roles, error: rolesError } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId);

      if (rolesError) {
        return {
          success: false,
          error: {
            code: 'FETCH_ROLES_FAILED',
            message: 'Erro ao buscar roles',
            details: rolesError
          }
        };
      }

      // Buscar todas as atribuições ativas
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          role:company_roles(name),
          user:profiles(name)
        `)
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (assignmentsError) {
        return {
          success: false,
          error: {
            code: 'FETCH_ASSIGNMENTS_FAILED',
            message: 'Erro ao buscar atribuições',
            details: assignmentsError
          }
        };
      }

      // Calcular distribuição de roles
      const roleDistribution: Record<string, number> = {};
      (assignments || []).forEach(assignment => {
        const roleName = assignment.role?.name || 'Desconhecido';
        roleDistribution[roleName] = (roleDistribution[roleName] || 0) + 1;
      });

      // Encontrar roles não utilizados
      const usedRoleIds = new Set((assignments || []).map(a => a.role_id));
      const unusedRoles = (roles || []).filter(role => !usedRoleIds.has(role.id));

      // Encontrar roles expirando
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiringRoles = (assignments || []).filter(assignment =>
        assignment.expires_at &&
        new Date(assignment.expires_at) <= nextWeek &&
        new Date(assignment.expires_at) > now
      );

      // Contar usuários únicos
      const uniqueUsers = new Set((assignments || []).map(a => a.user_id));

      return {
        success: true,
        data: {
          totalUsers: uniqueUsers.size,
          totalRoles: (roles || []).length,
          roleDistribution,
          unusedRoles: unusedRoles || [],
          expiringRoles: expiringRoles || []
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Erro ao calcular estatísticas',
          details: error
        }
      };
    }
  }

  /**
   * Relatório de uso de permissões
   * GET /api/company/{companyId}/reports/permission-usage
   */
  async getPermissionUsageReport(
    companyId: number
  ): Promise<ApiResponse<PermissionUsageReport[]>> {
    try {
      // Buscar todos os roles com suas permissões
      const { data: roles, error } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId);

      if (error) {
        return {
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Erro ao buscar roles',
            details: error
          }
        };
      }

      // Analisar uso de permissões
      const permissionUsage = new Map<string, {
        module: string;
        action: string;
        roleCount: number;
        roles: Set<number>;
      }>();

      (roles || []).forEach(role => {
        Object.entries(role.permissions || {}).forEach(([module, modulePermissions]) => {
          if (typeof modulePermissions === 'object') {
            Object.entries(modulePermissions).forEach(([action, enabled]) => {
              if (enabled) {
                const permissionKey = `${module}.${action}`;
                const existing = permissionUsage.get(permissionKey) || {
                  module,
                  action,
                  roleCount: 0,
                  roles: new Set()
                };
                existing.roleCount += 1;
                existing.roles.add(role.id);
                permissionUsage.set(permissionKey, existing);
              }
            });
          }
        });
      });

      // Buscar usuários afetados por cada permissão
      const permissionReports: PermissionUsageReport[] = [];

      for (const [permission, usage] of permissionUsage.entries()) {
        // Contar usuários com esta permissão
        const { count: userCount } = await supabase
          .from('user_role_assignments')
          .select('user_id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .in('role_id', Array.from(usage.roles))
          .eq('is_active', true);

        permissionReports.push({
          permission,
          module: usage.module,
          action: usage.action,
          usageCount: usage.roleCount,
          affectedUsers: userCount || 0,
          affectedRoles: usage.roles.size,
          percentage: ((usage.roleCount / (roles || []).length) * 100)
        });
      }

      // Ordenar por uso
      permissionReports.sort((a, b) => b.usageCount - a.usageCount);

      return {
        success: true,
        data: permissionReports
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_REPORT_ERROR',
          message: 'Erro ao gerar relatório de permissões',
          details: error
        }
      };
    }
  }

  /**
   * Relatório de efetividade de roles
   * GET /api/company/{companyId}/reports/role-effectiveness
   */
  async getRoleEffectivenessReport(
    companyId: number
  ): Promise<ApiResponse<RoleEffectivenessReport[]>> {
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId);

      if (rolesError) {
        return {
          success: false,
          error: {
            code: 'FETCH_ROLES_FAILED',
            message: 'Erro ao buscar roles',
            details: rolesError
          }
        };
      }

      const reports: RoleEffectivenessReport[] = [];

      for (const role of roles || []) {
        // Buscar estatísticas de atribuição
        const { data: assignments, count: totalAssignments } = await supabase
          .from('user_role_assignments')
          .select('*', { count: 'exact' })
          .eq('company_id', companyId)
          .eq('role_id', role.id);

        const { count: activeAssignments } = await supabase
          .from('user_role_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('role_id', role.id)
          .eq('is_active', true);

        // Calcular média de uso
        let averageUsageDays = 0;
        let lastUsed: string | null = null;

        if (assignments && assignments.length > 0) {
          const usageDays = assignments.map(assignment => {
            const start = new Date(assignment.assigned_at);
            const end = assignment.removed_at ? new Date(assignment.removed_at) : new Date();
            return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          });

          averageUsageDays = usageDays.reduce((sum, days) => sum + days, 0) / usageDays.length;

          // Última utilização
          const lastAssignment = assignments
            .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())[0];
          lastUsed = lastAssignment?.assigned_at || null;
        }

        // Determinar efetividade
        let effectiveness: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        const recommendations: string[] = [];

        if (activeAssignments && activeAssignments > 5) {
          effectiveness = 'HIGH';
        } else if (activeAssignments && activeAssignments > 1) {
          effectiveness = 'MEDIUM';
          recommendations.push('Considere expandir o uso deste role para mais funcionários');
        } else {
          effectiveness = 'LOW';
          if (totalAssignments === 0) {
            recommendations.push('Role nunca foi utilizado - considere remover ou revisar');
          } else {
            recommendations.push('Role com baixa utilização - verificar se ainda é necessário');
          }
        }

        if (averageUsageDays < 30) {
          recommendations.push('Atribuições muito curtas - verificar se o role está adequado');
        }

        reports.push({
          roleId: role.id,
          roleName: role.name,
          assignmentCount: totalAssignments || 0,
          activeAssignments: activeAssignments || 0,
          averageUsageDays,
          lastUsed,
          effectiveness,
          recommendations
        });
      }

      // Ordenar por efetividade
      const effectivenessOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      reports.sort((a, b) => effectivenessOrder[b.effectiveness] - effectivenessOrder[a.effectiveness]);

      return {
        success: true,
        data: reports
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EFFECTIVENESS_REPORT_ERROR',
          message: 'Erro ao gerar relatório de efetividade',
          details: error
        }
      };
    }
  }

  /**
   * Relatório de conformidade
   * GET /api/company/{companyId}/reports/compliance
   */
  async getComplianceReport(
    companyId: number,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<ComplianceReport>> {
    try {
      // Buscar informações da empresa
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      // Contar usuários totais
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true);

      // Contar usuários com roles
      const { count: usersWithRoles } = await supabase
        .from('user_role_assignments')
        .select('user_id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true);

      // Contar roles temporários
      const { count: temporaryRoles } = await supabase
        .from('user_role_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true)
        .not('expires_at', 'is', null);

      // Contar roles expirados
      const { count: expiredRoles } = await supabase
        .from('user_role_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .lt('expires_at', new Date().toISOString());

      // Verificar modificações em roles de sistema
      const { count: systemRolesModified } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('target_type', 'ROLE')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .ilike('details', '%system%');

      // Calcular score de conformidade
      const maxPoints = 100;
      let score = maxPoints;

      const issues: ComplianceReport['issues'] = [];

      // Penalizar usuários sem roles
      const usersWithoutRoles = (totalUsers || 0) - (usersWithRoles || 0);
      if (usersWithoutRoles > 0) {
        score -= Math.min(20, usersWithoutRoles * 2);
        issues.push({
          type: 'WARNING',
          description: `${usersWithoutRoles} usuários sem papéis atribuídos`,
          affectedUsers: usersWithoutRoles,
          recommendation: 'Atribuir papéis apropriados para todos os usuários ativos'
        });
      }

      // Penalizar roles expirados
      if ((expiredRoles || 0) > 0) {
        score -= Math.min(15, (expiredRoles || 0) * 3);
        issues.push({
          type: 'ERROR',
          description: `${expiredRoles} papéis expirados ainda ativos`,
          affectedUsers: expiredRoles || 0,
          recommendation: 'Remover ou renovar papéis expirados imediatamente'
        });
      }

      // Penalizar modificações em roles de sistema
      if ((systemRolesModified || 0) > 0) {
        score -= Math.min(25, (systemRolesModified || 0) * 5);
        issues.push({
          type: 'ERROR',
          description: `${systemRolesModified} modificações em papéis de sistema`,
          affectedUsers: 0,
          recommendation: 'Revisar e validar modificações em papéis de sistema'
        });
      }

      // Informação sobre roles temporários
      if ((temporaryRoles || 0) > 0) {
        issues.push({
          type: 'INFO',
          description: `${temporaryRoles} papéis temporários ativos`,
          affectedUsers: temporaryRoles || 0,
          recommendation: 'Monitorar papéis temporários regularmente'
        });
      }

      const report: ComplianceReport = {
        companyId,
        companyName: company?.name || 'Empresa Desconhecida',
        auditPeriod: { startDate, endDate },
        totalUsers: totalUsers || 0,
        usersWithRoles: usersWithRoles || 0,
        usersWithoutRoles,
        temporaryRoles: temporaryRoles || 0,
        expiredRoles: expiredRoles || 0,
        systemRolesModified: systemRolesModified || 0,
        complianceScore: Math.max(0, score),
        issues
      };

      return {
        success: true,
        data: report
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPLIANCE_REPORT_ERROR',
          message: 'Erro ao gerar relatório de conformidade',
          details: error
        }
      };
    }
  }

  /**
   * Exportar relatório por filial
   * GET /api/company/{companyId}/reports/permissions-by-branch
   */
  async getPermissionsByBranchReport(
    companyId: number,
    format: 'JSON' | 'CSV' | 'EXCEL' = 'JSON'
  ): Promise<ApiResponse<any>> {
    try {
      // Buscar filiais
      const { data: branches } = await supabase
        .from('branches')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      const branchReports = [];

      for (const branch of branches || []) {
        // Buscar roles da filial
        const { data: branchRoles } = await supabase
          .from('company_roles')
          .select('*')
          .eq('company_id', companyId)
          .or(`context_type.eq.BRANCH,branch_id.eq.${branch.id}`);

        // Buscar usuários da filial
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', branch.id)
          .eq('is_active', true);

        // Calcular permissões únicas
        const uniquePermissions = new Set<string>();
        (branchRoles || []).forEach(role => {
          Object.entries(role.permissions || {}).forEach(([module, modulePermissions]) => {
            if (typeof modulePermissions === 'object') {
              Object.entries(modulePermissions).forEach(([action, enabled]) => {
                if (enabled) {
                  uniquePermissions.add(`${module}.${action}`);
                }
              });
            }
          });
        });

        branchReports.push({
          branchId: branch.id,
          branchName: branch.name,
          branchCity: branch.city,
          userCount: userCount || 0,
          roleCount: (branchRoles || []).length,
          uniquePermissions: Array.from(uniquePermissions),
          permissionCount: uniquePermissions.size
        });
      }

      if (format === 'CSV') {
        // Converter para CSV
        const headers = ['Filial', 'Cidade', 'Usuários', 'Papéis', 'Permissões Únicas'];
        const csvContent = [
          headers.join(','),
          ...branchReports.map(report => [
            `"${report.branchName}"`,
            `"${report.branchCity}"`,
            report.userCount,
            report.roleCount,
            report.permissionCount
          ].join(','))
        ].join('\n');

        return {
          success: true,
          data: csvContent
        };
      }

      return {
        success: true,
        data: branchReports
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BRANCH_REPORT_ERROR',
          message: 'Erro ao gerar relatório por filial',
          details: error
        }
      };
    }
  }
}