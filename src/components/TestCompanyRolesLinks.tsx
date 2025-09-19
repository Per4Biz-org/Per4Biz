// ===============================================
// 🧪 Componente de Teste - Links para Company Roles
// Para testar rapidamente as novas funcionalidades
// ===============================================

import React from 'react';
import { Link } from 'react-router-dom';

export const TestCompanyRolesLinks: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
        🏢 Sistema de Company Roles
      </h2>
      <p className="text-sm text-gray-600 mb-6 text-center">
        Links de teste para as novas funcionalidades
      </p>

      <div className="space-y-3">
        <Link
          to="/company/roles"
          className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
        >
          <span className="text-2xl">🏢</span>
          <div>
            <div className="font-medium text-blue-900">Gerenciar Papéis</div>
            <div className="text-sm text-blue-600">Criar e gerenciar roles da empresa</div>
          </div>
        </Link>

        <Link
          to="/company/permissions/dashboard"
          className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
        >
          <span className="text-2xl">📊</span>
          <div>
            <div className="font-medium text-green-900">Dashboard de Permissões</div>
            <div className="text-sm text-green-600">Visão geral e estatísticas</div>
          </div>
        </Link>

        <Link
          to="/employees/123/roles"
          className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
        >
          <span className="text-2xl">👥</span>
          <div>
            <div className="font-medium text-purple-900">Papéis do Funcionário</div>
            <div className="text-sm text-purple-600">Gerenciar roles (Funcionário #123)</div>
          </div>
        </Link>
      </div>

      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 mb-1">💡 Como usar:</h3>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Clique nos links acima para testar as funcionalidades</li>
          <li>• As rotas estão integradas no sistema Per4Biz</li>
          <li>• Todos os componentes estão implementados</li>
        </ul>
      </div>

      <div className="mt-4 text-center">
        <span className="text-xs text-gray-500">
          Sistema implementado com sucesso! ✅
        </span>
      </div>
    </div>
  );
};

export default TestCompanyRolesLinks;