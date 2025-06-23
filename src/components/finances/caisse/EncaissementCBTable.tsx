import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { EncaissementCB } from './FermetureCaisseDrawer';

interface EncaissementCBTableProps {
  encaissements: EncaissementCB[];
  onEdit: (encaissement: EncaissementCB) => void;
  onDelete: (encaissement: EncaissementCB) => void;
  disabled?: boolean;
}

export function EncaissementCBTable({
  encaissements,
  onEdit,
  onDelete,
  disabled = false
}: EncaissementCBTableProps) {
  if (encaissements.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        Aucun encaissement CB enregistré
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Période
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant brut
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant réel
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Commentaire
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {encaissements.map((encaissement, index) => (
            <tr key={encaissement.id || `new-${index}`} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-900">
                {encaissement.periode}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {encaissement.montant_brut.toFixed(2)} €
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {encaissement.montant_reel.toFixed(2)} €
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                {encaissement.commentaire || '-'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500 text-center">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => onEdit(encaissement)}
                    className="text-blue-600 hover:text-blue-800"
                    disabled={disabled}
                    title="Modifier"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(encaissement)}
                    className="text-red-600 hover:text-red-800"
                    disabled={disabled}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}