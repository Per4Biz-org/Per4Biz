import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { supabase } from '../../../../lib/supabase';
import { FermetureCaisse, EncaissementCB, FactureDepense } from '../FermetureCaisseDrawer';
import { ToastData } from '../../../ui/toast';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface UseFermetureCaisseFormProps {
  isOpen: boolean;
  fermetureToEdit?: FermetureCaisse | null;
  onSuccess: () => void;
  onClose: () => void;
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  profil: any;
  selectedEntityId?: string;
}

/**
 * Hook personnalisé pour gérer la logique du formulaire de fermeture de caisse
 */
export function useFermetureCaisseForm({
  isOpen,
  fermetureToEdit,
  onSuccess,
  onClose,
  addToast,
  profil,
  selectedEntityId
}: UseFermetureCaisseFormProps) {
  const { t } = useTranslation();
  // États
  const [entites, setEntites] = useState<Entite[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fermeture, setFermeture] = useState<FermetureCaisse>(getInitialFermetureState());
  const [encaissementsCB, setEncaissementsCB] = useState<EncaissementCB[]>([]);
  const [facturesDepense, setFacturesDepense] = useState<FactureDepense[]>([]);

  // Valeurs calculées
  const gardeEnCaisse = 
    fermeture.depot_banque_theorique !== null && fermeture.depot_banque_reel !== null
      ? fermeture.depot_banque_theorique - fermeture.depot_banque_reel
      : null;

  // Fonctions utilitaires
  function getInitialFermetureState(): FermetureCaisse {
    return {
      id_entite: selectedEntityId || '',
      date_fermeture: format(new Date(), 'yyyy-MM-dd'),
      ca_ht: null,
      ca_ttc: null,
      fond_caisse_espece_debut: null,
      fond_caisse_espece_fin: null,
      depot_banque_theorique: null,
      depot_banque_reel: null,
      total_cb_brut: null,
      total_cb_reel: null,
      total_facture_depenses_ttc: null,
      est_valide: false,
      commentaire: ''
    };
  }

  // Chargement des entités
  useEffect(() => {
    const fetchEntites = async () => {
      if (!profil?.com_contrat_client_id || !isOpen) return;
      
      try {
        const { data, error } = await supabase
          .from('com_entite')
          .select('id, code, libelle')
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('libelle');
          
        if (error) throw error;
        setEntites(data || []);
        
        // Si aucune entité n'est sélectionnée et qu'il y a des entités disponibles, sélectionner la première
        if (!fermeture.id_entite && data && data.length > 0) {
          setFermeture(prev => ({ ...prev, id_entite: data[0].id }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des entités:', error);
        addToast({
          label: t('messages.errorLoadingEntities'),
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };
    
    fetchEntites();
  }, [isOpen, profil?.com_contrat_client_id, addToast, fermeture.id_entite]);
  
  // Chargement des données de la fermeture à éditer
  useEffect(() => {
    const fetchFermetureDetails = async () => {
      if (!fermetureToEdit?.id) return;
      
      try {
        // Charger les encaissements CB
        const { data: encaissementsData, error: encaissementsError } = await supabase
          .from('fin_ferm_multibanc')
          .select('*')
          .eq('fin_ferm_caisse_id', fermetureToEdit.id);
          
        if (encaissementsError) throw encaissementsError;
        setEncaissementsCB(encaissementsData || []);
        
        // Charger les factures de dépense
        const { data: facturesData, error: facturesError } = await supabase
          .from('fin_ferm_facturedepenses')
          .select(`
            *,
            facture:fin_facture_achat_id (
              num_document,
              date_facture,
              tiers:id_tiers (
                nom
              )
            )
          `)
          .eq('fin_ferm_caisse_id', fermetureToEdit.id);
          
        if (facturesError) throw facturesError;
        setFacturesDepense(facturesData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des détails de la fermeture:', error);
        addToast({
          label: t('messages.errorLoadingClosureDetails'),
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };
    
    if (fermetureToEdit) {
      setFermeture(fermetureToEdit);
      fetchFermetureDetails();
    } else {
      // Réinitialiser le formulaire avec l'entité sélectionnée si disponible
      const initialState = getInitialFermetureState();
      setFermeture(initialState);
      
      // Si une entité est sélectionnée dans les filtres, l'utiliser
      if (selectedEntityId && !fermetureToEdit) {
        setFermeture(prev => ({
          ...prev,
          id_entite: selectedEntityId
        }));
      }
    }
    setEncaissementsCB([]);
    setFacturesDepense([]);
  }, [fermetureToEdit, selectedEntityId]);
  
  // Calcul des totaux et des valeurs dérivées
  useEffect(() => {
    // Calcul du total des encaissements CB
    const totalCBBrut = encaissementsCB.reduce((sum, item) => sum + (item.montant_brut || 0), 0);
    const totalCBReel = encaissementsCB.reduce((sum, item) => sum + (item.montant_reel || 0), 0);
    
    // Calcul du total des factures de dépense
    const totalFacturesDepenses = facturesDepense.reduce((sum, item) => sum + (item.montant_ttc || 0), 0);
    
    // Calcul du dépôt théorique
    const depotTheorique = (fermeture.ca_ttc || 0) - totalCBBrut - totalFacturesDepenses;
    
    // Mise à jour de l'état
    setFermeture(prev => ({
      ...prev,
      total_cb_brut: totalCBBrut,
      total_cb_reel: totalCBReel,
      total_facture_depenses_ttc: totalFacturesDepenses,
      depot_banque_theorique: depotTheorique
    }));
    
    // Calcul du fond de caisse final
    if (fermeture.fond_caisse_espece_debut !== null && fermeture.depot_banque_reel !== null) {
      const gardeEnCaisse = depotTheorique - (fermeture.depot_banque_reel || 0);
      const fondCaisseFin = (fermeture.fond_caisse_espece_debut || 0) + gardeEnCaisse;
      
      setFermeture(prev => ({
        ...prev,
        fond_caisse_espece_fin: fondCaisseFin
      }));
    }
  }, [encaissementsCB, facturesDepense, fermeture.ca_ttc, fermeture.fond_caisse_espece_debut, fermeture.depot_banque_reel]);
  
  // Gestionnaires d'événements
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Traitement spécial pour les champs numériques
    if (['ca_ht', 'ca_ttc', 'fond_caisse_espece_debut', 'depot_banque_reel'].includes(name)) {
      const numValue = value === '' ? null : parseFloat(value);
      setFermeture(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFermeture(prev => ({ ...prev, [name]: value }));
    }
    
    // Effacer l'erreur quand l'utilisateur modifie un champ
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleEntiteChange = (value: string) => {
    // Si une entité est déjà sélectionnée depuis la page principale, ne pas permettre le changement
    if (selectedEntityId) return;
    
    setFermeture(prev => ({ ...prev, id_entite: value }));
    if (formErrors.id_entite) {
      setFormErrors(prev => ({ ...prev, id_entite: '' }));
    }
  };
  
  // Gestion des encaissements CB
  const handleAddEncaissement = () => {
    // Cette fonction est appelée par le composant parent
    // pour ouvrir la modale d'ajout d'encaissement
  };
  
  const handleEditEncaissement = (encaissement: EncaissementCB) => {
    // Cette fonction est appelée par le composant parent
    // pour ouvrir la modale d'édition d'encaissement
  };
  
  const handleDeleteEncaissement = async (encaissement: EncaissementCB) => {
    if (!encaissement.id) {
      // Si l'encaissement n'a pas encore été sauvegardé en base
      setEncaissementsCB(prev => prev.filter(item => item !== encaissement));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('fin_ferm_multibanc')
        .delete()
        .eq('id', encaissement.id);
        
      if (error) throw error;
      
      setEncaissementsCB(prev => prev.filter(item => item.id !== encaissement.id));
      addToast({
        label: t('messages.cardPaymentDeletedSuccess'),
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'encaissement:', error);
      addToast({
        label: t('messages.errorDeletingCardPayment'),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };
  
  const handleSaveEncaissement = (encaissement: EncaissementCB, selectedEncaissement: EncaissementCB | null) => {
    if (selectedEncaissement) {
      // Mise à jour d'un encaissement existant
      setEncaissementsCB(prev => 
        prev.map(item => 
          item === selectedEncaissement ? encaissement : item
        )
      );
    } else {
      // Ajout d'un nouvel encaissement
      setEncaissementsCB(prev => [...prev, encaissement]);
    }
  };
  
  // Gestion des factures de dépense
  const handleAddFacture = () => {
    // Cette fonction est appelée par le composant parent
    // pour ouvrir la modale d'ajout de facture
  };
  
  const handleDeleteFacture = async (facture: FactureDepense) => {
    if (!facture.id) {
      // Si la facture n'a pas encore été sauvegardée en base
      setFacturesDepense(prev => prev.filter(item => item !== facture));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('fin_ferm_facturedepenses')
        .delete()
        .eq('id', facture.id);
        
      if (error) throw error;
      
      setFacturesDepense(prev => prev.filter(item => item.id !== facture.id));
      addToast({
        label: t('messages.expenseInvoiceDeletedSuccess'),
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture:', error);
      addToast({
        label: t('messages.errorDeletingExpenseInvoice'),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };
  
  const handleSaveFactures = (factures: FactureDepense[]) => {
    setFacturesDepense(prev => [...prev, ...factures]);
  };
  
  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!fermeture.id_entite) {
      errors.id_entite = 'Le restaurant est requis';
    }
    
    if (!fermeture.date_fermeture) {
      errors.date_fermeture = 'La date de fermeture est requise';
    }
    
    if (fermeture.ca_ttc === null) {
      errors.ca_ttc = 'Le CA TTC est requis';
    }
    
    if (fermeture.depot_banque_reel === null) {
      errors.depot_banque_reel = 'Le dépôt en banque réel est requis';
    }
    
    if (fermeture.fond_caisse_espece_debut === null) {
      errors.fond_caisse_espece_debut = 'Le fond de caisse de début est requis';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Sauvegarde des données en base
  const saveFermetureCaisse = useCallback(async (fermetureData: any, fermetureId: number | undefined) => {
    if (!fermetureId) {
      // Création d'une nouvelle fermeture
      const { data: insertData, error: insertError } = await supabase
        .from('fin_ferm_caisse')
        .insert(fermetureData)
        .select()
        .single();
        
      if (insertError) throw insertError;
      return insertData.id;
    } else {
      // Mise à jour d'une fermeture existante
      const { error: updateError } = await supabase
        .from('fin_ferm_caisse')
        .update(fermetureData)
        .eq('id', fermetureId);
        
      if (updateError) throw updateError;
      return fermetureId;
    }
  }, []);

  const saveEncaissementsCB = useCallback(async (
    encaissements: EncaissementCB[], 
    fermetureId: number, 
    contratClientId: string
  ) => {
    for (const encaissement of encaissements) {
      if (encaissement.id) {
        // Mise à jour d'un encaissement existant
        await supabase
          .from('fin_ferm_multibanc')
          .update({
            periode: encaissement.periode,
            montant_brut: encaissement.montant_brut,
            montant_reel: encaissement.montant_reel,
            commentaire: encaissement.commentaire
          })
          .eq('id', encaissement.id);
      } else {
        // Création d'un nouvel encaissement
        await supabase
          .from('fin_ferm_multibanc')
          .insert({
            com_contrat_client_id: contratClientId,
            fin_ferm_caisse_id: fermetureId,
            periode: encaissement.periode,
            montant_brut: encaissement.montant_brut,
            montant_reel: encaissement.montant_reel,
            commentaire: encaissement.commentaire
          });
      }
    }
  }, []);

  const saveFacturesDepense = useCallback(async (
    factures: FactureDepense[], 
    fermetureId: number, 
    contratClientId: string
  ) => {
    for (const facture of factures) {
      if (facture.id) {
        // Les factures existantes ne sont pas modifiées, seulement supprimées
        continue;
      } else {
        // Création d'une nouvelle association de facture
        await supabase
          .from('fin_ferm_facturedepenses')
          .insert({
            com_contrat_client_id: contratClientId,
            fin_ferm_caisse_id: fermetureId,
            fin_facture_achat_id: facture.fin_facture_achat_id,
            montant_ttc: facture.montant_ttc,
            commentaire: facture.commentaire
          });
      }
    }
  }, []);
  
  // Soumission du formulaire
  const handleSubmit = async (valider: boolean = false) => {
    if (!validateForm()) return;
    if (!profil?.com_contrat_client_id) {
      addToast({
        label: t('messages.incompleteUserProfile'),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Préparation des données de fermeture de caisse
      const fermetureData = {
        ...fermeture,
        com_contrat_client_id: profil.com_contrat_client_id,
        est_valide: valider
      };
      
      // Sauvegarde de la fermeture de caisse
      const fermetureId = await saveFermetureCaisse(fermetureData, fermeture.id);
      
      // Sauvegarde des encaissements CB
      await saveEncaissementsCB(encaissementsCB, fermetureId, profil.com_contrat_client_id);
      
      // Sauvegarde des factures de dépense
      await saveFacturesDepense(facturesDepense, fermetureId, profil.com_contrat_client_id);
      
      addToast({
        label: valider ? t('messages.closureValidatedSuccess') : t('messages.closureSavedSuccess'),
        icon: 'Check',
        color: '#22c55e'
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la fermeture de caisse:', error);
      addToast({
        label: t('messages.errorSavingClosure'),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    fermeture,
    encaissementsCB,
    facturesDepense,
    formErrors,
    entites,
    isSubmitting,
    gardeEnCaisse,
    handleInputChange,
    handleEntiteChange,
    handleAddEncaissement,
    handleEditEncaissement,
    handleDeleteEncaissement,
    handleSaveEncaissement,
    handleAddFacture,
    handleDeleteFacture,
    handleSaveFactures,
    handleSubmit
  };
}