import React from 'react';
import { FactureLignesTable } from './FactureLignesTable';

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

interface FactureLignesSectionProps {
  lignes: FactureLigne[];
  onEdit: (ligne: FactureLigne) => void;
  onDelete: (ligne: FactureLigne) => void;
  onAddLigne: () => void;
  disabled?: boolean;
}

export function FactureLignesSection({
  lignes,
  onEdit,
  onDelete,
  onAddLigne,
  disabled = false
}: FactureLignesSectionProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Détail analytique de la facture</h3>
        <button
          onClick={onAddLigne}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          disabled={disabled}
        >
          <span className="mr-1">+</span> Ajouter une ligne
        </button>
      </div>
      
      <FactureLignesTable
        lignes={lignes}
        onEdit={onEdit}
        onDelete={onDelete}
        disabled={disabled}
      />
    </div>
  );
}