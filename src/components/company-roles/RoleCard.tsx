// ===============================================
// 🎴 RoleCard Component
// Card para exibição de informações de roles
// Implementa seção 6.2 da documentação técnica
// ===============================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Role, ContextType } from '../../types/company-roles';
import { format } from 'date-fns';
import { ptBR, fr, enUS } from 'date-fns/locale';

interface RoleCardProps {
  role: Role;
  onEdit?: (role: Role) => void;
  onDelete?: (roleId: number) => void;
  onView?: (role: Role) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Componente para exibir informações de um role em formato de card
 */
export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  compact = false,
  className = ''
}) => {
  const { t, i18n } = useTranslation();

  // Configurar locale para formatação de datas
  const dateLocale = i18n.language === 'pt' ? ptBR : i18n.language === 'fr' ? fr : enUS;

  // Contar permissões ativas
  const activePermissions = Object.values(role.permissions).reduce((count, modulePerms) => {
    return count + Object.values(modulePerms).filter(Boolean).length;
  }, 0);

  // Obter contexto legível
  const getContextDisplay = (contextType: ContextType, contextId: number) => {
    switch (contextType) {
      case 'company':
        return t('company-roles.context.company');
      case 'branch':
        return `${t('company-roles.context.branch')} #${contextId}`;
      case 'department':
        return `${t('company-roles.context.department')} #${contextId}`;
      case 'team':
        return `${t('company-roles.context.team')} #${contextId}`;
      default:
        return t('company-roles.context.unknown');
    }
  };

  // Obter cor do badge baseado no tipo de contexto
  const getContextBadgeColor = (contextType: ContextType) => {
    switch (contextType) {
      case 'company':
        return 'bg-purple-100 text-purple-800';
      case 'branch':
        return 'bg-blue-100 text-blue-800';
      case 'department':
        return 'bg-green-100 text-green-800';
      case 'team':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header do Card */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {role.name}
              </h3>
              {role.isSystemRole && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {t('company-roles.role.system')}
                </span>
              )}
            </div>

            {!compact && role.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {role.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getContextBadgeColor(role.contextType)}`}>
                {getContextDisplay(role.contextType, role.contextId)}
              </span>
              <span>{activePermissions} {t('company-roles.permissions.count')}</span>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-1 ml-4">
              {onView && (
                <button
                  onClick={() => onView(role)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('company-roles.actions.view')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}

              {onEdit && !role.isSystemRole && (
                <button
                  onClick={() => onEdit(role)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={t('company-roles.actions.edit')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              {onDelete && !role.isSystemRole && (
                <button
                  onClick={() => onDelete(role.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title={t('company-roles.actions.delete')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer do Card - Metadados */}
      {!compact && (
        <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <span>
            {t('company-roles.role.createdAt')}: {format(new Date(role.createdAt), 'dd/MM/yyyy', { locale: dateLocale })}
          </span>
          {role.updatedAt !== role.createdAt && (
            <span>
              {t('company-roles.role.updatedAt')}: {format(new Date(role.updatedAt), 'dd/MM/yyyy', { locale: dateLocale })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Variante compacta do RoleCard para listas
 */
export const RoleCardCompact: React.FC<RoleCardProps> = (props) => {
  return <RoleCard {...props} compact={true} />;
};

/**
 * Grid de RoleCards
 */
interface RoleCardGridProps {
  roles: Role[];
  onEdit?: (role: Role) => void;
  onDelete?: (roleId: number) => void;
  onView?: (role: Role) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export const RoleCardGrid: React.FC<RoleCardGridProps> = ({
  roles,
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyMessage
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {emptyMessage || t('company-roles.role.noRoles')}
        </h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles.map((role) => (
        <RoleCard
          key={role.id}
          role={role}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  );
};

export default RoleCard;