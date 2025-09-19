// ===============================================
// 🔧 RoleModal Component
// Modal para criação e edição de roles
// Implementa seção 3.2 da documentação técnica
// ===============================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Role, CreateRoleRequest, UpdateRoleRequest, ContextType, ModulePermissions } from '../../types/company-roles';
import { PermissionMatrix } from './PermissionMatrix';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  role?: Role | null;
  companyId: number;
  loading?: boolean;
}

interface FormData {
  name: string;
  description: string;
  contextType: ContextType;
  contextId: number;
  permissions: ModulePermissions;
}

interface FormErrors {
  name?: string;
  description?: string;
  contextId?: string;
  permissions?: string;
  general?: string;
}

/**
 * Modal para criação e edição de roles
 * Implementa o formulário especificado na seção 3.2
 */
export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  role,
  companyId,
  loading = false
}) => {
  const { t } = useTranslation();

  // Estados do formulário
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    contextType: 'company',
    contextId: companyId,
    permissions: {
      usuarios: {},
      financeiro: {},
      configuracoes: {},
      auditoria: {}
    }
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Determinar se é edição ou criação
  const isEditing = !!role;
  const modalTitle = isEditing
    ? t('company-roles.modal.editTitle')
    : t('company-roles.modal.createTitle');

  // Preencher formulário quando role for fornecido
  useEffect(() => {
    if (isOpen) {
      if (role) {
        setFormData({
          name: role.name,
          description: role.description || '',
          contextType: role.contextType,
          contextId: role.contextId,
          permissions: role.permissions
        });
      } else {
        // Reset para criação
        setFormData({
          name: '',
          description: '',
          contextType: 'company',
          contextId: companyId,
          permissions: {
            usuarios: {},
            financeiro: {},
            configuracoes: {},
            auditoria: {}
          }
        });
      }
      setErrors({});
      setHasChanges(false);
    }
  }, [isOpen, role, companyId]);

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Nome é obrigatório
    if (!formData.name.trim()) {
      newErrors.name = t('company-roles.validation.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('company-roles.validation.nameMinLength');
    } else if (formData.name.length > 100) {
      newErrors.name = t('company-roles.validation.nameMaxLength');
    }

    // Descrição tem limite
    if (formData.description && formData.description.length > 500) {
      newErrors.description = t('company-roles.validation.descriptionMaxLength');
    }

    // Context ID deve ser válido
    if (!formData.contextId || formData.contextId <= 0) {
      newErrors.contextId = t('company-roles.validation.contextIdRequired');
    }

    // Verificar se há pelo menos uma permissão selecionada
    const hasPermissions = Object.values(formData.permissions).some(modulePerms =>
      Object.values(modulePerms).some(Boolean)
    );

    if (!hasPermissions) {
      newErrors.permissions = t('company-roles.validation.permissionsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers do formulário
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);

    // Limpar erro do campo alterado
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePermissionsChange = (permissions: ModulePermissions) => {
    handleInputChange('permissions', permissions);
  };

  const handleContextTypeChange = (contextType: ContextType) => {
    setFormData(prev => ({
      ...prev,
      contextType,
      contextId: contextType === 'company' ? companyId : 0
    }));
    setHasChanges(true);
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setErrors({});

      if (isEditing && role) {
        // Atualização
        const updateData: UpdateRoleRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          permissions: formData.permissions
        };
        await onSave(updateData);
      } else {
        // Criação
        const createData: CreateRoleRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          contextType: formData.contextType,
          contextId: formData.contextId,
          permissions: formData.permissions
        };
        await onSave(createData);
      }

      onClose();
    } catch (error: any) {
      setErrors({
        general: error.message || t('company-roles.errors.saveFailed')
      });
    }
  };

  // Fechar com confirmação se houver mudanças
  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm(t('company-roles.confirmations.discardChanges'));
      if (!confirmed) return;
    }
    onClose();
  };

  // Não renderizar se modal não estiver aberto
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {modalTitle}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Erro geral */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* =============================================== */}
            {/* INFORMAÇÕES BÁSICAS                           */}
            {/* =============================================== */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">
                {t('company-roles.modal.basicInfo')}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome do Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('company-roles.fields.name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={t('company-roles.placeholders.name')}
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Tipo de Contexto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('company-roles.fields.contextType')}
                  </label>
                  <select
                    value={formData.contextType}
                    onChange={(e) => handleContextTypeChange(e.target.value as ContextType)}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading || isEditing} // Não permitir alterar contexto ao editar
                  >
                    <option value="company">{t('company-roles.context.company')}</option>
                    <option value="branch">{t('company-roles.context.branch')}</option>
                    <option value="department">{t('company-roles.context.department')}</option>
                    <option value="team">{t('company-roles.context.team')}</option>
                  </select>
                </div>
              </div>

              {/* Context ID */}
              {formData.contextType !== 'company' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('company-roles.fields.contextId')} *
                  </label>
                  <input
                    type="number"
                    value={formData.contextId || ''}
                    onChange={(e) => handleInputChange('contextId', parseInt(e.target.value) || 0)}
                    className={`block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contextId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={t('company-roles.placeholders.contextId')}
                    disabled={loading || isEditing}
                    min="1"
                  />
                  {errors.contextId && (
                    <p className="mt-1 text-sm text-red-600">{errors.contextId}</p>
                  )}
                </div>
              )}

              {/* Descrição */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('company-roles.fields.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={t('company-roles.placeholders.description')}
                  disabled={loading}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/500 {t('company-roles.limits.characters')}
                </p>
              </div>
            </div>

            {/* =============================================== */}
            {/* MATRIZ DE PERMISSÕES                          */}
            {/* =============================================== */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                {t('company-roles.modal.permissions')} *
              </h4>

              {errors.permissions && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{errors.permissions}</p>
                </div>
              )}

              <PermissionMatrix
                permissions={formData.permissions}
                onChange={handlePermissionsChange}
                readOnly={loading}
                highlightChanges={true}
              />
            </div>

            {/* =============================================== */}
            {/* AÇÕES DO MODAL                                */}
            {/* =============================================== */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                disabled={loading}
              >
                {t('company-roles.actions.cancel')}
              </button>

              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !hasChanges}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('company-roles.actions.saving')}
                  </div>
                ) : (
                  t(isEditing ? 'company-roles.actions.save' : 'company-roles.actions.create')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;