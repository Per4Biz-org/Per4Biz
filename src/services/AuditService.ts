// ===============================================
// 📋 Audit Service
// Implementação dos endpoints de auditoria conforme documentação técnica
// Seção 4.4 - Endpoints de Dashboard e Relatórios
// ===============================================

import { supabase } from '../lib/supabase';
import {
  AuditLogEntry,
  AuditQueryParams,
  PaginatedResponse,
  ApiResponse,
  AuditAction
} from '../types/company-roles';

/**
 * Service para auditoria de permissões e ações
 * Implementa endpoints da seção 4.4 da documentação
 */
export class AuditService {

  /**
   * Buscar logs de auditoria da empresa
   * GET /api/company/{companyId}/audit/permissions
   */
  async getAuditLogs(
    companyId: number,
    params?: AuditQueryParams
  ): Promise<ApiResponse<PaginatedResponse<AuditLogEntry>>> {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles!user_id(name)
        `, { count: 'exact' })
        .eq('company_id', companyId);

      // Aplicar filtros conforme documentação
      if (params?.startDate) {
        query = query.gte('timestamp', params.startDate);
      }

      if (params?.endDate) {
        query = query.lte('timestamp', params.endDate);
      }

      if (params?.userId) {
        query = query.eq('user_id', params.userId);
      }

      if (params?.action) {
        query = query.eq('action', params.action);
      }

      if (params?.targetType) {
        query = query.eq('target_type', params.targetType);
      }

      if (params?.branchId) {
        query = query.eq('branch_id', params.branchId);
      }

      // Paginação
      const page = params?.page || 1;
      const size = params?.size || 25;
      const from = (page - 1) * size;
      const to = from + size - 1;

      query = query
        .range(from, to)
        .order('timestamp', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: {
            code: 'FETCH_AUDIT_FAILED',
            message: 'Erro ao carregar logs de auditoria',
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
          message: 'Erro inesperado ao buscar auditoria',
          details: error
        }
      };
    }
  }

  /**
   * Obter estatísticas de auditoria
   * GET /api/company/{companyId}/audit/stats
   */
  async getAuditStats(
    companyId: number,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<{
    totalActions: number;
    actionsByType: Record<AuditAction, number>;
    activeUsers: number;
    mostActiveUsers: Array<{ userId: number; userName: string; count: number }>;
    recentActivity: AuditLogEntry[];
  }>> {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles!user_id(name)
        `)
        .eq('company_id', companyId);

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error } = await query.order('timestamp', { ascending: false });

      if (error) {
        return {
          success: false,
          error: {
            code: 'FETCH_STATS_FAILED',
            message: 'Erro ao buscar estatísticas de auditoria',
            details: error
          }
        };
      }

      const logs = data || [];

      // Calcular estatísticas
      const actionsByType = {
        CREATE: 0,
        UPDATE: 0,
        DELETE: 0,
        ASSIGN: 0,
        REMOVE: 0
      } as Record<AuditAction, number>;

      const userActions = new Map<number, { name: string; count: number }>();

      logs.forEach(log => {
        // Contar ações por tipo
        if (actionsByType.hasOwnProperty(log.action)) {
          actionsByType[log.action as AuditAction]++;
        }

        // Contar ações por usuário
        if (log.user_id) {
          const existing = userActions.get(log.user_id) || { name: log.user?.name || 'Usuário Desconhecido', count: 0 };
          userActions.set(log.user_id, {
            name: existing.name,
            count: existing.count + 1
          });
        }
      });

      // Top 5 usuários mais ativos
      const mostActiveUsers = Array.from(userActions.entries())
        .map(([userId, data]) => ({
          userId,
          userName: data.name,
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        success: true,
        data: {
          totalActions: logs.length,
          actionsByType,
          activeUsers: userActions.size,
          mostActiveUsers,
          recentActivity: logs.slice(0, 10)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao calcular estatísticas',
          details: error
        }
      };
    }
  }

  /**
   * Exportar logs de auditoria para CSV/Excel
   * GET /api/company/{companyId}/audit/export
   */
  async exportAuditLogs(
    companyId: number,
    params?: AuditQueryParams,
    format: 'CSV' | 'EXCEL' = 'CSV'
  ): Promise<ApiResponse<string>> {
    try {
      // Buscar todos os logs (sem paginação para export)
      const allLogsResponse = await this.getAuditLogs(companyId, {
        ...params,
        page: 1,
        size: 10000 // Limite alto para export
      });

      if (!allLogsResponse.success || !allLogsResponse.data) {
        return allLogsResponse as ApiResponse<string>;
      }

      const logs = allLogsResponse.data.data;

      // Converter para CSV
      if (format === 'CSV') {
        const headers = [
          'Data/Hora',
          'Usuário',
          'Ação',
          'Tipo',
          'ID do Alvo',
          'Detalhes',
          'Filial'
        ];

        const csvContent = [
          headers.join(','),
          ...logs.map(log => [
            new Date(log.timestamp).toLocaleString('pt-BR'),
            `"${log.userName || 'Sistema'}"`,
            log.action,
            log.targetType,
            log.targetId,
            `"${log.details}"`,
            log.branchId || ''
          ].join(','))
        ].join('\n');

        return {
          success: true,
          data: csvContent
        };
      }

      // Para Excel, retornaria um buffer ou URL de download
      // Por ora, retornar CSV mesmo para Excel
      return {
        success: false,
        error: {
          code: 'FORMAT_NOT_SUPPORTED',
          message: 'Formato Excel ainda não implementado'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Erro ao exportar logs de auditoria',
          details: error
        }
      };
    }
  }

  /**
   * Criar entrada de auditoria manual
   * POST /api/company/{companyId}/audit/log
   */
  async createAuditEntry(data: {
    companyId: number;
    userId: number;
    action: AuditAction;
    targetType: 'ROLE' | 'USER_ROLE';
    targetId: number;
    details: string;
    branchId?: number;
  }): Promise<ApiResponse<AuditLogEntry>> {
    try {
      const auditData = {
        company_id: data.companyId,
        user_id: data.userId,
        action: data.action,
        target_type: data.targetType,
        target_id: data.targetId,
        details: data.details,
        branch_id: data.branchId,
        timestamp: new Date().toISOString()
      };

      const { data: newEntry, error } = await supabase
        .from('audit_logs')
        .insert([auditData])
        .select(`
          *,
          user:profiles!user_id(name)
        `)
        .single();

      if (error) {
        return {
          success: false,
          error: {
            code: 'CREATE_AUDIT_FAILED',
            message: 'Erro ao criar entrada de auditoria',
            details: error
          }
        };
      }

      return {
        success: true,
        data: {
          ...newEntry,
          userName: newEntry.user?.name || 'Sistema'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado ao criar auditoria',
          details: error
        }
      };
    }
  }

  /**
   * Limpar logs antigos conforme política de retenção
   * DELETE /api/company/{companyId}/audit/cleanup
   */
  async cleanupOldLogs(
    companyId: number,
    retentionDays: number = 730 // 2 anos por padrão
  ): Promise<ApiResponse<{ deletedCount: number }>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .eq('company_id', companyId)
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) {
        return {
          success: false,
          error: {
            code: 'CLEANUP_FAILED',
            message: 'Erro ao limpar logs antigos',
            details: error
          }
        };
      }

      return {
        success: true,
        data: {
          deletedCount: data?.length || 0
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Erro inesperado na limpeza',
          details: error
        }
      };
    }
  }
}