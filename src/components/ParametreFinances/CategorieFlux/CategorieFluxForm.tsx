import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { useEntite } from '../../../context/EntiteContext';
import { Form, FormField, FormFieldWithIcon, FormInput, FormActions } from '../../ui/form';
import { Toggle } from '../../ui/toggle';
import { Dropdown, DropdownOption } from '../../ui/dropdown';
import { ColorPicker } from '../../ui/color-picker';
import { Button } from '../../ui/button';

interface NatureFlux {
  id: string;
  code: string;
  libelle: string;
  id_entite: string;
}

interface CategorieFluxFormData {
  code: string;
  libelle: string;
  type_flux: 'produit' | 'charge' | '';
  nature_flux_id: string;
  description?: string;
  couleur?: string;
  ordre_affichage: number;
  actif: boolean;
}

interface CategorieFluxFormProps {
  initialData?: CategorieFluxFormData;
  onSubmit: (data: CategorieFluxFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CategorieFluxForm({
  initialData = {
    code: '',
    libelle: '',
    type_flux: '',
    nature_flux_id: '',
    description: '',
    couleur: '',
    ordre_affichage: 0,
    actif: true
  },
  onSubmit,
  onCancel,
  isSubmitting = false
}: CategorieFluxFormProps) {
  const [formData, setFormData] = useState<CategorieFluxFormData>(initialData);
  const [naturesFlux, setNaturesFlux] = useState<NatureFlux[]>([]);
  const [filteredNaturesFlux, setFilteredNaturesFlux] = useState<NatureFlux[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof CategorieFluxFormData, string>>>({});
  const { profil } = useProfil();
  const { selectedEntiteId } = useEntite();
  const { t } = useTranslation();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profil?.com_contrat_client_id) return;

      // Récupérer les natures de flux
      const { data: naturesData } = await supabase
        .from('fin_flux_nature')
        .select('id, code, libelle, id_entite')
        .eq('actif', true)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('libelle');

      if (naturesData) {
        setNaturesFlux(naturesData);
      }
      
      setDataLoaded(true);
    };

    fetchData();
  }, [profil?.com_contrat_client_id]);

  // Filtrer les natures de flux selon l'entité sélectionnée et gérer l'initialisation
  useEffect(() => {
    if (!dataLoaded || !selectedEntiteId) return;

    // Filtrer les natures de flux pour l'entité sélectionnée
    const filtered = naturesFlux.filter(nature => 
      nature.id_entite === selectedEntiteId || nature.id_entite === null
    );

    setFilteredNaturesFlux(filtered);
      
    // En mode édition, vérifier si la nature de flux sélectionnée existe dans les données filtrées
    if (formData.nature_flux_id && 
        !filtered.find(nature => nature.id === formData.nature_flux_id) &&
        initialData?.nature_flux_id !== formData.nature_flux_id) {
      setFormData(prev => ({
        ...prev,
        nature_flux_id: ''
      }));
    }
  }, [selectedEntiteId, naturesFlux, formData.nature_flux_id, dataLoaded, initialData?.nature_flux_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ordre_affichage' ? (value === '' ? 0 : parseInt(value)) : value
    }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof CategorieFluxFormData]) {
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


  const handleNatureFluxChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      nature_flux_id: value
    }));
    if (errors.nature_flux_id) {
      setErrors(prev => ({
        ...prev,
        nature_flux_id: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CategorieFluxFormData, string>> = {};

    if (!formData.code.trim()) newErrors.code = t('financial.categorieFluxModal.codeRequired');
    if (!formData.libelle.trim()) newErrors.libelle = t('financial.categorieFluxModal.labelRequired');
    if (!formData.type_flux.trim()) newErrors.type_flux = t('financial.categorieFluxModal.flowTypeRequired');
    if (!formData.nature_flux_id.trim()) newErrors.nature_flux_id = t('financial.categorieFluxModal.flowNatureRequired');
    // id_entite peut être null pour une catégorie globale

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
    
    const sanitizedData = {
      ...formData,
      id_entite: selectedEntiteId,
      nature_flux_id: formData.nature_flux_id.trim() === '' ? null : formData.nature_flux_id
    };
    
    await onSubmit(sanitizedData);
  };


  const natureFluxOptions: DropdownOption[] = filteredNaturesFlux.map(nature => ({
    value: nature.id,
    label: `${nature.code} - ${nature.libelle}`
  }));

  const typeFluxOptions: DropdownOption[] = [
    { value: '', label: t('financial.categorieFluxModal.flowTypePlaceholder') },
    { value: 'produit', label: t('financial.categorieFluxModal.flowTypeProduct') },
    { value: 'charge', label: t('financial.categorieFluxModal.flowTypeCharge') }
  ];

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
          Por favor selecione uma entidade no header antes de criar uma categoria de fluxo.
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
        label={t('financial.categorieFluxModal.codeLabel')}
        required
        error={errors.code}
        description={t('financial.categorieFluxModal.codeDescription')}
        fieldType="code"
        className="mb-3"
      >
        <FormInput
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          placeholder={t('financial.categorieFluxModal.codePlaceholder')}
          className="h-9"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.categorieFluxModal.labelLabel')}
        required
        error={errors.libelle}
        description={t('financial.categorieFluxModal.labelDescription')}
        fieldType="label"
        className="mb-3"
      >
        <FormInput
          name="libelle"
          value={formData.libelle}
          onChange={handleInputChange}
          placeholder={t('financial.categorieFluxModal.labelPlaceholder')}
          className="h-9"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.categorieFluxModal.flowTypeLabel')}
        required
        error={errors.type_flux}
        description={t('financial.categorieFluxModal.flowTypeDescription')}
        fieldType="flowType"
        className="mb-3"
      >
        <Dropdown
          options={typeFluxOptions}
          value={formData.type_flux}
          onChange={(value) => setFormData(prev => ({ ...prev, type_flux: value as 'produit' | 'charge' | '' }))}
          label={t('financial.categorieFluxModal.flowTypePlaceholder')}
          size="sm"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.categorieFluxModal.flowNatureLabel')}
        required
        error={errors.nature_flux_id}
        description={t('financial.categorieFluxModal.flowNatureDescription')}
        fieldType="flowNature"
        className="mb-3"
      >
        <Dropdown
          options={natureFluxOptions}
          value={formData.nature_flux_id}
          onChange={handleNatureFluxChange}
          label={t('financial.categorieFluxModal.flowNaturePlaceholder')}
          size="sm"
          disabled={natureFluxOptions.length === 0}
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.categorieFluxModal.colorLabel')}
        description={t('financial.categorieFluxModal.colorDescription')}
        fieldType="color"
        className="mb-3"
      >
        <ColorPicker
          value={formData.couleur}
          onChange={(color) => setFormData(prev => ({ ...prev, couleur: color }))}
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.categorieFluxModal.displayOrderLabel')}
        description={t('financial.categorieFluxModal.displayOrderDescription')}
        fieldType="order"
        className="mb-3"
      >
        <FormInput
          name="ordre_affichage"
          type="number"
          value={formData.ordre_affichage.toString()}
          onChange={handleInputChange}
          min="0"
          step="1"
          className="h-9"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.categorieFluxModal.statusLabel')}
        description={t('financial.categorieFluxModal.statusDescription')}
        fieldType="status"
        className="mb-3"
      >
        <Toggle
          checked={formData.actif}
          onChange={handleToggleChange}
          label={formData.actif ? t('financial.categorieFluxModal.activeStatus') : t('financial.categorieFluxModal.inactiveStatus')}
          size="sm"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('financial.categorieFluxModal.descriptionLabel')}
        description={t('financial.categorieFluxModal.descriptionDescription')}
        fieldType="description"
        className="mb-3 col-span-2"
      >
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
          rows={2}
          placeholder={t('financial.categorieFluxModal.descriptionPlaceholder')}
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
          label={isSubmitting ? t('financial.categorieFluxModal.saving') : t('common.save')}
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