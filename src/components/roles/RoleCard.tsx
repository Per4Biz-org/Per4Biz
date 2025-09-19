// ===============================================
// 📋 Role Card Component
// Implementação conforme documentação técnica seção 6.1
// Card para exibição de informações de role
// ===============================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Role, ContextType } from '../../types/company-roles';

interface RoleCardProps {
  role: Role;
  onEdit?: (role: Role) => void;
  onDelete?: (roleId: number) => void;
  onClone?: (role: Role) => void;
  onViewAssignments?: (roleId: number) => void;
  showActions?: boolean;
  isLoading?: boolean;
  className?: string;
}

/**
 * Componente de card para exibição de roles
 * Implementa design conforme documentação seção 6.1
 */
export function RoleCard({
  role,
  onEdit,
  onDelete,
  onClone,
  onViewAssignments,
  showActions = true,
  isLoading = false,
  className = ''
}: RoleCardProps) {
  const { t } = useTranslation();

  const getContextBadgeColor = (contextType: ContextType): string => {
    switch (contextType) {
      case 'COMPANY':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BRANCH':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'APPLICATION':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPermissionCount = (): number => {
    let count = 0;
    Object.values(role.permissions).forEach(modulePermissions => {
      if (typeof modulePermissions === 'object') {
        count += Object.values(modulePermissions).filter(Boolean).length;
      }
    });
    return count;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors p-6 ${className}`}>
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {role.name}
          </h3>
          {role.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {role.description}
            </p>
          )}
        </div>

        {role.isSystemRole && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            {t('companyRoles.labels.systemRole')}
          </span>
        )}
      </div>

      {/* Metadados */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getContextBadgeColor(role.contextType)}`}>
          {t(`companyRoles.contextTypes.${role.contextType.toLowerCase()}`)}
        </span>

        <span className="text-sm text-gray-500">
          {getPermissionCount()} {t('companyRoles.labels.permissions')}
        </span>
      </div>

      {/* Informações de Data */}
      <div className="text-xs text-gray-500 mb-4">
        <div>
          {t('companyRoles.labels.createdAt')}: {new Date(role.createdAt).toLocaleDateString()}
        </div>
        {role.updatedAt !== role.createdAt && (
          <div>
            {t('companyRoles.labels.updatedAt')}: {new Date(role.updatedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Ações */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() => onViewAssignments?.(role.id)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {t('companyRoles.actions.viewAssignments')}
          </button>

          <div className="flex items-center gap-2">
            {onClone && (
              <button
                onClick={() => onClone(role)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title={t('companyRoles.actions.clone')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(role)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title={t('companyRoles.actions.edit')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            {onDelete && !role.isSystemRole && (
              <button
                onClick={() => onDelete(role.id)}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                title={t('companyRoles.actions.delete')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}