import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { FactureDepense } from './FermetureCaisseDrawer';

interface FactureDepenseTableProps {
  factures: FactureDepense[];
  onDelete: (facture: FactureDepense) => void;
  disabled?: boolean;
}

export function FactureDepenseTable({
  factures,
  onDelete,
  disabled = false
}: FactureDepenseTableProps) {
  if (factures.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        Aucune facture de dépense enregistrée
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              N° Document
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tiers
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant TTC
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
          {factures.map((facture, index) => (
            <tr key={facture.id || `new-${index}`} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-900">
                {facture.facture?.num_document || 'N/A'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {facture.facture?.date_facture 
                  ? format(new Date(facture.facture.date_facture), 'dd/MM/yyyy', { locale: fr })
                  : 'N/A'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {facture.facture?.tiers?.nom || 'N/A'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {facture.montant_ttc.toFixed(2)} €
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                {facture.commentaire || '-'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500 text-center">
                <button
                  onClick={() => onDelete(facture)}
                  className="text-red-600 hover:text-red-800"
                  disabled={disabled}
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}