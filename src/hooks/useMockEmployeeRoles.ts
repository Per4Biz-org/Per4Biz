// ===============================================
// 🧪 useMockEmployeeRoles Hook (Desenvolvimento)
// Hook simplificado para desenvolvimento/teste
// ===============================================

import { useState, useEffect } from 'react';
import { UserRoleAssignment, Role, AssignRoleRequest } from '../types/company-roles';

// Dados mock
const mockAssignments: UserRoleAssignment[] = [
  {
    id: 1,
    userId: 123,
    roleId: 1,
    role: {
      id: 1,
      applicationId: 1,
      contextType: 'company',
      contextId: 1,
      name: 'Administrador',
      description: 'Acesso completo',
      permissions: {
        usuarios: { visualizar: true, gerenciarRoles: true },
        financeiro: { visualizarRelatorios: true },
        configuracoes: { gerenciarEmpresa: true },
        auditoria: { visualizarLogs: true }
      },
      isSystemRole: false,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    },
    contextType: 'company',
    contextId: 1,
    companyId: 1,
    branchId: null,
    assignedBy: 999,
    assignedByName: 'Sistema',
    assignedAt: '2024-01-01T10:00:00Z',
    isActive: true,
    expiresAt: null
  }
];

const mockAvailableRoles: Role[] = [
  {
    id: 2,
    applicationId: 1,
    contextType: 'company',
    contextId: 1,
    name: 'Gerente',
    description: 'Gerenciamento de equipe',
    permissions: {
      usuarios: { visualizar: true },
      financeiro: { visualizarRelatorios: true },
      configuracoes: {},
      auditoria: {}
    },
    isSystemRole: false,
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-02T10:00:00Z'
  }
];

export function useMockEmployeeRoles(companyId: number, employeeId: number) {
  const [assignments, setAssignments] = useState<UserRoleAssignment[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAssignments(mockAssignments);
      setAvailableRoles(mockAvailableRoles);
      setLoading(false);
    }, 300);
  }, [companyId, employeeId]);

  const assignRole = async (data: AssignRoleRequest) => {
    console.log('Atribuindo role:', data);
    // Mock implementation
    return true;
  };

  const removeRole = async (assignmentId: number) => {
    console.log('Removendo role:', assignmentId);
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    return true;
  };

  const refetch = () => {
    setAssignments([...mockAssignments]);
  };

  return {
    assignments,
    availableRoles,
    loading,
    error,
    assignRole,
    removeRole,
    refetch
  };
}

export default useMockEmployeeRoles;