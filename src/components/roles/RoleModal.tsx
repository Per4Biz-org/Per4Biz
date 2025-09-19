// ===============================================
// 📋 Role Creation/Edit Modal Component
// Implementação conforme documentação técnica seção 3.2
// Modal para criação e edição de roles empresariais
// ===============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Role, CreateRoleRequest, UpdateRoleRequest, ContextType, ModulePermissions } from '../../types/company-roles';
import { PermissionMatrix } from './PermissionMatrix';

interface RoleModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'clone';
  role?: Role;
  companyId: number;
  onClose: () => void;
  onSave: (data: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  onClone?: (data: { name: string; contextType?: ContextType; branchId?: number }) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Modal para criação/edição de roles
 * Implementa interface conforme documentação seção 3.2
 */
export function RoleModal({
  isOpen,
  mode,
  role,
  companyId,
  onClose,
  onSave,
  onClone,
  isLoading = false
}: RoleModalProps) {
  const { t } = useTranslation();

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contextType: 'COMPANY' as ContextType,
    contextId: companyId,
    applicationId: 1, // TODO: Pegar do contexto ou props
    branchId: undefined as number | undefined
  });

  const [permissions, setPermissions] = useState<ModulePermissions>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Inicializar dados do formulário baseado no modo
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        contextType: role.contextType,
        contextId: role.contextId,
        applicationId: role.applicationId,
        branchId: undefined // TODO: Implementar lógica de branch
      });
      setPermissions(role.permissions);
    } else if (mode === 'clone' && role) {
      setFormData({
        name: `${role.name} (Cópia)`,
        description: role.description || '',
        contextType: role.contextType,
        contextId: role.contextId,
        applicationId: role.applicationId,
        branchId: undefined
      });
      setPermissions(role.permissions);
    } else {
      // Modo create
      setFormData({
        name: '',
        description: '',
        contextType: 'COMPANY',
        contextId: companyId,
        applicationId: 1,
        branchId: undefined
      });
      setPermissions({});
    }

    setErrors({});
    setCurrentStep(1);
  }, [isOpen, mode, role, companyId]);

  // Validação do formulário
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('companyRoles.validation.nameRequired');
    } else if (formData.name.length < 3) {
      newErrors.name = t('companyRoles.validation.nameMinLength');
    } else if (formData.name.length > 50) {
      newErrors.name = t('companyRoles.validation.nameMaxLength');
    }

    if (formData.description && formData.description.length > 255) {
      newErrors.description = t('companyRoles.validation.descriptionMaxLength');
    }

    // Validar se pelo menos uma permissão foi selecionada
    const hasPermissions = Object.values(permissions).some(modulePermissions =>
      typeof modulePermissions === 'object' &&
      Object.values(modulePermissions).some(Boolean)
    );

    if (!hasPermissions) {
      newErrors.permissions = t('companyRoles.validation.permissionsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, permissions, t]);

  // Handler para salvar
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      if (mode === 'clone' && onClone) {
        await onClone({
          name: formData.name,
          contextType: formData.contextType,
          branchId: formData.branchId
        });
      } else {
        const data = {
          name: formData.name,
          description: formData.description,
          contextType: formData.contextType,
          contextId: formData.contextId,
          applicationId: formData.applicationId,
          permissions
        };

        await onSave(data);
      }
      onClose();
    } catch (error) {
      console.error('Save role error:', error);
    }
  }, [formData, permissions, mode, onSave, onClone, onClose, validateForm]);

  // Handler para mudanças nos campos
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando ele for modificado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Título do modal baseado no modo
  const getModalTitle = (): string => {
    switch (mode) {
      case 'create':
        return t('companyRoles.modal.createTitle');
      case 'edit':
        return t('companyRoles.modal.editTitle');
      case 'clone':
        return t('companyRoles.modal.cloneTitle');
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {getModalTitle()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Indicador de Passos */}
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 mx-2 ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-500'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Conteúdo do Modal */}
        <div className="pb-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-900">
                {t('companyRoles.modal.basicInfoTitle')}
              </h4>

              {/* Nome do Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('companyRoles.fields.name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('companyRoles.placeholders.roleName')}
                  disabled={isLoading}
                  maxLength={50}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('companyRoles.fields.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('companyRoles.placeholders.roleDescription')}
                  disabled={isLoading}
                  maxLength={255}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Tipo de Contexto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('companyRoles.fields.contextType')} *
                </label>
                <select
                  value={formData.contextType}
                  onChange={(e) => handleFieldChange('contextType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading || mode === 'edit'}
                >
                  <option value="COMPANY">{t('companyRoles.contextTypes.company')}</option>
                  <option value="BRANCH">{t('companyRoles.contextTypes.branch')}</option>
                  <option value="APPLICATION">{t('companyRoles.contextTypes.application')}</option>
                </select>
              </div>

              {/* Informação sobre Role do Sistema */}
              {mode === 'edit' && role?.isSystemRole && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h5 className="text-sm font-medium text-yellow-800">
                        {t('companyRoles.warnings.systemRole')}
                      </h5>
                      <p className="text-sm text-yellow-700 mt-1">
                        {t('companyRoles.warnings.systemRoleDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">
                  {t('companyRoles.modal.permissionsTitle')}
                </h4>
                <span className="text-sm text-gray-600">
                  {t('companyRoles.modal.permissionsDescription')}
                </span>
              </div>

              {errors.permissions && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{errors.permissions}</p>
                </div>
              )}

              <PermissionMatrix
                permissions={permissions}
                onChange={setPermissions}
                readOnly={isLoading || (mode === 'edit' && role?.isSystemRole)}
                showModuleHeaders={true}
                className="max-h-96 overflow-y-auto"
              />
            </div>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {t('companyRoles.actions.previous')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {t('companyRoles.actions.cancel')}
            </button>

            {currentStep === 1 ? (
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading || !formData.name.trim()}
              >
                {t('companyRoles.actions.next')}
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                  </svg>
                )}
                {mode === 'create' && t('companyRoles.actions.createRole')}
                {mode === 'edit' && t('companyRoles.actions.saveChanges')}
                {mode === 'clone' && t('companyRoles.actions.cloneRole')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}