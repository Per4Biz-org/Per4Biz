// ===============================================
// 🔲 PermissionMatrix Component
// Matriz visual para gerenciamento de permissões
// Implementa seção 6.3 da documentação técnica
// ===============================================

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ModulePermissions } from '../../types/company-roles';

interface PermissionMatrixProps {
  permissions: ModulePermissions;
  onChange?: (permissions: ModulePermissions) => void;
  readOnly?: boolean;
  compact?: boolean;
  showModuleHeaders?: boolean;
  highlightChanges?: boolean;
  className?: string;
}

interface PermissionChange {
  module: string;
  permission: string;
  oldValue: boolean;
  newValue: boolean;
}

/**
 * Componente de matriz de permissões interativa
 * Permite visualizar e editar permissões por módulo
 */
export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  permissions,
  onChange,
  readOnly = false,
  compact = false,
  showModuleHeaders = true,
  highlightChanges = false,
  className = ''
}) => {
  const { t } = useTranslation();
  const [changes, setChanges] = useState<PermissionChange[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Definição dos módulos e suas permissões
  const moduleDefinitions = useMemo(() => ({
    usuarios: {
      name: t('company-roles.modules.usuarios.name'),
      permissions: {
        criar: t('company-roles.modules.usuarios.permissions.criar'),
        editar: t('company-roles.modules.usuarios.permissions.editar'),
        excluir: t('company-roles.modules.usuarios.permissions.excluir'),
        visualizar: t('company-roles.modules.usuarios.permissions.visualizar'),
        gerenciarRoles: t('company-roles.modules.usuarios.permissions.gerenciarRoles')
      }
    },
    financeiro: {
      name: t('company-roles.modules.financeiro.name'),
      permissions: {
        criarTransacao: t('company-roles.modules.financeiro.permissions.criarTransacao'),
        editarTransacao: t('company-roles.modules.financeiro.permissions.editarTransacao'),
        excluirTransacao: t('company-roles.modules.financeiro.permissions.excluirTransacao'),
        visualizarRelatorios: t('company-roles.modules.financeiro.permissions.visualizarRelatorios'),
        gerenciarOrcamentos: t('company-roles.modules.financeiro.permissions.gerenciarOrcamentos'),
        aprovarTransacoes: t('company-roles.modules.financeiro.permissions.aprovarTransacoes')
      }
    },
    configuracoes: {
      name: t('company-roles.modules.configuracoes.name'),
      permissions: {
        gerenciarEmpresa: t('company-roles.modules.configuracoes.permissions.gerenciarEmpresa'),
        gerenciarFiliais: t('company-roles.modules.configuracoes.permissions.gerenciarFiliais'),
        configurarSistema: t('company-roles.modules.configuracoes.permissions.configurarSistema'),
        gerenciarIntegracoes: t('company-roles.modules.configuracoes.permissions.gerenciarIntegracoes')
      }
    },
    auditoria: {
      name: t('company-roles.modules.auditoria.name'),
      permissions: {
        visualizarLogs: t('company-roles.modules.auditoria.permissions.visualizarLogs'),
        exportarRelatorios: t('company-roles.modules.auditoria.permissions.exportarRelatorios'),
        configurarAlertas: t('company-roles.modules.auditoria.permissions.configurarAlertas')
      }
    }
  }), [t]);

  // Alternar permissão
  const togglePermission = (module: string, permission: string) => {
    if (readOnly || !onChange) return;

    const currentValue = permissions[module as keyof ModulePermissions]?.[permission] || false;
    const newValue = !currentValue;

    // Registrar mudança se highlightChanges estiver ativo
    if (highlightChanges) {
      setChanges(prev => {
        const existingChange = prev.find(c => c.module === module && c.permission === permission);
        if (existingChange) {
          // Remover se voltar ao valor original
          if (existingChange.oldValue === newValue) {
            return prev.filter(c => !(c.module === module && c.permission === permission));
          }
          // Atualizar valor
          return prev.map(c =>
            c.module === module && c.permission === permission
              ? { ...c, newValue }
              : c
          );
        }
        // Adicionar nova mudança
        return [...prev, { module, permission, oldValue: currentValue, newValue }];
      });
    }

    // Atualizar permissões
    const updatedPermissions = {
      ...permissions,
      [module]: {
        ...permissions[module as keyof ModulePermissions],
        [permission]: newValue
      }
    };

    onChange(updatedPermissions);
  };

  // Alternar todos as permissões de um módulo
  const toggleModulePermissions = (module: string, enable: boolean) => {
    if (readOnly || !onChange) return;

    const modulePerms = moduleDefinitions[module as keyof typeof moduleDefinitions];
    if (!modulePerms) return;

    const updatedModulePermissions = Object.keys(modulePerms.permissions).reduce((acc, perm) => ({
      ...acc,
      [perm]: enable
    }), {});

    const updatedPermissions = {
      ...permissions,
      [module]: updatedModulePermissions
    };

    onChange(updatedPermissions);
  };

  // Alternar expansão do módulo
  const toggleModuleExpansion = (module: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  // Contar permissões ativas por módulo
  const getActivePermissionsCount = (module: string) => {
    const modulePerms = permissions[module as keyof ModulePermissions] || {};
    return Object.values(modulePerms).filter(Boolean).length;
  };

  // Verificar se mudança está destacada
  const isPermissionChanged = (module: string, permission: string) => {
    return changes.some(c => c.module === module && c.permission === permission);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {t('company-roles.permissions.matrix.title')}
          </h3>
          {highlightChanges && changes.length > 0 && (
            <span className="text-sm text-orange-600 font-medium">
              {changes.length} {t('company-roles.permissions.matrix.changesCount')}
            </span>
          )}
        </div>
      </div>

      {/* Matrix Content */}
      <div className="p-4">
        {Object.entries(moduleDefinitions).map(([moduleKey, moduleData]) => {
          const isExpanded = expandedModules.has(moduleKey);
          const activeCount = getActivePermissionsCount(moduleKey);
          const totalCount = Object.keys(moduleData.permissions).length;
          const isFullyEnabled = activeCount === totalCount;
          const isPartiallyEnabled = activeCount > 0 && activeCount < totalCount;

          return (
            <div key={moduleKey} className="mb-4 last:mb-0">
              {/* Module Header */}
              {showModuleHeaders && (
                <div
                  className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors ${
                    compact ? 'mb-2' : 'mb-3'
                  }`}
                  onClick={() => toggleModuleExpansion(moduleKey)}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg
                        className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <h4 className="font-medium text-gray-900">{moduleData.name}</h4>

                    <span className="text-sm text-gray-500">
                      {activeCount}/{totalCount} {t('company-roles.permissions.active')}
                    </span>

                    {/* Status indicator */}
                    <div className={`w-3 h-3 rounded-full ${
                      isFullyEnabled ? 'bg-green-400' :
                      isPartiallyEnabled ? 'bg-yellow-400' :
                      'bg-gray-300'
                    }`} />
                  </div>

                  {!readOnly && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModulePermissions(moduleKey, true);
                        }}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        {t('company-roles.permissions.matrix.enableAll')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModulePermissions(moduleKey, false);
                        }}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        {t('company-roles.permissions.matrix.disableAll')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Permissions Grid */}
              {(!showModuleHeaders || isExpanded) && (
                <div className={`grid gap-2 ${compact ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {Object.entries(moduleData.permissions).map(([permKey, permName]) => {
                    const isActive = permissions[moduleKey as keyof ModulePermissions]?.[permKey] || false;
                    const isChanged = isPermissionChanged(moduleKey, permKey);

                    return (
                      <label
                        key={permKey}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          readOnly ? 'cursor-default' : 'hover:bg-gray-50'
                        } ${
                          isActive ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                        } ${
                          isChanged ? 'ring-2 ring-orange-200 bg-orange-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => togglePermission(moduleKey, permKey)}
                          disabled={readOnly}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className={`text-sm ${isActive ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                          {permName}
                        </span>
                        {isChanged && (
                          <span className="ml-auto w-2 h-2 bg-orange-400 rounded-full" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {Object.values(permissions).reduce((total, modulePerms) =>
              total + Object.values(modulePerms || {}).filter(Boolean).length, 0
            )} {t('company-roles.permissions.matrix.totalActive')}
          </span>
          {highlightChanges && changes.length > 0 && (
            <button
              onClick={() => setChanges([])}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {t('company-roles.permissions.matrix.clearChanges')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente compacto da matriz de permissões
 */
export const PermissionMatrixCompact: React.FC<PermissionMatrixProps> = (props) => {
  return (
    <PermissionMatrix
      {...props}
      compact={true}
      showModuleHeaders={false}
    />
  );
};

/**
 * Visualizador simples de permissões (somente leitura)
 */
interface PermissionViewerProps {
  permissions: ModulePermissions;
  className?: string;
}

export const PermissionViewer: React.FC<PermissionViewerProps> = ({
  permissions,
  className = ''
}) => {
  return (
    <PermissionMatrix
      permissions={permissions}
      readOnly={true}
      compact={true}
      showModuleHeaders={true}
      className={className}
    />
  );
};

export default PermissionMatrix;