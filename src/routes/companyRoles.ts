// ===============================================
// 🛣️ Rotas do Sistema de Company Roles
// Para integrar no sistema de rotas existente
// ===============================================

import { lazy } from 'react';

// Lazy loading dos componentes
const CompanyRolesPage = lazy(() => import('../pages/CompanyRoles'));
const EmployeeRolesPage = lazy(() => import('../pages/EmployeeRoles'));
const PermissionsDashboardPage = lazy(() => import('../pages/PermissionsDashboard'));

export const companyRolesRoutes = [
  // Gestão de Roles da Empresa
  {
    path: '/company/roles',
    component: CompanyRolesPage,
    title: 'Gerenciamento de Papéis',
    description: 'Gerir papéis e permissões da empresa',
    requiredPermissions: ['company.roles.read'],
    icon: '🏢'
  },

  // Dashboard de Permissões
  {
    path: '/company/permissions/dashboard',
    component: PermissionsDashboardPage,
    title: 'Dashboard de Permissões',
    description: 'Visão geral das permissões da empresa',
    requiredPermissions: ['company.dashboard.view'],
    icon: '📊'
  },

  // Gestão de Roles do Funcionário
  {
    path: '/employees/:employeeId/roles',
    component: EmployeeRolesPage,
    title: 'Papéis do Funcionário',
    description: 'Gerenciar papéis de um funcionário específico',
    requiredPermissions: ['company.employees.manage_roles'],
    icon: '👥'
  }
];

// Menu items para navegação
export const companyRolesMenuItems = [
  {
    title: 'Sistema de Permissões',
    items: [
      {
        title: 'Gerenciar Papéis',
        path: '/company/roles',
        icon: '🏢',
        description: 'Criar e gerenciar papéis da empresa'
      },
      {
        title: 'Dashboard',
        path: '/company/permissions/dashboard',
        icon: '📊',
        description: 'Visão geral das permissões'
      }
    ]
  }
];

export default companyRolesRoutes;