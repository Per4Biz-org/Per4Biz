// ===============================================
// 🧪 useMockCompanyRoles Hook (Desenvolvimento)
// Hook simplificado para desenvolvimento/teste
// ===============================================

import { useState, useEffect } from 'react';
import { Role, UseCompanyRolesReturn, CreateRoleRequest, UpdateRoleRequest } from '../types/company-roles';

// Dados mock para desenvolvimento
const mockRoles: Role[] = [
  {
    id: 1,
    applicationId: 1,
    contextType: 'company',
    contextId: 1,
    name: 'Administrador',
    description: 'Acesso completo ao sistema',
    permissions: {
      usuarios: { criar: true, editar: true, excluir: true, visualizar: true, gerenciarRoles: true },
      financeiro: { criarTransacao: true, editarTransacao: true, excluirTransacao: true, visualizarRelatorios: true, gerenciarOrcamentos: true, aprovarTransacoes: true },
      configuracoes: { gerenciarEmpresa: true, gerenciarFiliais: true, configurarSistema: true, gerenciarIntegracoes: true },
      auditoria: { visualizarLogs: true, exportarRelatorios: true, configurarAlertas: true }
    },
    isSystemRole: false,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: 2,
    applicationId: 1,
    contextType: 'company',
    contextId: 1,
    name: 'Gerente',
    description: 'Gerenciamento de equipe e relatórios',
    permissions: {
      usuarios: { visualizar: true, gerenciarRoles: false },
      financeiro: { visualizarRelatorios: true, gerenciarOrcamentos: true },
      configuracoes: { gerenciarFiliais: true },
      auditoria: { visualizarLogs: true }
    },
    isSystemRole: false,
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-02T10:00:00Z'
  },
  {
    id: 3,
    applicationId: 1,
    contextType: 'branch',
    contextId: 123,
    name: 'Supervisor',
    description: 'Supervisão de filial',
    permissions: {
      usuarios: { visualizar: true },
      financeiro: { visualizarRelatorios: true },
      configuracoes: {},
      auditoria: {}
    },
    isSystemRole: false,
    createdAt: '2024-01-03T10:00:00Z',
    updatedAt: '2024-01-03T10:00:00Z'
  }
];

/**
 * Hook mock para desenvolvimento
 */
export function useMockCompanyRoles(companyId: number): UseCompanyRolesReturn {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simular carregamento
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setRoles(mockRoles.filter(role =>
        role.contextType === 'company' || role.contextId === companyId
      ));
      setLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [companyId]);

  const createRole = async (data: CreateRoleRequest): Promise<Role | null> => {
    const newRole: Role = {
      id: Date.now(),
      applicationId: 1,
      contextType: data.contextType,
      contextId: data.contextId,
      name: data.name,
      description: data.description || '',
      permissions: data.permissions,
      isSystemRole: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setRoles(prev => [newRole, ...prev]);
    return newRole;
  };

  const updateRole = async (roleId: number, data: UpdateRoleRequest): Promise<Role | null> => {
    setRoles(prev => prev.map(role =>
      role.id === roleId
        ? { ...role, ...data, updatedAt: new Date().toISOString() }
        : role
    ));

    const updatedRole = roles.find(r => r.id === roleId);
    return updatedRole || null;
  };

  const deleteRole = async (roleId: number): Promise<boolean> => {
    setRoles(prev => prev.filter(role => role.id !== roleId));
    return true;
  };

  const refetch = () => {
    setRoles([...mockRoles]);
  };

  return {
    roles,
    loading,
    error,
    pagination: {
      page: 1,
      size: 10,
      total: roles.length,
      totalPages: 1
    },
    createRole,
    updateRole,
    deleteRole,
    refetch
  };
}

export default useMockCompanyRoles;