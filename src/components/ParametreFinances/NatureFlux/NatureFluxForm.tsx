import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../../ui/form';
import { Toggle } from '../../ui/toggle';
import { Dropdown, DropdownOption } from '../../ui/dropdown';
import { Button } from '../../ui/button';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface NatureFluxFormData {
  code: string;
  libelle: string;
  description?: string;
  id_entite: string | null;
  actif: boolean;
  salarie: boolean;
}

interface NatureFluxFormProps {
  initialData?: NatureFluxFormData;
  onSubmit: (data: NatureFluxFormData & { id_entite: string | null }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function NatureFluxForm({
  initialData = {
    code: '',
    libelle: '',
    description: '',
    id_entite: null,
    actif: true,
    salarie: false
  },
  onSubmit,
  onCancel,
  isSubmitting = false
}: NatureFluxFormProps) {
  const [formData, setFormData] = useState<NatureFluxFormData>(initialData);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof NatureFluxFormData, string>>>({});
  const { profil } = useProfil();
  const { t } = useTranslation();

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

    fetchEntites();
  }, [profil?.com_contrat_client_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof NatureFluxFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      actif: checked
    }));
  };

  const handleSalarieToggleChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      salarie: checked
    }));
  };

  const handleEntiteChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      id_entite: value === '' ? null : value
    }));
    if (errors.id_entite) {
      setErrors(prev => ({
        ...prev,
        id_entite: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NatureFluxFormData, string>> = {};

    if (!formData.code.trim()) newErrors.code = t('financial.natureFluxModal.codeRequired');
    if (!formData.libelle.trim()) newErrors.libelle = t('financial.natureFluxModal.labelRequired');
    // id_entite peut être null pour une nature globale

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Préparer les données en convertissant les chaînes vides en null pour les UUID
    const submitData = {
      ...formData,
      id_entite: formData.id_entite === '' ? null : formData.id_entite
    };
    
    await onSubmit(submitData);
  };

  const entiteOptions: DropdownOption[] = [
    { value: '', label: t('financial.natureFluxModal.globalEntity') },
    ...entites.map(entite => ({
      value: entite.id,
      label: `${entite.code} - ${entite.libelle}`
    }))
  ];

  return (
    <Form size={100} columns={2} onSubmit={handleSubmit} className="text-sm">
      <FormField
        label={t('financial.natureFluxModal.entityLabel')}
        error={errors.id_entite}
        description={t('financial.natureFluxModal.entityDescription')}
        className="mb-3"
      >
        <Dropdown
          options={entiteOptions}
          value={formData.id_entite || ''}
          onChange={handleEntiteChange}
          label={t('financial.natureFluxModal.entityPlaceholder')}
          size="sm"
        />
      </FormField>

      <FormField
        label={t('financial.natureFluxModal.codeLabel')}
        required
        error={errors.code}
        description={t('financial.natureFluxModal.codeDescription')}
        className="mb-3"
      >
        <FormInput
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          maxLength={12}
          placeholder={t('financial.natureFluxModal.codePlaceholder')}
          className="h-9"
        />
      </FormField>

      <FormField
        label={t('financial.natureFluxModal.labelLabel')}
        required
        error={errors.libelle}
        description={t('financial.natureFluxModal.labelDescription')}
        className="mb-3"
      >
        <FormInput
          name="libelle"
          value={formData.libelle}
          onChange={handleInputChange}
          placeholder={t('financial.natureFluxModal.labelPlaceholder')}
          className="h-9"
        />
      </FormField>

      <FormField
        label={t('financial.natureFluxModal.employeeLabel')}
        description={t('financial.natureFluxModal.employeeDescription')}
        className="mb-3"
      >
        <Toggle
          checked={formData.salarie}
          onChange={handleSalarieToggleChange}
          label={formData.salarie ? t('financial.natureFluxModal.yesEmployee') : t('financial.natureFluxModal.noEmployee')}
          icon="Users"
          size="sm"
        />
      </FormField>

      <FormField
        label={t('financial.natureFluxModal.statusLabel')}
        description={t('financial.natureFluxModal.statusDescription')}
        className="mb-3"
      >
        <Toggle
          checked={formData.actif}
          onChange={handleToggleChange}
          label={formData.actif ? t('financial.natureFluxModal.activeStatus') : t('financial.natureFluxModal.inactiveStatus')}
          size="sm"
        />
      </FormField>

      <FormField
        label={t('financial.natureFluxModal.descriptionLabel')}
        description={t('financial.natureFluxModal.descriptionDescription')}
        className="mb-3 col-span-2"
      >
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
          rows={2}
          placeholder={t('financial.natureFluxModal.descriptionPlaceholder')}
        />
      </FormField>

      <FormActions>
        <Button
          label={t('common.cancel')}
          size="sm"
          color="#6B7280"
          onClick={onCancel}
          type="button"
        />
        <Button
          label={isSubmitting ? t('financial.natureFluxModal.saving') : t('common.save')}
          size="sm"
          icon="Save"
          color="var(--color-primary)"
          type="submit"
          disabled={isSubmitting}
        />
      </FormActions>
    </Form>
  );
}