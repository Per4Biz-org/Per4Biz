// ===============================================
// 🛡️ Página Principal - Administração
// Rota: /admin
// ===============================================

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../../context/MenuContext';
import { menuItemsAdministracao } from '../../config/menuConfig';
import { Shield, UserCheck, BarChart3, Users, ArrowUpRight, Lock, Activity, UserCircle2 } from 'lucide-react';

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();

  useEffect(() => {
    setMenuItems(menuItemsAdministracao);
  }, [setMenuItems]);

  const adminSections = [
    {
      icon: UserCheck,
      title: 'Gestão de Papéis',
      description: 'Configure papéis e permissões empresariais',
      path: '/company/roles',
      gradient: 'from-blue-600 to-blue-700',
      bgGradient: 'from-blue-50 to-blue-100',
      stats: { value: '12', label: 'Papéis ativos' }
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analytics',
      description: 'Métricas e insights de permissões',
      path: '/company/permissions/dashboard',
      gradient: 'from-emerald-600 to-emerald-700',
      bgGradient: 'from-emerald-50 to-emerald-100',
      stats: { value: '98%', label: 'Conformidade' }
    },
    {
      icon: Users,
      title: 'Colaboradores',
      description: 'Gerencie equipe e atribuições',
      path: '/employes',
      gradient: 'from-violet-600 to-violet-700',
      bgGradient: 'from-violet-50 to-violet-100',
      stats: { value: '45', label: 'Usuários' }
    }
  ];

  const securityFeatures = [
    { icon: Lock, title: 'Controle Granular', desc: 'Permissões específicas por contexto' },
    { icon: Activity, title: 'Auditoria Completa', desc: 'Log detalhado de todas as ações' },
    { icon: UserCircle2, title: 'Gestão Centralizada', desc: 'Interface única para administração' }
  ];

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
                    Centro de Administração
                  </h1>
                  <p className="text-slate-600 mt-1 text-lg">
                    Controle total sobre papéis e permissões empresariais
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Principais */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {adminSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Link
                key={section.path}
                to={section.path}
                className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/60 hover:border-slate-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br opacity-5 from-slate-900 to-transparent"></div>

                <div className="relative p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`relative p-4 rounded-xl bg-gradient-to-br ${section.bgGradient}`}>
                      <IconComponent className={`w-6 h-6 bg-gradient-to-br ${section.gradient} bg-clip-text text-transparent`} />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        {section.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {section.description}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold bg-gradient-to-r ${section.gradient} bg-clip-text text-transparent`}>
                          {section.stats.value}
                        </div>
                        <div className="text-sm text-slate-500">
                          {section.stats.label}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recursos de Segurança */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Recursos de Segurança Empresarial
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Tecnologia avançada para proteger e gerenciar o acesso aos recursos da sua organização
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200/60 transition-all duration-300 group-hover:shadow-lg"></div>

                  <div className="relative p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mb-6">
                      <IconComponent className="w-8 h-8 text-slate-700" />
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 lg:p-12 text-white">
          <div className="max-w-3xl">
            <h3 className="text-2xl font-bold mb-4">
              Pronto para começar?
            </h3>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Configure papéis personalizados, defina permissões granulares e mantenha sua organização
              segura com nosso sistema avançado de controle de acesso.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/company/roles"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 hover:shadow-lg"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Gerenciar Papéis
              </Link>

              <Link
                to="/company/permissions/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-800/50 text-white font-semibold rounded-xl border border-blue-500/30 hover:bg-blue-800/70 transition-all duration-200"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Ver Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;