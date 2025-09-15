import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../../ui/form';
import { Toggle } from '../../ui/toggle';
import { Dropdown, DropdownOption } from '../../ui/dropdown';
import { ColorPicker } from '../../ui/color-picker';
import { Button } from '../../ui/button';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

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
  id_entite: string;
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
    id_entite: '',
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
  const [entites, setEntites] = useState<Entite[]>([]);
  const [naturesFlux, setNaturesFlux] = useState<NatureFlux[]>([]);
  const [filteredNaturesFlux, setFilteredNaturesFlux] = useState<NatureFlux[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof CategorieFluxFormData, string>>>({});
  const { profil } = useProfil();
  const { t } = useTranslation();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profil?.com_contrat_client_id) return;

      // Récupérer les entités
      const { data: entitesData } = await supabase
        .from('com_entite')
        .select('id, code, libelle')
        .eq('actif', true)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('libelle');

      if (entitesData) {
        setEntites(entitesData);
      }

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
    if (!dataLoaded) return;

    // Filtrer les natures de flux:
    // - Si une entité est sélectionnée, inclure les natures spécifiques à cette entité ET les natures globales
    // - Si aucune entité n'est sélectionnée (mode global), n'inclure que les natures globales
    let filtered = [];
    if (formData.id_entite) {
      filtered = naturesFlux.filter(nature => 
        nature.id_entite === formData.id_entite || nature.id_entite === null
      );
    } else {
      filtered = naturesFlux.filter(nature => nature.id_entite === null);
    }

      setFilteredNaturesFlux(filtered);
      
      // En mode édition, vérifier si la nature de flux sélectionnée existe dans les données filtrées
      // Si ce n'est pas le cas ET que ce n'est pas l'initialisation, alors réinitialiser
      if (formData.nature_flux_id && 
          !filtered.find(nature => nature.id === formData.nature_flux_id) &&
          initialData?.nature_flux_id !== formData.nature_flux_id) {
        setFormData(prev => ({
          ...prev,
          nature_flux_id: ''
        }));
      }
  }, [formData.id_entite, naturesFlux, formData.nature_flux_id, dataLoaded, initialData?.nature_flux_id]);

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

  const handleEntiteChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      id_entite: value,
      nature_flux_id: '' // Réinitialiser la nature de flux quand l'entité change
    }));
    if (errors.id_entite) {
      setErrors(prev => ({
        ...prev,
        id_entite: undefined
      }));
    }
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
    
    // Convertir les chaînes vides en null pour les champs UUID optionnels
    const sanitizedData = {
      ...formData,
      id_entite: formData.id_entite.trim() === '' ? null : formData.id_entite,
      nature_flux_id: formData.nature_flux_id.trim() === '' ? null : formData.nature_flux_id
    };
    
    await onSubmit(sanitizedData);
  };

  const entiteOptions: DropdownOption[] = [
    { value: '', label: t('financial.categorieFluxModal.globalEntity') },
    ...entites.map(entite => ({
      value: entite.id,
      label: `${entite.code} - ${entite.libelle}`
    }))
  ];

  const natureFluxOptions: DropdownOption[] = filteredNaturesFlux.map(nature => ({
    value: nature.id,
    label: `${nature.code} - ${nature.libelle}`
  }));

  const typeFluxOptions: DropdownOption[] = [
    { value: '', label: t('financial.categorieFluxModal.flowTypePlaceholder') },
    { value: 'produit', label: t('financial.categorieFluxModal.flowTypeProduct') },
    { value: 'charge', label: t('financial.categorieFluxModal.flowTypeCharge') }
  ];

  return (
    <Form size={100} columns={2} onSubmit={handleSubmit} className="text-sm">
      <FormField
        label={t('financial.categorieFluxModal.entityLabel')}
        error={errors.id_entite}
        description={t('financial.categorieFluxModal.entityDescription')}
        className="mb-3"
      >
        <Dropdown
          options={entiteOptions}
          value={formData.id_entite}
          onChange={handleEntiteChange}
          label={t('financial.categorieFluxModal.entityPlaceholder')}
          size="sm"
        />
      </FormField>

      <FormField
        label={t('financial.categorieFluxModal.codeLabel')}
        required
        error={errors.code}
        description={t('financial.categorieFluxModal.codeDescription')}
        className="mb-3"
      >
        <FormInput
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          placeholder={t('financial.categorieFluxModal.codePlaceholder')}
          className="h-9"
        />
      </FormField>

      <FormField
        label={t('financial.categorieFluxModal.labelLabel')}
        required
        error={errors.libelle}
        description={t('financial.categorieFluxModal.labelDescription')}
        className="mb-3"
      >
        <FormInput
          name="libelle"
          value={formData.libelle}
          onChange={handleInputChange}
          placeholder={t('financial.categorieFluxModal.labelPlaceholder')}
          className="h-9"
        />
      </FormField>

      <FormField
        label={t('financial.categorieFluxModal.flowTypeLabel')}
        required
        error={errors.type_flux}
        description={t('financial.categorieFluxModal.flowTypeDescription')}
        className="mb-3"
      >
        <Dropdown
          options={typeFluxOptions}
          value={formData.type_flux}
          onChange={(value) => setFormData(prev => ({ ...prev, type_flux: value as 'produit' | 'charge' | '' }))}
          label={t('financial.categorieFluxModal.flowTypePlaceholder')}
          size="sm"
        />
      </FormField>

      <FormField
        label={t('financial.categorieFluxModal.flowNatureLabel')}
        required
        error={errors.nature_flux_id}
        description={t('financial.categorieFluxModal.flowNatureDescription')}
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
      </FormField>

      <FormField
        label={t('financial.categorieFluxModal.colorLabel')}
        description={t('financial.categorieFluxModal.colorDescription')}
        className="mb-3"
      >
        <ColorPicker
          value={formData.couleur}
          onChange={(color) => setFormData(prev => ({ ...prev, couleur: color }))}
        />
      </FormField>

      <FormField
        label={t('financial.categorieFluxModal.displayOrderLabel')}
        description={t('financial.categorieFluxModal.displayOrderDescription')}
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
      </FormField>

      <FormField
        label={t('financial.categorieFluxModal.statusLabel')}
        description={t('financial.categorieFluxModal.statusDescription')}
        className="mb-3"
      >
        <Toggle
          checked={formData.actif}
          onChange={handleToggleChange}
          label={formData.actif ? t('financial.categorieFluxModal.activeStatus') : t('financial.categorieFluxModal.inactiveStatus')}
          size="sm"
        />
      </FormField>

      <FormField
        label={t('financial.categorieFluxModal.descriptionLabel')}
        description={t('financial.categorieFluxModal.descriptionDescription')}
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