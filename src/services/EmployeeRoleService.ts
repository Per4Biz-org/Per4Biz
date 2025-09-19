// ===============================================
// 📋 Employee Role Service
// Implementação dos endpoints conforme documentação técnica
// 4.2 Endpoints de Atribuição de Roles
// ===============================================

import { supabase } from '../lib/supabase';
import {
  UserRoleAssignment,
  AssignRoleRequest,
  CompanyUserPermissions,
  ApiResponse,
  ApiError
} from '../types/company-roles';

/**
 * Service para atribuição de roles aos funcionários
 * Implementa todos os endpoints da seção 4.2 da documentação
 */
export class EmployeeRoleService {

  /**
   * Listar roles de um funcionário
   * GET /api/company/{companyId}/users/{userId}/roles
   */
  async getEmployeeRoles(
    companyId: number,
    userId: number
  ): Promise<ApiResponse<UserRoleAssignment[]>> {
    try {
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          role:company_roles(*),
          assigned_by_user:profiles!assigned_by(name)
        `)
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: {
            code: 'FETCH_USER_ROLES_FAILED',
            message: 'Erro ao carregar papéis do funcionário',
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
          message: 'Erro inesperado ao buscar roles do funcionário',
          details: error
        }
      };
    }
  }

  /**
   * Atribuir role a funcionário
   * POST /api/company/{companyId}/users/{userId}/roles
   */
  async assignRoleToEmployee(
    companyId: number,
    userId: number,
    data: AssignRoleRequest
  ): Promise<ApiResponse<UserRoleAssignment>> {
    try {
      // Validar se o role existe e pertence à empresa
      const { data: role, error: roleError } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', data.roleId)
        .single();

      if (roleError || !role) {
        return {
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role não encontrado nesta empresa'
          }
        };
      }

      // Verificar se funcionário já possui este role ativo
      const { data: existingAssignment } = await supabase
        .from('user_role_assignments')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('role_id', data.roleId)
        .eq('is_active', true)
        .single();

      if (existingAssignment) {
        return {
          success: false,
          error: {
            code: 'ROLE_ALREADY_ASSIGNED',
            message: 'Este papel já está atribuído ao funcionário'
          }
        };
      }

      // Verificar limite máximo de roles por funcionário (conforme regras de negócio)
      const { count: currentRolesCount } = await supabase
        .from('user_role_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('is_active', true);

      const MAX_ROLES_PER_EMPLOYEE = 5; // Conforme documentação seção 10.2
      if (currentRolesCount && currentRolesCount >= MAX_ROLES_PER_EMPLOYEE) {
        return {
          success: false,
          error: {
            code: 'MAX_ROLES_EXCEEDED',
            message: 'Funcionário já possui o máximo de papéis permitidos'
          }
        };
      }

      // Validar justificativa para roles temporários
      if (data.expiresAt && !data.justification) {
        return {
          success: false,
          error: {
            code: 'JUSTIFICATION_REQUIRED',
            message: 'Justificativa é obrigatória para papéis temporários'
          }
        };
      }

      const assignmentData = {
        user_id: userId,
        role_id: data.roleId,
        context_type: data.contextType,
        context_id: data.contextId,
        company_id: companyId,
        branch_id: data.branchId,
        assigned_by: 0, // TODO: Pegar do contexto de auth
        assigned_by_name: 'System', // TODO: Pegar nome do contexto de auth
        assigned_at: new Date().toISOString(),
        is_active: true,
        expires_at: data.expiresAt,
        justification: data.justification
      };

      const { data: newAssignment, error } = await supabase
        .from('user_role_assignments')
        .insert([assignmentData])
        .select('*')
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'ASSIGN_ROLE_FAILED',
            message: 'Erro ao atribuir papel',
            details: error
          }
        };
      }

      // Log de auditoria
      await this.logAudit({
        companyId,
        userId: 0, // TODO: Pegar do contexto de auth
        action: 'ASSIGN',
        targetType: 'USER_ROLE',
        targetId: newAssignment.id,
        details: `Assigned role ${role.name} to user ${userId}`
      });

      return {
        success: true,
        data: newAssignment
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao atribuir role',
          details: error
        }
      };
    }
  }

  /**
   * Remover role de funcionário
   * DELETE /api/company/{companyId}/users/{userId}/roles/{userRoleId}
   */
  async removeEmployeeRole(
    companyId: number,
    userId: number,
    userRoleId: number
  ): Promise<ApiResponse<void>> {
    try {
      // Verificar se assignment existe e pertence ao funcionário/empresa
      const { data: assignment, error: fetchError } = await supabase
        .from('user_role_assignments')
        .select('*, role:company_roles(*)')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('id', userRoleId)
        .single();

      if (fetchError || !assignment) {
        return {
          success: false,
          error: {
            code: 'ASSIGNMENT_NOT_FOUND',
            message: 'Atribuição de papel não encontrada'
          }
        };
      }

      // Desativar assignment ao invés de deletar (para auditoria)
      const { error } = await supabase
        .from('user_role_assignments')
        .update({
          is_active: false,
          removed_at: new Date().toISOString(),
          removed_by: 0 // TODO: Pegar do contexto de auth
        })
        .eq('id', userRoleId);

      if (error) {
        return {
          success: false,
          error: {
            code: 'REMOVE_ROLE_FAILED',
            message: 'Erro ao remover papel',
            details: error
          }
        };
      }

      // Log de auditoria
      await this.logAudit({
        companyId,
        userId: 0, // TODO: Pegar do contexto de auth
        action: 'REMOVE',
        targetType: 'USER_ROLE',
        targetId: userRoleId,
        details: `Removed role ${assignment.role?.name} from user ${userId}`
      });

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao remover role',
          details: error
        }
      };
    }
  }

  /**
   * Atualizar atribuição de role
   * PUT /api/company/{companyId}/users/{userId}/roles/{userRoleId}
   */
  async updateEmployeeRoleAssignment(
    companyId: number,
    userId: number,
    userRoleId: number,
    updateData: {
      isActive: boolean;
      expiresAt?: string | null;
      branchId?: number;
    }
  ): Promise<ApiResponse<UserRoleAssignment>> {
    try {
      // Verificar se assignment existe
      const { data: existing } = await supabase
        .from('user_role_assignments')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('id', userRoleId)
        .single();

      if (!existing) {
        return {
          success: false,
          error: {
            code: 'ASSIGNMENT_NOT_FOUND',
            message: 'Atribuição não encontrada'
          }
        };
      }

      const { data: updated, error } = await supabase
        .from('user_role_assignments')
        .update({
          is_active: updateData.isActive,
          expires_at: updateData.expiresAt,
          branch_id: updateData.branchId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userRoleId)
        .select('*')
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'UPDATE_ASSIGNMENT_FAILED',
            message: 'Erro ao atualizar atribuição',
            details: error
          }
        };
      }

      return {
        success: true,
        data: updated
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao atualizar atribuição',
          details: error
        }
      };
    }
  }

  /**
   * Obter permissões efetivas do funcionário
   * GET /api/company/{companyId}/users/{userId}/permissions
   */
  async getEmployeePermissions(
    companyId: number,
    userId: number,
    branchId?: number
  ): Promise<ApiResponse<CompanyUserPermissions>> {
    try {
      // Buscar todos os roles ativos do funcionário
      const { data: assignments, error } = await supabase
        .from('user_role_assignments')
        .select(`
          *,
          role:company_roles(*),
          user:profiles(name),
          company:companies(name)
        `)
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (error) {
        return {
          success: false,
          error: {
            code: 'FETCH_PERMISSIONS_FAILED',
            message: 'Erro ao buscar permissões',
            details: error
          }
        };
      }

      // Filtrar por filial se especificado
      let relevantAssignments = assignments || [];
      if (branchId) {
        relevantAssignments = relevantAssignments.filter(assignment =>
          assignment.context_type === 'COMPANY' ||
          (assignment.context_type === 'BRANCH' && assignment.branch_id === branchId)
        );
      }

      // Calcular permissões efetivas (união de todas as permissões)
      const effectivePermissions = this.calculateEffectivePermissions(
        relevantAssignments.map(a => a.role?.permissions).filter(Boolean)
      );

      // Preparar resposta conforme DTO da seção 2.6
      const userPermissions: CompanyUserPermissions = {
        userId,
        userName: assignments?.[0]?.user?.name || '',
        companyId,
        companyName: assignments?.[0]?.company?.name || '',
        effectivePermissions,
        roles: relevantAssignments.map(assignment => ({
          roleId: assignment.role?.id || 0,
          roleName: assignment.role?.name || '',
          contextType: assignment.context_type,
          contextId: assignment.context_id,
          contextName: assignment.context_type === 'COMPANY'
            ? assignment.company?.name || ''
            : `Branch ${assignment.branch_id}`,
          permissions: assignment.role?.permissions || {}
        }))
      };

      return {
        success: true,
        data: userPermissions
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao buscar permissões',
          details: error
        }
      };
    }
  }

  /**
   * Calcular permissões efetivas (união de todas as permissões)
   * Implementa lógica de agregação conforme documentação
   */
  private calculateEffectivePermissions(permissionSets: any[]): any {
    const effective: any = {};

    for (const permissions of permissionSets) {
      for (const [module, modulePermissions] of Object.entries(permissions)) {
        if (!effective[module]) {
          effective[module] = {};
        }

        if (typeof modulePermissions === 'object') {
          for (const [permission, value] of Object.entries(modulePermissions as any)) {
            // Usar OR lógico - se pelo menos um role tem a permissão, ela é concedida
            effective[module][permission] = effective[module][permission] || value;
          }
        }
      }
    }

    return effective;
  }

  /**
   * Log de auditoria interno
   */
  private async logAudit(logData: {
    companyId: number;
    userId: number;
    action: string;
    targetType: string;
    targetId: number;
    details: string;
  }) {
    try {
      await supabase.from('audit_logs').insert([{
        company_id: logData.companyId,
        user_id: logData.userId,
        action: logData.action,
        target_type: logData.targetType,
        target_id: logData.targetId,
        details: logData.details,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.warn('Failed to log audit entry:', error);
    }
  }
}