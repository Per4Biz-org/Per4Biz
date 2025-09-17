import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { useEntite } from '../../../context/EntiteContext';
import { Form, FormField, FormFieldWithIcon, FormInput, FormActions } from '../../ui/form';
import { Toggle } from '../../ui/toggle';
import { Dropdown, DropdownOption } from '../../ui/dropdown';
import { Button } from '../../ui/button';

interface NatureFluxFormData {
  code: string;
  libelle: string;
  description?: string;
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
    actif: true,
    salarie: false
  },
  onSubmit,
  onCancel,
  isSubmitting = false
}: NatureFluxFormProps) {
  const [formData, setFormData] = useState<NatureFluxFormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof NatureFluxFormData, string>>>({});
  const { profil } = useProfil();
  const { selectedEntiteId } = useEntite();
  const { t } = useTranslation();


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
    
    if (!selectedEntiteId) {
      console.error('Nenhuma entidade selecionada');
      return;
    }
    
    const submitData = {
      ...formData,
      id_entite: selectedEntiteId
    };
    
    await onSubmit(submitData);
  };


  if (!selectedEntiteId) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m0 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Entidade Necessária</h3>
        <p className="text-gray-600 mb-4">
          Por favor selecione uma entidade no header antes de criar uma natureza de fluxo.
        </p>
        <Button
          label="Fechar"
          size="sm"
          color="#6B7280"
          onClick={onCancel}
        />
      </div>
    );
  }

  return (
    <Form size={100} columns={2} onSubmit={handleSubmit} className="text-sm">

      <FormFieldWithIcon
        label={t('financial.natureFluxModal.codeLabel')}
        required
        error={errors.code}
        description={t('financial.natureFluxModal.codeDescription')}
        fieldType="code"
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
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.natureFluxModal.labelLabel')}
        required
        error={errors.libelle}
        description={t('financial.natureFluxModal.labelDescription')}
        fieldType="label"
        className="mb-3"
      >
        <FormInput
          name="libelle"
          value={formData.libelle}
          onChange={handleInputChange}
          placeholder={t('financial.natureFluxModal.labelPlaceholder')}
          className="h-9"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.natureFluxModal.employeeLabel')}
        description={t('financial.natureFluxModal.employeeDescription')}
        fieldType="employee"
        className="mb-3"
      >
        <Toggle
          checked={formData.salarie}
          onChange={handleSalarieToggleChange}
          label={formData.salarie ? t('financial.natureFluxModal.yesEmployee') : t('financial.natureFluxModal.noEmployee')}
          icon="Users"
          size="sm"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.natureFluxModal.statusLabel')}
        description={t('financial.natureFluxModal.statusDescription')}
        fieldType="status"
        className="mb-3"
      >
        <Toggle
          checked={formData.actif}
          onChange={handleToggleChange}
          label={formData.actif ? t('financial.natureFluxModal.activeStatus') : t('financial.natureFluxModal.inactiveStatus')}
          size="sm"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.natureFluxModal.descriptionLabel')}
        description={t('financial.natureFluxModal.descriptionDescription')}
        fieldType="description"
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
      </FormFieldWithIcon>

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