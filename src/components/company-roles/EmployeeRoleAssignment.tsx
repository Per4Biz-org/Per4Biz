// ===============================================
// 👥 EmployeeRoleAssignment Component
// Interface para atribuição de roles aos funcionários
// Implementa seção 3.3 da documentação técnica
// ===============================================

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEmployeeRoles } from '../../hooks/useEmployeeRoles';
import { useCompanyRoles } from '../../hooks/useCompanyRoles';
import {
  UserRoleAssignment,
  AssignRoleRequest,
  Role,
  ContextType
} from '../../types/company-roles';
import { format } from 'date-fns';
import { ptBR, fr, enUS } from 'date-fns/locale';

interface EmployeeRoleAssignmentProps {
  companyId: number;
  employeeId: number;
  employeeName?: string;
  onAssignmentChange?: () => void;
  className?: string;
}

interface AssignmentModalState {
  isOpen: boolean;
  selectedRoles: number[];
  justification: string;
  assignedBy: string;
}

/**
 * Interface para gerenciar atribuições de roles dos funcionários
 * Implementa a especificação da seção 3.3
 */
export const EmployeeRoleAssignment: React.FC<EmployeeRoleAssignmentProps> = ({
  companyId,
  employeeId,
  employeeName = '',
  onAssignmentChange,
  className = ''
}) => {
  const { t, i18n } = useTranslation();

  // Estados locais
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [modalState, setModalState] = useState<AssignmentModalState>({
    isOpen: false,
    selectedRoles: [],
    justification: '',
    assignedBy: ''
  });
  const [filterContext, setFilterContext] = useState<ContextType | 'all'>('all');

  // Configurar locale para formatação de datas
  const dateLocale = i18n.language === 'pt' ? ptBR : i18n.language === 'fr' ? fr : enUS;

  // Hooks
  const {
    assignments,
    availableRoles,
    loading: employeeLoading,
    error: employeeError,
    assignRole,
    removeRole,
    refetch: refetchEmployeeRoles
  } = useEmployeeRoles(companyId, employeeId);

  const {
    roles: allCompanyRoles,
    loading: rolesLoading
  } = useCompanyRoles(companyId);

  // Roles disponíveis para atribuição (não atribuídos ainda)
  const unassignedRoles = useMemo(() => {
    if (!allCompanyRoles || !assignments) return [];

    const assignedRoleIds = assignments.map(assignment => assignment.roleId);
    return allCompanyRoles.filter(role =>
      !assignedRoleIds.includes(role.id) &&
      !role.isSystemRole &&
      (filterContext === 'all' || role.contextType === filterContext)
    );
  }, [allCompanyRoles, assignments, filterContext]);

  // Handlers
  const handleAssignRoles = async () => {
    if (modalState.selectedRoles.length === 0) return;

    try {
      for (const roleId of modalState.selectedRoles) {
        const assignmentData: AssignRoleRequest = {
          roleId,
          justification: modalState.justification.trim() || undefined,
          assignedBy: modalState.assignedBy.trim() || undefined
        };

        await assignRole(assignmentData);
      }

      // Resetar modal
      setModalState({
        isOpen: false,
        selectedRoles: [],
        justification: '',
        assignedBy: ''
      });
      setShowAssignModal(false);

      // Callback para atualização externa
      if (onAssignmentChange) {
        onAssignmentChange();
      }

      // Recarregar dados
      refetchEmployeeRoles();
    } catch (error: any) {
      console.error('Erro ao atribuir roles:', error);
    }
  };

  const handleRemoveRole = async (assignmentId: number) => {
    const confirmed = window.confirm(t('company-roles.confirmations.removeRole'));
    if (!confirmed) return;

    try {
      await removeRole(assignmentId);

      if (onAssignmentChange) {
        onAssignmentChange();
      }

      refetchEmployeeRoles();
    } catch (error: any) {
      console.error('Erro ao remover role:', error);
    }
  };

  const toggleRoleSelection = (roleId: number) => {
    setModalState(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter(id => id !== roleId)
        : [...prev.selectedRoles, roleId]
    }));
  };

  // Componente de erro
  if (employeeError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-red-800">{employeeError.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* =============================================== */}
      {/* HEADER - Informações do Funcionário           */}
      {/* =============================================== */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('company-roles.employee.roleAssignments')}
            </h2>
            {employeeName && (
              <p className="text-sm text-gray-600 mt-1">
                {t('company-roles.employee.name')}: {employeeName}
              </p>
            )}
            <p className="text-sm text-gray-500">
              {assignments?.length || 0} {t('company-roles.employee.assignedRoles')}
            </p>
          </div>

          <button
            onClick={() => setShowAssignModal(true)}
            disabled={employeeLoading || rolesLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('company-roles.actions.assignRole')}
          </button>
        </div>
      </div>

      {/* =============================================== */}
      {/* LISTA DE ROLES ATRIBUÍDOS                     */}
      {/* =============================================== */}
      <div className="p-6">
        {employeeLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-20"></div>
            ))}
          </div>
        ) : assignments && assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment) => (
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
                        assignment.role.contextType === 'company' ? 'bg-purple-100 text-purple-800' :
                        assignment.role.contextType === 'branch' ? 'bg-blue-100 text-blue-800' :
                        assignment.role.contextType === 'department' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {t(`company-roles.context.${assignment.role.contextType}`)}
                      </span>
                    </div>

                    {assignment.role.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {assignment.role.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>
                        {t('company-roles.assignment.assignedAt')}: {format(new Date(assignment.assignedAt), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                      </span>
                      {assignment.assignedBy && (
                        <span>
                          {t('company-roles.assignment.assignedBy')}: {assignment.assignedBy}
                        </span>
                      )}
                      {assignment.justification && (
                        <span>
                          {t('company-roles.assignment.justification')}: {assignment.justification}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveRole(assignment.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('company-roles.actions.removeRole')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {t('company-roles.employee.noRoles')}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {t('company-roles.employee.noRolesDescription')}
            </p>
          </div>
        )}
      </div>

      {/* =============================================== */}
      {/* MODAL DE ATRIBUIÇÃO DE ROLES                  */}
      {/* =============================================== */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAssignModal(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              {/* Header do Modal */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('company-roles.modal.assignRoles')}
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filtro de contexto */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('company-roles.filters.filterByContext')}
                </label>
                <select
                  value={filterContext}
                  onChange={(e) => setFilterContext(e.target.value as ContextType | 'all')}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('company-roles.filters.allContexts')}</option>
                  <option value="company">{t('company-roles.filters.company')}</option>
                  <option value="branch">{t('company-roles.filters.branch')}</option>
                  <option value="department">{t('company-roles.filters.department')}</option>
                  <option value="team">{t('company-roles.filters.team')}</option>
                </select>
              </div>

              {/* Lista de roles disponíveis */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('company-roles.modal.availableRoles')} ({unassignedRoles.length})
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {unassignedRoles.length > 0 ? (
                    unassignedRoles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={modalState.selectedRoles.includes(role.id)}
                          onChange={() => toggleRoleSelection(role.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{role.name}</div>
                          {role.description && (
                            <div className="text-sm text-gray-600">{role.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {t(`company-roles.context.${role.contextType}`)}
                          </div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {t('company-roles.modal.noAvailableRoles')}
                    </div>
                  )}
                </div>
              </div>

              {/* Campos adicionais */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('company-roles.fields.assignedBy')}
                  </label>
                  <input
                    type="text"
                    value={modalState.assignedBy}
                    onChange={(e) => setModalState(prev => ({ ...prev, assignedBy: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('company-roles.placeholders.assignedBy')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('company-roles.fields.justification')}
                  </label>
                  <textarea
                    value={modalState.justification}
                    onChange={(e) => setModalState(prev => ({ ...prev, justification: e.target.value }))}
                    rows={3}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('company-roles.placeholders.justification')}
                  />
                </div>
              </div>

              {/* Ações do modal */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  {t('company-roles.actions.cancel')}
                </button>
                <button
                  onClick={handleAssignRoles}
                  disabled={modalState.selectedRoles.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('company-roles.actions.assignSelected')} ({modalState.selectedRoles.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRoleAssignment;