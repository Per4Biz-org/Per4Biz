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

interface SousCategorieFlux {
  id: string;
  code: string;
  libelle: string;
  id_categorie: string;
}

interface CATypeServiceFormData {
  code: string;
  libelle: string;
  description?: string;
  ordre_affichage: number;
  actif: boolean;
  heure_debut?: string;
  heure_fin?: string;
  id_flux_sous_categorie?: string;
}

interface CATypeServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CATypeServiceFormData) => Promise<void>;
  initialData?: CATypeServiceFormData | null;
  isSubmitting?: boolean;
}

export function CATypeServiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}: CATypeServiceFormModalProps) {
  const [formData, setFormData] = useState<CATypeServiceFormData>({
    code: '',
    libelle: '',
    description: '',
    ordre_affichage: 0,
    actif: true,
    heure_debut: '',
    heure_fin: '',
    id_flux_sous_categorie: ''
  });
  const [sousCategories, setSousCategories] = useState<SousCategorieFlux[]>([]);
  const [filteredSousCategories, setFilteredSousCategories] = useState<SousCategorieFlux[]>([]);
  const [categories, setCategories] = useState<CategorieFlux[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategorieFlux[]>([]);
  const [selectedCategorie, setSelectedCategorie] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof CATypeServiceFormData, string>>>({});
  const { profil } = useProfil();
  const { selectedEntiteId } = useEntite();
  const { t, i18n } = useTranslation();
  
  // Traduções diretas para garantir funcionamento
  const modalTranslations = {
    fr: {
      selectEntity: "Sélectionner une entité",
      selectEntityFirst: "Sélectionner d'abord une entité",
      selectCategory: "Sélectionner une catégorie", 
      selectCategoryFirst: "Sélectionner d'abord une catégorie",
      selectSubcategory: "Sélectionner une sous-catégorie",
      noCategoryAvailable: "Aucune catégorie disponible pour cette entité",
      noSubcategoryAvailable: "Aucune sous-catégorie disponible pour cette catégorie"
    },
    pt: {
      selectEntity: "Selecionar uma entidade",
      selectEntityFirst: "Selecionar primeiro uma entidade",
      selectCategory: "Selecionar uma categoria",
      selectCategoryFirst: "Selecionar primeiro uma categoria", 
      selectSubcategory: "Selecionar uma subcategoria",
      noCategoryAvailable: "Nenhuma categoria disponível para esta entidade",
      noSubcategoryAvailable: "Nenhuma subcategoria disponível para esta categoria"
    },
    en: {
      selectEntity: "Select an entity",
      selectEntityFirst: "Select an entity first",
      selectCategory: "Select a category",
      selectCategoryFirst: "Select a category first",
      selectSubcategory: "Select a subcategory", 
      noCategoryAvailable: "No category available for this entity",
      noSubcategoryAvailable: "No subcategory available for this category"
    }
  };
  
  const getModalText = (key: keyof typeof modalTranslations.fr) => {
    const lang = i18n.language as keyof typeof modalTranslations;
    return modalTranslations[lang]?.[key] || modalTranslations.fr[key];
  };

  // Charger les données
  useEffect(() => {
    const fetchCategories = async () => {
      if (!profil?.com_contrat_client_id) return;

      const { data } = await supabase
        .from('fin_flux_categorie')
        .select(`
          id, 
          code, 
          libelle, 
          id_entite, 
          entite:id_entite(id, code)
        `)
        .eq('actif', true)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('libelle');

      if (data) {
        setCategories(data);
      }
    };
    
    const fetchSousCategories = async () => {
      if (!profil?.com_contrat_client_id) return;

      const { data } = await supabase
        .from('fin_flux_sous_categorie')
        .select(`
          id, 
          code, 
          libelle, 
          id_categorie
        `)
        .eq('actif', true)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('libelle');

      if (data) {
        setSousCategories(data);
      }
    };

    if (isOpen && selectedEntiteId) {
      fetchCategories();
      fetchSousCategories();
    }
  }, [isOpen, selectedEntiteId, profil?.com_contrat_client_id]);

  // Filtrer les catégories en fonction de l'entité sélectionnée
  useEffect(() => {
    if (selectedEntiteId) {
      // Filtrer les catégories qui appartiennent à cette entité OU qui sont globales
      const filtered = categories.filter(cat => 
        cat.id_entite === selectedEntiteId || cat.id_entite === null
      );
      setFilteredCategories(filtered);

      // Réinitialiser la catégorie sélectionnée si elle n'est pas valide pour cette entité
      if (selectedCategorie && !filtered.some(cat => cat.id === selectedCategorie)) {
        setSelectedCategorie('');
      }

      // Réinitialiser la sous-catégorie si l'entité change
      if (formData.id_flux_sous_categorie) {
        setFormData(prev => ({
          ...prev,
          id_flux_sous_categorie: ''
        }));
      }
    } else {
      setFilteredCategories([]);
      setSelectedCategorie('');
      setFilteredSousCategories([]);
    }
  }, [selectedEntiteId, categories, selectedCategorie, formData.id_flux_sous_categorie]);

  // Filtrer les sous-catégories en fonction de la catégorie sélectionnée
  useEffect(() => {
    if (selectedCategorie) {
      // Filtrer les sous-catégories qui appartiennent à cette catégorie
      const filtered = sousCategories.filter(sc => sc.id_categorie === selectedCategorie);
      setFilteredSousCategories(filtered);
      
      // Si la sous-catégorie sélectionnée n'est pas dans la liste filtrée, la réinitialiser
      if (formData.id_flux_sous_categorie && 
          !filtered.some(sc => sc.id === formData.id_flux_sous_categorie)) {
        setFormData(prev => ({
          ...prev,
          id_flux_sous_categorie: ''
        }));
      }
    } else {
      setFilteredSousCategories([]);
      
      // Réinitialiser la sous-catégorie si aucune catégorie n'est sélectionnée
      if (formData.id_flux_sous_categorie) {
        setFormData(prev => ({
          ...prev,
          id_flux_sous_categorie: ''
        }));
      }
    }
  }, [selectedCategorie, sousCategories, formData.id_flux_sous_categorie]);

  // Réinitialiser le formulaire quand la modale s'ouvre/ferme ou que les données initiales changent
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: initialData.code,
          libelle: initialData.libelle,
          description: initialData.description || '',
          ordre_affichage: initialData.ordre_affichage,
          actif: initialData.actif,
          heure_debut: initialData.heure_debut || '',
          heure_fin: initialData.heure_fin || '',
          id_flux_sous_categorie: initialData.id_flux_sous_categorie || '',
        });
        
        // Si une sous-catégorie est sélectionnée, trouver sa catégorie parente
        if (initialData.id_flux_sous_categorie) {
          const sousCategorie = sousCategories.find(sc => sc.id === initialData.id_flux_sous_categorie);
          if (sousCategorie) {
            setSelectedCategorie(sousCategorie.id_categorie);
          }
        }
      } else {
        setFormData({
          code: '',
          libelle: '',
          description: '',
          ordre_affichage: 0,
          actif: true,
          heure_debut: '',
          heure_fin: '',
          id_flux_sous_categorie: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Traitement spécial pour les champs numériques
    if (name === 'ordre_affichage') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof CATypeServiceFormData]) {
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
    setSelectedCategorie(value);
  };

  const handleSousCategorieChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      id_flux_sous_categorie: value
    }));
    if (errors.id_flux_sous_categorie) {
      setErrors(prev => ({
        ...prev,
        id_flux_sous_categorie: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CATypeServiceFormData, string>> = {};

    if (!formData.code.trim()) newErrors.code = t('financial.serviceTypeModal.codeRequired');
    if (!formData.libelle.trim()) newErrors.libelle = t('financial.serviceTypeModal.labelRequired');
    if (!formData.id_flux_sous_categorie) newErrors.id_flux_sous_categorie = t('financial.serviceTypeModal.subcategoryRequired');

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
      id_entite: selectedEntiteId,
      code: formData.code.trim(),
      libelle: formData.libelle.trim(),
      description: formData.description?.trim() || undefined,
      heure_debut: formData.heure_debut?.trim() || undefined,
      heure_fin: formData.heure_fin?.trim() || undefined,
      id_flux_sous_categorie: formData.id_flux_sous_categorie || undefined
    });
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      libelle: '',
      description: '',
      ordre_affichage: 0,
      actif: true,
      heure_debut: '',
      heure_fin: '',
      id_flux_sous_categorie: ''
    });
    setErrors({});
    onClose();
  };


  const categorieOptions: DropdownOption[] = filteredCategories.map(categorie => ({
    value: categorie.id,
    label: `${categorie.code} - ${categorie.libelle}`
  }));

  const sousCategorieOptions: DropdownOption[] = filteredSousCategories.map(sousCategorie => ({
    value: sousCategorie.id,
    label: `${sousCategorie.code} - ${sousCategorie.libelle}`
  }));

  if (!isOpen) return null;

  if (!selectedEntiteId) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">Entidade Necessária</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Por favor selecione uma entidade no header antes de criar tipos de serviço.
            </p>
            <Button
              label="Fechar"
              size="sm"
              color="#6B7280"
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? t('financial.serviceTypeModal.editTitle') : t('financial.serviceTypeModal.addTitle')}
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

          <FormFieldWithIcon
            label={t('financial.serviceTypeModal.codeLabel')}
            required
            error={errors.code}
            description={t('financial.serviceTypeModal.codeDescription')}
            fieldType="code"
            className="mb-2"
          >
            <FormInput
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder={t('financial.serviceTypeModal.codePlaceholder')}
              disabled={isSubmitting}
              className="h-9"
            />
          </FormFieldWithIcon>

          <FormFieldWithIcon
            label={t('financial.serviceTypeModal.labelLabel')}
            required
            error={errors.libelle}
            description={t('financial.serviceTypeModal.labelDescription')}
            fieldType="label"
            className="mb-2"
          >
            <FormInput
              name="libelle"
              value={formData.libelle}
              onChange={handleInputChange}
              placeholder={t('financial.serviceTypeModal.labelPlaceholder')}
              disabled={isSubmitting}
              className="h-9"
            />
          </FormFieldWithIcon>

          <FormFieldWithIcon
            label={t('financial.serviceTypeModal.displayOrderLabel')}
            description={t('financial.serviceTypeModal.displayOrderDescription')}
            fieldType="order"
            className="mb-2"
          >
            <FormInput
              name="ordre_affichage"
              type="number"
              value={formData.ordre_affichage.toString()}
              onChange={handleInputChange}
              min="0"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormFieldWithIcon>

          <FormFieldWithIcon
            label={t('financial.serviceTypeModal.startTimeLabel')}
            description={t('financial.serviceTypeModal.startTimeDescription')}
            fieldType="time"
            className="mb-2"
          >
            <FormInput
              name="heure_debut"
              type="time"
              value={formData.heure_debut}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="h-9"
            />
          </FormFieldWithIcon>

          <FormFieldWithIcon
            label={t('financial.serviceTypeModal.endTimeLabel')}
            description={t('financial.serviceTypeModal.endTimeDescription')}
            fieldType="time"
            className="mb-2"
          >
            <FormInput
              name="heure_fin"
              type="time"
              value={formData.heure_fin}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="h-9"
            />
          </FormFieldWithIcon>

          <FormFieldWithIcon
            label={t('financial.serviceTypeModal.flowCategoryLabel')}
            description={t('financial.serviceTypeModal.flowCategoryDescription')}
            fieldType="category"
            className="mb-2"
          >
            <Dropdown
              options={categorieOptions}
              value={selectedCategorie}
              onChange={handleCategorieChange}
              label={
                categorieOptions.length === 0 
                  ? getModalText('noCategoryAvailable')
                  : getModalText('selectCategory')
              }
              size="sm"
              disabled={isSubmitting || categorieOptions.length === 0}
            />
          </FormFieldWithIcon>

          <FormFieldWithIcon
            label={t('financial.serviceTypeModal.flowSubcategoryLabel')}
            required
            description={t('financial.serviceTypeModal.flowSubcategoryDescription')}
            error={errors.id_flux_sous_categorie}
            fieldType="subcategory"
            className="mb-2"
          >
            <Dropdown
              options={sousCategorieOptions}
              value={formData.id_flux_sous_categorie || ''}
              onChange={handleSousCategorieChange}
              label={
                !selectedCategorie 
                  ? getModalText('selectCategoryFirst')
                  : sousCategorieOptions.length === 0 
                    ? getModalText('noSubcategoryAvailable')
                    : getModalText('selectSubcategory')
              }
              size="sm"
              disabled={!selectedCategorie || isSubmitting || sousCategorieOptions.length === 0}
            />
          </FormFieldWithIcon>

          <FormFieldWithIcon
            label={t('financial.serviceTypeModal.statusLabel')}
            description={t('financial.serviceTypeModal.statusDescription')}
            fieldType="status"
            className="mb-2 col-span-2"
          >
            <Toggle
              checked={formData.actif}
              onChange={handleToggleChange}
              label={formData.actif ? t('financial.serviceTypeModal.activeStatus') : t('financial.serviceTypeModal.inactiveStatus')}
              icon="Check"
              disabled={isSubmitting}
            />
          </FormFieldWithIcon>

          <FormFieldWithIcon
            label={t('financial.serviceTypeModal.descriptionLabel')}
            description={t('financial.serviceTypeModal.descriptionDescription')}
            fieldType="description"
            className="mb-4 col-span-2"
          >
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              rows={2}
              placeholder={t('financial.serviceTypeModal.descriptionPlaceholder')}
              disabled={isSubmitting}
            />
          </FormFieldWithIcon>

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
              label={isSubmitting ? t('financial.serviceTypeModal.saving') : t('common.save')}
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