import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { ToastData } from '../../ui/toast';
import { Button } from '../../ui/button';
import { FactureAchatForm } from './FactureAchatForm';
import { FactureLignesSection } from './FactureLignesSection';
import { FactureLigneForm } from './FactureLigneForm';
import { FactureTotals } from './FactureTotals';
import { X } from 'lucide-react';

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

interface EditFactureAchatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (factureId: string) => void;
  entiteId?: string;
  factureId?: string;
  fermetureCaisseId?: number;
}

const EditFactureAchatModal: React.FC<EditFactureAchatModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  entiteId,
  factureId,
  fermetureCaisseId
}) => {
  const { t } = useTranslation();
  const { profil } = useProfil();
  
  // États principaux
  const [facture, setFacture] = useState<FactureAchat>({
    id_entite: entiteId || '',
    id_tiers: '',
    date_facture: new Date().toISOString().split('T')[0],
    num_document: null,
    id_mode_paiement: '',
    montant_ht: 0,
    montant_tva: 0,
    montant_ttc: 0
  });
  
  const [lignes, setLignes] = useState<FactureLigne[]>([]);
  const [entites, setEntites] = useState<any[]>([]);
  
  // États UI
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLigneFormOpen, setIsLigneFormOpen] = useState(false);
  const [selectedLigne, setSelectedLigne] = useState<FactureLigne | null>(null);
  
  // État pour stocker le type de facture "exploitation"
  const [exploitationTypeFacture, setExploitationTypeFacture] = useState<{id: string, libelle: string} | null>(null);
  
  // Chargement des entités
  useEffect(() => {
    if (!isOpen) return;
    
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
  }, [isOpen, profil?.com_contrat_client_id]);
  
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
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du type de facture exploitation:', error);
      }
    };
    
    fetchExploitationTypeFacture();
  }, [profil?.com_contrat_client_id]);
  
  // Chargement de la facture et de ses lignes si on est en mode édition
  useEffect(() => {
    if (!isOpen || !factureId || !profil?.com_contrat_client_id) return;
    
    const fetchFacture = async () => {
      setLoading(true);
      try {
        // Charger la facture
        const { data: factureData, error: factureError } = await supabase
          .from('fin_facture_achat')
          .select('*')
          .eq('id', factureId)
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
          .eq('id_facture_achat', factureId)
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
        onClose();
      } finally {
        setLoading(false);
      }
    };
    
    fetchFacture();
  }, [isOpen, factureId, profil?.com_contrat_client_id, onClose]);
  
  // Réinitialiser le formulaire quand la modale se ferme
  useEffect(() => {
    if (!isOpen) {
      // Préparer l'objet facture avec le type de facture "exploitation" pré-rempli
      if (!entiteId) {
        setFacture({
          id_entite: '',
          id_tiers: '',
          date_facture: new Date().toISOString().split('T')[0],
          num_document: null,
          id_mode_paiement: '',
          montant_ht: 0,
          montant_tva: 0,
          montant_ttc: 0,
          id_type_facture: exploitationTypeFacture?.id || ''
        });
      } else {
        setFacture({
          id_entite: entiteId,
          id_tiers: '',
          date_facture: new Date().toISOString().split('T')[0],
          num_document: null,
          id_mode_paiement: '',
          montant_ht: 0,
          montant_tva: 0,
          montant_ttc: 0,
          id_type_facture: exploitationTypeFacture?.id || ''
        });
      }
      setLignes([]);
      setSelectedLigne(null);
      setIsLigneFormOpen(false);
    }
  }, [isOpen, entiteId, exploitationTypeFacture]);
  
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
    console.log('handleFileUploadSuccess appelé avec filePath:', filePath);
    console.log('État actuel de facture.lien_piece_jointe:', facture.lien_piece_jointe);
    
    setFacture(prev => ({
      ...prev,
      lien_piece_jointe: filePath
    }));
    
    // Log après mise à jour de l'état
    setTimeout(() => {
      console.log('Nouvel état de facture.lien_piece_jointe après mise à jour:', facture.lien_piece_jointe);
    }, 0);
    
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
  
  // Sauvegarde de la facture et de ses lignes
  const handleSaveFacture = async (factureData: FactureAchat) => {
    console.log('handleSaveFacture appelé avec:', factureData);
    console.log('État actuel de facture:', facture);
    
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
      
      // Préparation des données de la facture - code_user est toujours nécessaire dans fin_facture_achat
      const factureToSave = { 
        ...factureData,
        com_contrat_client_id: profil.com_contrat_client_id,
        code_user: profil.code_user,
        lien_piece_jointe: facture.lien_piece_jointe
      };
      
      console.log('Données de la facture à sauvegarder:', factureToSave);
      console.log('lien_piece_jointe à sauvegarder:', facture.lien_piece_jointe);
      
      if (factureId) {
        // Mise à jour d'une facture existante
        console.log('Mode mise à jour - factureId:', factureId);
        const { data: updateData, error: updateError } = await supabase
          .from('fin_facture_achat')
          .update(factureToSave)
          .eq('id', factureId)
          .select();
          
        if (updateError) {
          console.error('Erreur lors de la mise à jour de la facture:', updateError);
          throw updateError;
        }
        
        console.log('Mise à jour réussie, données retournées:', updateData);
      } else {
        // Création d'une nouvelle facture
        console.log('Mode création - nouvelle facture');
        const { data: insertData, error: insertError } = await supabase
          .from('fin_facture_achat')
          .insert(factureToSave)
          .select()
          .single();
          
        if (insertError) {
          console.error('Erreur lors de la création de la facture:', insertError);
          throw insertError;
        }
        
        console.log('Création réussie, données retournées:', insertData);
        factureId = insertData.id;
      }
      
      if (!factureId) {
        throw new Error('Erreur: ID de facture manquant après création');
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
      
      // Appeler le callback de succès avec l'ID de la facture
      onSaveSuccess(factureId);
      
      console.log('onSaveSuccess appelé avec factureId:', factureId);
      
      // Fermer la modale
      console.log('Fermeture de la modale');
      onClose();
      
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {factureId ? t('invoices.modal.editInvoice') : t('invoices.modal.newInvoice')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={saving}
          >
            <X size={24} />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Formulaire principal de la facture */}
            <FactureAchatForm
              facture={facture}
              onSave={handleSaveFacture}
              exploitationTypeFacture={exploitationTypeFacture}
              onFormChange={handleFactureFormChange}
              entites={entites}
              isSaving={saving}
              entiteId={entiteId}
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
            
            {/* Boutons d'action en bas de page */}
            <div className="flex justify-end mt-8 pt-4 border-t">
              <div className="flex gap-3">
                <Button
                  label={t('invoices.modal.cancel')}
                  color="#6B7280" 
                  onClick={onClose}
                  disabled={saving}
                />
                <Button
                  label={t('invoices.modal.save')}
                  icon="Save"
                  color="var(--color-primary)"
                  onClick={() => handleSaveFacture(facture)}
                  disabled={saving || isTotalMismatch() || lignes.length === 0}
                  className={isTotalMismatch() ? "opacity-50 cursor-not-allowed" : ""}
                  title={isTotalMismatch() ? t('invoices.modal.totalMismatchTooltip') : ""}
                />
              </div>
            </div>
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
      </div>
    </div>
  );
};

export default EditFactureAchatModal;