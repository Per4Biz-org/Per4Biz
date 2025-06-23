import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../../ui/form';
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

interface FactureLigneFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ligne: any) => void;
  initialData?: any | undefined;
  entiteId: string;
  onAddLigne?: () => void;
}

export function FactureLigneForm({
  isOpen,
  onClose,
  onSave,
  initialData = undefined,
  entiteId, 
  onAddLigne = () => {}
}: FactureLigneFormProps) {
  const { profil } = useProfil();
  // Stocker l'entité ID dans une référence pour éviter sa perte lors des re-rendus
  const currentEntiteIdRef = React.useRef<string>(entiteId);
  
  // Initialiser la référence avec l'entiteId dès le premier rendu
  React.useEffect(() => {
    if (entiteId) {
      currentEntiteIdRef.current = entiteId;
      console.log("Entité ID initialisée dans la référence:", entiteId);
    }
  }, []);
  
  const [formData, setFormData] = useState({
    id_categorie_flux: '',
    id_sous_categorie_flux: '',
    montant_ht: 0,
    montant_tva: 0,
    commentaire: ''
  });
  
  const [categories, setCategories] = useState<CategorieFlux[]>([]);
  const [sousCategories, setSousCategories] = useState<SousCategorieFlux[]>([]);
  const [filteredSousCategories, setFilteredSousCategories] = useState<SousCategorieFlux[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mettre à jour l'entité ID si elle change dans les props
  useEffect(() => {
    if (entiteId) {
      currentEntiteIdRef.current = entiteId;
      console.log("Entité ID mise à jour dans la référence:", entiteId);
    }
  }, [entiteId]);

  // Chargement des catégories et sous-catégories avec dépendance sur currentEntiteIdRef.current
  useEffect(() => {
    const fetchData = async () => {
      if (!profil?.com_contrat_client_id || !currentEntiteIdRef.current) return;

      setLoading(true);
      try {
        // Récupérer les catégories de flux pour cette entité
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('fin_flux_categorie')
          .select('id, code, libelle, id_entite')
          .eq('com_contrat_client_id', profil.com_contrat_client_id) 
          .eq('id_entite', currentEntiteIdRef.current)
          .eq('actif', true)
          .order('libelle');

        if (categoriesError) {
          console.error('Erreur lors du chargement des catégories:', categoriesError);
          throw categoriesError;
        }
        
        console.log(`Catégories chargées pour l'entité ${currentEntiteIdRef.current}:`, categoriesData?.length || 0);
        setCategories(categoriesData || []);

        // Récupérer toutes les sous-catégories
        const { data: sousCategoriesData, error: sousCategoriesError } = await supabase
          .from('fin_flux_sous_categorie')
          .select(`
            id, 
            code, 
            libelle,
            id_categorie,
            categorie:fin_flux_categorie(id, id_entite)
          `)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (sousCategoriesError) {
          console.error('Erreur lors du chargement des sous-catégories:', sousCategoriesError);
          throw sousCategoriesError;
        }
        
        console.log(`Sous-catégories chargées:`, sousCategoriesData?.length || 0);
        setSousCategories(sousCategoriesData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && currentEntiteIdRef.current) {
      fetchData();
    }
  }, [isOpen, profil?.com_contrat_client_id]);

  // Log pour débogage
  useEffect(() => {
    console.log(`FactureLigneForm - entiteId: ${entiteId}, currentEntiteIdRef: ${currentEntiteIdRef.current}`);
    console.log(`FactureLigneForm - Catégories disponibles: ${categories.length}`);
  }, [entiteId, categories.length]);

  // Initialisation du formulaire
  useEffect(() => {
    if (initialData) {
      setFormData({
        id_categorie_flux: initialData.id_categorie_flux || '',
        id_sous_categorie_flux: initialData.id_sous_categorie_flux || '',
        montant_ht: initialData.montant_ht || 0,
        montant_tva: initialData.montant_tva || 0,
        commentaire: initialData.commentaire || ''
      });
    } else {
      setFormData({
        id_categorie_flux: '',
        id_sous_categorie_flux: '',
        montant_ht: 0,
        montant_tva: 0,
        commentaire: ''
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Filtrer les sous-catégories en fonction de la catégorie sélectionnée
  useEffect(() => {
    if (formData.id_categorie_flux) {
      console.log("Filtrage des sous-catégories pour la catégorie:", formData.id_categorie_flux);
      console.log("Entité courante:", currentEntiteIdRef.current);
      
      // Filtrer les sous-catégories qui appartiennent à cette catégorie
      // ET dont la catégorie parente appartient à l'entité courante
      const filtered = sousCategories.filter(sc => 
        sc.id_categorie === formData.id_categorie_flux &&
        sc.categorie?.id_entite === currentEntiteIdRef.current
      );
      
      console.log(`Sous-catégories filtrées pour la catégorie ${formData.id_categorie_flux}:`, filtered.length);
      setFilteredSousCategories(filtered);
      
      // Si la sous-catégorie sélectionnée n'est pas dans la liste filtrée, la réinitialiser
      if (formData.id_sous_categorie_flux && !filtered.some(sc => sc.id === formData.id_sous_categorie_flux)) {
        setFormData(prev => ({ ...prev, id_sous_categorie_flux: '' }));
      }
    } else {
      setFilteredSousCategories([]);
    }
  }, [formData.id_categorie_flux, sousCategories, formData.id_sous_categorie_flux]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Traitement spécial pour les champs numériques
    if (['montant_ht', 'montant_tva'].includes(name)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCategorieChange = (value: string) => {
    console.log("Changement de catégorie:", value);
    setFormData(prev => ({ ...prev, id_categorie_flux: value, id_sous_categorie_flux: '' }));
    
    if (errors.id_categorie_flux) {
      setErrors(prev => ({ ...prev, id_categorie_flux: '' }));
    }
  };

  const handleSousCategorieChange = (value: string) => {
    console.log("Changement de sous-catégorie:", value);
    setFormData(prev => ({ ...prev, id_sous_categorie_flux: value }));
    
    if (errors.id_sous_categorie_flux) {
      setErrors(prev => ({ ...prev, id_sous_categorie_flux: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.id_categorie_flux) {
      newErrors.id_categorie_flux = 'La catégorie est requise';
    }
    
    if (!formData.id_sous_categorie_flux) {
      newErrors.id_sous_categorie_flux = 'La sous-catégorie est requise';
    }
    
    if (formData.montant_ht <= 0) {
      newErrors.montant_ht = 'Le montant HT doit être supérieur à 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Récupérer les informations de catégorie et sous-catégorie pour l'affichage
    const categorie = categories.find(c => c.id === formData.id_categorie_flux);
    const sousCategorie = sousCategories.find(sc => sc.id === formData.id_sous_categorie_flux);
    
    const ligneData = {
      ...formData,
      fin_flux_categorie: categorie ? { code: categorie.code, libelle: categorie.libelle } : undefined,
      fin_flux_sous_categorie: sousCategorie ? { code: sousCategorie.code, libelle: sousCategorie.libelle } : undefined
    };
    
    onSave(ligneData);
  };

  if (!isOpen) return null;

  // Options pour les dropdowns
  const categorieOptions: DropdownOption[] = categories.map(cat => ({
    value: cat.id,
    label: `${cat.code} - ${cat.libelle}`
  }));

  const sousCategorieOptions: DropdownOption[] = filteredSousCategories.map(sc => ({
    value: sc.id,
    label: `${sc.code} - ${sc.libelle}`
  }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Modifier une ligne' : 'Ajouter une ligne'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <Form size={100} onSubmit={handleSubmit}>
          <FormField
            label="Catégorie de flux"
            required
            error={errors.id_categorie_flux}
          >
            <Dropdown
              options={categorieOptions}
              value={formData.id_categorie_flux}
              onChange={handleCategorieChange}
              label="Sélectionner une catégorie"
              disabled={loading}
            />
          </FormField>
          
          <FormField
            label="Sous-catégorie de flux"
            required
            error={errors.id_sous_categorie_flux}
          >
            <Dropdown
              options={sousCategorieOptions}
              value={formData.id_sous_categorie_flux}
              onChange={handleSousCategorieChange}
              label={formData.id_categorie_flux ? "Sélectionner une sous-catégorie" : "Sélectionner d'abord une catégorie"}
              disabled={loading || !formData.id_categorie_flux}
            />
          </FormField>
          
          <FormField
            label="Montant HT"
            required
            error={errors.montant_ht}
          >
            <FormInput
              type="number"
              name="montant_ht"
              value={formData.montant_ht.toString()}
              onChange={handleInputChange}
              step="0.01"
              min="0"
            />
          </FormField>
          
          <FormField
            label="Montant TVA"
          >
            <FormInput
              type="number"
              name="montant_tva"
              value={formData.montant_tva.toString()}
              onChange={handleInputChange}
              step="0.01"
              min="0"
            />
          </FormField>
          
          <FormField
            label="Commentaire"
          >
            <textarea
              name="commentaire"
              value={formData.commentaire}
              onChange={handleInputChange}
              className="w-full p-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              rows={2}
              placeholder="Commentaire optionnel"
            />
          </FormField>
          
          <FormActions>
            <Button
              label="Annuler"
              color="#6B7280"
              onClick={onClose}
              type="button"
            />
            <Button
              label="Enregistrer"
              icon="Save"
              color="var(--color-primary)"
              type="submit"
            />
          </FormActions>
        </Form>
      </div>
    </div>
  );
}