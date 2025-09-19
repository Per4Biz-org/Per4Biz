// ===============================================
// 📋 Company Roles Context
// Implementação conforme documentação técnica seção 9
// Estado global para sistema de roles empresariais
// ===============================================

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  Role,
  UserRoleAssignment,
  CompanyUserPermissions,
  ApiError,
  RoleQueryParams,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest
} from '../types/company-roles';
import { Branch } from '../services/BranchService';

// ===== INTERFACES DO ESTADO =====

interface CompanyRoleState {
  // Identificação da empresa
  companyId: number | null;

  // Roles da empresa
  roles: Role[];
  selectedRole: Role | null;
  loading: boolean;
  error: ApiError | null;

  // Paginação
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };

  // Roles por filial
  branchRoles: Record<number, Role[]>;

  // Permissões do usuário atual
  userPermissions: CompanyUserPermissions | null;

  // Filiais da empresa
  branches: Branch[];
  selectedBranch: Branch | null;

  // Cache de permissões
  permissionsCache: Record<string, boolean>;

  // Configurações
  settings: {
    autoRefresh: boolean;
    refreshInterval: number;
    pageSize: number;
  };
}

// ===== TIPOS DE AÇÕES =====

type CompanyRoleAction =
  | { type: 'SET_COMPANY_ID'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: ApiError | null }
  | { type: 'SET_ROLES'; payload: Role[] }
  | { type: 'ADD_ROLE'; payload: Role }
  | { type: 'UPDATE_ROLE'; payload: { id: number; role: Role } }
  | { type: 'REMOVE_ROLE'; payload: number }
  | { type: 'SELECT_ROLE'; payload: Role | null }
  | { type: 'SET_PAGINATION'; payload: Partial<CompanyRoleState['pagination']> }
  | { type: 'SET_BRANCH_ROLES'; payload: { branchId: number; roles: Role[] } }
  | { type: 'SET_USER_PERMISSIONS'; payload: CompanyUserPermissions | null }
  | { type: 'SET_BRANCHES'; payload: Branch[] }
  | { type: 'SELECT_BRANCH'; payload: Branch | null }
  | { type: 'CACHE_PERMISSION'; payload: { key: string; value: boolean } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<CompanyRoleState['settings']> }
  | { type: 'RESET_STATE' };

// ===== AÇÕES DO CONTEXTO =====

interface CompanyRoleActions {
  // Gerenciamento de roles
  fetchRoles: (params?: RoleQueryParams) => Promise<void>;
  createRole: (data: CreateRoleRequest) => Promise<Role | null>;
  updateRole: (roleId: number, data: UpdateRoleRequest) => Promise<Role | null>;
  deleteRole: (roleId: number) => Promise<boolean>;
  selectRole: (role: Role | null) => void;

  // Gerenciamento de permissões
  loadUserPermissions: (userId: number, branchId?: number) => Promise<void>;
  checkPermission: (permission: string, branchId?: number) => boolean;
  refreshPermissions: () => Promise<void>;

  // Gerenciamento de filiais
  loadBranches: () => Promise<void>;
  selectBranch: (branch: Branch | null) => void;
  loadBranchRoles: (branchId: number) => Promise<void>;

  // Configurações
  updateSettings: (settings: Partial<CompanyRoleState['settings']>) => void;

  // Utilitários
  clearError: () => void;
  resetState: () => void;
  refetch: () => Promise<void>;
}

// ===== ESTADO INICIAL =====

const initialState: CompanyRoleState = {
  companyId: null,
  roles: [],
  selectedRole: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    size: 25,
    total: 0,
    totalPages: 0
  },
  branchRoles: {},
  userPermissions: null,
  branches: [],
  selectedBranch: null,
  permissionsCache: {},
  settings: {
    autoRefresh: false,
    refreshInterval: 300000, // 5 minutos
    pageSize: 25
  }
};

// ===== REDUCER =====

function companyRoleReducer(
  state: CompanyRoleState,
  action: CompanyRoleAction
): CompanyRoleState {
  switch (action.type) {
    case 'SET_COMPANY_ID':
      return {
        ...state,
        companyId: action.payload,
        // Limpar dados da empresa anterior
        roles: [],
        selectedRole: null,
        branchRoles: {},
        userPermissions: null,
        branches: [],
        selectedBranch: null,
        permissionsCache: {}
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_ROLES':
      return { ...state, roles: action.payload };

    case 'ADD_ROLE':
      return {
        ...state,
        roles: [action.payload, ...state.roles]
      };

    case 'UPDATE_ROLE':
      return {
        ...state,
        roles: state.roles.map(role =>
          role.id === action.payload.id ? action.payload.role : role
        ),
        selectedRole: state.selectedRole?.id === action.payload.id
          ? action.payload.role
          : state.selectedRole
      };

    case 'REMOVE_ROLE':
      return {
        ...state,
        roles: state.roles.filter(role => role.id !== action.payload),
        selectedRole: state.selectedRole?.id === action.payload
          ? null
          : state.selectedRole
      };

    case 'SELECT_ROLE':
      return { ...state, selectedRole: action.payload };

    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };

    case 'SET_BRANCH_ROLES':
      return {
        ...state,
        branchRoles: {
          ...state.branchRoles,
          [action.payload.branchId]: action.payload.roles
        }
      };

    case 'SET_USER_PERMISSIONS':
      return { ...state, userPermissions: action.payload };

    case 'SET_BRANCHES':
      return { ...state, branches: action.payload };

    case 'SELECT_BRANCH':
      return { ...state, selectedBranch: action.payload };

    case 'CACHE_PERMISSION':
      return {
        ...state,
        permissionsCache: {
          ...state.permissionsCache,
          [action.payload.key]: action.payload.value
        }
      };

    case 'CLEAR_CACHE':
      return { ...state, permissionsCache: {} };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// ===== CONTEXTO =====

const CompanyRoleContext = createContext<
  (CompanyRoleState & CompanyRoleActions) | undefined
>(undefined);

// ===== PROVIDER =====

interface CompanyRoleProviderProps {
  children: ReactNode;
  companyId?: number;
}

export function CompanyRoleProvider({
  children,
  companyId
}: CompanyRoleProviderProps) {
  const [state, dispatch] = useReducer(companyRoleReducer, {
    ...initialState,
    companyId: companyId || null
  });

  // ===== IMPORTAÇÕES DE SERVIÇOS =====
  // Nota: Seria melhor injetar estes como dependências
  const { CompanyRoleService } = require('../services/CompanyRoleService');
  const { EmployeeRoleService } = require('../services/EmployeeRoleService');
  const { BranchService } = require('../services/BranchService');

  const roleService = new CompanyRoleService();
  const employeeService = new EmployeeRoleService();
  const branchService = new BranchService();

  // ===== IMPLEMENTAÇÃO DAS AÇÕES =====

  const fetchRoles = async (params?: RoleQueryParams): Promise<void> => {
    if (!state.companyId) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await roleService.listCompanyRoles(state.companyId, params);

      if (response.success && response.data) {
        dispatch({ type: 'SET_ROLES', payload: response.data.data });
        dispatch({ type: 'SET_PAGINATION', payload: response.data.pagination });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || {
          code: 'FETCH_FAILED',
          message: 'Erro ao carregar roles'
        }});
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: {
        code: 'FETCH_ERROR',
        message: 'Erro de comunicação',
        details: error
      }});
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createRole = async (data: CreateRoleRequest): Promise<Role | null> => {
    if (!state.companyId) return null;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await roleService.createCompanyRole(state.companyId, data);

      if (response.success && response.data) {
        dispatch({ type: 'ADD_ROLE', payload: response.data });
        return response.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || {
          code: 'CREATE_FAILED',
          message: 'Erro ao criar role'
        }});
        return null;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: {
        code: 'CREATE_ERROR',
        message: 'Erro ao criar role',
        details: error
      }});
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateRole = async (
    roleId: number,
    data: UpdateRoleRequest
  ): Promise<Role | null> => {
    if (!state.companyId) return null;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await roleService.updateCompanyRole(state.companyId, roleId, data);

      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_ROLE', payload: { id: roleId, role: response.data } });
        return response.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || {
          code: 'UPDATE_FAILED',
          message: 'Erro ao atualizar role'
        }});
        return null;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: {
        code: 'UPDATE_ERROR',
        message: 'Erro ao atualizar role',
        details: error
      }});
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteRole = async (roleId: number): Promise<boolean> => {
    if (!state.companyId) return false;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await roleService.deleteCompanyRole(state.companyId, roleId);

      if (response.success) {
        dispatch({ type: 'REMOVE_ROLE', payload: roleId });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || {
          code: 'DELETE_FAILED',
          message: 'Erro ao deletar role'
        }});
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: {
        code: 'DELETE_ERROR',
        message: 'Erro ao deletar role',
        details: error
      }});
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const selectRole = (role: Role | null): void => {
    dispatch({ type: 'SELECT_ROLE', payload: role });
  };

  const loadUserPermissions = async (
    userId: number,
    branchId?: number
  ): Promise<void> => {
    if (!state.companyId) return;

    try {
      const response = await employeeService.getEmployeePermissions(
        state.companyId,
        userId,
        branchId
      );

      if (response.success && response.data) {
        dispatch({ type: 'SET_USER_PERMISSIONS', payload: response.data });
        // Limpar cache ao carregar novas permissões
        dispatch({ type: 'CLEAR_CACHE' });
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
    }
  };

  const checkPermission = (permission: string, branchId?: number): boolean => {
    if (!state.userPermissions) return false;

    const cacheKey = `${permission}_${branchId || 'general'}`;

    // Verificar cache primeiro
    if (cacheKey in state.permissionsCache) {
      return state.permissionsCache[cacheKey];
    }

    // Calcular permissão
    const [module, action] = permission.split('.');
    if (!module || !action) return false;

    let hasPermission = false;

    // Verificar permissão específica de filial
    if (branchId) {
      const branchRole = state.userPermissions.roles.find(role =>
        role.contextType === 'BRANCH' && role.contextId === branchId
      );

      if (branchRole) {
        const modulePermissions = branchRole.permissions[module];
        hasPermission = modulePermissions?.[action] === true;
      }
    }

    // Se não encontrou permissão específica, verificar permissão geral
    if (!hasPermission) {
      const modulePermissions = state.userPermissions.effectivePermissions[module];
      hasPermission = modulePermissions?.[action] === true;
    }

    // Cache do resultado
    dispatch({ type: 'CACHE_PERMISSION', payload: { key: cacheKey, value: hasPermission } });

    return hasPermission;
  };

  const refreshPermissions = async (): Promise<void> => {
    if (state.userPermissions) {
      await loadUserPermissions(state.userPermissions.userId);
    }
  };

  const loadBranches = async (): Promise<void> => {
    if (!state.companyId) return;

    try {
      const response = await branchService.listCompanyBranches(state.companyId, true);

      if (response.success && response.data) {
        dispatch({ type: 'SET_BRANCHES', payload: response.data });
      }
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const selectBranch = (branch: Branch | null): void => {
    dispatch({ type: 'SELECT_BRANCH', payload: branch });
  };

  const loadBranchRoles = async (branchId: number): Promise<void> => {
    if (!state.companyId) return;

    try {
      const response = await branchService.getBranchRoles(state.companyId, branchId);

      if (response.success && response.data) {
        dispatch({
          type: 'SET_BRANCH_ROLES',
          payload: { branchId, roles: response.data }
        });
      }
    } catch (error) {
      console.error('Error loading branch roles:', error);
    }
  };

  const updateSettings = (settings: Partial<CompanyRoleState['settings']>): void => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const resetState = (): void => {
    dispatch({ type: 'RESET_STATE' });
  };

  const refetch = async (): Promise<void> => {
    await fetchRoles();
    await loadBranches();
  };

  // ===== EFFECTS =====

  // Carregar dados iniciais quando companyId muda
  useEffect(() => {
    if (companyId && companyId !== state.companyId) {
      dispatch({ type: 'SET_COMPANY_ID', payload: companyId });
    }
  }, [companyId, state.companyId]);

  // Auto-refresh se habilitado
  useEffect(() => {
    if (state.settings.autoRefresh && state.companyId) {
      const interval = setInterval(() => {
        refetch();
      }, state.settings.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [state.settings.autoRefresh, state.settings.refreshInterval, state.companyId]);

  // ===== VALOR DO CONTEXTO =====

  const value = {
    ...state,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    selectRole,
    loadUserPermissions,
    checkPermission,
    refreshPermissions,
    loadBranches,
    selectBranch,
    loadBranchRoles,
    updateSettings,
    clearError,
    resetState,
    refetch
  };

  return (
    <CompanyRoleContext.Provider value={value}>
      {children}
    </CompanyRoleContext.Provider>
  );
}

// ===== HOOK PERSONALIZADO =====

export function useCompanyRoleContext() {
  const context = useContext(CompanyRoleContext);

  if (context === undefined) {
    throw new Error('useCompanyRoleContext deve ser usado dentro de um CompanyRoleProvider');
  }

  return context;
}

// ===== HOOKS UTILITÁRIOS =====

/**
 * Hook para verificação simples de permissão
 */
export function usePermission(permission: string, branchId?: number): boolean {
  const { checkPermission } = useCompanyRoleContext();
  return checkPermission(permission, branchId);
}

/**
 * Hook para roles da empresa
 */
export function useCompanyRoleState() {
  const context = useCompanyRoleContext();
  return {
    roles: context.roles,
    selectedRole: context.selectedRole,
    loading: context.loading,
    error: context.error,
    pagination: context.pagination
  };
}

/**
 * Hook para ações de roles
 */
export function useCompanyRoleActions() {
  const context = useCompanyRoleContext();
  return {
    fetchRoles: context.fetchRoles,
    createRole: context.createRole,
    updateRole: context.updateRole,
    deleteRole: context.deleteRole,
    selectRole: context.selectRole,
    refetch: context.refetch
  };
}