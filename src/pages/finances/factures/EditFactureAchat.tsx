import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles.module.css';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsGestionFinanciere } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { Button } from '../../../components/ui/button';
import { FactureAchatForm } from '../../../components/finances/factures/FactureAchatForm';
import { FactureLignesSection } from '../../../components/finances/factures/FactureLignesSection';
import { FactureLigneForm } from '../../../components/finances/factures/FactureLigneForm';
import { FactureTotals } from '../../../components/finances/factures/FactureTotals';
import { FactureFileUpload } from '../../../components/finances/factures/FactureFileUpload';
import { supabase } from '../../../lib/supabase';

interface FactureAchat {
  id?: string;
  id_entite: string;
  id_tiers: string;
  date_facture: string;
  num_document: string | null;
  id_mode_paiement: string;
  montant_ht: number;
  montant_tva: number | null;
  montant_ttc: number;
  commentaire?: string | null;
  id_type_facture?: string;
  lien_piece_jointe?: string | null;
}

interface FactureLigne {
  id?: string;
  id_facture_achat?: string;
  id_categorie_flux: string;
  id_sous_categorie_flux: string;
  montant_ht: number;
  montant_tva: number | null;
  commentaire?: string | null;
}

const EditFactureAchat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const returnToFactureDepenseModal = location.state?.returnToFactureDepenseModal;
  const previousPath = location.state?.previousPath;
  const fermetureCaisseId = location.state?.fermetureCaisseId;
  const { setMenuItems } = useMenu();
  const { profil } = useProfil();
  const entiteFromState = location.state?.entiteId;
  
  // État pour stocker le type de facture "exploitation"
  const [exploitationTypeFacture, setExploitationTypeFacture] = useState<{id: string, libelle: string} | null>(null);
  
  // États principaux
  const [facture, setFacture] = useState<FactureAchat>({
    id_entite: entiteFromState || '',
    id_tiers: '',
    date_facture: new Date().toISOString().split('T')[0],
    num_document: null,
    id_mode_paiement: '',
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0,
    id_type_facture: ''
  });
  
  const [lignes, setLignes] = useState<FactureLigne[]>([]);
  const [entites, setEntites] = useState<any[]>([]);
  
  // États UI
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLigneFormOpen, setIsLigneFormOpen] = useState(false);
  const [selectedLigne, setSelectedLigne] = useState<FactureLigne | null>(null);
  
  // Configuration du menu
  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
  }, [setMenuItems]);
  
  // Récupération du type de facture "exploitation"
  useEffect(() => {
    const fetchExploitationTypeFacture = async () => {
      if (!profil?.com_contrat_client_id) return;
      
      try {
        const { data, error } = await supabase
          .from('com_param_type_facture')
          .select('id, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('facture_exploitation', true)
          .single();
          
        if (error) {
          console.error('Erreur lors de la récupération du type de facture exploitation:', error);
          return;
        }
        
        if (data) {
          setExploitationTypeFacture({
            id: data.id,
            libelle: data.libelle
          });
          
          // Mettre à jour l'état de la facture avec le type de facture exploitation
          setFacture(prev => ({
            ...prev,
            id_type_facture: data.id
          }));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du type de facture exploitation:', error);
      }
    };
    
    fetchExploitationTypeFacture();
  }, [profil?.com_contrat_client_id]);
  
  // Chargement des entités
  useEffect(() => {
    const fetchEntites = async () => {
      if (!profil?.com_contrat_client_id) return;
      
      try {
        const { data, error } = await supabase
          .from('com_entite')
          .select('id, code, libelle')
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('libelle');
          
        if (error) throw error;
        setEntites(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des entités:', error);
        addToast({
          label: 'Erreur lors du chargement des entités',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };
    
    fetchEntites();
  }, [profil?.com_contrat_client_id]);
  
  // Chargement de la facture et de ses lignes si on est en mode édition
  useEffect(() => {
    const fetchFacture = async () => {
      if (!id || !profil?.com_contrat_client_id) return;
      
      setLoading(true);
      try {
        // Charger la facture
        const { data: factureData, error: factureError } = await supabase
          .from('fin_facture_achat')
          .select('*')
          .eq('id', id)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .single();
          
        if (factureError) throw factureError;
        
        // Charger les lignes de la facture
        const { data: lignesData, error: lignesError } = await supabase
          .from('fin_facture_achat_ligne')
          .select(`
            *,
            fin_flux_categorie:id_categorie_flux (
              code,
              libelle
            ),
            fin_flux_sous_categorie:id_sous_categorie_flux (
              code,
              libelle
            )
          `)
          .eq('id_facture_achat', id)
          .eq('com_contrat_client_id', profil.com_contrat_client_id);
          
        if (lignesError) throw lignesError;
        
        setFacture(factureData);
        setLignes(lignesData || []);
      } catch (error) {
        console.error('Erreur lors du chargement de la facture:', error);
        addToast({
          label: 'Erreur lors du chargement de la facture',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        navigate('/finances/mes-factures');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFacture();
  }, [id, profil?.com_contrat_client_id, navigate]);
  
  // Gestionnaire pour les changements dans le formulaire de facture
  const handleFactureFormChange = (updatedFacture: FactureAchat) => {
    setFacture(updatedFacture);
  };
  
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
  
  // Calcul des totaux à partir des lignes
  const recalculerTotaux = () => {
    const totalHT = lignes.reduce((sum, ligne) => sum + (ligne.montant_ht || 0), 0);
    const totalTVA = lignes.reduce((sum, ligne) => sum + (ligne.montant_tva || 0), 0); 

    // Ne pas mettre à jour automatiquement les montants de la facture
    // car ils sont maintenant indépendants des lignes
    console.log(`Totaux recalculés - HT: ${totalHT}, TVA: ${totalTVA}`);
  };
  
  // Gestion des lignes de facture
  const handleAddLigne = () => {
    if (!facture.id_entite) {
      addToast({
        label: 'Veuillez d\'abord sélectionner une entité',
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }
    
    setSelectedLigne(null); 
    setIsLigneFormOpen(true);
  };
  
  const handleEditLigne = (ligne: FactureLigne) => {
    setSelectedLigne(ligne);
    setIsLigneFormOpen(true);
  };
  
  const handleDeleteLigne = async (ligne: FactureLigne) => {
    if (!ligne.id) {
      // Si la ligne n'a pas encore été sauvegardée en base
      setLignes(prev => prev.filter(item => item !== ligne));
      recalculerTotaux();
      return;
    }
    
    try {
      const { error } = await supabase
        .from('fin_facture_achat_ligne')
        .delete()
        .eq('id', ligne.id);
        
      if (error) throw error;
      
      setLignes(prev => prev.filter(item => item.id !== ligne.id));
      recalculerTotaux();
      addToast({
        label: 'Ligne supprimée avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la ligne:', error);
      addToast({
        label: 'Erreur lors de la suppression de la ligne',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };
  
  const handleSaveLigne = (ligne: FactureLigne) => {
    // Sauvegarde de l'état actuel de la facture avant modification des lignes
    const currentFacture = { ...facture };

    if (selectedLigne) {
      // Mise à jour d'une ligne existante
      setLignes(prev => 
        prev.map(item => 
          item === selectedLigne ? { ...ligne, id: selectedLigne.id } : item
        )
      );
    } else {
      // Ajout d'une nouvelle ligne
      setLignes(prev => [...prev, ligne]);
    }
    
    setIsLigneFormOpen(false);
    recalculerTotaux();
    
    // Restaurer l'état de la facture pour éviter la perte des montants saisis
    setFacture(currentFacture);
  };
  
  // Gestion du fichier joint
  const handleFileUploadSuccess = (filePath: string) => {
    setFacture(prev => ({
      ...prev,
      lien_piece_jointe: filePath
    }));
    
    addToast({
      label: 'Fichier joint avec succès',
      icon: 'Check',
      color: '#22c55e'
    });
  };
  
  const handleFileUploadError = (errorMessage: string) => {
    addToast({
      label: `Erreur: ${errorMessage}`,
      icon: 'AlertTriangle',
      color: '#ef4444'
    });
  };
  
  // Sauvegarde de la facture et de ses lignes
  const handleSaveFacture = async (factureData: FactureAchat) => {
    if (!profil?.com_contrat_client_id || !profil?.code_user) {
      addToast({
        label: 'Erreur: Profil utilisateur incomplet',
        icon: 'AlertTriangle', 
        color: '#ef4444'
      });
      return;
    }
    
    // Vérifier qu'il y a au moins une ligne
    if (lignes.length === 0) {
      addToast({
        label: 'Veuillez ajouter au moins une ligne à la facture',
        icon: 'AlertCircle',
        color: '#f59e0b'
      });
      return;
    }
    
    // Vérifier que le total HT des lignes est égal au montant HT de la facture
    if (isTotalMismatch()) {
      addToast({
        label: 'Le montant HT de la facture doit être défini et égal au total des lignes',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }
    
    setSaving(true);
    
    try {
      let factureId = facture.id;
      
      // Préparation des données de la facture
      const factureToSave = { 
        ...factureData,
        com_contrat_client_id: profil.com_contrat_client_id,
        code_user: profil.code_user,
        lien_piece_jointe: facture.lien_piece_jointe
      };
      
      if (factureId) {
        // Mise à jour d'une facture existante
        const { error: updateError } = await supabase
          .from('fin_facture_achat')
          .update(factureToSave)
          .eq('id', factureId);
          
        if (updateError) throw updateError;
      } else {
        // Création d'une nouvelle facture
        const { data: insertData, error: insertError } = await supabase
          .from('fin_facture_achat')
          .insert(factureToSave)
          .select()
          .single();
          
        if (insertError) throw insertError;
        factureId = insertData.id;
      }
      
      // Sauvegarde des lignes
      for (const ligne of lignes) {
        const ligneToSave = {
          id_categorie_flux: ligne.id_categorie_flux,
          id_sous_categorie_flux: ligne.id_sous_categorie_flux,
          montant_ht: ligne.montant_ht,
          montant_tva: ligne.montant_tva,
          commentaire: ligne.commentaire,
          id_facture_achat: factureId,
          com_contrat_client_id: profil.com_contrat_client_id,
          code_user: profil.code_user
        };
        
        if (ligne.id) {
          // Mise à jour d'une ligne existante
          await supabase
            .from('fin_facture_achat_ligne')
            .update(ligneToSave)
            .eq('id', ligne.id);
        } else {
          // Création d'une nouvelle ligne
          await supabase
            .from('fin_facture_achat_ligne')
            .insert(ligneToSave);
        }
      }
      
      addToast({
        label: `Facture ${factureId ? 'modifiée' : 'créée'} avec succès`,
        color: '#22c55e',
        icon: 'Check' 
      });
      
      // Rediriger selon le contexte
      if (returnToFactureDepenseModal && previousPath) {
        // Retourner à la modale de sélection des factures de dépense
        navigate(previousPath, {
          state: {
            returnToFactureDepenseModal: true,
            factureCreated: true, 
            entiteId: facture.id_entite, 
            fermetureCaisseId: fermetureCaisseId
          }
        });
      } else {
        // Rediriger vers la liste des factures
        navigate('/finances/mes-factures', { 
          state: { fromFactureEdit: true }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la facture:', error);
      addToast({
        label: 'Erreur lors de la sauvegarde de la facture',
        color: '#ef4444',
        icon: 'AlertTriangle',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Vérifier si les totaux sont cohérents
  const isTotalMismatch = () => {
    if (lignes.length === 0) return false;
    const totalHT = lignes.reduce((sum, ligne) => sum + (ligne.montant_ht || 0), 0);
    return Math.abs(totalHT - facture.montant_ht) > 0.01;
  };
  
  // Calcul du total HT des lignes
  const getTotalLignesHT = () => {
    return lignes.reduce((sum, ligne) => sum + (ligne.montant_ht || 0), 0);
  };
  
  return (
    <div className={styles.container}>
      <PageSection
        title={id ? "Modifier une facture d'achat" : "Nouvelle facture d'achat"} 
        description="Saisissez les informations de la facture et ses lignes analytiques"
        className={styles.header}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Formulaire principal de la facture */}
            <FactureAchatForm
              exploitationTypeFacture={exploitationTypeFacture}
              facture={facture}
              onSave={handleSaveFacture}
              onFormChange={handleFactureFormChange}
              entites={entites}
              isSaving={saving}
              entiteId={entiteFromState}
              currentFile={facture.lien_piece_jointe}
              contratClientId={profil?.com_contrat_client_id || ''}
              onUploadSuccess={handleFileUploadSuccess}
              onUploadError={handleFileUploadError}
            />
            
            {/* Tableau des lignes de facture */}
            <FactureLignesSection
              lignes={lignes}
              onEdit={handleEditLigne}
              onDelete={handleDeleteLigne}
              onAddLigne={handleAddLigne}
              disabled={saving}
            />
            
            {/* Affichage des totaux */}
            <FactureTotals
              montantHT={facture.montant_ht}
              montantTVA={facture.montant_tva || 0}
              montantTTC={facture.montant_ttc}
              totalLignesHT={getTotalLignesHT()}
              isTotalMismatch={isTotalMismatch()}
            />
          </div>
        )}
        
        {/* Modale d'ajout/édition de ligne */}
        {isLigneFormOpen && (
          <FactureLigneForm
            isOpen={isLigneFormOpen}
            onClose={() => setIsLigneFormOpen(false)}
            onSave={handleSaveLigne}
            onAddLigne={() => {}}
            entiteId={facture.id_entite}
          />
        )}
        
        {/* Boutons d'action en bas de page */}
        <div className="flex justify-end mt-8 pt-4 border-t">
          <div className="flex gap-3">
            <Button
              label="Annuler"
              color="#6B7280" 
              onClick={() => navigate('/finances/mes-factures', { state: { fromFactureEdit: true } })}
              disabled={saving}
            />
            <Button
              label="Enregistrer"
              icon="Save"
              color="var(--color-primary)"
              onClick={() => handleSaveFacture(facture)}
              disabled={saving || isTotalMismatch() || lignes.length === 0}
              className={isTotalMismatch() ? "opacity-50 cursor-not-allowed" : ""}
              title={isTotalMismatch() ? "Le montant HT de la facture doit être égal au total des lignes analytiques" : ""}
            />
          </div>
        </div>
        
        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default EditFactureAchat;