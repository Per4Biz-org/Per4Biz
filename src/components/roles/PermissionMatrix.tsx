// ===============================================
// 📋 Permission Matrix Component
// Implementação conforme documentação técnica seção 6.2
// Matriz visual para configuração de permissões
// ===============================================

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ModulePermissions } from '../../types/company-roles';

interface PermissionMatrixProps {
  permissions: ModulePermissions;
  onChange?: (permissions: ModulePermissions) => void;
  readOnly?: boolean;
  compact?: boolean;
  showModuleHeaders?: boolean;
  className?: string;
}

interface ModuleConfig {
  key: string;
  label: string;
  actions: string[];
  description?: string;
}

/**
 * Componente de matriz de permissões
 * Implementa interface conforme documentação seção 6.2
 */
export function PermissionMatrix({
  permissions,
  onChange,
  readOnly = false,
  compact = false,
  showModuleHeaders = true,
  className = ''
}: PermissionMatrixProps) {
  const { t } = useTranslation();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Configuração dos módulos disponíveis conforme documentação
  const moduleConfigs: ModuleConfig[] = [
    {
      key: 'users',
      label: t('companyRoles.modules.users'),
      actions: ['view', 'create', 'edit', 'delete', 'assign_roles'],
      description: t('companyRoles.moduleDescriptions.users')
    },
    {
      key: 'roles',
      label: t('companyRoles.modules.roles'),
      actions: ['view', 'create', 'edit', 'delete', 'clone'],
      description: t('companyRoles.moduleDescriptions.roles')
    },
    {
      key: 'finance',
      label: t('companyRoles.modules.finance'),
      actions: ['view', 'create', 'edit', 'delete', 'approve'],
      description: t('companyRoles.moduleDescriptions.finance')
    },
    {
      key: 'reports',
      label: t('companyRoles.modules.reports'),
      actions: ['view', 'create', 'export', 'share'],
      description: t('companyRoles.moduleDescriptions.reports')
    },
    {
      key: 'settings',
      label: t('companyRoles.modules.settings'),
      actions: ['view', 'edit', 'system_config'],
      description: t('companyRoles.moduleDescriptions.settings')
    }
  ];

  const toggleModule = useCallback((moduleKey: string) => {
    if (compact) return;

    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleKey)) {
        newSet.delete(moduleKey);
      } else {
        newSet.add(moduleKey);
      }
      return newSet;
    });
  }, [compact]);

  const handlePermissionChange = useCallback((
    moduleKey: string,
    action: string,
    value: boolean
  ) => {
    if (readOnly || !onChange) return;

    const newPermissions = { ...permissions };
    if (!newPermissions[moduleKey]) {
      newPermissions[moduleKey] = {};
    }
    newPermissions[moduleKey][action] = value;
    onChange(newPermissions);
  }, [permissions, onChange, readOnly]);

  const handleModuleToggle = useCallback((
    moduleKey: string,
    moduleActions: string[]
  ) => {
    if (readOnly || !onChange) return;

    const modulePermissions = permissions[moduleKey] || {};
    const hasAnyPermission = moduleActions.some(action => modulePermissions[action]);

    const newPermissions = { ...permissions };
    newPermissions[moduleKey] = {};

    moduleActions.forEach(action => {
      newPermissions[moduleKey][action] = !hasAnyPermission;
    });

    onChange(newPermissions);
  }, [permissions, onChange, readOnly]);

  const getModulePermissionCount = useCallback((
    moduleKey: string,
    moduleActions: string[]
  ): number => {
    const modulePermissions = permissions[moduleKey] || {};
    return moduleActions.filter(action => modulePermissions[action]).length;
  }, [permissions]);

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {moduleConfigs.map(module => {
          const permissionCount = getModulePermissionCount(module.key, module.actions);
          const totalActions = module.actions.length;

          return (
            <div key={module.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{module.label}</h4>
                <p className="text-sm text-gray-600">
                  {permissionCount}/{totalActions} {t('companyRoles.labels.permissions')}
                </p>
              </div>

              {!readOnly && (
                <button
                  onClick={() => handleModuleToggle(module.key, module.actions)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    permissionCount > 0
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {permissionCount > 0 ? t('companyRoles.actions.removeAll') : t('companyRoles.actions.addAll')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {moduleConfigs.map(module => {
        const isExpanded = expandedModules.has(module.key);
        const permissionCount = getModulePermissionCount(module.key, module.actions);
        const modulePermissions = permissions[module.key] || {};

        return (
          <div key={module.key} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header do Módulo */}
            {showModuleHeaders && (
              <div
                className={`px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer select-none ${
                  !readOnly ? 'hover:bg-gray-100' : ''
                }`}
                onClick={() => toggleModule(module.key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{module.label}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        permissionCount > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {permissionCount}/{module.actions.length}
                      </span>
                    </div>
                    {module.description && (
                      <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!readOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModuleToggle(module.key, module.actions);
                        }}
                        className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        {permissionCount > 0 ? t('companyRoles.actions.removeAll') : t('companyRoles.actions.addAll')}
                      </button>
                    )}

                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Permissões */}
            {(isExpanded || !showModuleHeaders) && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {module.actions.map(action => {
                    const isChecked = Boolean(modulePermissions[action]);

                    return (
                      <label
                        key={action}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isChecked
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handlePermissionChange(module.key, action, e.target.checked)}
                          disabled={readOnly}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {t(`companyRoles.actions.${action}`)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {t(`companyRoles.actionDescriptions.${action}`)}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}