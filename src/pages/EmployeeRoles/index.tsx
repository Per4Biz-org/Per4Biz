// ===============================================
// 👥 Página - Gestão de Roles do Funcionário
// Rota: /employees/:employeeId/roles
// ===============================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMockEmployeeRoles } from '../../hooks/useMockEmployeeRoles';
import { Role, UserRoleAssignment, AssignRoleRequest } from '../../types/company-roles';

interface RouteParams {
  employeeId: string;
}

const EmployeeRolesPage: React.FC = () => {
  const { employeeId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedContext, setSelectedContext] = useState<'COMPANY' | 'BRANCH'>('COMPANY');
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [justification, setJustification] = useState('');

  // TODO: Obter dados do contexto de autenticação
  const companyId = 1;

  // Mock data conforme seção 3.3
  const employeeData = {
    name: "João Silva",
    email: "joao.silva@abctecnologia.com",
    company: "ABC Tecnologia Ltda",
    mainBranch: "São Paulo - SP",
    admissionDate: "15/01/2023"
  };

  // Usar hook mock para desenvolvimento
  const { assignments, availableRoles, loading, error, assignRole, removeRole } = useMockEmployeeRoles(companyId, parseInt(employeeId || '0'));

  // Mock branches
  const branches = [
    { id: 1, name: "São Paulo - SP" },
    { id: 2, name: "Rio de Janeiro - RJ" },
    { id: 3, name: "Belo Horizonte - MG" }
  ];

  const handleBack = () => {
    navigate('/employees');
  };

  const handleRemoveRole = async (assignmentId: number) => {
    if (confirm('Tem certeza que deseja remover este papel do funcionário?')) {
      try {
        await removeRole(assignmentId);
      } catch (error) {
        console.error('Erro ao remover papel:', error);
      }
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole || !justification.trim()) {
      alert('Selecione um papel e forneça uma justificativa');
      return;
    }

    const assignRequest: AssignRoleRequest = {
      userId: parseInt(employeeId || '0'),
      roleId: selectedRole.id,
      contextType: selectedContext,
      contextId: selectedContext === 'COMPANY' ? companyId : selectedBranch || companyId,
      branchId: selectedContext === 'BRANCH' ? selectedBranch : null,
      expiresAt: isTemporary && expirationDate ? new Date(expirationDate).toISOString() : null
    };

    try {
      await assignRole(assignRequest);
      setShowAssignModal(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao atribuir papel:', error);
    }
  };

  const resetForm = () => {
    setSelectedRole(null);
    setSelectedContext('COMPANY');
    setSelectedBranch(null);
    setIsTemporary(false);
    setExpirationDate('');
    setJustification('');
  };

  if (!employeeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Funcionário não encontrado
          </h2>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando papéis do funcionário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar dados do funcionário</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Página - Seção 3.3 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={handleBack}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Voltar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                👥 Gerenciar Papéis do Funcionário
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Atribuir e gerenciar papéis empresariais
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Dados do Funcionário - Conforme Seção 3.3 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">👤 Funcionário:</p>
              <p className="text-lg font-semibold text-gray-900">{employeeData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">📧 Email:</p>
              <p className="text-sm text-gray-900">{employeeData.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">🏢 Empresa:</p>
              <p className="text-sm text-gray-900">{employeeData.company}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">🏬 Filial Principal:</p>
              <p className="text-sm text-gray-900">{employeeData.mainBranch}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">📅 Admissão:</p>
              <p className="text-sm text-gray-900">{employeeData.admissionDate}</p>
            </div>
          </div>
        </div>

        {/* Papéis Atuais - Conforme ASCII Art seção 3.3 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">📋 Papéis Atuais</h2>
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              ➕ Adicionar Papel
            </button>
          </div>

          {assignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Papel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contexto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atribuído
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expira
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">
                            {assignment.role.name.includes('Gerente') ? '📊' :
                             assignment.role.name.includes('Supervisor') ? '👷' :
                             assignment.role.name.includes('Aprovador') ? '💰' : '📋'}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{assignment.role.name}</div>
                            <div className="text-sm text-gray-500">{assignment.role.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {assignment.contextType === 'COMPANY' ? '🏢 Empresa' : '🏬 Filial SP'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(assignment.assignedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.expiresAt ?
                          new Date(assignment.expiresAt).toLocaleDateString('pt-BR') :
                          '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRemoveRole(assignment.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Remover papel"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum papel atribuído a este funcionário</p>
              <button
                onClick={() => setShowAssignModal(true)}
                className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                ➕ Atribuir primeiro papel
              </button>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={() => alert('Funcionalidade de salvar será implementada')}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Salvar Mudanças
          </button>
        </div>
      </div>

      {/* Modal de Atribuição - Conforme Seção 3.3 */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAssignModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  ➕ Adicionar Novo Papel
                </h3>
                <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                  ❌
                </button>
              </div>

              <div className="space-y-4">
                {/* Seleção de Papel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione o Papel:
                  </label>
                  <select
                    value={selectedRole?.id || ''}
                    onChange={(e) => {
                      const role = availableRoles.find(r => r.id === parseInt(e.target.value));
                      setSelectedRole(role || null);
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Escolha um papel...</option>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contexto de Aplicação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aplicar em:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="context"
                        value="COMPANY"
                        checked={selectedContext === 'COMPANY'}
                        onChange={(e) => setSelectedContext(e.target.value as 'COMPANY')}
                        className="mr-2"
                      />
                      ● Empresa (Todas as filiais)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="context"
                        value="BRANCH"
                        checked={selectedContext === 'BRANCH'}
                        onChange={(e) => setSelectedContext(e.target.value as 'BRANCH')}
                        className="mr-2"
                      />
                      ○ Filial Específica
                    </label>
                  </div>
                </div>

                {/* Seleção de Filial */}
                {selectedContext === 'BRANCH' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecione a Filial:
                    </label>
                    <select
                      value={selectedBranch || ''}
                      onChange={(e) => setSelectedBranch(parseInt(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione uma filial...</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Papel Temporário */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isTemporary}
                      onChange={(e) => setIsTemporary(e.target.checked)}
                      className="mr-2"
                    />
                    ☐ Papel temporário (definir expiração)
                  </label>

                  {isTemporary && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Expiração:
                      </label>
                      <input
                        type="date"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Justificativa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Justificativa: (obrigatório)
                  </label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={3}
                    placeholder="Descreva o motivo da atribuição deste papel..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignRole}
                  disabled={!selectedRole || !justification.trim()}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ➕ Atribuir Papel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRolesPage;