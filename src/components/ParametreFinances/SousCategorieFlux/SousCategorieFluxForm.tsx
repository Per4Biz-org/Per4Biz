import React, { useState, useEffect } from 'react';
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
  id_entite: string;
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
    id_entite: '',
    description: '',
    ordre_affichage: 0,
    actif: true
  },
  onSubmit,
  onCancel,
  isSubmitting = false
}: SousCategorieFluxFormProps) {
  const [formData, setFormData] = useState<SousCategorieFluxFormData>(initialData);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [categoriesFlux, setCategoriesFlux] = useState<CategorieFlux[]>([]);
  const [filteredCategoriesFlux, setFilteredCategoriesFlux] = useState<CategorieFlux[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof SousCategorieFluxFormData, string>>>({});
  const { profil } = useProfil();
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

    fetchData();
  }, [profil?.com_contrat_client_id]);

  // Filtrer les catégories de flux selon l'entité sélectionnée et gérer l'initialisation
  useEffect(() => {
    if (!dataLoaded) return;
    
    if (formData.id_entite) {
      const filtered = categoriesFlux.filter(categorie => categorie.id_entite === formData.id_entite);
      setFilteredCategoriesFlux(filtered);
      
      // En mode édition, vérifier si la catégorie sélectionnée existe dans les données filtrées
      // Si ce n'est pas le cas ET que ce n'est pas l'initialisation, alors réinitialiser
      if (formData.id_categorie && 
          !filtered.find(categorie => categorie.id === formData.id_categorie) &&
          initialData?.id_categorie !== formData.id_categorie) {
        setFormData(prev => ({
          ...prev,
          id_categorie: ''
        }));
      }
    } else {
      setFilteredCategoriesFlux([]);
      setFormData(prev => ({
        ...prev,
        id_categorie: ''
      }));
    }
  }, [formData.id_entite, categoriesFlux, formData.id_categorie, dataLoaded, initialData?.id_categorie]);

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

  const handleEntiteChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      id_entite: value,
      id_categorie: '' // Réinitialiser la catégorie quand l'entité change
    }));
    if (errors.id_entite) {
      setErrors(prev => ({
        ...prev,
        id_entite: undefined
      }));
    }
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

    if (!formData.code) newErrors.code = 'Le code est requis';
    if (!formData.libelle) newErrors.libelle = 'Le libellé est requis';
    if (!formData.id_entite) newErrors.id_entite = 'L\'entité est requise';
    if (!formData.id_categorie) newErrors.id_categorie = 'La catégorie de flux est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  const entiteOptions: DropdownOption[] = entites.map(entite => ({
    value: entite.id,
    label: `${entite.code} - ${entite.libelle}`
  }));

  const categorieOptions: DropdownOption[] = filteredCategoriesFlux.map(categorie => ({
    value: categorie.id,
    label: `${categorie.code} - ${categorie.libelle}`
  }));

  return (
    <Form size={100} columns={2} onSubmit={handleSubmit} className="text-sm">
      <FormField
        label="Entité"
        required
        error={errors.id_entite}
        className="mb-3"
      >
        <Dropdown
          options={entiteOptions}
          value={formData.id_entite}
          onChange={handleEntiteChange}
          label="Sélectionner une entité"
          size="sm"
        />
      </FormField>

      <FormField
        label="Catégorie de flux"
        required
        error={errors.id_categorie}
        className="mb-3"
      >
        <Dropdown
          options={categorieOptions}
          value={formData.id_categorie}
          onChange={handleCategorieChange}
          label={formData.id_entite ? "Sélectionner une catégorie" : "Sélectionner d'abord une entité"}
          size="sm"
          disabled={!formData.id_entite || categorieOptions.length === 0}
        />
      </FormField>

      <FormField
        label="Code"
        required
        error={errors.code}
        className="mb-3"
      >
        <FormInput
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          placeholder="Ex: VENTE_BOISSON"
          className="h-9"
        />
      </FormField>

      <FormField
        label="Libellé"
        required
        error={errors.libelle}
        className="mb-3"
      >
        <FormInput
          name="libelle"
          value={formData.libelle}
          onChange={handleInputChange}
          placeholder="Ex: Vente de boissons"
          className="h-9"
        />
      </FormField>

      <FormField
        label="Ordre d'affichage"
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
        label="Statut"
        className="mb-3"
      >
        <Toggle
          checked={formData.actif}
          onChange={handleToggleChange}
          label={formData.actif ? 'Actif' : 'Inactif'}
          size="sm"
        />
      </FormField>

      <FormField
        label="Description"
        className="mb-3 col-span-2"
      >
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
          rows={2}
          placeholder="Description optionnelle de la sous-catégorie..."
        />
      </FormField>

      <FormActions>
        <Button
          label="Annuler"
          size="sm"
          color="#6B7280"
          onClick={onCancel}
          type="button"
        />
        <Button
          label={isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
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