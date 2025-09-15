import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useProfil } from '../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../ui/form';
import { Dropdown, DropdownOption } from '../ui/dropdown';
import { Button } from '../ui/button';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface ParamJoursFormData {
  id_entite: string;
  annee: number;
  mois: number;
  nb_jours_ouverts: number;
  taux_mp_prevu?: number;
  commentaire?: string;
}

interface ParamJoursFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ParamJoursFormData) => Promise<void>;
  initialData?: any | null;
  isSubmitting?: boolean;
}

export function ParamJoursFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}: ParamJoursFormModalProps) {
  const { profil } = useProfil();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ParamJoursFormData>({
    id_entite: '',
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
    nb_jours_ouverts: 0,
    taux_mp_prevu: undefined,
    commentaire: ''
  });
  const [entites, setEntites] = useState<Entite[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ParamJoursFormData, string>>>({});

  // Charger les entités
  useEffect(() => {
    const fetchEntites = async () => {
      if (!profil?.com_contrat_client_id) return;

      const { data } = await supabase
        .from('com_entite')
        .select('id, code, libelle')
        .eq('actif', true)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('libelle');

      if (data) {
        setEntites(data);
      }
    };

    if (isOpen) {
      fetchEntites();
    }
  }, [isOpen, profil?.com_contrat_client_id]);

  // Réinitialiser le formulaire quand la modale s'ouvre/ferme ou que les données initiales changent
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          id_entite: initialData.id_entite,
          annee: initialData.annee,
          mois: initialData.mois,
          nb_jours_ouverts: initialData.nb_jours_ouverts,
          taux_mp_prevu: initialData.taux_mp_prevu || undefined,
          commentaire: initialData.commentaire || ''
        });
      } else {
        setFormData({
          id_entite: '',
          annee: new Date().getFullYear(),
          mois: new Date().getMonth() + 1,
          nb_jours_ouverts: 0,
          taux_mp_prevu: undefined,
          commentaire: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue: any = value;

    // Traitement spécifique selon le type de champ
    if (name === 'annee' || name === 'mois' || name === 'nb_jours_ouverts') {
      processedValue = value === '' ? 0 : parseInt(value);
    } else if (name === 'taux_mp_prevu') {
      processedValue = value === '' ? undefined : parseFloat(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof ParamJoursFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleEntiteChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      id_entite: value
    }));
    if (errors.id_entite) {
      setErrors(prev => ({
        ...prev,
        id_entite: undefined
      }));
    }
  };

  const handleMoisChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      mois: parseInt(value)
    }));
    if (errors.mois) {
      setErrors(prev => ({
        ...prev,
        mois: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ParamJoursFormData, string>> = {};

    if (!formData.id_entite) newErrors.id_entite = t('financial.paramJoursModal.entityRequired');
    if (!formData.annee || formData.annee < 2000 || formData.annee > 2100) {
      newErrors.annee = t('financial.paramJoursModal.yearRequired');
    }
    if (!formData.mois || formData.mois < 1 || formData.mois > 12) {
      newErrors.mois = t('financial.paramJoursModal.monthRequired');
    }
    if (formData.nb_jours_ouverts < 0 || formData.nb_jours_ouverts > 31) {
      newErrors.nb_jours_ouverts = t('financial.paramJoursModal.openDaysRequired');
    }
    if (formData.taux_mp_prevu !== undefined && (formData.taux_mp_prevu < 0 || formData.taux_mp_prevu > 100)) {
      newErrors.taux_mp_prevu = t('financial.paramJoursModal.expectedRateValidation');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    await onSubmit({
      id_entite: formData.id_entite,
      annee: formData.annee,
      mois: formData.mois,
      nb_jours_ouverts: formData.nb_jours_ouverts,
      taux_mp_prevu: formData.taux_mp_prevu,
      commentaire: formData.commentaire?.trim() || undefined
    });
  };

  const handleCancel = () => {
    setFormData({
      id_entite: '',
      annee: new Date().getFullYear(),
      mois: new Date().getMonth() + 1,
      nb_jours_ouverts: 0,
      taux_mp_prevu: undefined,
      commentaire: ''
    });
    setErrors({});
    onClose();
  };

  const entiteOptions: DropdownOption[] = entites.map(entite => ({
    value: entite.id,
    label: `${entite.code} - ${entite.libelle}`
  }));

  const moisOptions: DropdownOption[] = [
    { value: '1', label: t('financial.months.january') },
    { value: '2', label: t('financial.months.february') },
    { value: '3', label: t('financial.months.march') },
    { value: '4', label: t('financial.months.april') },
    { value: '5', label: t('financial.months.may') },
    { value: '6', label: t('financial.months.june') },
    { value: '7', label: t('financial.months.july') },
    { value: '8', label: t('financial.months.august') },
    { value: '9', label: t('financial.months.september') },
    { value: '10', label: t('financial.months.october') },
    { value: '11', label: t('financial.months.november') },
    { value: '12', label: t('financial.months.december') }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? t('financial.paramJoursModal.editTitle') : t('financial.paramJoursModal.addTitle')}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Form size={100} columns={2} onSubmit={handleSubmit} className="text-sm">
          <FormField
            label={t('financial.paramJoursModal.entityLabel')}
            required
            error={errors.id_entite}
            description={t('financial.paramJoursModal.entityDescription')}
            className="mb-4"
          >
            <Dropdown
              options={entiteOptions}
              value={formData.id_entite}
              onChange={handleEntiteChange}
              label={t('financial.paramJoursModal.entityPlaceholder')}
              size="sm"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label={t('financial.paramJoursModal.yearLabel')}
            required
            error={errors.annee}
            description={t('financial.paramJoursModal.yearDescription')}
            className="mb-4"
          >
            <FormInput
              name="annee"
              type="number"
              value={formData.annee.toString()}
              onChange={handleInputChange}
              min="2000"
              max="2100"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label={t('financial.paramJoursModal.monthLabel')}
            required
            error={errors.mois}
            description={t('financial.paramJoursModal.monthDescription')}
            className="mb-4"
          >
            <Dropdown
              options={moisOptions}
              value={formData.mois.toString()}
              onChange={handleMoisChange}
              label={t('financial.paramJoursModal.monthPlaceholder')}
              size="sm"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label={t('financial.paramJoursModal.openDaysLabel')}
            required
            error={errors.nb_jours_ouverts}
            description={t('financial.paramJoursModal.openDaysDescription')}
            className="mb-4"
          >
            <FormInput
              name="nb_jours_ouverts"
              type="number"
              value={formData.nb_jours_ouverts.toString()}
              onChange={handleInputChange}
              min="0"
              max="31"
              placeholder={t('financial.paramJoursModal.openDaysPlaceholder')}
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label={t('financial.paramJoursModal.expectedRateLabel')}
            error={errors.taux_mp_prevu}
            description={t('financial.paramJoursModal.expectedRateDescription')}
            className="mb-4"
          >
            <FormInput
              name="taux_mp_prevu"
              type="number"
              step="0.01"
              value={formData.taux_mp_prevu?.toString() || ''}
              onChange={handleInputChange}
              min="0"
              max="100"
              placeholder={t('financial.paramJoursModal.expectedRatePlaceholder')}
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label={t('financial.paramJoursModal.commentLabel')}
            description={t('financial.paramJoursModal.commentDescription')}
            className="mb-6 col-span-2"
          >
            <textarea
              name="commentaire"
              value={formData.commentaire}
              onChange={handleInputChange}
              className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder={t('financial.paramJoursModal.commentPlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormActions>
            <Button
              label={t('common.cancel')}
              color="#6B7280"
              onClick={handleCancel}
              type="button"
              disabled={isSubmitting}
              size="sm"
            />
            <Button
              label={isSubmitting ? t('financial.paramJoursModal.saving') : t('common.save')}
              icon="Save"
              color="var(--color-primary)"
              type="submit"
              disabled={isSubmitting}
              size="sm"
            />
          </FormActions>
        </Form>
      </div>
    </div>
  );
}