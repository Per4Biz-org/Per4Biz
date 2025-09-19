// ===============================================
// 🧪 TestEmployeeRoleAssignment - Versão Simplificada
// Componente para teste temporário
// ===============================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TestEmployeeRoleAssignmentProps {
  companyId: number;
  employeeId: number;
  employeeName?: string;
  onAssignmentChange?: () => void;
  className?: string;
}

export const TestEmployeeRoleAssignment: React.FC<TestEmployeeRoleAssignmentProps> = ({
  companyId,
  employeeId,
  employeeName = 'João Silva',
  onAssignmentChange,
  className = ''
}) => {
  const { t } = useTranslation();
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Dados mock para teste
  const mockAssignments = [
    {
      id: 1,
      role: { id: 1, name: 'Administrador', contextType: 'company' },
      assignedAt: '2024-01-15',
      assignedBy: 'Sistema'
    },
    {
      id: 2,
      role: { id: 2, name: 'Gerente', contextType: 'branch' },
      assignedAt: '2024-02-01',
      assignedBy: 'RH'
    }
  ];

  const mockAvailableRoles = [
    { id: 3, name: 'Supervisor', contextType: 'branch' },
    { id: 4, name: 'Operador', contextType: 'company' }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Atribuições de Papéis
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Funcionário: {employeeName}
            </p>
            <p className="text-sm text-gray-500">
              {mockAssignments.length} papéis atribuídos
            </p>
          </div>

          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Atribuir Papel
          </button>
        </div>
      </div>

      {/* Lista de Roles Atribuídos */}
      <div className="p-6">
        <div className="space-y-4">
          {mockAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {assignment.role.name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      assignment.role.contextType === 'company' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {assignment.role.contextType === 'company' ? 'Empresa' : 'Filial'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>
                      Atribuído em: {assignment.assignedAt}
                    </span>
                    <span>
                      Atribuído por: {assignment.assignedBy}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => console.log('Remover role:', assignment.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remover papel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Atribuição (simplificado) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAssignModal(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Atribuir Papéis
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Papéis Disponíveis ({mockAvailableRoles.length})
                  </label>
                  <div className="space-y-2">
                    {mockAvailableRoles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{role.name}</div>
                          <div className="text-xs text-gray-500">
                            {role.contextType === 'company' ? 'Empresa' : 'Filial'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      console.log('Atribuindo papéis selecionados');
                      setShowAssignModal(false);
                    }}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Atribuir Selecionados
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestEmployeeRoleAssignment;