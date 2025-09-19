// ===============================================
// 📋 Company Role Service
// Implementação dos endpoints conforme documentação técnica
// 4.1 Endpoints de Roles Empresariais
// ===============================================

import { supabase } from '../lib/supabase';
import {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  CloneRoleRequest,
  RoleQueryParams,
  PaginatedResponse,
  ApiResponse,
  ApiError
} from '../types/company-roles';

/**
 * Service para gerenciamento de roles empresariais
 * Implementa todos os endpoints da seção 4.1 da documentação
 */
export class CompanyRoleService {

  /**
   * Listar roles da empresa
   * GET /api/company/{companyId}/roles
   */
  async listCompanyRoles(
    companyId: number,
    params?: RoleQueryParams
  ): Promise<ApiResponse<PaginatedResponse<Role>>> {
    try {
      let query = supabase
        .from('company_roles')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId);

      // Aplicar filtros conforme documentação
      if (params?.contextType) {
        query = query.eq('context_type', params.contextType);
      }

      if (params?.branchId) {
        query = query.eq('branch_id', params.branchId);
      }

      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      if (params?.active !== undefined) {
        query = query.eq('is_active', params.active);
      }

      // Paginação
      const page = params?.page || 1;
      const size = params?.size || 25;
      const from = (page - 1) * size;
      const to = from + size - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: {
            code: 'LIST_ROLES_FAILED',
            message: 'Erro ao carregar papéis da empresa',
            details: error
          }
        };
      }

      const totalPages = Math.ceil((count || 0) / size);

      return {
        success: true,
        data: {
          data: data || [],
          pagination: {
            page,
            size,
            total: count || 0,
            totalPages
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao listar roles',
          details: error
        }
      };
    }
  }

  /**
   * Obter role específico
   * GET /api/company/{companyId}/roles/{roleId}
   */
  async getCompanyRole(
    companyId: number,
    roleId: number
  ): Promise<ApiResponse<Role>> {
    try {
      const { data, error } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', roleId)
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role não encontrado',
            details: error
          }
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro ao buscar role',
          details: error
        }
      };
    }
  }

  /**
   * Criar novo role para empresa
   * POST /api/company/{companyId}/roles
   */
  async createCompanyRole(
    companyId: number,
    data: CreateRoleRequest
  ): Promise<ApiResponse<Role>> {
    try {
      // Validar se já existe role com mesmo nome na empresa
      const { data: existing } = await supabase
        .from('company_roles')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', data.name)
        .single();

      if (existing) {
        return {
          success: false,
          error: {
            code: 'ROLE_NAME_EXISTS',
            message: 'Já existe um papel com este nome'
          }
        };
      }

      const roleData = {
        company_id: companyId,
        application_id: data.applicationId,
        context_type: data.contextType,
        context_id: data.contextId,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        is_system_role: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newRole, error } = await supabase
        .from('company_roles')
        .insert([roleData])
        .select('*')
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'CREATE_ROLE_FAILED',
            message: 'Erro ao criar papel empresarial',
            details: error
          }
        };
      }

      // Log de auditoria
      await this.logAudit({
        companyId,
        userId: 0, // TODO: Pegar do contexto de auth
        action: 'CREATE',
        targetType: 'ROLE',
        targetId: newRole.id,
        details: `Created role: ${newRole.name}`
      });

      return {
        success: true,
        data: newRole
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao criar role',
          details: error
        }
      };
    }
  }

  /**
   * Atualizar role da empresa
   * PUT /api/company/{companyId}/roles/{roleId}
   */
  async updateCompanyRole(
    companyId: number,
    roleId: number,
    data: UpdateRoleRequest
  ): Promise<ApiResponse<Role>> {
    try {
      // Verificar se role existe e pertence à empresa
      const { data: existing } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', roleId)
        .single();

      if (!existing) {
        return {
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role não encontrado'
          }
        };
      }

      // Verificar se não é role de sistema
      if (existing.is_system_role) {
        return {
          success: false,
          error: {
            code: 'SYSTEM_ROLE_READONLY',
            message: 'Roles de sistema não podem ser editados'
          }
        };
      }

      const updateData = {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        updated_at: new Date().toISOString()
      };

      const { data: updatedRole, error } = await supabase
        .from('company_roles')
        .update(updateData)
        .eq('id', roleId)
        .eq('company_id', companyId)
        .select('*')
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'UPDATE_ROLE_FAILED',
            message: 'Erro ao atualizar papel',
            details: error
          }
        };
      }

      // Log de auditoria
      await this.logAudit({
        companyId,
        userId: 0, // TODO: Pegar do contexto de auth
        action: 'UPDATE',
        targetType: 'ROLE',
        targetId: roleId,
        details: `Updated role: ${updatedRole.name}`
      });

      return {
        success: true,
        data: updatedRole
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao atualizar role',
          details: error
        }
      };
    }
  }

  /**
   * Deletar role da empresa
   * DELETE /api/company/{companyId}/roles/{roleId}
   */
  async deleteCompanyRole(
    companyId: number,
    roleId: number
  ): Promise<ApiResponse<void>> {
    try {
      // Verificar se role existe e pertence à empresa
      const { data: existing } = await supabase
        .from('company_roles')
        .select('*, user_role_assignments!inner(count)')
        .eq('company_id', companyId)
        .eq('id', roleId)
        .single();

      if (!existing) {
        return {
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role não encontrado'
          }
        };
      }

      // Verificar se não é role de sistema
      if (existing.is_system_role) {
        return {
          success: false,
          error: {
            code: 'SYSTEM_ROLE_READONLY',
            message: 'Roles de sistema não podem ser deletados'
          }
        };
      }

      // Verificar se role está em uso
      const { count: usageCount } = await supabase
        .from('user_role_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', roleId)
        .eq('is_active', true);

      if (usageCount && usageCount > 0) {
        return {
          success: false,
          error: {
            code: 'ROLE_IN_USE',
            message: `Este papel está sendo usado por ${usageCount} funcionários`
          }
        };
      }

      const { error } = await supabase
        .from('company_roles')
        .delete()
        .eq('id', roleId)
        .eq('company_id', companyId);

      if (error) {
        return {
          success: false,
          error: {
            code: 'DELETE_ROLE_FAILED',
            message: 'Erro ao excluir papel',
            details: error
          }
        };
      }

      // Log de auditoria
      await this.logAudit({
        companyId,
        userId: 0, // TODO: Pegar do contexto de auth
        action: 'DELETE',
        targetType: 'ROLE',
        targetId: roleId,
        details: `Deleted role: ${existing.name}`
      });

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao deletar role',
          details: error
        }
      };
    }
  }

  /**
   * Clonar role existente
   * POST /api/company/{companyId}/roles/{roleId}/clone
   */
  async cloneRole(
    companyId: number,
    roleId: number,
    data: CloneRoleRequest
  ): Promise<ApiResponse<Role>> {
    try {
      // Buscar role original
      const { data: originalRole, error: fetchError } = await supabase
        .from('company_roles')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', roleId)
        .single();

      if (fetchError || !originalRole) {
        return {
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role original não encontrado'
          }
        };
      }

      // Criar dados para o clone
      const cloneData: CreateRoleRequest = {
        applicationId: originalRole.application_id,
        contextType: data.contextType || originalRole.context_type,
        contextId: data.branchId || originalRole.context_id,
        name: data.name,
        description: `Clone de: ${originalRole.description}`,
        permissions: originalRole.permissions
      };

      // Criar o clone
      return await this.createCompanyRole(companyId, cloneData);

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao clonar role',
          details: error
        }
      };
    }
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