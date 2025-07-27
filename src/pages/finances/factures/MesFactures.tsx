import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Paperclip, ExternalLink } from 'lucide-react';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsAccueil } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { DataTable, Column } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { FilterSection } from '../../../components/filters/FilterSection';
import { ToastContainer, ToastData } from '../../../components/ui/toast'; 
import EditFactureAchatModal from '../../../components/finances/factures/EditFactureAchatModal';
import styles from '../styles.module.css';

interface FactureAchat {
  id: string;
  num_document: string | null;
  date_facture: string;
  montant_ht: number;
  montant_tva: number | null;
  montant_ttc: number;
  lien_piece_jointe: string | null;
  commentaire: string | null;
  created_at: string;
  entite: {
    code: string;
    libelle: string;
  };
  tiers: {
    code: string;
    nom: string;
  };
  mode_paiement: {
    code: string;
    libelle: string;
  };
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

const MesFactures: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const navigate = useNavigate();
  const location = useLocation();
  const [factures, setFactures] = useState<FactureAchat[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<FactureAchat[]>([]);
  
  // État pour suivre si les entités ont été chargées
  const [entitesLoaded, setEntitesLoaded] = useState(false);
  
  // Récupérer les filtres depuis le localStorage avec une valeur par défaut vide pour l'entité
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem('facturesFilters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        // S'assurer que l'entité est vide au démarrage
        parsedFilters.entite = '';
        return parsedFilters;
      } catch (e) {
        console.error("Erreur lors du parsing des filtres sauvegardés:", e);
        return {
          entite: '',
          dateDebut: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
          dateFin: format(endOfMonth(new Date()), 'yyyy-MM-dd')
        };
      }
    }
    return {
      entite: '',
      dateDebut: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
      dateFin: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    };
  });

  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // États pour la modale d'édition de facture
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFactureId, setSelectedFactureId] = useState<string | undefined>(undefined);

  // État pour stocker le type de facture "exploitation"
  const [exploitationTypeFacture, setExploitationTypeFacture] = useState<{id: string, libelle: string} | null>(null);
  
  const fetchFactures = async () => {
    setIsSearching(true);
    try {
      if (!profil?.com_contrat_client_id) {
        setFactures([]);
        setSearchPerformed(true);
        return;
      }

      let query = supabase
        .from('fin_facture_achat')
        .select(`
          *,
          entite:id_entite (
            code,
            libelle
          ),
          tiers:id_tiers (
            code,
            nom
          ),
          mode_paiement:id_mode_paiement (
            code,
            libelle
          )`)
        .eq('com_contrat_client_id', profil.com_contrat_client_id);
      
      // Filtrer par entité si sélectionnée
      if (filters.entite) {
        // Trouver l'entité sélectionnée par son code ou son id
        const entiteSelectionnee = entites.find(e => e.code === filters.entite || e.id === filters.entite);
        if (entiteSelectionnee) { 
          console.log(`Filtrage par entité: ${entiteSelectionnee.code} (ID: ${entiteSelectionnee.id})`);
          query = query.eq('id_entite', entiteSelectionnee.id); 
        } else {
          console.warn(`Entité sélectionnée non trouvée dans la liste: ${filters.entite}`);
        }
      }
      
      // Filtrer par date
      if (filters.dateDebut) {
        query = query.gte('date_facture', filters.dateDebut);
      }
      
      if (filters.dateFin) {
        query = query.lte('date_facture', filters.dateFin);
      }
      
      // Trier par date décroissante
      query = query.order('date_facture', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;
      
      const facturesData = data || [];
      console.log(`${facturesData.length} factures récupérées avec les filtres actuels`);
      setFactures(facturesData);
      setFilteredFactures(facturesData);
      setSearchPerformed(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      addToast({
        label: 'Erreur lors de la récupération des factures',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const fetchEntites = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setEntites([]);
        return;
      }

      const { data, error } = await supabase
        .from('com_entite')
        .select('id, code, libelle')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('actif', true)
        .order('libelle');

      if (error) throw error;
      setEntites(data || []);
      setEntitesLoaded(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des entités:', error);
    }
  };

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
    if (!profilLoading) {
      // Chargement des entités sans déclencher de recherche automatique
      fetchEntites();
      setLoading(false);
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

  // Effet pour gérer le retour depuis la page de création/modification de facture
  useEffect(() => {
    if (entitesLoaded && !loading && !isSearching) {
      const fromFactureEdit = location.state?.fromFactureEdit;
      const entiteId = location.state?.entiteId;
      
      // Si on revient de la page d'édition
      if (fromFactureEdit) {
        // Si une entité est spécifiée dans l'état de navigation, l'utiliser
        if (entiteId) {
          const entiteFromState = entites.find(e => e.id === entiteId);
          if (entiteFromState) {
            // Mettre à jour le filtre avec l'entité de l'état
            const updatedFilters = {
              ...filters,
              entite: entiteFromState.code
            };
            setFilters(updatedFilters);
            
            // Sauvegarder dans localStorage
            try {
              localStorage.setItem('facturesFilters', JSON.stringify(updatedFilters));
            } catch (e) {
              console.error("Erreur lors de la sauvegarde des filtres:", e);
            }
            
            // Exécuter la recherche avec la nouvelle entité
            setTimeout(() => {
              console.log("Recherche automatique après retour d'édition avec entité:", entiteFromState.code);
              fetchFactures();
            }, 100);
          }
        } else if (filters.entite) {
          // Si pas d'entité dans l'état mais une entité est déjà sélectionnée dans les filtres
          console.log("Recherche automatique après retour d'édition avec filtre existant:", filters.entite);
          fetchFactures();
        }
      }
    }
  }, [entitesLoaded, location.state, entites]);

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

  const handleEdit = (facture: FactureAchat) => {
    setSelectedFactureId(facture.id);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (facture: FactureAchat) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la facture ${facture.num_document || 'sans numéro'} ?`)) {
      try {
        const { error } = await supabase
          .from('fin_facture_achat')
          .delete()
          .eq('id', facture.id);

        if (error) throw error;

        await fetchFactures();
        addToast({
          label: `La facture a été supprimée avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la suppression de la facture',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const handleFilterChange = (updatedFilters: { [key: string]: any }) => {
    setFilters(updatedFilters);
    // Sauvegarder les filtres dans le localStorage
    try {
      localStorage.setItem('facturesFilters', JSON.stringify(updatedFilters));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des filtres:", e);
    }
  };

  // Récupérer l'ID de l'entité sélectionnée
  const getSelectedEntityId = (): string | undefined => {
    if (!filters.entite) return undefined;
    const selectedEntity = entites.find(e => e.code === filters.entite);
    return selectedEntity?.id;
  };

  // Validation des dates
  const validateDates = (): boolean => {
    if (new Date(filters.dateDebut) > new Date(filters.dateFin)) {
      addToast({ label: 'La date de début doit être antérieure à la date de fin', icon: 'AlertTriangle', color: '#f59e0b' });
      return false;
    }
    return true;
  };

  // Gestionnaire pour le bouton de recherche
  const handleSearch = () => {
    if (!validateDates()) return;
    
    if (!filters.entite) {
      addToast({ 
        label: 'Veuillez sélectionner une entité avant de rechercher', 
        icon: 'AlertTriangle', 
        color: '#f59e0b' 
      });
      return;
    }
    
    fetchFactures();
    
    try {
      // Sauvegarder les filtres dans le localStorage après la recherche
      localStorage.setItem('facturesFilters', JSON.stringify(filters));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des filtres:", e);
    }
  };

  const handleEditFactureSuccess = (factureId: string) => {
    console.log('handleEditFactureSuccess appelé avec factureId:', factureId);
    fetchFactures();
    addToast({
      label: `Facture ${selectedFactureId ? 'modifiée' : 'créée'} avec succès`,
      icon: 'Check',
      color: '#22c55e'
    });
  };

  const filterConfigs = [
    {
      name: 'entite',
      label: 'Entité',
      type: 'select' as const,
      options: entites.map(entite => ({
        id: entite.id,
        code: entite.code,
        libelle: entite.libelle
      })), 
      isEntityOption: true,
      requireSelection: true
    },
    {
      name: 'dateDebut',
      label: 'Date de début',
      type: 'date' as const,
      width: '160px'
    },
    {
      name: 'dateFin',
      label: 'Date de fin',
      type: 'date' as const,
      width: '160px'
    }
  ];

  const columns: Column<FactureAchat>[] = [
    {
      label: 'N° Document',
      accessor: 'num_document',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      label: 'Date',
      accessor: 'date_facture',
      sortable: true,
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    },
    {
      label: 'Entité',
      accessor: 'entite',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Tiers',
      accessor: 'tiers',
      render: (value) => `${value.code} - ${value.nom}`
    },
    {
      label: 'Mode Paiement',
      accessor: 'mode_paiement',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Montant HT',
      accessor: 'montant_ht',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'Montant TVA',
      accessor: 'montant_tva',
      align: 'right',
      render: (value) => value ? `${Number(value).toFixed(2)} €` : '-'
    },
    {
      label: 'Montant TTC',
      accessor: 'montant_ttc',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'PJ',
      accessor: 'lien_piece_jointe',
      align: 'center',
      width: '60px',
      render: (value) => {
        if (!value) return null;
        
        // Utiliser un bouton qui génère une URL signée au clic
        return (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                // Générer une URL signée valide pendant 60 secondes
                const { data, error } = await supabase.storage
                  .from('factures-achat')
                  .createSignedUrl(value, 60);
                
                if (error) throw error;
                
                // Ouvrir l'URL dans un nouvel onglet
                window.open(data.signedUrl, '_blank');
              } catch (error) {
                console.error('Erreur lors de la génération de l\'URL signée:', error);
                alert('Erreur lors de l\'accès à la pièce jointe');
              }
            }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
            title="Ouvrir la pièce jointe"
          >
            <Paperclip size={18} className="text-blue-600" />
          </button>
        );
      }
    },
    {
      label: 'Date de création',
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: fr })
    }
  ];

  const actions = [
    {
      label: 'Éditer',
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleEdit
    },
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDelete
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? "Chargement..." : "Mes Factures"} 
        description="Consultez et gérez vos factures d'achat"
        className={styles.header}>
        <div className="mb-6">
          <div className="flex items-end gap-4">
            <FilterSection
              filters={filterConfigs} 
              values={filters}
              onChange={handleFilterChange}
              requireSelection={true}
              className="flex-1 flex items-end gap-4"
            />
            
            <Button
              label={isSearching ? "Recherche en cours..." : "Afficher les Factures"}
              icon="Search"
              color="var(--color-primary)"
              onClick={handleSearch}
              disabled={isSearching || !filters.entite}
            />
          </div>

          <div className="mt-2 text-sm text-gray-600">
            {searchPerformed && factures.length > 0 ? (
              <span>{filteredFactures.length} facture(s) trouvée(s)</span>
            ) : searchPerformed ? (
              <span>Aucune facture trouvée</span>
            ) : (
              <span>Utilisez les filtres ci-dessus et cliquez sur "Afficher les Factures"</span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <Button
            label="Nouvelle facture"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => {
              const selectedEntityId = getSelectedEntityId();
              if (selectedEntityId) {
                setSelectedFactureId(undefined);
                setIsEditModalOpen(true);
              } else {
                addToast({
                  label: 'Veuillez sélectionner une entité avant de créer une facture',
                  icon: 'AlertTriangle',
                  color: '#f59e0b'
                });
              }
            }}
            disabled={!filters.entite}
          />
        </div>

        {loading && !searchPerformed ? (
          <div className="flex justify-center items-center h-64"> 
            <p className="text-gray-500">Chargement des factures...</p>
          </div>
        ) : !searchPerformed ? (
          <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center p-6">
              <p className="text-gray-500 mb-2">Sélectionnez une entité et cliquez sur "Afficher les Factures"</p>
              <p className="text-gray-400 text-sm">Aucune recherche n'a encore été effectuée</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredFactures}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucune facture"
            emptyMessage="Aucune facture d'achat n'a été créée pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />
        
        {/* Modale d'édition/création de facture */}
        <EditFactureAchatModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          exploitationTypeFacture={exploitationTypeFacture}
          onSaveSuccess={handleEditFactureSuccess}
          entiteId={getSelectedEntityId()}
          factureId={selectedFactureId}
        />
      </PageSection>
    </div>
  );
};

export default MesFactures;