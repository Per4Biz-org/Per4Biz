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
  id_entite: string;
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
    id_entite: '',
    heure_debut: '',
    heure_fin: '',
    id_flux_sous_categorie: ''
  });
  const [entites, setEntites] = useState<Entite[]>([]);
  const [sousCategories, setSousCategories] = useState<SousCategorieFlux[]>([]);
  const [filteredSousCategories, setFilteredSousCategories] = useState<SousCategorieFlux[]>([]);
  const [categories, setCategories] = useState<CategorieFlux[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategorieFlux[]>([]);
  const [selectedCategorie, setSelectedCategorie] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof CATypeServiceFormData, string>>>({});
  const { profil } = useProfil();

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
    
    const fetchCategories = async () => {
      if (!profil?.com_contrat_client_id) return;

      const { data } = await supabase
        .from('fin_flux_categorie')
        .select(`
          id, 
          code, 
          libelle, 
          id_entite
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

    if (isOpen) {
      fetchEntites();
      fetchCategories();
      fetchSousCategories();
    }
  }, [isOpen, profil?.com_contrat_client_id]);

  // Filtrer les catégories en fonction de l'entité sélectionnée
  useEffect(() => {
    if (formData.id_entite) {
      // Filtrer les catégories qui appartiennent à cette entité
      const filtered = categories.filter(cat => cat.id_entite === formData.id_entite);
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
  }, [formData.id_entite, categories]);

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
          id_entite: initialData.id_entite,
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
          id_entite: '',
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

    if (!formData.code.trim()) newErrors.code = 'Le code est requis';
    if (!formData.libelle.trim()) newErrors.libelle = 'Le libellé est requis';
    if (!formData.id_entite) newErrors.id_entite = 'L\'entité est requise';
    if (!formData.id_flux_sous_categorie) newErrors.id_flux_sous_categorie = 'La sous-catégorie est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    await onSubmit({
      code: formData.code.trim(),
      libelle: formData.libelle.trim(),
      description: formData.description?.trim() || undefined,
      ordre_affichage: formData.ordre_affichage,
      actif: formData.actif,
      id_entite: formData.id_entite,
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
      id_entite: '',
      heure_debut: '',
      heure_fin: ''
    });
    setErrors({});
    onClose();
  };

  const entiteOptions: DropdownOption[] = entites.map(entite => ({
    value: entite.id,
    label: `${entite.code} - ${entite.libelle}`
  }));

  const categorieOptions: DropdownOption[] = filteredCategories.map(categorie => ({
    value: categorie.id,
    label: `${categorie.code} - ${categorie.libelle}`
  }));

  const sousCategorieOptions: DropdownOption[] = filteredSousCategories.map(sousCategorie => ({
    value: sousCategorie.id,
    label: `${sousCategorie.code} - ${sousCategorie.libelle}`
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Modifier un type de service' : 'Ajouter un type de service'}
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
            label="Entité"
            required
            error={errors.id_entite}
            description="Entité à laquelle ce type de service est associé"
            className="mb-2"
          >
            <Dropdown
              options={entiteOptions}
              value={formData.id_entite}
              onChange={handleEntiteChange}
              label="Sélectionner une entité"
              size="sm"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Code"
            required
            error={errors.code}
            description="Code unique du type de service"
            className="mb-2"
          >
            <FormInput
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="Ex: petit_dej, dejeuner, diner"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Libellé"
            required
            error={errors.libelle}
            description="Nom du type de service"
            className="mb-2"
          >
            <FormInput
              name="libelle"
              value={formData.libelle}
              onChange={handleInputChange}
              placeholder="Ex: Petit-déjeuner, Déjeuner, Dîner"
              disabled={isSubmitting}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Ordre d'affichage"
            description="Position dans la liste (0 = premier)"
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
          </FormField>

          <FormField
            label="Heure de début"
            description="Heure de début du service (format HH:MM)"
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
          </FormField>

          <FormField
            label="Heure de fin"
            description="Heure de fin du service (format HH:MM)"
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
          </FormField>

          <FormField
            label="Catégorie de flux"
            description="Catégorie pour filtrer les sous-catégories"
            className="mb-2"
          >
            <Dropdown
              options={categorieOptions}
              value={selectedCategorie}
              onChange={handleCategorieChange}
              label={
                !formData.id_entite 
                  ? "Sélectionner d'abord une entité" 
                  : categorieOptions.length === 0 
                    ? "Aucune catégorie disponible pour cette entité" 
                    : "Sélectionner une catégorie"
              }
              size="sm"
              disabled={!formData.id_entite || isSubmitting || categorieOptions.length === 0}
            />
          </FormField>

          <FormField
            label="Sous-catégorie de flux"
            required
            description="Sous-catégorie associée à ce type de service"
            error={errors.id_flux_sous_categorie}
            className="mb-2"
          >
            <Dropdown
              options={sousCategorieOptions}
              value={formData.id_flux_sous_categorie || ''}
              onChange={handleSousCategorieChange}
              label={
                !selectedCategorie 
                  ? "Sélectionner d'abord une catégorie" 
                  : sousCategorieOptions.length === 0 
                    ? "Aucune sous-catégorie disponible pour cette catégorie" 
                    : "Sélectionner une sous-catégorie"
              }
              size="sm"
              disabled={!selectedCategorie || isSubmitting || sousCategorieOptions.length === 0}
            />
          </FormField>

          <FormField
            label="Statut"
            description="Activer ou désactiver ce type de service"
            className="mb-2 col-span-2"
          >
            <Toggle
              checked={formData.actif}
              onChange={handleToggleChange}
              label={formData.actif ? 'Actif' : 'Inactif'}
              icon="Check"
              disabled={isSubmitting}
              size="sm"
            />
          </FormField>

          <FormField
            label="Description"
            description="Description optionnelle du type de service"
            className="mb-4 col-span-2"
          >
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              rows={2}
              placeholder="Description détaillée du type de service..."
              disabled={isSubmitting}
            />
          </FormField>

          <FormActions>
            <Button
              label="Annuler"
              color="#6B7280"
              onClick={handleCancel}
              type="button"
              disabled={isSubmitting}
              size="sm"
            />
            <Button
              label={isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
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