import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  return (
    <div className="col-span-2 bg-blue-50 p-4 rounded-lg mb-4">
      <div className="flex items-center mb-3">
        <Calculator className="text-blue-600 mr-2" size={20} />
        <h3 className="text-lg font-medium text-blue-800">{t('cashRegister.closure.form.calculatedSummary')}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label={t('cashRegister.closure.form.theoreticalBankDeposit')}
          description={t('cashRegister.closure.form.calculationFormula')}
        >
          <FormInput
            type="number"
            value={fermeture.depot_banque_theorique === null ? '' : fermeture.depot_banque_theorique.toFixed(2)}
            disabled={true}
            className="bg-blue-100"
          />
        </FormField>
        
        <FormField
          label={t('cashRegister.closure.form.realBankDeposit')}
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
          label={t('cashRegister.closure.form.cashKeeping')}
          description={t('cashRegister.closure.form.theoreticalRealDifference')}
        >
          <FormInput
            type="number"
            value={gardeEnCaisse === null ? '' : gardeEnCaisse.toFixed(2)}
            disabled={true}
            className={`${gardeEnCaisse && gardeEnCaisse !== 0 ? (gardeEnCaisse > 0 ? 'bg-green-100' : 'bg-red-100') : 'bg-blue-100'}`}
          />
        </FormField>
        
        <FormField
          label={t('cashRegister.closure.form.startingCashFund')}
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
          label={t('cashRegister.closure.form.endingCashFund')}
          description={t('cashRegister.closure.form.cashFundFormula')}
        >
          <FormInput
            type="number"
            value={fermeture.fond_caisse_espece_fin === null ? '' : fermeture.fond_caisse_espece_fin.toFixed(2)}
            disabled={true}
            className="bg-blue-100"
          />
        </FormField>
        
        <FormField
          label={t('cashRegister.closure.form.comment')}
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
