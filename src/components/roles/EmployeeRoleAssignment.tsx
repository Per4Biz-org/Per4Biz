// ===============================================
// 📋 Employee Role Assignment Component
// Implementação conforme documentação técnica seção 3.3
// Interface para atribuição de roles a funcionários
// ===============================================

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEmployeeRoles } from '../../hooks/useEmployeeRoles';
import { useCompanyRoles } from '../../hooks/useCompanyRoles';
import { UserRoleAssignment, AssignRoleRequest, Role } from '../../types/company-roles';

interface EmployeeRoleAssignmentProps {
  companyId: number;
  userId: number;
  userName: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Componente para atribuição de roles a funcionários
 * Implementa interface conforme documentação seção 3.3
 */
export function EmployeeRoleAssignment({
  companyId,
  userId,
  userName,
  onClose,
  className = ''
}: EmployeeRoleAssignmentProps) {
  const { t } = useTranslation();

  // Estados
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [assignmentData, setAssignmentData] = useState({
    expiresAt: '',
    justification: '',
    branchId: undefined as number | undefined
  });

  // Hooks para gerenciamento
  const {
    roles: employeeRoles,
    loading: rolesLoading,
    error: rolesError,
    assignRole,
    removeRole,
    updateAssignment,
    refetch: refetchEmployeeRoles
  } = useEmployeeRoles(companyId, userId);

  const {
    roles: availableRoles,
    loading: availableRolesLoading
  } = useCompanyRoles(companyId, { active: true });

  // Filtrar roles disponíveis (que o funcionário ainda não possui)
  const assignableRoles = availableRoles.filter(role =>
    !employeeRoles.some(assignment => assignment.roleId === role.id)
  );

  // Handler para atribuir role
  const handleAssignRole = useCallback(async () => {
    if (!selectedRole) return;

    try {
      const request: AssignRoleRequest = {
        roleId: selectedRole,
        contextType: 'COMPANY',
        contextId: companyId,
        branchId: assignmentData.branchId,
        expiresAt: assignmentData.expiresAt || undefined,
        justification: assignmentData.justification || undefined
      };

      await assignRole(request);
      setShowAssignModal(false);
      setSelectedRole(null);
      setAssignmentData({
        expiresAt: '',
        justification: '',
        branchId: undefined
      });
      // TODO: Mostrar toast de sucesso
    } catch (error) {
      // TODO: Mostrar toast de erro
      console.error('Assign role error:', error);
    }
  }, [selectedRole, companyId, assignmentData, assignRole]);

  // Handler para remover role
  const handleRemoveRole = useCallback(async (userRoleId: number, roleName: string) => {
    if (window.confirm(t('companyRoles.confirmations.removeUserRole', { roleName }))) {
      try {
        await removeRole(userRoleId);
        // TODO: Mostrar toast de sucesso
      } catch (error) {
        // TODO: Mostrar toast de erro
        console.error('Remove role error:', error);
      }
    }
  }, [removeRole, t]);

  // Handler para toggle de status ativo
  const handleToggleActive = useCallback(async (
    userRoleId: number,
    currentStatus: boolean
  ) => {
    try {
      await updateAssignment(userRoleId, {
        isActive: !currentStatus
      });
      // TODO: Mostrar toast de sucesso
    } catch (error) {
      // TODO: Mostrar toast de erro
      console.error('Toggle active error:', error);
    }
  }, [updateAssignment]);

  // Formatação de data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Verificar se role está expirado
  const isRoleExpired = (expiresAt?: string): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('companyRoles.titles.employeeRoles')}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {t('companyRoles.descriptions.employeeRoles', { userName })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={assignableRoles.length === 0}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('companyRoles.actions.assignRole')}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Roles Atribuídos */}
      <div className="p-6">
        {rolesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : rolesError ? (
          <div className="text-center py-6">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600">{rolesError.message}</p>
            <button
              onClick={refetchEmployeeRoles}
              className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              {t('companyRoles.actions.retry')}
            </button>
          </div>
        ) : employeeRoles.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {t('companyRoles.messages.noAssignedRoles')}
            </h4>
            <p className="text-gray-600 mb-4">
              {t('companyRoles.messages.assignFirstRole')}
            </p>
            {assignableRoles.length > 0 && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {t('companyRoles.actions.assignFirstRole')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {employeeRoles.map(assignment => (
              <div
                key={assignment.id}
                className={`border rounded-lg p-4 ${
                  !assignment.isActive
                    ? 'border-gray-200 bg-gray-50'
                    : isRoleExpired(assignment.expiresAt)
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {assignment.role?.name}
                      </h4>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        {!assignment.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {t('companyRoles.status.inactive')}
                          </span>
                        )}

                        {isRoleExpired(assignment.expiresAt) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {t('companyRoles.status.expired')}
                          </span>
                        )}

                        {assignment.expiresAt && !isRoleExpired(assignment.expiresAt) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {t('companyRoles.status.temporary')}
                          </span>
                        )}
                      </div>
                    </div>

                    {assignment.role?.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {assignment.role.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <span>
                        {t('companyRoles.labels.assignedAt')}: {formatDate(assignment.assignedAt)}
                      </span>
                      {assignment.expiresAt && (
                        <span>
                          {t('companyRoles.labels.expiresAt')}: {formatDate(assignment.expiresAt)}
                        </span>
                      )}
                      {assignment.assignedByName && (
                        <span>
                          {t('companyRoles.labels.assignedBy')}: {assignment.assignedByName}
                        </span>
                      )}
                    </div>

                    {assignment.justification && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">
                          {t('companyRoles.labels.justification')}:
                        </p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                          {assignment.justification}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(assignment.id, assignment.isActive)}
                      className={`p-1.5 rounded text-sm font-medium ${
                        assignment.isActive
                          ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                          : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                      }`}
                      title={assignment.isActive
                        ? t('companyRoles.actions.deactivate')
                        : t('companyRoles.actions.activate')
                      }
                    >
                      {assignment.isActive ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => handleRemoveRole(assignment.id, assignment.role?.name || '')}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title={t('companyRoles.actions.removeRole')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Atribuição */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('companyRoles.modal.assignRoleTitle')}
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

            <div className="py-4 space-y-4">
              {/* Seleção de Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('companyRoles.fields.selectRole')} *
                </label>
                <select
                  value={selectedRole || ''}
                  onChange={(e) => setSelectedRole(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">{t('companyRoles.placeholders.selectRole')}</option>
                  {assignableRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data de Expiração (Opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('companyRoles.fields.expiresAt')}
                </label>
                <input
                  type="datetime-local"
                  value={assignmentData.expiresAt}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Justificativa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('companyRoles.fields.justification')}
                  {assignmentData.expiresAt && ' *'}
                </label>
                <textarea
                  value={assignmentData.justification}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, justification: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={t('companyRoles.placeholders.justification')}
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-gray-200 gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('companyRoles.actions.cancel')}
              </button>
              <button
                onClick={handleAssignRole}
                disabled={!selectedRole || (assignmentData.expiresAt && !assignmentData.justification)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('companyRoles.actions.assignRole')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}