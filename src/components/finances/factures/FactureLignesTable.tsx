import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface FactureLigne {
  id?: string;
  id_facture_achat?: string;
  id_categorie_flux: string;
  id_sous_categorie_flux: string;
  montant_ht: number;
  montant_tva: number | null;
  commentaire?: string | null;
  fin_flux_categorie?: {
    code: string;
    libelle: string;
  };
  fin_flux_sous_categorie?: {
    code: string;
    libelle: string;
  };
}

interface FactureLignesTableProps {
  lignes: FactureLigne[];
  onEdit: (ligne: FactureLigne) => void;
  onDelete: (ligne: FactureLigne) => void;
  disabled?: boolean;
}

export function FactureLignesTable({
  lignes,
  onEdit,
  onDelete,
  disabled = false
}: FactureLignesTableProps) {
  if (lignes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        Aucune ligne de facture. Cliquez sur "Ajouter une ligne" pour commencer.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Catégorie
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sous-catégorie
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant HT
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant TVA
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Commentaire
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {lignes.map((ligne, index) => (
            <tr key={ligne.id || `new-${index}`} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-500 text-center">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => onEdit(ligne)}
                    className="text-blue-600 hover:text-blue-800"
                    disabled={disabled}
                    title="Modifier"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(ligne)}
                    className="text-red-600 hover:text-red-800"
                    disabled={disabled}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {ligne.fin_flux_categorie ? `${ligne.fin_flux_categorie.code} - ${ligne.fin_flux_categorie.libelle}` : 'Non spécifié'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {ligne.fin_flux_sous_categorie ? `${ligne.fin_flux_sous_categorie.code} - ${ligne.fin_flux_sous_categorie.libelle}` : 'Non spécifié'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {ligne.montant_ht.toFixed(2)} €
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 text-right">
                {ligne.montant_tva ? `${ligne.montant_tva.toFixed(2)} €` : '-'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                {ligne.commentaire || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}