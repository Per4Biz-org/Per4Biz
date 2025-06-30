import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { Form, FormField, FormInput, FormActions } from '../../ui/form';
import { Dropdown, DropdownOption } from '../../ui/dropdown';
import { Button } from '../../ui/button';
import { getMonthName } from '../../../utils/budgetTableColumns';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface CategorieFlux {
  id: string;
  code: string;
  libelle: string;
  type_flux: 'produit' | 'charge';
  id_entite: string;
}

interface SousCategorieFlux {
  id: string;
  code: string;
  libelle: string;
  id_categorie: string;
}

interface TypeService {
  id: string;
  code: string;
  libelle: string;
  id_entite: string;
}

interface ParamJours {
  id: number;
  nb_jours_ouverts: number;
  taux_mp_prevu: number | null;
}

interface BudgetFormData {
  id_entite: string;
  annee: number;
  mois: number;
  id_flux_categorie: string;
  montant_ht: number;
  montant_ttc: number;
  nb_jours_ouverts: number | null;
  nb_couverts: number | null;
  prix_moyen_couvert: number | null;
  commentaire: string | null;
}

interface BudgetDetailFormData {
  id_type_service: string;
  id_flux_sous_categorie: string;
  montant_ht: number;
  montant_ttc: number;
  nb_couverts: number | null;
  prix_moyen_couvert: number | null;
  nb_jours_ouverts: number | null;
  commentaire: string | null;
}

interface SuiviCABudgetFormProps {
  initialBudgetData?: BudgetFormData | null;
  initialDetailData?: BudgetDetailFormData[] | null;
  onSubmit: (budgetData: BudgetFormData, detailsData: BudgetDetailFormData[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SuiviCABudgetForm({
  initialBudgetData = null,
  initialDetailData = null,
  onSubmit,
  onCancel,
  isSubmitting = false
}: SuiviCABudgetFormProps) {
  const { profil } = useProfil();
  const [budgetData, setBudgetData] = useState<BudgetFormData>({
    id_entite: '',
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
    id_flux_categorie: '',
    montant_ht: 0, // Ce montant sera calculé à partir des détails
    montant_ttc: 0, // Ce montant sera calculé à partir des détails
    nb_jours_ouverts: null,
    nb_couverts: null,
    prix_moyen_couvert: null,
    commentaire: null
  });

  const [detailsData, setDetailsData] = useState<BudgetDetailFormData[]>([]);
  const [currentDetail, setCurrentDetail] = useState<BudgetDetailFormData>({
    id_type_service: '',
    id_flux_sous_categorie: '',
    montant_ht: 0,
    montant_ttc: 0,
    nb_couverts: null,
    prix_moyen_couvert: null,
    nb_jours_ouverts: null,
    commentaire: null
  });

  // États pour les listes déroulantes
  const [entites, setEntites] = useState<Entite[]>([]);
  const [categoriesFlux, setCategoriesFlux] = useState<CategorieFlux[]>([]);
  const [sousCategories, setSousCategories] = useState<SousCategorieFlux[]>([]);
  const [typesService, setTypesService] = useState<TypeService[]>([]);
  const [paramsJours, setParamsJours] = useState<ParamJours | null>(null);

  // États pour les listes filtrées
  const [filteredCategories, setFilteredCategories] = useState<CategorieFlux[]>([]);
  const [filteredSousCategories, setFilteredSousCategories] = useState<SousCategorieFlux[]>([]);
  const [filteredTypesService, setFilteredTypesService] = useState<TypeService[]>([]);
  const [typeServiceMap, setTypeServiceMap] = useState<Map<string, string>>(new Map());

  // États pour les erreurs
  const [budgetErrors, setBudgetErrors] = useState<Partial<Record<keyof BudgetFormData, string>>>({});
  const [detailErrors, setDetailErrors] = useState<Partial<Record<keyof BudgetDetailFormData, string>>>({});

  // États pour la vérification des doublons
  const [isDuplicateBudget, setIsDuplicateBudget] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [existingBudgetId, setExistingBudgetId] = useState<number | null>(null);

  // Chargement des données de référence
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!profil?.com_contrat_client_id) return;

      try {
        // Charger les entités
        const { data: entitesData, error: entitesError } = await supabase
          .from('com_entite')
          .select('id, code, libelle')
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('libelle');

        if (entitesError) throw entitesError;
        setEntites(entitesData || []);

        // Charger les catégories de flux
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('fin_flux_categorie')
          .select('id, code, libelle, type_flux, id_entite, entite:id_entite(id, code)')
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('libelle');

        if (categoriesError) throw categoriesError;
        setCategoriesFlux(categoriesData || []);

        // Charger les sous-catégories de flux
        const { data: sousCategoriesData, error: sousCategoriesError } = await supabase
          .from('fin_flux_sous_categorie')
          .select('id, code, libelle, id_categorie')
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('libelle');

        if (sousCategoriesError) throw sousCategoriesError;
        setSousCategories(sousCategoriesData || []);

        // Charger les types de service
        const { data: typesServiceData, error: typesServiceError } = await supabase
          .from('ca_type_service')
          .select('id, code, libelle, id_entite')
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('ordre_affichage')
          .order('libelle');

        if (typesServiceError) throw typesServiceError;
        setTypesService(typesServiceData || []);
        // Charger les associations type service - sous catégorie
        const { data: typeServiceData, error: typeServiceError } = await supabase
          .from('ca_type_service')
          .select('id, id_flux_sous_categorie')
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id);

        if (typeServiceError) throw typeServiceError;
        
        // Créer une map des associations type service -> sous catégorie
        const serviceMap = new Map<string, string>();
        typeServiceData?.forEach(ts => {
          if (ts.id && ts.id_flux_sous_categorie) {
            serviceMap.set(ts.id, ts.id_flux_sous_categorie);
          }
        });
        setTypeServiceMap(serviceMap);

      } catch (error) {
        console.error('Erreur lors du chargement des données de référence:', error);
      }
    };

    fetchReferenceData();
  }, [profil?.com_contrat_client_id]);

  // Initialisation des données du formulaire
  useEffect(() => {
    if (initialBudgetData) {
      setBudgetData(initialBudgetData);
      // Si on modifie un budget existant, on stocke son ID pour éviter la vérification de doublon
      setExistingBudgetId(initialBudgetData.id || null);
    }

    if (initialDetailData && initialDetailData.length > 0) {
      setDetailsData(initialDetailData);
    }
  }, [initialBudgetData, initialDetailData]);

  // Vérification des doublons de budget
  useEffect(() => {
    const checkDuplicateBudget = async () => {
      // Ne vérifier que si tous les champs clés sont remplis
      if (!budgetData.id_entite || !budgetData.id_flux_categorie || !budgetData.annee || !budgetData.mois) {
        setIsDuplicateBudget(false);
        return;
      }

      // Ne pas vérifier si on modifie un budget existant
      if (existingBudgetId) {
        setIsDuplicateBudget(false);
        return;
      }

      setIsCheckingDuplicate(true);

      try {
        const { data, error } = await supabase
          .from('ca_budget_mensuel')
          .select('id')
          .eq('id_entite', budgetData.id_entite)
          .eq('annee', budgetData.annee)
          .eq('mois', budgetData.mois)
          .eq('id_flux_categorie', budgetData.id_flux_categorie)
          .limit(1);

        if (error) {
          console.error('Erreur lors de la vérification des doublons:', error);
          setIsDuplicateBudget(false);
        } else {
          setIsDuplicateBudget(data && data.length > 0);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des doublons:', error);
        setIsDuplicateBudget(false);
      } finally {
        setIsCheckingDuplicate(false);
      }
    };

    // Délai pour éviter trop de requêtes
    const timeoutId = setTimeout(checkDuplicateBudget, 500);
    return () => clearTimeout(timeoutId);
  }, [budgetData.id_entite, budgetData.annee, budgetData.mois, budgetData.id_flux_categorie, existingBudgetId]);

  // Filtrer les catégories par entité
  useEffect(() => {
    if (budgetData.id_entite) {
      // Inclure les catégories spécifiques à l'entité ET les catégories globales
      const filtered = categoriesFlux.filter(cat => 
        cat.id_entite === budgetData.id_entite || cat.id_entite === null
      );
      setFilteredCategories(filtered);

      // Réinitialiser la catégorie si elle n'est pas valide pour cette entité
      if (budgetData.id_flux_categorie && !filtered.find(cat => cat.id === budgetData.id_flux_categorie)) {
        setBudgetData(prev => ({ ...prev, id_flux_categorie: '' }));
      }

      // Filtrer les types de service par entité
      const filteredServices = typesService.filter(service => service.id_entite === budgetData.id_entite);
      setFilteredTypesService(filteredServices);

      // Charger les paramètres de jours pour cette entité et cette période
      fetchParamJours(budgetData.id_entite, budgetData.annee, budgetData.mois);
    } else {
      setFilteredCategories([]);
      setFilteredTypesService([]);
      setParamsJours(null);
    }
  }, [budgetData.id_entite, budgetData.annee, budgetData.mois, categoriesFlux, typesService]);

  // Filtrer les sous-catégories par catégorie
  useEffect(() => {
    if (budgetData.id_flux_categorie) {
      const filtered = sousCategories.filter(sc => sc.id_categorie === budgetData.id_flux_categorie);
      setFilteredSousCategories(filtered);
    } else {
      setFilteredSousCategories([]);
    }
  }, [budgetData.id_flux_categorie, sousCategories]);

  // Charger les paramètres de jours d'ouverture
  const fetchParamJours = async (id_entite: string, annee: number, mois: number) => {
    if (!profil?.com_contrat_client_id || !id_entite) return;

    try {
      const { data, error } = await supabase
        .from('ca_param_jours_ouverture')
        .select('id, nb_jours_ouverts, taux_mp_prevu')
        .eq('id_entite', id_entite)
        .eq('annee', annee)
        .eq('mois', mois)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (data) {
        setParamsJours(data);
        // Mettre à jour le nombre de jours ouverts dans le formulaire
        setBudgetData(prev => ({
          ...prev,
          nb_jours_ouverts: data.nb_jours_ouverts
        }));
      } else {
        setParamsJours(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de jours:', error);
      setParamsJours(null);
    }
  };

  // Gestionnaires d'événements pour le formulaire principal
  const handleBudgetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Traitement spécial pour les champs numériques
    if (['montant_ht', 'montant_ttc', 'nb_jours_ouverts', 'nb_couverts', 'prix_moyen_couvert'].includes(name)) {
      const numValue = value === '' ? null : parseFloat(value);
      setBudgetData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setBudgetData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (budgetErrors[name as keyof BudgetFormData]) {
      setBudgetErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleEntiteChange = (value: string) => {
    setBudgetData(prev => ({
      ...prev,
      id_entite: value,
      id_flux_categorie: '' // Réinitialiser la catégorie quand l'entité change
    }));
    
    if (budgetErrors.id_entite) {
      setBudgetErrors(prev => ({
        ...prev,
        id_entite: undefined
      }));
    }
  };

  const handleCategorieChange = (value: string) => {
    setBudgetData(prev => ({
      ...prev,
      id_flux_categorie: value
    }));
    
    if (budgetErrors.id_flux_categorie) {
      setBudgetErrors(prev => ({
        ...prev,
        id_flux_categorie: undefined
      }));
    }
  };

  const handleAnneeChange = (value: string) => {
    const annee = parseInt(value);
    setBudgetData(prev => ({
      ...prev,
      annee
    }));
    
    if (budgetErrors.annee) {
      setBudgetErrors(prev => ({
        ...prev,
        annee: undefined
      }));
    }

    // Recharger les paramètres de jours si l'entité est déjà sélectionnée
    if (budgetData.id_entite) {
      fetchParamJours(budgetData.id_entite, annee, budgetData.mois);
    }
  };

  const handleMoisChange = (value: string) => {
    const mois = parseInt(value);
    setBudgetData(prev => ({
      ...prev,
      mois
    }));
    
    if (budgetErrors.mois) {
      setBudgetErrors(prev => ({
        ...prev,
        mois: undefined
      }));
    }

    // Recharger les paramètres de jours si l'entité est déjà sélectionnée
    if (budgetData.id_entite) {
      fetchParamJours(budgetData.id_entite, budgetData.annee, mois);
    }
  };

  // Gestionnaires d'événements pour le formulaire de détail
  const handleDetailInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Traitement spécial pour les champs numériques
    if (['montant_ht', 'montant_ttc', 'nb_jours_ouverts', 'nb_couverts', 'prix_moyen_couvert'].includes(name)) {
      const numValue = value === '' ? null : parseFloat(value);
      setCurrentDetail(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setCurrentDetail(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (detailErrors[name as keyof BudgetDetailFormData]) {
      setDetailErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleTypeServiceChange = (value: string) => {
    setCurrentDetail(prev => ({
      ...prev,
      id_type_service: value,
    }));
    
    // Récupérer la sous-catégorie associée à ce type de service
    const sousCategorieId = typeServiceMap.get(value);
    if (sousCategorieId) {
      // Vérifier si cette sous-catégorie est compatible avec la catégorie sélectionnée
      const sousCategorie = sousCategories.find(sc => sc.id === sousCategorieId);
      if (sousCategorie && sousCategorie.id_categorie === budgetData.id_flux_categorie) {
        // Si la sous-catégorie est compatible, la sélectionner automatiquement
        setCurrentDetail(prev => ({
          ...prev,
          id_flux_sous_categorie: sousCategorieId
        }));
        
        // Effacer l'erreur éventuelle sur la sous-catégorie
        if (detailErrors.id_flux_sous_categorie) {
          setDetailErrors(prev => ({
            ...prev,
            id_flux_sous_categorie: undefined
          }));
        }
      }
    }
    
    if (detailErrors.id_type_service) {
      setDetailErrors(prev => ({
        ...prev,
        id_type_service: undefined
      }));
    }
  };

  const handleSousCategorieChange = (value: string) => {
    setCurrentDetail(prev => ({
      ...prev,
      id_flux_sous_categorie: value
    }));
    
    if (detailErrors.id_flux_sous_categorie) {
      setDetailErrors(prev => ({
        ...prev,
        id_flux_sous_categorie: undefined
      }));
    }
  };

  // Ajouter un détail à la liste
  const handleAddDetail = () => {
    if (!validateDetailForm()) return;

    // Ajouter le détail à la liste
    const newDetailsData = [...detailsData, { ...currentDetail }];
    setDetailsData(newDetailsData);
    
    // Calculer les nouveaux totaux
    const newTotalHT = newDetailsData.reduce((sum, detail) => sum + (detail.montant_ht || 0), 0);
    const newTotalTTC = newDetailsData.reduce((sum, detail) => sum + (detail.montant_ttc || 0), 0);
    
    // Mettre à jour les montants totaux dans le formulaire principal
    setBudgetData(prev => ({
      ...prev,
      montant_ht: newTotalHT,
      montant_ttc: newTotalTTC
    }));
    
    // Réinitialiser le formulaire de détail
    setCurrentDetail({
      id_type_service: '',
      id_flux_sous_categorie: '',
      montant_ht: 0,
      montant_ttc: 0,
      nb_couverts: null,
      prix_moyen_couvert: null,
      nb_jours_ouverts: null,
      commentaire: null
    });
  };

  // Supprimer un détail de la liste
  const handleRemoveDetail = (index: number) => {
    // Supprimer le détail
    const newDetailsData = detailsData.filter((_, i) => i !== index);
    setDetailsData(newDetailsData);
    
    // Recalculer les totaux
    const newTotalHT = newDetailsData.reduce((sum, detail) => sum + (detail.montant_ht || 0), 0);
    const newTotalTTC = newDetailsData.reduce((sum, detail) => sum + (detail.montant_ttc || 0), 0);
    
    // Mettre à jour les montants totaux dans le formulaire principal
    setBudgetData(prev => ({
      ...prev,
      montant_ht: newTotalHT,
      montant_ttc: newTotalTTC
    }));
  };

  // Validation du formulaire principal
  const validateBudgetForm = (): boolean => {
    const errors: Partial<Record<keyof BudgetFormData, string>> = {};

    if (!budgetData.id_entite) errors.id_entite = 'L\'entité est requise';
    if (!budgetData.id_flux_categorie) errors.id_flux_categorie = 'La catégorie de flux est requise';
    
    if (!budgetData.annee || budgetData.annee < 2000 || budgetData.annee > 2100) {
      errors.annee = 'L\'année doit être comprise entre 2000 et 2100';
    }
    
    if (!budgetData.mois || budgetData.mois < 1 || budgetData.mois > 12) {
      errors.mois = 'Le mois doit être compris entre 1 et 12';
    }

    if (budgetData.montant_ht < 0) {
      errors.montant_ht = 'Le montant HT ne peut pas être négatif';
    }

    if (budgetData.montant_ttc < 0) {
      errors.montant_ttc = 'Le montant TTC ne peut pas être négatif';
    }

    if (budgetData.nb_jours_ouverts !== null && (budgetData.nb_jours_ouverts < 0 || budgetData.nb_jours_ouverts > 31)) {
      errors.nb_jours_ouverts = 'Le nombre de jours doit être compris entre 0 et 31';
    }

    if (budgetData.nb_couverts !== null && budgetData.nb_couverts < 0) {
      errors.nb_couverts = 'Le nombre de couverts ne peut pas être négatif';
    }

    if (budgetData.prix_moyen_couvert !== null && budgetData.prix_moyen_couvert < 0) {
      errors.prix_moyen_couvert = 'Le prix moyen ne peut pas être négatif';
    }

    // Vérifier les doublons
    if (isDuplicateBudget) {
      errors.id_flux_categorie = 'Un budget existe déjà pour cette combinaison entité/année/mois/catégorie';
    }

    setBudgetErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation du formulaire de détail
  const validateDetailForm = (): boolean => {
    const errors: Partial<Record<keyof BudgetDetailFormData, string>> = {};

    if (!currentDetail.id_type_service) errors.id_type_service = 'Le type de service est requis';
    if (!currentDetail.id_flux_sous_categorie) errors.id_flux_sous_categorie = 'La sous-catégorie est requise';
    
    if (currentDetail.montant_ht < 0) {
      errors.montant_ht = 'Le montant HT ne peut pas être négatif';
    }

    if (currentDetail.montant_ttc < 0) {
      errors.montant_ttc = 'Le montant TTC ne peut pas être négatif';
    }

    if (currentDetail.nb_jours_ouverts !== null && (currentDetail.nb_jours_ouverts < 0 || currentDetail.nb_jours_ouverts > 31)) {
      errors.nb_jours_ouverts = 'Le nombre de jours doit être compris entre 0 et 31';
    }

    if (currentDetail.nb_couverts !== null && currentDetail.nb_couverts < 0) {
      errors.nb_couverts = 'Le nombre de couverts ne peut pas être négatif';
    }

    if (currentDetail.prix_moyen_couvert !== null && currentDetail.prix_moyen_couvert < 0) {
      errors.prix_moyen_couvert = 'Le prix moyen ne peut pas être négatif';
    }

    // Vérifier si cette combinaison type_service/sous_categorie existe déjà
    const isDuplicate = detailsData.some(
      detail => detail.id_type_service === currentDetail.id_type_service && 
                detail.id_flux_sous_categorie === currentDetail.id_flux_sous_categorie
    );

    if (isDuplicate) {
      errors.id_type_service = 'Cette combinaison type de service / sous-catégorie existe déjà';
    }

    setDetailErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation et soumission du formulaire complet
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBudgetForm()) return;
    
    // Vérifier qu'il y a au moins un détail
    if (detailsData.length === 0) {
      alert('Vous devez ajouter au moins un détail de budget');
      return;
    }
    
    // Calculer les totaux des détails pour vérifier la cohérence
    const totalHT = detailsData.reduce((sum, detail) => sum + (detail.montant_ht || 0), 0);
    const totalTTC = detailsData.reduce((sum, detail) => sum + (detail.montant_ttc || 0), 0);

    // Si des détails ont été ajoutés, utiliser les totaux calculés
    // Sinon, utiliser les montants saisis directement
    if (detailsData.length > 0) {
      // Mettre à jour les montants du budget principal avec les totaux des détails
      const updatedBudgetData = {
        ...budgetData,
        montant_ht: totalHT,
        montant_ttc: totalTTC
      };
      
      await onSubmit(updatedBudgetData, detailsData);
    } else {
      // Utiliser les montants saisis directement
      await onSubmit(budgetData, detailsData);
    }
  };

  // Options pour les listes déroulantes
  const entiteOptions: DropdownOption[] = entites.map(entite => ({
    value: entite.id,
    label: `${entite.code} - ${entite.libelle}`
  }));

  const categorieOptions: DropdownOption[] = filteredCategories.map(categorie => ({
    value: categorie.id,
    label: `${categorie.code} - ${categorie.libelle} (${categorie.type_flux === 'produit' ? 'Produit' : 'Charge'})`
  }));

  const sousCategorieOptions: DropdownOption[] = filteredSousCategories.map(sousCategorie => ({
    value: sousCategorie.id,
    label: `${sousCategorie.code} - ${sousCategorie.libelle}`
  }));

  const typeServiceOptions: DropdownOption[] = filteredTypesService.map(typeService => ({
    value: typeService.id,
    label: `${typeService.code} - ${typeService.libelle}`
  }));

  const anneeOptions: DropdownOption[] = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const moisOptions: DropdownOption[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month.toString(), label: getMonthName(month) };
  });

  // Calculer les totaux des détails
  const totalHT = detailsData.reduce((sum, detail) => sum + (detail.montant_ht || 0), 0);
  const totalTTC = detailsData.reduce((sum, detail) => sum + (detail.montant_ttc || 0), 0);

  // Déterminer si le formulaire peut être soumis
  const canSubmit = !isSubmitting && !isDuplicateBudget && !isCheckingDuplicate && detailsData.length > 0;

  return (
    <div className="space-y-6">
      {/* Alerte de doublon */}
      {isDuplicateBudget && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-700 text-sm font-medium">
              Un budget existe déjà pour cette combinaison entité/année/mois/catégorie de flux.
            </p>
          </div>
          <p className="text-red-600 text-sm mt-1">
            Veuillez modifier l'une de ces valeurs ou choisir une autre combinaison.
          </p>
        </div>
      )}

      {/* Indicateur de vérification */}
      {isCheckingDuplicate && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="animate-spin w-4 h-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-blue-700 text-sm">
              Vérification des doublons en cours...
            </p>
          </div>
        </div>
      )}

      {/* Formulaire principal du budget */}
      <Form size={100} columns={2} onSubmit={handleSubmit} className="text-sm">
        <FormField
          label="Entité"
          required
          error={budgetErrors.id_entite}
          className="mb-3"
        >
          <Dropdown
            options={entiteOptions}
            value={budgetData.id_entite}
            onChange={handleEntiteChange}
            label="Choisir l'entité"
            size="sm"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Catégorie de flux"
          required
          error={budgetErrors.id_flux_categorie}
          className="mb-3"
        >
          <Dropdown
            options={categorieOptions}
            value={budgetData.id_flux_categorie}
            onChange={handleCategorieChange}
            label={budgetData.id_entite ? "Choisir la catégorie" : "Choisir d'abord une entité"}
            size="sm"
            disabled={!budgetData.id_entite || isSubmitting}
          />
        </FormField>

        <FormField
          label="Année"
          required
          error={budgetErrors.annee}
          className="mb-3"
        >
          <Dropdown
            options={anneeOptions}
            value={budgetData.annee.toString()}
            onChange={handleAnneeChange}
            label="Choisir l'année"
            size="sm"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Mois"
          required
          error={budgetErrors.mois}
          className="mb-3"
        >
          <Dropdown
            options={moisOptions}
            value={budgetData.mois.toString()}
            onChange={handleMoisChange}
            label="Choisir le mois"
            size="sm"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label="Montant HT"
          error={budgetErrors.montant_ht}
          description="Montant total HT (calculé à partir des détails)"
          className="mb-3"
        >
          <FormInput
            name="montant_ht"
            type="number"
            step="0.01"
            value={budgetData.montant_ht?.toString() || '0'}
            onChange={handleBudgetInputChange}
            min="0"
            placeholder="Montant HT"
            disabled={isSubmitting || detailsData.length > 0}
            className="h-9"
          />
        </FormField>

        <FormField
          label="Montant TTC"
          error={budgetErrors.montant_ttc}
          description="Montant total TTC (calculé à partir des détails)"
          className="mb-3"
        >
          <FormInput
            name="montant_ttc"
            type="number"
            step="0.01"
            value={budgetData.montant_ttc?.toString() || '0'}
            onChange={handleBudgetInputChange}
            min="0"
            placeholder="Montant TTC"
            disabled={isSubmitting || detailsData.length > 0}
            className="h-9"
          />
        </FormField>

        <FormField
          label="Nombre de jours ouverts"
          error={budgetErrors.nb_jours_ouverts}
          description={paramsJours ? `Paramètre global: ${paramsJours.nb_jours_ouverts} jours` : undefined}
          className="mb-3"
        >
          <FormInput
            name="nb_jours_ouverts"
            type="number"
            value={budgetData.nb_jours_ouverts?.toString() || ''}
            onChange={handleBudgetInputChange}
            min="0"
            max="31"
            placeholder="Nombre de jours"
            disabled={isSubmitting}
            className="h-9"
          />
        </FormField>

        <FormField
          label="Nombre de couverts"
          error={budgetErrors.nb_couverts}
          className="mb-3"
        >
          <FormInput
            name="nb_couverts"
            type="number"
            value={budgetData.nb_couverts?.toString() || ''}
            onChange={handleBudgetInputChange}
            min="0"
            placeholder="Nombre de couverts"
            disabled={isSubmitting}
            className="h-9"
          />
        </FormField>

        <FormField
          label="Prix moyen par couvert"
          error={budgetErrors.prix_moyen_couvert}
          className="mb-3"
        >
          <FormInput
            name="prix_moyen_couvert"
            type="number"
            step="0.01"
            value={budgetData.prix_moyen_couvert?.toString() || ''}
            onChange={handleBudgetInputChange}
            min="0"
            placeholder="Prix moyen"
            disabled={isSubmitting}
            className="h-9"
          />
        </FormField>

        <FormField
          label="Commentaire"
          error={budgetErrors.commentaire}
          className="mb-3 col-span-2"
        >
          <textarea
            name="commentaire"
            value={budgetData.commentaire || ''}
            onChange={handleBudgetInputChange}
            className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            rows={2}
            placeholder="Commentaire sur ce budget..."
            disabled={isSubmitting}
          />
        </FormField>

        {/* Section des détails du budget */}
        <div className="col-span-2 mt-4 border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Détails du budget</h3>
          
          {/* Formulaire d'ajout de détail */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="text-md font-medium mb-3">Ajouter un détail</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Type de service"
                required
                error={detailErrors.id_type_service}
              >
                <Dropdown
                  options={typeServiceOptions}
                  value={currentDetail.id_type_service}
                  onChange={handleTypeServiceChange}
                  label={budgetData.id_entite ? "Choisir le service" : "Choisir d'abord une entité"}
                  size="sm"
                  disabled={!budgetData.id_entite || isSubmitting}
                />
              </FormField>

              <FormField
                label="Sous-catégorie"
                required
                error={detailErrors.id_flux_sous_categorie}
              >
                <Dropdown
                  options={sousCategorieOptions}
                  value={currentDetail.id_flux_sous_categorie}
                  onChange={handleSousCategorieChange}
                  label={budgetData.id_flux_categorie ? "Choisir la sous-catégorie" : "Choisir d'abord une catégorie"}
                  size="sm"
                  disabled={!budgetData.id_flux_categorie || isSubmitting}
                />
              </FormField>

              <FormField
                label="Montant HT"
                required
                error={detailErrors.montant_ht}
              >
                <FormInput
                  name="montant_ht"
                  type="number"
                  step="0.01"
                  value={currentDetail.montant_ht?.toString() || '0'}
                  onChange={handleDetailInputChange}
                  min="0"
                  placeholder="Montant HT"
                  disabled={isSubmitting}
                  className="h-9"
                />
              </FormField>

              <FormField
                label="Montant TTC"
                required
                error={detailErrors.montant_ttc}
              >
                <FormInput
                  name="montant_ttc"
                  type="number"
                  step="0.01"
                  value={currentDetail.montant_ttc?.toString() || '0'}
                  onChange={handleDetailInputChange}
                  min="0"
                  placeholder="Montant TTC"
                  disabled={isSubmitting}
                  className="h-9"
                />
              </FormField>

              <FormField
                label="Nombre de jours ouverts"
                error={detailErrors.nb_jours_ouverts}
              >
                <FormInput
                  name="nb_jours_ouverts"
                  type="number"
                  value={currentDetail.nb_jours_ouverts?.toString() || ''}
                  onChange={handleDetailInputChange}
                  min="0"
                  max="31"
                  placeholder="Jours ouverts"
                  disabled={isSubmitting}
                  className="h-9"
                />
              </FormField>

              <FormField
                label="Nombre de couverts"
                error={detailErrors.nb_couverts}
              >
                <FormInput
                  name="nb_couverts"
                  type="number"
                  value={currentDetail.nb_couverts?.toString() || ''}
                  onChange={handleDetailInputChange}
                  min="0"
                  placeholder="Nombre de couverts"
                  disabled={isSubmitting}
                  className="h-9"
                />
              </FormField>

              <FormField
                label="Prix moyen par couvert"
                error={detailErrors.prix_moyen_couvert}
              >
                <FormInput
                  name="prix_moyen_couvert"
                  type="number"
                  step="0.01"
                  value={currentDetail.prix_moyen_couvert?.toString() || ''}
                  onChange={handleDetailInputChange}
                  min="0"
                  placeholder="Prix moyen"
                  disabled={isSubmitting}
                  className="h-9"
                />
              </FormField>

              <FormField
                label="Commentaire"
                error={detailErrors.commentaire}
              >
                <FormInput
                  name="commentaire"
                  value={currentDetail.commentaire || ''}
                  onChange={handleDetailInputChange}
                  placeholder="Commentaire"
                  disabled={isSubmitting}
                  className="h-9"
                />
              </FormField>
            </div>
            
            <div className="mt-3 flex justify-end">
              <Button
                label="Ajouter ce détail"
                icon="Plus"
                color="var(--color-primary)"
                type="button"
                onClick={handleAddDetail}
                disabled={isSubmitting || !currentDetail.id_type_service || !currentDetail.id_flux_sous_categorie}
                size="sm"
              />
            </div>
          </div>

          {/* Liste des détails ajoutés */}
          {detailsData.length > 0 ? (
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2">Détails ajoutés</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type de service</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sous-catégorie</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant HT</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant TTC</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detailsData.map((detail, index) => {
                      const typeService = typesService.find(ts => ts.id === detail.id_type_service);
                      const sousCategorie = sousCategories.find(sc => sc.id === detail.id_flux_sous_categorie);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {typeService ? `${typeService.code} - ${typeService.libelle}` : 'Non trouvé'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {sousCategorie ? `${sousCategorie.code} - ${sousCategorie.libelle}` : 'Non trouvé'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">
                            {detail.montant_ht?.toFixed(2)} €
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">
                            {detail.montant_ttc?.toFixed(2)} €
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveDetail(index)}
                              className="text-red-600 hover:text-red-900"
                              disabled={isSubmitting}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Ligne de total */}
                    <tr className="bg-gray-100 font-semibold">
                      <td className="px-3 py-2 text-sm text-gray-900" colSpan={2}>
                        Total
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">
                        {totalHT.toFixed(2)} €
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">
                        {totalTTC.toFixed(2)} €
                      </td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                Aucun détail ajouté. Veuillez ajouter au moins un détail pour ce budget.
              </p>
            </div>
          )}
        </div>

        <FormActions>
          <Button
            label="Annuler"
            color="#6B7280"
            onClick={onCancel}
            type="button"
            disabled={isSubmitting}
            size="sm"
          />
          <Button
            label={isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            icon="Save"
            color="var(--color-primary)"
            type="submit"
            disabled={!canSubmit}
            size="sm"
          />
        </FormActions>
      </Form>
    </div>
  );
}