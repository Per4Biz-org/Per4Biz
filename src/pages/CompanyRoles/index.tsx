// ===============================================
// 📋 Página Principal - Gerenciamento de Roles
// Rota: /company/roles
// ===============================================

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { menuItemsAdministracao } from '../../config/menuConfig';
import { useMockCompanyRoles } from '../../hooks/useMockCompanyRoles';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../../types/company-roles';
import {
  Shield,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  Users,
  Building,
  Crown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

const CompanyRolesPage: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContext, setSelectedContext] = useState<'COMPANY' | 'BRANCH' | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setMenuItems(menuItemsAdministracao);
  }, [setMenuItems]);

  // TODO: Obter companyId do contexto de autenticação
  const companyId = 1;

  // Usar hook mock para desenvolvimento
  const { roles: mockRoles, loading, error } = useMockCompanyRoles(companyId);

  // Filtros
  const filteredRoles = mockRoles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesContext = selectedContext === 'ALL' || role.contextType === selectedContext;
    return matchesSearch && matchesContext;
  });

  // Paginação
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + itemsPerPage);

  const handleCreateRole = () => {
    setEditingRole(null);
    setShowModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowModal(true);
  };

  const handleDeleteRole = (roleId: number) => {
    if (confirm('Tem certeza que deseja excluir este papel?')) {
      console.log('Deletando role:', roleId);
      // TODO: Implementar deleção
    }
  };

  const handleViewRole = (role: Role) => {
    console.log('Visualizando role:', role);
    // TODO: Implementar visualização detalhada
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName.includes('Administrador')) return Crown;
    if (roleName.includes('Gerente') || roleName.includes('Supervisor')) return Shield;
    return Users;
  };

  const getRoleBadge = (contextType: string, isSystem: boolean) => {
    if (isSystem) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <Shield className="w-3 h-3" />
          Sistema
        </span>
      );
    }

    if (contextType === 'COMPANY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Building className="w-3 h-3" />
          Empresa
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
        <Users className="w-3 h-3" />
        Filial
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Carregando papéis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-xl border border-slate-200/60">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Erro ao carregar papéis</h3>
          <p className="text-slate-600 mb-8">Não foi possível carregar os papéis da empresa</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header Moderno */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600 rounded-xl blur-sm opacity-25"></div>
                  <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Gestão de Papéis
                  </h1>
                  <p className="text-slate-600 mt-1 text-lg">
                    Configure papéis e permissões empresariais
                  </p>
                </div>
              </div>

              <button
                onClick={handleCreateRole}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Novo Papel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar papéis por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Filtro de Contexto */}
            <div className="lg:w-48">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={selectedContext}
                  onChange={(e) => setSelectedContext(e.target.value as 'COMPANY' | 'BRANCH' | 'ALL')}
                  className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="ALL">Todos os contextos</option>
                  <option value="COMPANY">Empresa</option>
                  <option value="BRANCH">Filial</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{filteredRoles.length} papéis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Cards dos Papéis */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {paginatedRoles.map((role) => {
            const RoleIcon = getRoleIcon(role.name);
            return (
              <div
                key={role.id}
                className="group relative bg-white rounded-2xl border border-slate-200/60 hover:border-slate-300/60 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-transparent rounded-2xl"></div>

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                        <RoleIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg leading-tight">
                          {role.name}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                          {role.description}
                        </p>
                      </div>
                    </div>

                    {/* Actions Dropdown */}
                    <div className="relative">
                      <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-4">
                    {getRoleBadge(role.contextType, role.isSystemRole)}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                      <Users className="w-3 h-3" />
                      {Math.floor(Math.random() * 20) + 1} usuários
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleViewRole(role)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100 transition-all duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>

                    {!role.isSystemRole && (
                      <>
                        <button
                          onClick={() => handleEditRole(role)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-all duration-200"
                        >
                          <Edit3 className="w-4 h-4" />
                          Editar
                        </button>

                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-all duration-200"
                          title="Excluir papel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredRoles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              {searchTerm ? 'Nenhum papel encontrado' : 'Nenhum papel criado'}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchTerm
                ? 'Tente ajustar os filtros ou criar um novo papel'
                : 'Comece criando papéis personalizados para organizar as permissões da sua empresa'
              }
            </p>
            <button
              onClick={handleCreateRole}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Papel
            </button>
          </div>
        )}

        {/* Paginação Moderna */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredRoles.length)} de {filteredRoles.length} papéis
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Moderno */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowModal(false)}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto transform transition-all">
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {editingRole ? 'Editar Papel' : 'Novo Papel'}
                      </h3>
                      <p className="text-slate-600">
                        {editingRole ? 'Modifique as configurações do papel' : 'Configure um novo papel empresarial'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-8">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">
                    Formulário em Desenvolvimento
                  </h4>
                  <p className="text-slate-600 mb-2">
                    O formulário completo de criação/edição de papéis será implementado
                  </p>
                  <p className="text-sm text-slate-500">
                    Incluirá campos para nome, descrição, contexto e permissões específicas
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-slate-50/50 rounded-b-2xl border-t border-slate-200/60">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Salvar Papel
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyRolesPage;