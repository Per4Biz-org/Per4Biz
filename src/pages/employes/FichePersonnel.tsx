import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfil } from '../../context/ProfilContext';
import { supabase } from '../../lib/supabase';
import { PageSection } from '../../components/ui/page-section';
import { Form, FormField, FormInput, FormActions } from '../../components/ui/form';
import { Button } from '../../components/ui/button';
import { Dropdown, DropdownOption } from '../../components/ui/dropdown';
import { ToastContainer, ToastData } from '../../components/ui/toast';
import { TiersSelector } from '../../components/ParametreGlobal/Tiers/TiersSelector';
import { TiersFormModal } from '../../components/ParametreGlobal/Tiers/TiersFormModal';
import { DataTable, Column } from '../../components/ui/data-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, FileText, Briefcase, Building, CreditCard, Upload, X, UserPlus, Save, ArrowLeft } from 'lucide-react';

// Types
interface Personnel {
  id?: string;
  nom: string;
  prenom: string;
  civilite: string | null;
  sexe: string | null;
  date_naissance: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  pays: string | null;
  numero_securite_sociale: string | null;
  nif: string | null;
  email_perso: string | null;
  telephone: string | null;
  lien_photo: string | null;
  actif: boolean;
  id_tiers: string;
  code_court: string;
  matricule: string;
}

interface Contrat {
  id?: string;
  id_personnel: string;
  id_type_contrat: string;
  date_debut: string;
  date_fin: string | null;
  commentaire: string | null;
  id_entite_payeur: string | null;
  created_at?: string;
}

interface TypeContrat {
  id: string;
  code: string;
  libelle: string;
}

interface Affectation {
  id?: string;
  id_personnel: string;
  id_entite: string;
  id_contrat: string;
  id_fonction: string;
  date_debut: string;
  date_fin: string | null;
  actif: boolean;
  commentaire: string | null;
  tx_presence: number;
  created_at?: string;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface Fonction {
  id: string;
  code: string;
  libelle: string;
}

interface HistoriqueFinancier {
  id?: string;
  id_personnel: string;
  id_contrat: string;
  date_debut: string;
  date_fin: string | null;
  id_categorie: string;
  id_sous_categorie: string;
  montant: number;
  commentaire: string | null;
  created_at?: string;
}

interface CategorieFlux {
  id: string;
  code: string;
  libelle: string;
  type_flux: string;
}

interface SousCategorieFlux {
  id: string;
  code: string;
  libelle: string;
  id_categorie: string;
}

interface CoutMensuel {
  id: string;
  id_personnel: string;
  id_entite: string;
  annee: number;
  mois: number;
  id_categorie: string;
  id_sous_categorie: string;
  montant: number;
  categorie: {
    code: string;
    libelle: string;
  };
  sous_categorie: {
    code: string;
    libelle: string;
  };
  entite: {
    code: string;
    libelle: string;
  };
}

interface PieceJointe {
  id: string;
  id_personnel: string;
  nom_fichier: string;
  lien_fichier: string;
  type_fichier: string;
  created_at: string;
}

interface FichePersonnelProps {
  personnelId?: string;
  onClose: () => void;
}

const FichePersonnel: React.FC<FichePersonnelProps> = ({ personnelId, onClose }) => {
  const navigate = useNavigate();
  const { profil } = useProfil();
  const [activeTab, setActiveTab] = useState(0);
  const [isCreationMode, setIsCreationMode] = useState(!personnelId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  // État pour le personnel
  const [personnel, setPersonnel] = useState<Personnel>({
    nom: '',
    prenom: '',
    civilite: null,
    sexe: null,
    date_naissance: null,
    adresse: null,
    code_postal: null,
    ville: null,
    pays: null,
    numero_securite_sociale: null,
    nif: null,
    email_perso: null,
    telephone: null,
    lien_photo: null,
    actif: true,
    id_tiers: '',
    code_court: '',
    matricule: ''
  });
  
  // États pour les onglets
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [historiqueFinancier, setHistoriqueFinancier] = useState<HistoriqueFinancier[]>([]);
  const [coutsMensuels, setCoutsMensuels] = useState<CoutMensuel[]>([]);
  const [piecesJointes, setPiecesJointes] = useState<PieceJointe[]>([]);
  
  // États pour les données de référence
  const [typesContrat, setTypesContrat] = useState<TypeContrat[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [categoriesFlux, setCategoriesFlux] = useState<CategorieFlux[]>([]);
  const [sousCategories, setSousCategories] = useState<SousCategorieFlux[]>([]);
  
  // États pour les modales
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false);
  const [isContratModalOpen, setIsContratModalOpen] = useState(false);
  const [isAffectationModalOpen, setIsAffectationModalOpen] = useState(false);
  const [isHistoriqueFinancierModalOpen, setIsHistoriqueFinancierModalOpen] = useState(false);
  
  // États pour les formulaires modaux
  const [selectedContrat, setSelectedContrat] = useState<Contrat | null>(null);
  const [selectedAffectation, setSelectedAffectation] = useState<Affectation | null>(null);
  const [selectedHistoriqueFinancier, setSelectedHistoriqueFinancier] = useState<HistoriqueFinancier | null>(null);
  
  // État pour les erreurs de formulaire
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Chargement des données de référence
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!profil?.com_contrat_client_id) return;
      
      try {
        // Charger les types de contrat
        const { data: typesContratData, error: typesContratError } = await supabase
          .from('rh_type_contrat')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');
          
        if (typesContratError) throw typesContratError;
        setTypesContrat(typesContratData || []);
        
        // Charger les entités
        const { data: entitesData, error: entitesError } = await supabase
          .from('com_entite')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');
          
        if (entitesError) throw entitesError;
        setEntites(entitesData || []);
        
        // Charger les fonctions
        const { data: fonctionsData, error: fonctionsError } = await supabase
          .from('rh_fonction')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');
          
        if (fonctionsError) throw fonctionsError;
        setFonctions(fonctionsData || []);
        
        // Charger les catégories de flux
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('fin_flux_categorie')
          .select('id, code, libelle, type_flux')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');
          
        if (categoriesError) throw categoriesError;
        setCategoriesFlux(categoriesData || []);
        
        // Charger les sous-catégories de flux
        const { data: sousCategoriesData, error: sousCategoriesError } = await supabase
          .from('fin_flux_sous_categorie')
          .select('id, code, libelle, id_categorie')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');
          
        if (sousCategoriesError) throw sousCategoriesError;
        setSousCategories(sousCategoriesData || []);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données de référence:', error);
        addToast({
          label: 'Erreur lors du chargement des données de référence',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };
    
    fetchReferenceData();
  }, [profil?.com_contrat_client_id]);
  
  // Chargement des données du personnel si en mode édition
  useEffect(() => {
    const fetchPersonnel = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) return;
      
      try {
        // Charger les informations du personnel
        const { data: personnelData, error: personnelError } = await supabase
          .from('rh_personnel')
          .select('*')
          .eq('id', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .single();
          
        if (personnelError) throw personnelError;
        setPersonnel(personnelData);
        
        // Charger les contrats
        const { data: contratsData, error: contratsError } = await supabase
          .from('rh_historique_contrat')
          .select('*')
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('date_debut', { ascending: false });
          
        if (contratsError) throw contratsError;
        setContrats(contratsData || []);
        
        // Charger les affectations
        const { data: affectationsData, error: affectationsError } = await supabase
          .from('rh_affectation')
          .select('*')
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('date_debut', { ascending: false });
          
        if (affectationsError) throw affectationsError;
        setAffectations(affectationsData || []);
        
        // Charger l'historique financier
        const { data: historiqueData, error: historiqueError } = await supabase
          .from('rh_historique_financier')
          .select('*')
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('date_debut', { ascending: false });
          
        if (historiqueError) throw historiqueError;
        setHistoriqueFinancier(historiqueData || []);
        
        // Charger les coûts mensuels
        const { data: coutsData, error: coutsError } = await supabase
          .from('rh_cout_mensuel')
          .select(`
            *,
            categorie:id_categorie (
              code,
              libelle
            ),
            sous_categorie:id_sous_categorie (
              code,
              libelle
            ),
            entite:id_entite (
              code,
              libelle
            )
          `)
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('annee', { ascending: false })
          .order('mois', { ascending: false });
          
        if (coutsError) throw coutsError;
        setCoutsMensuels(coutsData || []);
        
        // Charger les pièces jointes (à implémenter quand la table sera créée)
        // const { data: piecesData, error: piecesError } = await supabase
        //   .from('rh_piece_jointe')
        //   .select('*')
        //   .eq('id_personnel', personnelId)
        //   .order('created_at', { ascending: false });
          
        // if (piecesError) throw piecesError;
        // setPiecesJointes(piecesData || []);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données du personnel:', error);
        addToast({
          label: 'Erreur lors du chargement des données du personnel',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };
    
    fetchPersonnel();
  }, [personnelId, profil?.com_contrat_client_id]);
  
  // Gestion des toasts
  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: Date.now().toString(),
    };
    setToasts(prev => [...prev, newToast]);
  };
  
  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Gestion du formulaire principal
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPersonnel(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleDropdownChange = (name: string) => (value: string) => {
    setPersonnel(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleTiersChange = (value: string) => {
    setPersonnel(prev => ({
      ...prev,
      id_tiers: value
    }));
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors.id_tiers) {
      setFormErrors(prev => ({
        ...prev,
        id_tiers: ''
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!personnel.nom.trim()) {
      errors.nom = 'Le nom est requis';
    }
    
    if (!personnel.prenom.trim()) {
      errors.prenom = 'Le prénom est requis';
    }
    
    if (!personnel.code_court.trim()) {
      errors.code_court = 'Le code court est requis';
    }
    
    if (!personnel.matricule.trim()) {
      errors.matricule = 'Le matricule est requis';
    }
    
    if (!personnel.id_tiers) {
      errors.id_tiers = 'Le tiers est requis';
    }
    
    // Validation de l'email si fourni
    if (personnel.email_perso && personnel.email_perso.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personnel.email_perso.trim())) {
        errors.email_perso = 'Format d\'email invalide';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    if (!profil?.com_contrat_client_id) {
      addToast({
        label: 'Erreur: Profil utilisateur incomplet',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const personnelData = {
        ...personnel,
        com_contrat_client_id: profil.com_contrat_client_id
      };
      
      let result;
      
      if (isCreationMode) {
        // Mode création
        const { data, error } = await supabase
          .from('rh_personnel')
          .insert([personnelData])
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        // Mettre à jour l'état pour passer en mode édition
        setIsCreationMode(false);
        setPersonnel(data);
        
        addToast({
          label: 'Personnel créé avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      } else {
        // Mode édition
        const { data, error } = await supabase
          .from('rh_personnel')
          .update(personnelData)
          .eq('id', personnel.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        addToast({
          label: 'Personnel mis à jour avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      }
      
      // Activer les autres onglets après la création
      if (activeTab === 0) {
        setActiveTab(0); // Rester sur l'onglet actuel
      }
      
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      let errorMessage = `Erreur lors de la ${isCreationMode ? 'création' : 'modification'} du personnel`;
      
      // Gestion des erreurs de contrainte d'unicité
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        if (error.message.includes('code_court')) {
          errorMessage = 'Ce code court existe déjà. Veuillez en choisir un autre.';
          setFormErrors(prev => ({ ...prev, code_court: errorMessage }));
        } else if (error.message.includes('matricule')) {
          errorMessage = 'Ce matricule existe déjà. Veuillez en choisir un autre.';
          setFormErrors(prev => ({ ...prev, matricule: errorMessage }));
        }
      }
      
      addToast({
        label: errorMessage,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Gestion du tiers
  const handleCreateTiers = async (tiersData: any) => {
    try {
      if (!profil?.com_contrat_client_id) {
        throw new Error('Profil utilisateur incomplet');
      }
      
      const { data, error } = await supabase
        .from('com_tiers')
        .insert([{
          ...tiersData,
          com_contrat_client_id: profil.com_contrat_client_id
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Mettre à jour le tiers sélectionné
      setPersonnel(prev => ({
        ...prev,
        id_tiers: data.id
      }));
      
      addToast({
        label: 'Tiers créé avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
      
      return data.id;
    } catch (error) {
      console.error('Erreur lors de la création du tiers:', error);
      addToast({
        label: 'Erreur lors de la création du tiers',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      throw error;
    }
  };
  
  // Gestion de l'upload de photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profil?.com_contrat_client_id) return;
    
    try {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        addToast({
          label: 'Veuillez sélectionner une image',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        return;
      }
      
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profil.com_contrat_client_id}/${fileName}`;
      
      // Upload du fichier
      const { error: uploadError } = await supabase.storage
        .from('personnel-photos')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Mettre à jour le lien de la photo
      setPersonnel(prev => ({
        ...prev,
        lien_photo: filePath
      }));
      
      addToast({
        label: 'Photo uploadée avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo:', error);
      addToast({
        label: 'Erreur lors de l\'upload de la photo',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };
  
  // Gestion des contrats
  const handleAddContrat = () => {
    if (!personnel.id) {
      addToast({
        label: 'Veuillez d\'abord enregistrer les informations personnelles',
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }
    
    setSelectedContrat(null);
    setIsContratModalOpen(true);
  };
  
  const handleEditContrat = (contrat: Contrat) => {
    setSelectedContrat(contrat);
    setIsContratModalOpen(true);
  };
  
  const handleDeleteContrat = async (contrat: Contrat) => {
    if (!contrat.id) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      try {
        const { error } = await supabase
          .from('rh_historique_contrat')
          .delete()
          .eq('id', contrat.id);
          
        if (error) throw error;
        
        // Rafraîchir la liste des contrats
        setContrats(prev => prev.filter(c => c.id !== contrat.id));
        
        addToast({
          label: 'Contrat supprimé avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression du contrat:', error);
        addToast({
          label: 'Erreur lors de la suppression du contrat',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };
  
  const handleSaveContrat = async (contratData: Contrat) => {
    if (!personnel.id || !profil?.com_contrat_client_id) return;
    
    try {
      const contratToSave = {
        ...contratData,
        id_personnel: personnel.id,
        com_contrat_client_id: profil.com_contrat_client_id
      };
      
      let result;
      
      if (contratData.id) {
        // Mode édition
        const { data, error } = await supabase
          .from('rh_historique_contrat')
          .update(contratToSave)
          .eq('id', contratData.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        // Mettre à jour la liste des contrats
        setContrats(prev => prev.map(c => c.id === contratData.id ? result : c));
      } else {
        // Mode création
        const { data, error } = await supabase
          .from('rh_historique_contrat')
          .insert([contratToSave])
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        // Ajouter le contrat à la liste
        setContrats(prev => [...prev, result]);
      }
      
      setIsContratModalOpen(false);
      
      addToast({
        label: `Contrat ${contratData.id ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du contrat:', error);
      addToast({
        label: `Erreur lors de la ${contratData.id ? 'modification' : 'création'} du contrat`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };
  
  // Gestion des affectations
  const handleAddAffectation = () => {
    if (!personnel.id) {
      addToast({
        label: 'Veuillez d\'abord enregistrer les informations personnelles',
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }
    
    if (contrats.length === 0) {
      addToast({
        label: 'Veuillez d\'abord créer un contrat pour ce personnel',
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }
    
    setSelectedAffectation(null);
    setIsAffectationModalOpen(true);
  };
  
  const handleEditAffectation = (affectation: Affectation) => {
    setSelectedAffectation(affectation);
    setIsAffectationModalOpen(true);
  };
  
  const handleDeleteAffectation = async (affectation: Affectation) => {
    if (!affectation.id) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
      try {
        const { error } = await supabase
          .from('rh_affectation')
          .delete()
          .eq('id', affectation.id);
          
        if (error) throw error;
        
        // Rafraîchir la liste des affectations
        setAffectations(prev => prev.filter(a => a.id !== affectation.id));
        
        addToast({
          label: 'Affectation supprimée avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'affectation:', error);
        addToast({
          label: 'Erreur lors de la suppression de l\'affectation',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };
  
  const handleSaveAffectation = async (affectationData: Affectation) => {
    if (!personnel.id || !profil?.com_contrat_client_id) return;
    
    try {
      const affectationToSave = {
        ...affectationData,
        id_personnel: personnel.id,
        com_contrat_client_id: profil.com_contrat_client_id
      };
      
      let result;
      
      if (affectationData.id) {
        // Mode édition
        const { data, error } = await supabase
          .from('rh_affectation')
          .update(affectationToSave)
          .eq('id', affectationData.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        // Mettre à jour la liste des affectations
        setAffectations(prev => prev.map(a => a.id === affectationData.id ? result : a));
      } else {
        // Mode création
        const { data, error } = await supabase
          .from('rh_affectation')
          .insert([affectationToSave])
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        // Ajouter l'affectation à la liste
        setAffectations(prev => [...prev, result]);
      }
      
      setIsAffectationModalOpen(false);
      
      addToast({
        label: `Affectation ${affectationData.id ? 'modifiée' : 'créée'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'affectation:', error);
      addToast({
        label: `Erreur lors de la ${affectationData.id ? 'modification' : 'création'} de l'affectation`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };
  
  // Gestion de l'historique financier
  const handleAddHistoriqueFinancier = () => {
    if (!personnel.id) {
      addToast({
        label: 'Veuillez d\'abord enregistrer les informations personnelles',
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }
    
    if (contrats.length === 0) {
      addToast({
        label: 'Veuillez d\'abord créer un contrat pour ce personnel',
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }
    
    setSelectedHistoriqueFinancier(null);
    setIsHistoriqueFinancierModalOpen(true);
  };
  
  const handleEditHistoriqueFinancier = (historique: HistoriqueFinancier) => {
    setSelectedHistoriqueFinancier(historique);
    setIsHistoriqueFinancierModalOpen(true);
  };
  
  const handleDeleteHistoriqueFinancier = async (historique: HistoriqueFinancier) => {
    if (!historique.id) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet historique financier ?')) {
      try {
        const { error } = await supabase
          .from('rh_historique_financier')
          .delete()
          .eq('id', historique.id);
          
        if (error) throw error;
        
        // Rafraîchir la liste des historiques financiers
        setHistoriqueFinancier(prev => prev.filter(h => h.id !== historique.id));
        
        addToast({
          label: 'Historique financier supprimé avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'historique financier:', error);
        addToast({
          label: 'Erreur lors de la suppression de l\'historique financier',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };
  
  const handleSaveHistoriqueFinancier = async (historiqueData: HistoriqueFinancier) => {
    if (!personnel.id || !profil?.com_contrat_client_id) return;
    
    try {
      const historiqueToSave = {
        ...historiqueData,
        id_personnel: personnel.id,
        com_contrat_client_id: profil.com_contrat_client_id
      };
      
      let result;
      
      if (historiqueData.id) {
        // Mode édition
        const { data, error } = await supabase
          .from('rh_historique_financier')
          .update(historiqueToSave)
          .eq('id', historiqueData.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        // Mettre à jour la liste des historiques financiers
        setHistoriqueFinancier(prev => prev.map(h => h.id === historiqueData.id ? result : h));
      } else {
        // Mode création
        const { data, error } = await supabase
          .from('rh_historique_financier')
          .insert([historiqueToSave])
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        // Ajouter l'historique financier à la liste
        setHistoriqueFinancier(prev => [...prev, result]);
      }
      
      setIsHistoriqueFinancierModalOpen(false);
      
      addToast({
        label: `Historique financier ${historiqueData.id ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique financier:', error);
      addToast({
        label: `Erreur lors de la ${historiqueData.id ? 'modification' : 'création'} de l'historique financier`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };
  
  // Gestion des pièces jointes
  const handleUploadPieceJointe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !personnel.id || !profil?.com_contrat_client_id) return;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Créer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${i}.${fileExt}`;
        const filePath = `${profil.com_contrat_client_id}/${personnel.id}/${fileName}`;
        
        // Upload du fichier
        const { error: uploadError } = await supabase.storage
          .from('personnel-documents')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Enregistrer la pièce jointe dans la base de données
        // Note: Cette partie sera à implémenter quand la table rh_piece_jointe sera créée
        // const { error: insertError } = await supabase
        //   .from('rh_piece_jointe')
        //   .insert([{
        //     id_personnel: personnel.id,
        //     nom_fichier: file.name,
        //     lien_fichier: filePath,
        //     type_fichier: file.type,
        //     com_contrat_client_id: profil.com_contrat_client_id
        //   }]);
          
        // if (insertError) throw insertError;
      }
      
      addToast({
        label: `${files.length} fichier(s) uploadé(s) avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
      
      // Rafraîchir la liste des pièces jointes
      // À implémenter quand la table rh_piece_jointe sera créée
    } catch (error) {
      console.error('Erreur lors de l\'upload des pièces jointes:', error);
      addToast({
        label: 'Erreur lors de l\'upload des pièces jointes',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };
  
  // Colonnes pour les tableaux
  const contratsColumns: Column<Contrat>[] = [
    {
      label: 'Type de contrat',
      accessor: 'id_type_contrat',
      render: (value) => {
        const typeContrat = typesContrat.find(t => t.id === value);
        return typeContrat ? `${typeContrat.code} - ${typeContrat.libelle}` : value;
      }
    },
    {
      label: 'Date de début',
      accessor: 'date_debut',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    },
    {
      label: 'Date de fin',
      accessor: 'date_fin',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) : 'Indéterminée'
    },
    {
      label: 'Entité payeuse',
      accessor: 'id_entite_payeur',
      render: (value) => {
        if (!value) return '-';
        const entite = entites.find(e => e.id === value);
        return entite ? `${entite.code} - ${entite.libelle}` : value;
      }
    },
    {
      label: 'Commentaire',
      accessor: 'commentaire',
      render: (value) => value || '-'
    }
  ];
  
  const affectationsColumns: Column<Affectation>[] = [
    {
      label: 'Entité',
      accessor: 'id_entite',
      render: (value) => {
        const entite = entites.find(e => e.id === value);
        return entite ? `${entite.code} - ${entite.libelle}` : value;
      }
    },
    {
      label: 'Fonction',
      accessor: 'id_fonction',
      render: (value) => {
        const fonction = fonctions.find(f => f.id === value);
        return fonction ? `${fonction.code} - ${fonction.libelle}` : value;
      }
    },
    {
      label: 'Contrat',
      accessor: 'id_contrat',
      render: (value) => {
        const contrat = contrats.find(c => c.id === value);
        if (!contrat) return value;
        
        const typeContrat = typesContrat.find(t => t.id === contrat.id_type_contrat);
        return typeContrat ? `${typeContrat.code} du ${format(new Date(contrat.date_debut), 'dd/MM/yyyy', { locale: fr })}` : value;
      }
    },
    {
      label: 'Date de début',
      accessor: 'date_debut',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    },
    {
      label: 'Date de fin',
      accessor: 'date_fin',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) : 'Indéterminée'
    },
    {
      label: 'Taux présence',
      accessor: 'tx_presence',
      render: (value) => `${(value * 100).toFixed(0)}%`
    },
    {
      label: 'Actif',
      accessor: 'actif',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
    }
  ];
  
  const historiqueFinancierColumns: Column<HistoriqueFinancier>[] = [
    {
      label: 'Contrat',
      accessor: 'id_contrat',
      render: (value) => {
        const contrat = contrats.find(c => c.id === value);
        if (!contrat) return value;
        
        const typeContrat = typesContrat.find(t => t.id === contrat.id_type_contrat);
        return typeContrat ? `${typeContrat.code} du ${format(new Date(contrat.date_debut), 'dd/MM/yyyy', { locale: fr })}` : value;
      }
    },
    {
      label: 'Catégorie',
      accessor: 'id_categorie',
      render: (value) => {
        const categorie = categoriesFlux.find(c => c.id === value);
        return categorie ? `${categorie.code} - ${categorie.libelle}` : value;
      }
    },
    {
      label: 'Sous-catégorie',
      accessor: 'id_sous_categorie',
      render: (value) => {
        const sousCategorie = sousCategories.find(s => s.id === value);
        return sousCategorie ? `${sousCategorie.code} - ${sousCategorie.libelle}` : value;
      }
    },
    {
      label: 'Montant',
      accessor: 'montant',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'Date de début',
      accessor: 'date_debut',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    },
    {
      label: 'Date de fin',
      accessor: 'date_fin',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) : 'Indéterminée'
    },
    {
      label: 'Commentaire',
      accessor: 'commentaire',
      render: (value) => value || '-'
    }
  ];
  
  const coutsMensuelsColumns: Column<CoutMensuel>[] = [
    {
      label: 'Année',
      accessor: 'annee'
    },
    {
      label: 'Mois',
      accessor: 'mois',
      render: (value) => {
        const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        return mois[value - 1];
      }
    },
    {
      label: 'Entité',
      accessor: 'entite',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Catégorie',
      accessor: 'categorie',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Sous-catégorie',
      accessor: 'sous_categorie',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Montant',
      accessor: 'montant',
      render: (value) => `${value.toFixed(2)} €`
    }
  ];
  
  const piecesJointesColumns: Column<PieceJointe>[] = [
    {
      label: 'Nom du fichier',
      accessor: 'nom_fichier'
    },
    {
      label: 'Type',
      accessor: 'type_fichier',
      render: (value) => {
        if (value.startsWith('image/')) return 'Image';
        if (value === 'application/pdf') return 'PDF';
        return value;
      }
    },
    {
      label: 'Date d\'ajout',
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    },
    {
      label: 'Actions',
      accessor: 'lien_fichier',
      render: (value) => (
        <div className="flex gap-2">
          <button
            onClick={() => window.open(value, '_blank')}
            className="text-blue-600 hover:text-blue-800"
          >
            <FileText size={16} />
          </button>
        </div>
      )
    }
  ];
  
  // Actions pour les tableaux
  const contratsActions = [
    {
      label: 'Éditer',
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleEditContrat
    },
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDeleteContrat
    }
  ];
  
  const affectationsActions = [
    {
      label: 'Éditer',
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleEditAffectation
    },
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDeleteAffectation
    }
  ];
  
  const historiqueFinancierActions = [
    {
      label: 'Éditer',
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleEditHistoriqueFinancier
    },
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDeleteHistoriqueFinancier
    }
  ];
  
  // Obtenir l'URL de la photo
  const getPhotoUrl = () => {
    if (!personnel.lien_photo) return null;
    
    return supabase.storage
      .from('personnel-photos')
      .getPublicUrl(personnel.lien_photo).data.publicUrl;
  };
  
  // Rendu des onglets
  const renderTabs = () => {
    const tabs = [
      { icon: <User size={20} />, label: 'Informations personnelles' },
      { icon: <Briefcase size={20} />, label: 'Contrats' },
      { icon: <Building size={20} />, label: 'Affectations' },
      { icon: <CreditCard size={20} />, label: 'Historique financier' },
      { icon: <FileText size={20} />, label: 'Coûts mensuels' },
      { icon: <Upload size={20} />, label: 'Pièces jointes' }
    ];
    
    return (
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm ${
              activeTab === index
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            } ${
              isCreationMode && index > 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => {
              if (!isCreationMode || index === 0) {
                setActiveTab(index);
              }
            }}
            disabled={isCreationMode && index > 0}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    );
  };
  
  // Rendu du contenu des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderInformationsPersonnelles();
      case 1:
        return renderContrats();
      case 2:
        return renderAffectations();
      case 3:
        return renderHistoriqueFinancier();
      case 4:
        return renderCoutsMensuels();
      case 5:
        return renderPiecesJointes();
      default:
        return null;
    }
  };
  
  // Rendu de l'onglet Informations personnelles
  const renderInformationsPersonnelles = () => {
    const photoUrl = getPhotoUrl();
    
    const civiliteOptions: DropdownOption[] = [
      { value: '', label: 'Sélectionner une civilité' },
      { value: 'Madame', label: 'Madame' },
      { value: 'Mademoiselle', label: 'Mademoiselle' },
      { value: 'Monsieur', label: 'Monsieur' }
    ];
    
    const sexeOptions: DropdownOption[] = [
      { value: '', label: 'Sélectionner un sexe' },
      { value: 'Homme', label: 'Homme' },
      { value: 'Femme', label: 'Femme' }
    ];
    
    return (
      <Form size={100} columns={3} onSubmit={handleSubmit}>
        {/* Photo de profil */}
        <div className="col-span-3 flex justify-center mb-6">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-2 flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-gray-400" />
              )}
            </div>
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isSubmitting}
            />
            <Button
              label="Changer la photo"
              icon="Camera"
              color="var(--color-primary)"
              onClick={() => document.getElementById('photo-upload')?.click()}
              disabled={isSubmitting}
              size="sm"
            />
          </div>
        </div>
        
        {/* Informations d'identification */}
        <FormField
          label="Code court"
          required
          error={formErrors.code_court}
          description="Code unique pour identifier le salarié (12 caractères max)"
        >
          <FormInput
            name="code_court"
            value={personnel.code_court}
            onChange={handleInputChange}
            maxLength={12}
            placeholder="Ex: EMP001"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Matricule"
          required
          error={formErrors.matricule}
          description="Matricule unique du salarié (12 caractères max)"
        >
          <FormInput
            name="matricule"
            value={personnel.matricule}
            onChange={handleInputChange}
            maxLength={12}
            placeholder="Ex: MAT001"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Tiers"
          required
          error={formErrors.id_tiers}
          description="Tiers associé au salarié"
        >
          <div className="flex gap-2">
            <div className="flex-1">
              <TiersSelector
                value={personnel.id_tiers}
                onChange={handleTiersChange}
                disabled={isSubmitting}
              />
            </div>
            <Button
              label="Créer"
              icon="Plus"
              color="#f59e0b"
              onClick={() => setIsTiersModalOpen(true)}
              disabled={isSubmitting}
              size="sm"
            />
          </div>
        </FormField>
        
        {/* Informations personnelles */}
        <FormField
          label="Civilité"
          description="Civilité du salarié"
        >
          <Dropdown
            options={civiliteOptions}
            value={personnel.civilite || ''}
            onChange={handleDropdownChange('civilite')}
            label="Sélectionner une civilité"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Nom"
          required
          error={formErrors.nom}
        >
          <FormInput
            name="nom"
            value={personnel.nom}
            onChange={handleInputChange}
            placeholder="Nom de famille"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Prénom"
          required
          error={formErrors.prenom}
        >
          <FormInput
            name="prenom"
            value={personnel.prenom}
            onChange={handleInputChange}
            placeholder="Prénom"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Sexe"
          description="Sexe du salarié"
        >
          <Dropdown
            options={sexeOptions}
            value={personnel.sexe || ''}
            onChange={handleDropdownChange('sexe')}
            label="Sélectionner un sexe"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Date de naissance"
          description="Date de naissance du salarié"
        >
          <FormInput
            type="date"
            name="date_naissance"
            value={personnel.date_naissance || ''}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Numéro de sécurité sociale"
          description="Numéro de sécurité sociale du salarié"
        >
          <FormInput
            name="numero_securite_sociale"
            value={personnel.numero_securite_sociale || ''}
            onChange={handleInputChange}
            placeholder="Ex: 1 85 12 34 567 890 12"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="NIF"
          description="Numéro d'identification fiscale"
        >
          <FormInput
            name="nif"
            value={personnel.nif || ''}
            onChange={handleInputChange}
            placeholder="Numéro d'identification fiscale"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Email personnel"
          error={formErrors.email_perso}
          description="Email personnel du salarié"
        >
          <FormInput
            type="email"
            name="email_perso"
            value={personnel.email_perso || ''}
            onChange={handleInputChange}
            placeholder="email@exemple.com"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Téléphone"
          description="Numéro de téléphone du salarié"
        >
          <FormInput
            name="telephone"
            value={personnel.telephone || ''}
            onChange={handleInputChange}
            placeholder="Ex: +33 6 12 34 56 78"
            disabled={isSubmitting}
          />
        </FormField>
        
        {/* Adresse */}
        <FormField
          label="Adresse"
          description="Adresse du salarié"
          className="col-span-3"
        >
          <FormInput
            name="adresse"
            value={personnel.adresse || ''}
            onChange={handleInputChange}
            placeholder="Adresse"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Code postal"
          description="Code postal"
        >
          <FormInput
            name="code_postal"
            value={personnel.code_postal || ''}
            onChange={handleInputChange}
            placeholder="Code postal"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Ville"
          description="Ville"
        >
          <FormInput
            name="ville"
            value={personnel.ville || ''}
            onChange={handleInputChange}
            placeholder="Ville"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField
          label="Pays"
          description="Pays"
        >
          <FormInput
            name="pays"
            value={personnel.pays || ''}
            onChange={handleInputChange}
            placeholder="Pays"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormActions>
          <Button
            label="Retour"
            icon="ArrowLeft"
            color="#6B7280"
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
          />
          <Button
            label={isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            icon="Save"
            color="var(--color-primary)"
            type="submit"
            disabled={isSubmitting}
          />
        </FormActions>
      </Form>
    );
  };
  
  // Rendu de l'onglet Contrats
  const renderContrats = () => {
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Contrats</h3>
          <Button
            label="Ajouter un contrat"
            icon="Plus"
            color="var(--color-primary)"
            onClick={handleAddContrat}
            size="sm"
          />
        </div>
        
        <DataTable
          columns={contratsColumns}
          data={contrats}
          actions={contratsActions}
          defaultRowsPerPage={5}
          emptyTitle="Aucun contrat"
          emptyMessage="Aucun contrat n'a été créé pour ce salarié."
        />
        
        {isContratModalOpen && (
          <ContratFormModal
            isOpen={isContratModalOpen}
            onClose={() => setIsContratModalOpen(false)}
            onSubmit={handleSaveContrat}
            initialData={selectedContrat}
            typesContrat={typesContrat}
            entites={entites}
          />
        )}
      </div>
    );
  };
  
  // Rendu de l'onglet Affectations
  const renderAffectations = () => {
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Affectations</h3>
          <Button
            label="Ajouter une affectation"
            icon="Plus"
            color="var(--color-primary)"
            onClick={handleAddAffectation}
            size="sm"
          />
        </div>
        
        <DataTable
          columns={affectationsColumns}
          data={affectations}
          actions={affectationsActions}
          defaultRowsPerPage={5}
          emptyTitle="Aucune affectation"
          emptyMessage="Aucune affectation n'a été créée pour ce salarié."
        />
        
        {isAffectationModalOpen && (
          <AffectationFormModal
            isOpen={isAffectationModalOpen}
            onClose={() => setIsAffectationModalOpen(false)}
            onSubmit={handleSaveAffectation}
            initialData={selectedAffectation}
            entites={entites}
            fonctions={fonctions}
            contrats={contrats}
            typesContrat={typesContrat}
          />
        )}
      </div>
    );
  };
  
  // Rendu de l'onglet Historique financier
  const renderHistoriqueFinancier = () => {
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Historique financier</h3>
          <Button
            label="Ajouter un historique"
            icon="Plus"
            color="var(--color-primary)"
            onClick={handleAddHistoriqueFinancier}
            size="sm"
          />
        </div>
        
        <DataTable
          columns={historiqueFinancierColumns}
          data={historiqueFinancier}
          actions={historiqueFinancierActions}
          defaultRowsPerPage={5}
          emptyTitle="Aucun historique financier"
          emptyMessage="Aucun historique financier n'a été créé pour ce salarié."
        />
        
        {isHistoriqueFinancierModalOpen && (
          <HistoriqueFinancierFormModal
            isOpen={isHistoriqueFinancierModalOpen}
            onClose={() => setIsHistoriqueFinancierModalOpen(false)}
            onSubmit={handleSaveHistoriqueFinancier}
            initialData={selectedHistoriqueFinancier}
            contrats={contrats}
            typesContrat={typesContrat}
            categoriesFlux={categoriesFlux}
            sousCategories={sousCategories}
          />
        )}
      </div>
    );
  };
  
  // Rendu de l'onglet Coûts mensuels
  const renderCoutsMensuels = () => {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">Coûts mensuels</h3>
          <p className="text-sm text-gray-500">
            Les coûts mensuels sont calculés automatiquement à partir des affectations et des historiques financiers.
          </p>
        </div>
        
        <DataTable
          columns={coutsMensuelsColumns}
          data={coutsMensuels}
          defaultRowsPerPage={10}
          emptyTitle="Aucun coût mensuel"
          emptyMessage="Aucun coût mensuel n'a été calculé pour ce salarié."
        />
      </div>
    );
  };
  
  // Rendu de l'onglet Pièces jointes
  const renderPiecesJointes = () => {
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Pièces jointes</h3>
          <div>
            <input
              type="file"
              id="pieces-jointes-upload"
              className="hidden"
              multiple
              onChange={handleUploadPieceJointe}
              disabled={!personnel.id}
            />
            <Button
              label="Ajouter des pièces jointes"
              icon="Upload"
              color="var(--color-primary)"
              onClick={() => document.getElementById('pieces-jointes-upload')?.click()}
              disabled={!personnel.id}
              size="sm"
            />
          </div>
        </div>
        
        {piecesJointes.length > 0 ? (
          <DataTable
            columns={piecesJointesColumns}
            data={piecesJointes}
            defaultRowsPerPage={5}
            emptyTitle="Aucune pièce jointe"
            emptyMessage="Aucune pièce jointe n'a été ajoutée pour ce salarié."
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune pièce jointe</h3>
            <p className="text-gray-500 mb-4">
              Ajoutez des documents liés à ce salarié (contrats, attestations, etc.)
            </p>
            <Button
              label="Ajouter des pièces jointes"
              icon="Upload"
              color="var(--color-primary)"
              onClick={() => document.getElementById('pieces-jointes-upload')?.click()}
              disabled={!personnel.id}
              size="sm"
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="text-blue-600" />
          {isCreationMode ? 'Nouvel employé' : `${personnel.prenom} ${personnel.nom}`}
        </h2>
        <Button
          label="Retour"
          icon="ArrowLeft"
          color="#6B7280"
          onClick={onClose}
        />
      </div>
      
      {renderTabs()}
      {renderTabContent()}
      
      <ToastContainer toasts={toasts} onClose={closeToast} />
      
      {/* Modale pour créer un tiers */}
      {isTiersModalOpen && (
        <TiersFormModal
          isOpen={isTiersModalOpen}
          onClose={() => setIsTiersModalOpen(false)}
          onSubmit={handleCreateTiers}
        />
      )}
    </div>
  );
};

// Composant modal pour le formulaire de contrat
interface ContratFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contrat: Contrat) => void;
  initialData: Contrat | null;
  typesContrat: TypeContrat[];
  entites: Entite[];
}

const ContratFormModal: React.FC<ContratFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  typesContrat,
  entites
}) => {
  const [formData, setFormData] = useState<Contrat>({
    id_personnel: initialData?.id_personnel || '',
    id_type_contrat: initialData?.id_type_contrat || '',
    date_debut: initialData?.date_debut || format(new Date(), 'yyyy-MM-dd'),
    date_fin: initialData?.date_fin || '',
    commentaire: initialData?.commentaire || '',
    id_entite_payeur: initialData?.id_entite_payeur || ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleDropdownChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.id_type_contrat) {
      errors.id_type_contrat = 'Le type de contrat est requis';
    }
    
    if (!formData.date_debut) {
      errors.date_debut = 'La date de début est requise';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    onSubmit({
      ...formData,
      id: initialData?.id
    });
  };
  
  if (!isOpen) return null;
  
  const typeContratOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner un type de contrat' },
    ...typesContrat.map(type => ({
      value: type.id,
      label: `${type.code} - ${type.libelle}`
    }))
  ];
  
  const entiteOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une entité payeuse (optionnel)' },
    ...entites.map(entite => ({
      value: entite.id,
      label: `${entite.code} - ${entite.libelle}`
    }))
  ];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Modifier un contrat' : 'Ajouter un contrat'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <Form size={100} onSubmit={handleSubmit}>
          <FormField
            label="Type de contrat"
            required
            error={formErrors.id_type_contrat}
          >
            <Dropdown
              options={typeContratOptions}
              value={formData.id_type_contrat}
              onChange={handleDropdownChange('id_type_contrat')}
              label="Sélectionner un type de contrat"
            />
          </FormField>
          
          <FormField
            label="Date de début"
            required
            error={formErrors.date_debut}
          >
            <FormInput
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleInputChange}
            />
          </FormField>
          
          <FormField
            label="Date de fin"
            description="Laisser vide pour un contrat à durée indéterminée"
          >
            <FormInput
              type="date"
              name="date_fin"
              value={formData.date_fin || ''}
              onChange={handleInputChange}
            />
          </FormField>
          
          <FormField
            label="Entité payeuse"
            description="Entité qui paie le salaire (optionnel)"
          >
            <Dropdown
              options={entiteOptions}
              value={formData.id_entite_payeur || ''}
              onChange={handleDropdownChange('id_entite_payeur')}
              label="Sélectionner une entité payeuse"
            />
          </FormField>
          
          <FormField
            label="Commentaire"
          >
            <textarea
              name="commentaire"
              value={formData.commentaire || ''}
              onChange={handleInputChange}
              className="w-full p-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Commentaire sur ce contrat..."
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
};

// Composant modal pour le formulaire d'affectation
interface AffectationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (affectation: Affectation) => void;
  initialData: Affectation | null;
  entites: Entite[];
  fonctions: Fonction[];
  contrats: Contrat[];
  typesContrat: TypeContrat[];
}

const AffectationFormModal: React.FC<AffectationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  entites,
  fonctions,
  contrats,
  typesContrat
}) => {
  const [formData, setFormData] = useState<Affectation>({
    id_personnel: initialData?.id_personnel || '',
    id_entite: initialData?.id_entite || '',
    id_contrat: initialData?.id_contrat || '',
    id_fonction: initialData?.id_fonction || '',
    date_debut: initialData?.date_debut || format(new Date(), 'yyyy-MM-dd'),
    date_fin: initialData?.date_fin || '',
    actif: initialData?.actif ?? true,
    commentaire: initialData?.commentaire || '',
    tx_presence: initialData?.tx_presence ?? 1
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Traitement spécial pour tx_presence
    if (name === 'tx_presence') {
      // Convertir la valeur en pourcentage en décimal (ex: 100 -> 1.0)
      const numValue = parseFloat(value) / 100;
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleDropdownChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.id_entite) {
      errors.id_entite = 'L\'entité est requise';
    }
    
    if (!formData.id_fonction) {
      errors.id_fonction = 'La fonction est requise';
    }
    
    if (!formData.id_contrat) {
      errors.id_contrat = 'Le contrat est requis';
    }
    
    if (!formData.date_debut) {
      errors.date_debut = 'La date de début est requise';
    }
    
    if (formData.tx_presence <= 0 || formData.tx_presence > 1) {
      errors.tx_presence = 'Le taux de présence doit être compris entre 1 et 100%';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    onSubmit({
      ...formData,
      id: initialData?.id
    });
  };
  
  if (!isOpen) return null;
  
  const entiteOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une entité' },
    ...entites.map(entite => ({
      value: entite.id,
      label: `${entite.code} - ${entite.libelle}`
    }))
  ];
  
  const fonctionOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une fonction' },
    ...fonctions.map(fonction => ({
      value: fonction.id,
      label: `${fonction.code} - ${fonction.libelle}`
    }))
  ];
  
  const contratOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner un contrat' },
    ...contrats.map(contrat => {
      const typeContrat = typesContrat.find(t => t.id === contrat.id_type_contrat);
      return {
        value: contrat.id || '',
        label: `${typeContrat?.code || 'Contrat'} du ${format(new Date(contrat.date_debut), 'dd/MM/yyyy', { locale: fr })}`
      };
    })
  ];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Modifier une affectation' : 'Ajouter une affectation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <Form size={100} onSubmit={handleSubmit}>
          <FormField
            label="Entité"
            required
            error={formErrors.id_entite}
          >
            <Dropdown
              options={entiteOptions}
              value={formData.id_entite}
              onChange={handleDropdownChange('id_entite')}
              label="Sélectionner une entité"
            />
          </FormField>
          
          <FormField
            label="Fonction"
            required
            error={formErrors.id_fonction}
          >
            <Dropdown
              options={fonctionOptions}
              value={formData.id_fonction}
              onChange={handleDropdownChange('id_fonction')}
              label="Sélectionner une fonction"
            />
          </FormField>
          
          <FormField
            label="Contrat"
            required
            error={formErrors.id_contrat}
          >
            <Dropdown
              options={contratOptions}
              value={formData.id_contrat}
              onChange={handleDropdownChange('id_contrat')}
              label="Sélectionner un contrat"
            />
          </FormField>
          
          <FormField
            label="Date de début"
            required
            error={formErrors.date_debut}
          >
            <FormInput
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleInputChange}
            />
          </FormField>
          
          <FormField
            label="Date de fin"
            description="Laisser vide pour une affectation sans date de fin"
          >
            <FormInput
              type="date"
              name="date_fin"
              value={formData.date_fin || ''}
              onChange={handleInputChange}
            />
          </FormField>
          
          <FormField
            label="Taux de présence (%)"
            required
            error={formErrors.tx_presence}
            description="Pourcentage de présence (ex: 100 pour temps plein, 50 pour mi-temps)"
          >
            <FormInput
              type="number"
              name="tx_presence"
              value={(formData.tx_presence * 100).toString()}
              onChange={handleInputChange}
              min="1"
              max="100"
              step="1"
            />
          </FormField>
          
          <FormField
            label="Actif"
            description="Indique si l'affectation est active"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                name="actif"
                checked={formData.actif}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                {formData.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </FormField>
          
          <FormField
            label="Commentaire"
          >
            <textarea
              name="commentaire"
              value={formData.commentaire || ''}
              onChange={handleInputChange}
              className="w-full p-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Commentaire sur cette affectation..."
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
};

// Composant modal pour le formulaire d'historique financier
interface HistoriqueFinancierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (historique: HistoriqueFinancier) => void;
  initialData: HistoriqueFinancier | null;
  contrats: Contrat[];
  typesContrat: TypeContrat[];
  categoriesFlux: CategorieFlux[];
  sousCategories: SousCategorieFlux[];
}

const HistoriqueFinancierFormModal: React.FC<HistoriqueFinancierFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  contrats,
  typesContrat,
  categoriesFlux,
  sousCategories
}) => {
  const [formData, setFormData] = useState<HistoriqueFinancier>({
    id_personnel: initialData?.id_personnel || '',
    id_contrat: initialData?.id_contrat || '',
    date_debut: initialData?.date_debut || format(new Date(), 'yyyy-MM-dd'),
    date_fin: initialData?.date_fin || '',
    id_categorie: initialData?.id_categorie || '',
    id_sous_categorie: initialData?.id_sous_categorie || '',
    montant: initialData?.montant || 0,
    commentaire: initialData?.commentaire || ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [filteredSousCategories, setFilteredSousCategories] = useState<SousCategorieFlux[]>([]);
  
  // Filtrer les sous-catégories en fonction de la catégorie sélectionnée
  useEffect(() => {
    if (formData.id_categorie) {
      const filtered = sousCategories.filter(sc => sc.id_categorie === formData.id_categorie);
      setFilteredSousCategories(filtered);
      
      // Si la sous-catégorie sélectionnée n'est pas dans la liste filtrée, la réinitialiser
      if (formData.id_sous_categorie && !filtered.some(sc => sc.id === formData.id_sous_categorie)) {
        setFormData(prev => ({
          ...prev,
          id_sous_categorie: ''
        }));
      }
    } else {
      setFilteredSousCategories([]);
    }
  }, [formData.id_categorie, sousCategories, formData.id_sous_categorie]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Traitement spécial pour le montant
    if (name === 'montant') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleDropdownChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.id_contrat) {
      errors.id_contrat = 'Le contrat est requis';
    }
    
    if (!formData.date_debut) {
      errors.date_debut = 'La date de début est requise';
    }
    
    if (!formData.id_categorie) {
      errors.id_categorie = 'La catégorie est requise';
    }
    
    if (!formData.id_sous_categorie) {
      errors.id_sous_categorie = 'La sous-catégorie est requise';
    }
    
    if (formData.montant <= 0) {
      errors.montant = 'Le montant doit être supérieur à 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    onSubmit({
      ...formData,
      id: initialData?.id
    });
  };
  
  if (!isOpen) return null;
  
  const contratOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner un contrat' },
    ...contrats.map(contrat => {
      const typeContrat = typesContrat.find(t => t.id === contrat.id_type_contrat);
      return {
        value: contrat.id || '',
        label: `${typeContrat?.code || 'Contrat'} du ${format(new Date(contrat.date_debut), 'dd/MM/yyyy', { locale: fr })}`
      };
    })
  ];
  
  const categorieOptions: DropdownOption[] = [
    { value: '', label: 'Sélectionner une catégorie' },
    ...categoriesFlux.map(categorie => ({
      value: categorie.id,
      label: `${categorie.code} - ${categorie.libelle} (${categorie.type_flux === 'produit' ? 'Produit' : 'Charge'})`
    }))
  ];
  
  const sousCategorieOptions: DropdownOption[] = [
    { value: '', label: formData.id_categorie ? 'Sélectionner une sous-catégorie' : 'Sélectionner d\'abord une catégorie' },
    ...filteredSousCategories.map(sousCategorie => ({
      value: sousCategorie.id,
      label: `${sousCategorie.code} - ${sousCategorie.libelle}`
    }))
  ];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Modifier un historique financier' : 'Ajouter un historique financier'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <Form size={100} onSubmit={handleSubmit}>
          <FormField
            label="Contrat"
            required
            error={formErrors.id_contrat}
          >
            <Dropdown
              options={contratOptions}
              value={formData.id_contrat}
              onChange={handleDropdownChange('id_contrat')}
              label="Sélectionner un contrat"
            />
          </FormField>
          
          <FormField
            label="Catégorie"
            required
            error={formErrors.id_categorie}
          >
            <Dropdown
              options={categorieOptions}
              value={formData.id_categorie}
              onChange={handleDropdownChange('id_categorie')}
              label="Sélectionner une catégorie"
            />
          </FormField>
          
          <FormField
            label="Sous-catégorie"
            required
            error={formErrors.id_sous_categorie}
          >
            <Dropdown
              options={sousCategorieOptions}
              value={formData.id_sous_categorie}
              onChange={handleDropdownChange('id_sous_categorie')}
              label={formData.id_categorie ? "Sélectionner une sous-catégorie" : "Sélectionner d'abord une catégorie"}
              disabled={!formData.id_categorie}
            />
          </FormField>
          
          <FormField
            label="Montant"
            required
            error={formErrors.montant}
          >
            <FormInput
              type="number"
              name="montant"
              value={formData.montant.toString()}
              onChange={handleInputChange}
              step="0.01"
              min="0"
            />
          </FormField>
          
          <FormField
            label="Date de début"
            required
            error={formErrors.date_debut}
          >
            <FormInput
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleInputChange}
            />
          </FormField>
          
          <FormField
            label="Date de fin"
            description="Laisser vide pour un historique sans date de fin"
          >
            <FormInput
              type="date"
              name="date_fin"
              value={formData.date_fin || ''}
              onChange={handleInputChange}
            />
          </FormField>
          
          <FormField
            label="Commentaire"
          >
            <textarea
              name="commentaire"
              value={formData.commentaire || ''}
              onChange={handleInputChange}
              className="w-full p-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Commentaire sur cet historique financier..."
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
};

export default FichePersonnel;