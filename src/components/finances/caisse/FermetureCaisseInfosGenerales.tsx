import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, FormInput } from '../../ui/form';
import { Dropdown, DropdownOption } from '../../ui/dropdown';
import { FermetureCaisse } from './FermetureCaisseDrawer';
import { useEffect } from 'react';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface FermetureCaisseInfosGeneralesProps {
  fermeture: FermetureCaisse;
  entites: Entite[];
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleEntiteChange?: (value: string) => void;
}

/**
 * Composant pour afficher et éditer les informations générales d'une fermeture de caisse
 */
export function FermetureCaisseInfosGenerales({
  fermeture,
  entites,
  formErrors,
  isSubmitting,
  handleInputChange,
  handleEntiteChange
}: FermetureCaisseInfosGeneralesProps) {
  const { t } = useTranslation();
  
  const entiteOptions: DropdownOption[] = entites.map(entite => ({
    value: entite.id,
    label: `${entite.code} - ${entite.libelle}`
  }));
  
  // Déterminer si le champ entité doit être désactivé
  const isEntiteDisabled = isSubmitting || !!fermeture.id || !handleEntiteChange;
  
  // Trouver le libellé de l'entité sélectionnée
  const selectedEntiteLabel = entites.find(e => e.id === fermeture.id_entite)
    ? `${entites.find(e => e.id === fermeture.id_entite)?.code} - ${entites.find(e => e.id === fermeture.id_entite)?.libelle}`
    : "Entité sélectionnée";

  return (
    <>
      <FormField
        label={t('cashRegister.closure.form.restaurant')}
        required
        error={formErrors.id_entite}
      >
        {isEntiteDisabled ? (
          <div className="flex items-center p-2 border-2 border-gray-300 bg-gray-100 rounded-md">
            <span className="text-gray-700">
              {selectedEntiteLabel}
            </span>
            <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {t('cashRegister.closure.form.restaurantLocked')}
            </span>
          </div>
        ) : (
          <Dropdown
            options={entiteOptions}
            value={fermeture.id_entite}
            onChange={handleEntiteChange!}
            label="Sélectionner un restaurant"
            disabled={isSubmitting}
          />
        )}
      </FormField>
      
      <FormField
        label={t('cashRegister.closure.form.closureDate')}
        required
        error={formErrors.date_fermeture}
      >
        <FormInput
          type="date"
          name="date_fermeture"
          value={fermeture.date_fermeture}
          onChange={handleInputChange}
          disabled={isSubmitting || fermeture.est_valide}
        />
      </FormField>
      
      <FormField
        label={t('cashRegister.closure.form.revenueExVat')}
        error={formErrors.ca_ht}
      >
        <FormInput
          type="number"
          name="ca_ht"
          value={fermeture.ca_ht === null ? '' : fermeture.ca_ht.toString()}
          onChange={handleInputChange}
          step="0.01"
          min="0"
          disabled={isSubmitting || fermeture.est_valide}
        />
      </FormField>
      
      <FormField
        label={t('cashRegister.closure.form.revenueIncVat')}
        required
        error={formErrors.ca_ttc}
      >
        <FormInput
          type="number"
          name="ca_ttc"
          value={fermeture.ca_ttc === null ? '' : fermeture.ca_ttc.toString()}
          onChange={handleInputChange}
          step="0.01"
          min="0"
          disabled={isSubmitting || fermeture.est_valide}
        />
      </FormField>
    </>
  );
}