import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { useEntite } from '../../../context/EntiteContext';
import { Form, FormField, FormFieldWithIcon, FormInput, FormActions } from '../../ui/form';
import { Toggle } from '../../ui/toggle';
import { Dropdown, DropdownOption } from '../../ui/dropdown';
import { Button } from '../../ui/button';


interface CategorieFlux {
  id: string;
  code: string;
  libelle: string;
  id_entite: string;
}

interface SousCategorieFluxFormData {
  code: string;
  libelle: string;
  id_categorie: string;
  description?: string;
  ordre_affichage: number;
  actif: boolean;
}

interface SousCategorieFluxFormProps {
  initialData?: SousCategorieFluxFormData;
  onSubmit: (data: SousCategorieFluxFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SousCategorieFluxForm({
  initialData = {
    code: '',
    libelle: '',
    id_categorie: '',
    description: '',
    ordre_affichage: 0,
    actif: true
  },
  onSubmit,
  onCancel,
  isSubmitting = false
}: SousCategorieFluxFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<SousCategorieFluxFormData>(initialData);
  const [categoriesFlux, setCategoriesFlux] = useState<CategorieFlux[]>([]);
  const [filteredCategoriesFlux, setFilteredCategoriesFlux] = useState<CategorieFlux[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof SousCategorieFluxFormData, string>>>({});
  const { profil } = useProfil();
  const { selectedEntiteId } = useEntite();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profil?.com_contrat_client_id) return;

      // Récupérer les catégories de flux
      const { data: categoriesData } = await supabase
        .from('fin_flux_categorie')
        .select('id, code, libelle, id_entite')
        .eq('actif', true)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('libelle');

      if (categoriesData) {
        setCategoriesFlux(categoriesData);
      }
      
      setDataLoaded(true);
    };

    if (selectedEntiteId) {
      fetchData();
    }
  }, [profil?.com_contrat_client_id, selectedEntiteId]);

  // Filtrer les catégories de flux selon l'entité sélectionnée et gérer l'initialisation
  useEffect(() => {
    if (!dataLoaded || !selectedEntiteId) return;

    // Filtrer les catégories de flux pour l'entité sélectionnée
    const filtered = categoriesFlux.filter(categorie => 
      categorie.id_entite === selectedEntiteId || categorie.id_entite === null
    );

    setFilteredCategoriesFlux(filtered);
      
    // En mode édition, vérifier si la catégorie sélectionnée existe dans les données filtrées
    if (formData.id_categorie && 
        !filtered.find(categorie => categorie.id === formData.id_categorie) &&
        initialData?.id_categorie !== formData.id_categorie) {
      setFormData(prev => ({
        ...prev,
        id_categorie: ''
      }));
    }
  }, [selectedEntiteId, categoriesFlux, formData.id_categorie, dataLoaded, initialData?.id_categorie]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ordre_affichage' ? (value === '' ? 0 : parseInt(value)) : value
    }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof SousCategorieFluxFormData]) {
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


  const handleCategorieChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      id_categorie: value
    }));
    if (errors.id_categorie) {
      setErrors(prev => ({
        ...prev,
        id_categorie: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SousCategorieFluxFormData, string>> = {};

    if (!formData.code.trim()) newErrors.code = t('parametersFinances.subCategoryFlux.form.validation.codeRequired');
    if (!formData.libelle.trim()) newErrors.libelle = t('parametersFinances.subCategoryFlux.form.validation.labelRequired');
    if (!formData.id_categorie) newErrors.id_categorie = t('parametersFinances.subCategoryFlux.form.validation.categoryRequired');
    // id_entite peut être null pour une sous-catégorie liée à une catégorie globale

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
    
    await onSubmit({
      ...formData,
      id_entite: selectedEntiteId
    });
  };


  const categorieOptions: DropdownOption[] = filteredCategoriesFlux.map(categorie => ({
    value: categorie.id,
    label: `${categorie.code} - ${categorie.libelle}`
  }));

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
          Por favor selecione uma entidade no header antes de criar uma subcategoria de fluxo.
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
        label={t('parametersFinances.subCategoryFlux.form.fluxCategory')}
        required
        error={errors.id_categorie}
        description={t('parametersFinances.subCategoryFlux.form.categoryDescription')}
        fieldType="category"
        className="mb-3"
      >
        <Dropdown
          options={categorieOptions}
          value={formData.id_categorie}
          onChange={handleCategorieChange}
          label={t('parametersFinances.subCategoryFlux.form.selectCategory')}
          size="sm"
          disabled={categorieOptions.length === 0}
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('parametersFinances.subCategoryFlux.form.code')}
        required
        error={errors.code}
        description={t('parametersFinances.subCategoryFlux.form.codeDescription')}
        fieldType="code"
        className="mb-3"
      >
        <FormInput
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          placeholder={t('parametersFinances.subCategoryFlux.form.codeExample')}
          className="h-9"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('parametersFinances.subCategoryFlux.form.label')}
        required
        error={errors.libelle}
        description={t('parametersFinances.subCategoryFlux.form.labelDescription')}
        fieldType="label"
        className="mb-3"
      >
        <FormInput
          name="libelle"
          value={formData.libelle}
          onChange={handleInputChange}
          placeholder={t('parametersFinances.subCategoryFlux.form.labelExample')}
          className="h-9"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('parametersFinances.subCategoryFlux.form.displayOrder')}
        description={t('parametersFinances.subCategoryFlux.form.displayOrderDescription')}
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
        label={t('parametersFinances.subCategoryFlux.form.status')}
        description={t('parametersFinances.subCategoryFlux.form.statusDescription')}
        fieldType="status"
        className="mb-3"
      >
        <Toggle
          checked={formData.actif}
          onChange={handleToggleChange}
          label={formData.actif ? t('parametersFinances.subCategoryFlux.form.activeStatus') : t('parametersFinances.subCategoryFlux.form.inactiveStatus')}
          size="sm"
        />
      </FormFieldWithIcon>

      <FormFieldWithIcon
        label={t('parametersFinances.subCategoryFlux.form.description')}
        description={t('parametersFinances.subCategoryFlux.form.descriptionDescription')}
        fieldType="description"
        className="mb-3 col-span-2"
      >
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
          rows={2}
          placeholder={t('parametersFinances.subCategoryFlux.form.descriptionPlaceholder')}
        />
      </FormFieldWithIcon>

      <FormActions>
        <Button
          label={t('parametersFinances.subCategoryFlux.form.cancel')}
          size="sm"
          color="#6B7280"
          onClick={onCancel}
          type="button"
        />
        <Button
          label={isSubmitting ? t('parametersFinances.subCategoryFlux.form.saving') : t('parametersFinances.subCategoryFlux.form.save')}
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