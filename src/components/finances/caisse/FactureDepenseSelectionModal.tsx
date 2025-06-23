import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Search, Check, Plus, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useProfil } from '../../../context/ProfilContext';
import { Form, FormField, FormInput } from '../../ui/form';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox'; 
import { ToastContainer, ToastData } from '../../ui/toast'; 
import { FactureDepense } from './FermetureCaisseDrawer';
import EditFactureAchatModal from '../../finances/factures/EditFactureAchatModal';

interface Facture {
  id: string;
  num_document: string | null;
  date_facture: string;
  montant_ttc: number;
  tiers: {
    nom: string;
  };
  mode_paiement: {
    code: string;
    libelle: string;
  };
}

interface FactureDepenseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (factures: FactureDepense[]) => void;
  entiteId: string;
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  fermetureCaisseId?: number;
}

export function FactureDepenseSelectionModal({
  isOpen,
  onClose,
  onSave,
  entiteId,
  addToast,
  fermetureCaisseId = undefined
}: FactureDepenseSelectionModalProps) {
  const navigate = useNavigate();
  const { profil } = useProfil();
  const location = useLocation();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFactures, setSelectedFactures] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modesPaiementCaisse, setModesPaiementCaisse] = useState<{ id: string, code: string, libelle: string }[]>([]);
  const [returnFromFactureCreation, setReturnFromFactureCreation] = useState(false);
  
  // États pour la modale de création/édition de facture
  const [isEditFactureModalOpen, setIsEditFactureModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  // État pour stocker le type de facture "exploitation"
  const [exploitationTypeFacture, setExploitationTypeFacture] = useState<{id: string, libelle: string} | null>(null);
  
  // Fonction pour charger les factures éligibles
  const fetchFactures = useCallback(async () => {
    if ((!isOpen && !returnFromFactureCreation) || !entiteId || !profil?.com_contrat_client_id) return;
    
    setLoading(true);
    try {
      // Récupérer les IDs des modes de paiement avec paiement_caisse = true
      const { data: modesPaiement, error: modesPaiementError } = await supabase
        .from('bq_param_mode_paiement')
        .select('id')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('paiement_caisse', true)
        .eq('actif', true);
        
      if (modesPaiementError) throw modesPaiementError;
      
      if (!modesPaiement || modesPaiement.length === 0) {
        setModesPaiementCaisse([]);
        addToast({
          label: 'Aucun mode de paiement en caisse configuré',
          icon: 'Info',
          color: '#3b82f6'
        });
        setFactures([]);
        setLoading(false);
        return;
      }
      
      // Récupérer les détails des modes de paiement pour la création de facture
      const { data: modesPaiementDetails, error: modesPaiementDetailsError } = await supabase
        .from('bq_param_mode_paiement')
        .select('id, code, libelle')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('paiement_caisse', true)
        .eq('actif', true);
        
      if (modesPaiementDetailsError) throw modesPaiementDetailsError;
      setModesPaiementCaisse(modesPaiementDetails || []);
      
      const modesPaiementIds = modesPaiement.map(mode => mode.id);
      
      // Récupérer les factures avec ces modes de paiement et pour l'entité sélectionnée
      const { data: facturesData, error: facturesError } = await supabase
        .from('fin_facture_achat')
        .select(`
          id,
          num_document,
          date_facture,
          montant_ttc,
          tiers:id_tiers (
            nom
          ),
          mode_paiement:id_mode_paiement (
            code,
            libelle
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('id_entite', entiteId)
        .in('id_mode_paiement', modesPaiementIds)
        .order('date_facture', { ascending: false });
        
      if (facturesError) throw facturesError;
      
      setFactures(facturesData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      addToast({
        label: 'Erreur lors du chargement des factures',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
      setReturnFromFactureCreation(false);
    }
  }, [isOpen, returnFromFactureCreation, entiteId, profil?.com_contrat_client_id, addToast]);

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
    
    if (isOpen) {
      fetchExploitationTypeFacture();
    }
  }, [isOpen, profil?.com_contrat_client_id]);
  
  // Chargement des factures éligibles
  useEffect(() => {
    fetchFactures();
  }, [fetchFactures]);

  // Vérifier si on revient de la page de création de facture
  useEffect(() => {
    // Si la modale est ouverte et qu'on a un état de retour de la page de facture
    if (isOpen && location.state && (location.state.fromFactureCreation || location.state.factureCreated)) {
      setReturnFromFactureCreation(true);
      
      // Si une nouvelle facture a été créée, afficher un toast
      if (location.state?.factureCreated) {
        addToast({
          label: 'Facture créée avec succès',
          icon: 'Check',
          color: '#22c55e'
        });
      }
      
      // Nettoyer l'état de navigation pour éviter des rechargements en boucle
      navigate(location.pathname, { replace: true, state: undefined });
    }
  }, [isOpen, location.state, navigate, addToast]);
  
  // Fonction pour ajouter un toast local
  const addLocalToast = (toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: Date.now().toString(),
    };
    setToasts(prev => [...prev, newToast]);
  };
  
  // Fonction pour fermer un toast local
  const closeLocalToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleToggleFacture = (factureId: string) => {
    setSelectedFactures(prev => {
      if (prev.includes(factureId)) {
        return prev.filter(id => id !== factureId);
      } else {
        return [...prev, factureId];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedFactures.length === filteredFactures.length) {
      setSelectedFactures([]);
    } else {
      setSelectedFactures(filteredFactures.map(facture => facture.id));
    }
  };
  
  const handleSave = () => {
    const facturesToSave: FactureDepense[] = selectedFactures.map(factureId => {
      const facture = factures.find(f => f.id === factureId);
      return {
        fin_facture_achat_id: factureId,
        montant_ttc: facture?.montant_ttc || 0,
        commentaire: '',
        facture: {
          num_document: facture?.num_document || null,
          date_facture: facture?.date_facture || '',
          tiers: {
            nom: facture?.tiers?.nom || ''
          }
        }
      };
    });
    
    onSave(facturesToSave);
  };
  
  const handleOpenCreationModal = () => {
    // Rediriger vers la page de création de facture avec l'entité pré-sélectionnée
    setIsEditFactureModalOpen(true);
  };
  
  // Fonction appelée après la création réussie d'une facture
  const handleFactureCreated = useCallback((factureId: string) => {
    // Rafraîchir la liste des factures
    fetchFactures();
    
    // Afficher un toast de succès
    addToast({
      label: 'Facture créée avec succès',
      icon: 'Check',
      color: '#22c55e'
    });
  }, [fetchFactures, addToast]);
  
  // Filtrer les factures selon le terme de recherche
  const filteredFactures = factures.filter(facture => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (facture.num_document && facture.num_document.toLowerCase().includes(searchLower)) ||
      facture.tiers.nom.toLowerCase().includes(searchLower) ||
      facture.mode_paiement.libelle.toLowerCase().includes(searchLower)
    );
  });
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Sélection des factures de dépense</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Rechercher par numéro, tiers ou mode de paiement..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>  
          ) : factures.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center text-yellow-700">
              Aucune facture disponible avec un mode de paiement en caisse pour ce restaurant.
            </div>
          ) : (
            <>
              <div className="mb-2 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {filteredFactures.length} facture(s) trouvée(s)
                </div>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedFactures.length === filteredFactures.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                </button>
              </div>
              
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 w-10">
                        <Checkbox
                          checked={selectedFactures.length > 0 && selectedFactures.length === filteredFactures.length}
                          onChange={handleSelectAll}
                          size="sm"
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Document
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiers
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mode
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant TTC
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFactures.map(facture => (
                      <tr 
                        key={facture.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${selectedFactures.includes(facture.id) ? 'bg-blue-50' : ''}`}
                        onClick={() => handleToggleFacture(facture.id)}
                      >
                        <td className="px-4 py-2">
                          <Checkbox
                            checked={selectedFactures.includes(facture.id)}
                            onChange={() => handleToggleFacture(facture.id)}
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {facture.num_document || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {format(new Date(facture.date_facture), 'dd/MM/yyyy', { locale: fr })}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {facture.tiers.nom}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {facture.mode_paiement.libelle}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          {facture.montant_ttc.toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Bouton pour ajouter une nouvelle facture */}
          <div className="mt-4 border-t pt-4 flex justify-between items-center">
            <Button
              label="Créer une nouvelle facture"
              icon="Plus"
              color="#f59e0b"
              onClick={handleOpenCreationModal}
              type="button"
              size="sm"
            />
            <p className="text-xs text-gray-500">
              Vous serez redirigé vers la page de création de facture.
            </p>
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              label="Annuler"
              color="#6B7280"
              onClick={onClose}
              type="button"
            />
            <Button
              label="Ajouter les factures sélectionnées"
              icon="Plus"
              color="var(--color-primary)"
              onClick={handleSave}
              disabled={selectedFactures.length === 0}
              type="button"
            />
          </div>
        </div>
      </div>
      
      {/* Modale de création/édition de facture */}
      <EditFactureAchatModal
        isOpen={isEditFactureModalOpen}
        onClose={() => setIsEditFactureModalOpen(false)}
        exploitationTypeFacture={exploitationTypeFacture}
        onSaveSuccess={handleFactureCreated}
        entiteId={entiteId}
        fermetureCaisseId={fermetureCaisseId}
      />
      
      {/* Conteneur de toasts local */}
      <ToastContainer toasts={toasts} onClose={closeLocalToast} />
    </div>
  );
}