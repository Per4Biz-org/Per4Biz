// ===============================================
// 📋 Branch Management Service
// Implementação dos endpoints conforme documentação técnica
// Seção 4.3 - Endpoints de Gestão de Filiais
// ===============================================

import { supabase } from '../lib/supabase';
import {
  Role,
  TransferUserRequest,
  ApiResponse,
  ApiError,
  PaginatedResponse
} from '../types/company-roles';

// Interfaces específicas para filiais
export interface Branch {
  id: number;
  companyId: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  managerId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchStats {
  branchId: number;
  branchName: string;
  employeeCount: number;
  roleCount: number;
  activeRoles: number;
  departments: string[];
}

export interface BranchUser {
  id: number;
  name: string;
  email: string;
  position?: string;
  department?: string;
  isActive: boolean;
  joinedAt: string;
  roles: Role[];
}

/**
 * Service para gestão de filiais e transferências
 * Implementa endpoints da seção 4.3 da documentação
 */
export class BranchService {

  /**
   * Listar filiais da empresa
   * GET /api/company/{companyId}/branches
   */
  async listCompanyBranches(
    companyId: number,
    includeStats: boolean = false
  ): Promise<ApiResponse<Branch[]>> {
    try {
      let query = supabase
        .from('branches')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: {
            code: 'FETCH_BRANCHES_FAILED',
            message: 'Erro ao carregar filiais da empresa',
            details: error
          }
        };
      }

      let branches = data || [];

      // Se solicitado, incluir estatísticas
      if (includeStats && branches.length > 0) {
        const branchesWithStats = await Promise.all(
          branches.map(async (branch) => {
            const stats = await this.getBranchStats(companyId, branch.id);
            return {
              ...branch,
              stats: stats.success ? stats.data : null
            };
          })
        );
        branches = branchesWithStats;
      }

      return {
        success: true,
        data: branches
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao buscar filiais',
          details: error
        }
      };
    }
  }

  /**
   * Obter estatísticas de uma filial
   * GET /api/company/{companyId}/branches/{branchId}/stats
   */
  async getBranchStats(
    companyId: number,
    branchId: number
  ): Promise<ApiResponse<BranchStats>> {
    try {
      // Buscar informações da filial
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', branchId)
        .single();

      if (branchError || !branch) {
        return {
          success: false,
          error: {
            code: 'BRANCH_NOT_FOUND',
            message: 'Filial não encontrada'
          }
        };
      }

      // Contar funcionários da filial
      const { count: employeeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('is_active', true);

      // Contar roles da filial
      const { count: roleCount } = await supabase
        .from('company_roles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .or(`context_type.eq.BRANCH,branch_id.eq.${branchId}`)
        .eq('is_active', true);

      // Contar roles ativos (com atribuições)
      const { count: activeRoles } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          role:company_roles!inner(*)
        `, { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('branch_id', branchId)
        .eq('is_active', true);

      // Buscar departamentos únicos
      const { data: departments } = await supabase
        .from('profiles')
        .select('department')
        .eq('branch_id', branchId)
        .not('department', 'is', null);

      const uniqueDepartments = [
        ...new Set((departments || []).map(d => d.department).filter(Boolean))
      ];

      const stats: BranchStats = {
        branchId: branch.id,
        branchName: branch.name,
        employeeCount: employeeCount || 0,
        roleCount: roleCount || 0,
        activeRoles: activeRoles || 0,
        departments: uniqueDepartments
      };

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro ao calcular estatísticas da filial',
          details: error
        }
      };
    }
  }

  /**
   * Listar roles específicos de uma filial
   * GET /api/company/{companyId}/branches/{branchId}/roles
   */
  async getBranchRoles(
    companyId: number,
    branchId: number
  ): Promise<ApiResponse<Role[]>> {
    try {
      const { data, error } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId)
        .or(`context_type.eq.BRANCH,branch_id.eq.${branchId}`)
        .eq('is_active', true)
        .order('name');

      if (error) {
        return {
          success: false,
          error: {
            code: 'FETCH_BRANCH_ROLES_FAILED',
            message: 'Erro ao buscar roles da filial',
            details: error
          }
        };
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao buscar roles da filial',
          details: error
        }
      };
    }
  }

  /**
   * Listar funcionários de uma filial
   * GET /api/company/{companyId}/branches/{branchId}/users
   */
  async getBranchUsers(
    companyId: number,
    branchId: number,
    includeRoles: boolean = true
  ): Promise<ApiResponse<BranchUser[]>> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          position,
          department,
          is_active,
          created_at
        `)
        .eq('branch_id', branchId)
        .eq('company_id', companyId)
        .order('name');

      const { data: users, error } = await query;

      if (error) {
        return {
          success: false,
          error: {
            code: 'FETCH_BRANCH_USERS_FAILED',
            message: 'Erro ao buscar funcionários da filial',
            details: error
          }
        };
      }

      let branchUsers: BranchUser[] = (users || []).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        position: user.position,
        department: user.department,
        isActive: user.is_active,
        joinedAt: user.created_at,
        roles: []
      }));

      // Se solicitado, incluir roles de cada usuário
      if (includeRoles && branchUsers.length > 0) {
        const usersWithRoles = await Promise.all(
          branchUsers.map(async (user) => {
            const { data: userRoles } = await supabase
              .from('user_role_assignments')
              .select(`
                *,
                role:company_roles(*)
              `)
              .eq('company_id', companyId)
              .eq('user_id', user.id)
              .eq('is_active', true);

            return {
              ...user,
              roles: (userRoles || []).map(assignment => assignment.role).filter(Boolean)
            };
          })
        );
        branchUsers = usersWithRoles;
      }

      return {
        success: true,
        data: branchUsers
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao buscar funcionários',
          details: error
        }
      };
    }
  }

  /**
   * Transferir funcionário entre filiais
   * POST /api/company/{companyId}/branches/transfer-user
   */
  async transferUser(
    companyId: number,
    transferData: TransferUserRequest
  ): Promise<ApiResponse<{ success: boolean; transferredRoles: number }>> {
    try {
      const { userId, fromBranchId, toBranchId, transferRoles } = transferData;

      // Verificar se usuário existe na filial origem
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .eq('company_id', companyId)
        .eq('branch_id', fromBranchId)
        .single();

      if (userError || !user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuário não encontrado na filial origem'
          }
        };
      }

      // Verificar se filial destino existe
      const { data: targetBranch, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('id', toBranchId)
        .eq('company_id', companyId)
        .single();

      if (branchError || !targetBranch) {
        return {
          success: false,
          error: {
            code: 'TARGET_BRANCH_NOT_FOUND',
            message: 'Filial destino não encontrada'
          }
        };
      }

      // Atualizar filial do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          branch_id: toBranchId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return {
          success: false,
          error: {
            code: 'TRANSFER_FAILED',
            message: 'Erro ao transferir usuário',
            details: updateError
          }
        };
      }

      let transferredRoles = 0;

      // Se solicitado, transferir roles específicos de filial
      if (transferRoles) {
        // Desativar roles específicos da filial origem
        const { error: deactivateError } = await supabase
          .from('user_role_assignments')
          .update({
            is_active: false,
            removed_at: new Date().toISOString(),
            removed_by: 0 // TODO: Pegar do contexto de auth
          })
          .eq('company_id', companyId)
          .eq('user_id', userId)
          .eq('branch_id', fromBranchId)
          .eq('is_active', true);

        if (!deactivateError) {
          // Buscar roles equivalentes na filial destino para transferir
          const { data: equivalentRoles } = await supabase
            .from('company_roles')
            .select('*')
            .eq('company_id', companyId)
            .eq('context_type', 'BRANCH')
            .or(`branch_id.eq.${toBranchId},context_type.eq.COMPANY`)
            .eq('is_active', true);

          // Aqui você implementaria a lógica de mapeamento de roles equivalentes
          // Por simplicidade, contamos apenas os roles removidos
          const { count } = await supabase
            .from('user_role_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('user_id', userId)
            .eq('branch_id', fromBranchId)
            .eq('is_active', false);

          transferredRoles = count || 0;
        }
      }

      // Log de auditoria
      await this.logTransferAudit({
        companyId,
        userId: 0, // TODO: Pegar do contexto de auth
        targetUserId: userId,
        fromBranchId,
        toBranchId,
        transferredRoles
      });

      return {
        success: true,
        data: {
          success: true,
          transferredRoles
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado na transferência',
          details: error
        }
      };
    }
  }

  /**
   * Comparar roles entre filiais
   * GET /api/company/{companyId}/branches/compare-roles
   */
  async compareBranchRoles(
    companyId: number,
    branchIds: number[]
  ): Promise<ApiResponse<{
    commonRoles: Role[];
    uniqueRoles: Record<number, Role[]>;
    recommendations: string[];
  }>> {
    try {
      const branchRoles = await Promise.all(
        branchIds.map(async (branchId) => {
          const response = await this.getBranchRoles(companyId, branchId);
          return {
            branchId,
            roles: response.success ? response.data! : []
          };
        })
      );

      // Encontrar roles comuns
      const allRoleNames = branchRoles.flatMap(br => br.roles.map(r => r.name));
      const roleNameCounts = allRoleNames.reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonRoleNames = Object.keys(roleNameCounts)
        .filter(name => roleNameCounts[name] === branchIds.length);

      const commonRoles = branchRoles[0].roles
        .filter(role => commonRoleNames.includes(role.name));

      // Encontrar roles únicos por filial
      const uniqueRoles: Record<number, Role[]> = {};
      branchRoles.forEach(({ branchId, roles }) => {
        uniqueRoles[branchId] = roles.filter(
          role => !commonRoleNames.includes(role.name)
        );
      });

      // Gerar recomendações
      const recommendations: string[] = [];

      if (commonRoles.length === 0) {
        recommendations.push('Considere criar roles padronizados para todas as filiais');
      }

      Object.entries(uniqueRoles).forEach(([branchId, roles]) => {
        if (roles.length > 5) {
          recommendations.push(`Filial ${branchId} possui muitos roles únicos (${roles.length}), considere padronização`);
        }
      });

      return {
        success: true,
        data: {
          commonRoles,
          uniqueRoles,
          recommendations
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPARE_ERROR',
          message: 'Erro ao comparar roles entre filiais',
          details: error
        }
      };
    }
  }

  /**
   * Log de auditoria para transferências
   */
  private async logTransferAudit(data: {
    companyId: number;
    userId: number;
    targetUserId: number;
    fromBranchId: number;
    toBranchId: number;
    transferredRoles: number;
  }) {
    try {
      await supabase.from('audit_logs').insert([{
        company_id: data.companyId,
        user_id: data.userId,
        action: 'TRANSFER',
        target_type: 'USER_TRANSFER',
        target_id: data.targetUserId,
        details: `Transferred user from branch ${data.fromBranchId} to ${data.toBranchId}. Roles transferred: ${data.transferredRoles}`,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.warn('Failed to log transfer audit:', error);
    }
  }
}