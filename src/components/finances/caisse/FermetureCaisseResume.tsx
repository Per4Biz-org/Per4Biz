import React from 'react';
import { FormField, FormInput } from '../../ui/form';
import { Calculator } from 'lucide-react';
import { FermetureCaisse } from './FermetureCaisseDrawer';

interface FermetureCaisseResumeProps {
  fermeture: FermetureCaisse;
  gardeEnCaisse: number | null;
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * Composant pour afficher le résumé calculé d'une fermeture de caisse
 */
export function FermetureCaisseResume({
  fermeture,
  gardeEnCaisse,
  formErrors,
  isSubmitting,
  handleInputChange
}: FermetureCaisseResumeProps) {
  return (
    <div className="col-span-2 bg-blue-50 p-4 rounded-lg mb-4">
      <div className="flex items-center mb-3">
        <Calculator className="text-blue-600 mr-2" size={20} />
        <h3 className="text-lg font-medium text-blue-800">Résumé calculé</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Dépôt en banque théorique"
          description="CA TTC - Total CB brut - Total factures"
        >
          <FormInput
            type="number"
            value={fermeture.depot_banque_theorique === null ? '' : fermeture.depot_banque_theorique.toFixed(2)}
            disabled={true}
            className="bg-blue-100"
          />
        </FormField>
        
        <FormField
          label="Dépôt en banque réel"
          required
          error={formErrors.depot_banque_reel}
        >
          <FormInput
            type="number"
            name="depot_banque_reel"
            value={fermeture.depot_banque_reel === null ? '' : fermeture.depot_banque_reel.toString()}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            disabled={isSubmitting || fermeture.est_valide}
          />
        </FormField>
        
        <FormField
          label="Garde en caisse"
          description="Différence entre théorique et réel"
        >
          <FormInput
            type="number"
            value={gardeEnCaisse === null ? '' : gardeEnCaisse.toFixed(2)}
            disabled={true}
            className={`${gardeEnCaisse && gardeEnCaisse !== 0 ? (gardeEnCaisse > 0 ? 'bg-green-100' : 'bg-red-100') : 'bg-blue-100'}`}
          />
        </FormField>
        
        <FormField
          label="Fond de caisse début"
          required
          error={formErrors.fond_caisse_espece_debut}
        >
          <FormInput
            type="number"
            name="fond_caisse_espece_debut"
            value={fermeture.fond_caisse_espece_debut === null ? '' : fermeture.fond_caisse_espece_debut.toString()}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            disabled={isSubmitting || fermeture.est_valide}
          />
        </FormField>
        
        <FormField
          label="Fond de caisse fin"
          description="Fond début + Garde en caisse"
        >
          <FormInput
            type="number"
            value={fermeture.fond_caisse_espece_fin === null ? '' : fermeture.fond_caisse_espece_fin.toFixed(2)}
            disabled={true}
            className="bg-blue-100"
          />
        </FormField>
        
        <FormField
          label="Commentaire"
          className="col-span-2"
        >
          <textarea
            name="commentaire"
            value={fermeture.commentaire || ''}
            onChange={handleInputChange}
            className="w-full p-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            rows={2}
            disabled={isSubmitting || fermeture.est_valide}
          />
        </FormField>
      </div>
    </div>
  );
}