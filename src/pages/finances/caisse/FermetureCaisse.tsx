import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale'; 
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsAccueil, menuItemsGestionFinanciere } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { DataTable, Column } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { FilterSection } from '../../../components/filters/FilterSection';
import { FermetureCaisseDrawer, FermetureCaisse as FermetureCaisseType } from '../../../components/finances/caisse/FermetureCaisseDrawer';
import styles from '../styles.module.css';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface FermetureCaisseData extends FermetureCaisseType {
  entite: {
    code: string;
    libelle: string;
  };
}

const FermetureCaisse: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [entites, setEntites] = useState<Entite[]>([]);
  const [fermetures, setFermetures] = useState<FermetureCaisseData[]>([]);
  const [filteredFermetures, setFilteredFermetures] = useState<FermetureCaisseData[]>([]);
  
  // État pour suivre si les entités ont été chargées
  const [entitesLoaded, setEntitesLoaded] = useState(false);
  
  // Récupérer les filtres depuis le localStorage avec une valeur par défaut vide pour l'entité
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem('fermetureCaisseFilters');
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedFermeture, setSelectedFermeture] = useState<FermetureCaisseType | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Gestion des toasts - déclarées avant les useEffect
  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: Date.now().toString(),
    };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Récupération des entités
  useEffect(() => {
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
        addToast({
          label: 'Erreur lors de la récupération des entités',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      } finally {
        setLoading(false);
      }
    }

    if (!profilLoading && profil?.com_contrat_client_id) {
      fetchEntites();
    }
  }, [profilLoading, profil?.com_contrat_client_id, addToast]);

  // Configuration du menu
  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
  }, [setMenuItems]);

  // Application des filtres
  useEffect(() => {
    if (fermetures.length > 0) {
      let filtered = [...fermetures];

      // Filtre par entité
      if (filters.entite) {
        filtered = filtered.filter(fermeture => fermeture.entite.code === filters.entite);
      }

      // Filtre par date
      if (filters.dateDebut) {
        filtered = filtered.filter(fermeture => fermeture.date_fermeture >= filters.dateDebut);
      }

      if (filters.dateFin) {
        filtered = filtered.filter(fermeture => fermeture.date_fermeture <= filters.dateFin);
      }

      setFilteredFermetures(filtered);
    } else {
      setFilteredFermetures([]);
    }
  }, [fermetures, filters]);

  const handleFilterChange = (updatedFilters: { [key: string]: any }) => {
    setFilters(updatedFilters);
    // Sauvegarder les filtres dans le localStorage
    try {
      localStorage.setItem('fermetureCaisseFilters', JSON.stringify(updatedFilters));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des filtres:", e);
    }
  };

  // Chargement des fermetures de caisse
  const fetchFermetures = async () => {
    if (!profil?.com_contrat_client_id) {
      addToast({
        label: 'Profil utilisateur incomplet',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    // Vérifier que les filtres obligatoires sont renseignés
    if (!filters.entite) {
      addToast({ 
        label: 'Veuillez sélectionner une entité avant de rechercher', 
        icon: 'AlertTriangle', 
        color: '#f59e0b' 
      });
      return;
    }
    
    // Vérifier que les dates sont valides
    if (new Date(filters.dateDebut) > new Date(filters.dateFin)) {
      addToast({ 
        label: 'La date de début doit être antérieure à la date de fin', 
        icon: 'AlertTriangle', 
        color: '#f59e0b' 
      });
      return;
    }

    setIsSearching(true);
    setLoading(true);
    try {
      let query = supabase
        .from('fin_ferm_caisse')
        .select(`
          *,
          entite:id_entite (
            code,
            libelle
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id);
      
      // Filtrer par entité si sélectionnée
      if (filters.entite) {
        // Trouver l'entité sélectionnée par son code
        const entiteSelectionnee = entites.find(e => e.code === filters.entite);
        if (entiteSelectionnee) {
          query = query.eq('id_entite', entiteSelectionnee.id);
        }
      }
      
      // Filtrer par date
      if (filters.dateDebut) {
        query = query.gte('date_fermeture', filters.dateDebut);
      }
      
      if (filters.dateFin) {
        query = query.lte('date_fermeture', filters.dateFin);
      }
      
      // Trier par date décroissante
      query = query.order('date_fermeture', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;
      
      setFermetures(data || []);
      setFilteredFermetures(data || []);
      setSearchPerformed(true);
    } catch (error) {
      console.error('Erreur lors du chargement des fermetures de caisse:', error);
      addToast({
        label: 'Erreur lors du chargement des fermetures de caisse',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
    
    try {
      // Sauvegarder les filtres dans le localStorage après la recherche
      localStorage.setItem('fermetureCaisseFilters', JSON.stringify(filters));
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

  // Gestion des actions sur les fermetures
  const handleAddFermeture = () => {
    const selectedEntityId = getSelectedEntityId();
    if (!selectedEntityId) {
      addToast({
        label: 'Veuillez sélectionner une entité avant de créer une fermeture de caisse',
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }
    
    setSelectedFermeture(null);
    setIsDrawerOpen(true);
  };

  const handleEditFermeture = (fermeture: FermetureCaisseData) => {
    setSelectedFermeture(fermeture);
    setIsDrawerOpen(true);
  };

  const handleDeleteFermeture = async (fermeture: FermetureCaisseData) => {
    if (!fermeture.id) return;
    
    if (fermeture.est_valide) {
      addToast({
        label: 'Impossible de supprimer une fermeture validée',
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la fermeture de caisse du ${format(new Date(fermeture.date_fermeture), 'dd/MM/yyyy', { locale: fr })} ?`)) {
      try {
        const { error } = await supabase
          .from('fin_ferm_caisse')
          .delete()
          .eq('id', fermeture.id);

        if (error) throw error;

        addToast({
          label: 'Fermeture de caisse supprimée avec succès',
          icon: 'Check',
          color: '#22c55e'
        });

        fetchFermetures();
      } catch (error) {
        console.error('Erreur lors de la suppression de la fermeture de caisse:', error);
        addToast({
          label: 'Erreur lors de la suppression de la fermeture de caisse',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  // Configuration des filtres
  const filterConfigs = [
    {
      name: 'entite',
      label: 'Restaurant',
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

  // Configuration des colonnes du tableau
  const columns: Column<FermetureCaisseData>[] = [
    {
      label: 'Restaurant',
      accessor: 'entite',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Date',
      accessor: 'date_fermeture',
      sortable: true,
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    },
    {
      label: 'CA TTC',
      accessor: 'ca_ttc',
      align: 'right',
      render: (value) => value ? `${value.toFixed(2)} €` : '-'
    },
    {
      label: 'Total CB',
      accessor: 'total_cb_brut',
      align: 'right',
      render: (value) => value ? `${value.toFixed(2)} €` : '-'
    },
    {
      label: 'Total Factures',
      accessor: 'total_facture_depenses_ttc',
      align: 'right',
      render: (value) => value ? `${value.toFixed(2)} €` : '-'
    },
    {
      label: 'Dépôt Théorique',
      accessor: 'depot_banque_theorique',
      align: 'right',
      render: (value) => value ? `${value.toFixed(2)} €` : '-'
    },
    {
      label: 'Dépôt Réel',
      accessor: 'depot_banque_reel',
      align: 'right',
      render: (value) => value ? `${value.toFixed(2)} €` : '-'
    },
    {
      label: 'Statut',
      accessor: 'est_valide',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value ? 'Validé' : 'Brouillon'}
        </span>
      )
    }
  ];

  // Configuration des actions du tableau
  const actions = [
    {
      label: 'Modifier',
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleEditFermeture
    },
    {
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDeleteFermeture
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title="Fermeture de Caisse"
        description="Gérez les fermetures de caisse de votre établissement"
        className={styles.header}
      >
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
              label={isSearching ? "Recherche en cours..." : "Afficher les Fermetures"}
              icon="Search"
              color="var(--color-primary)"
              onClick={fetchFermetures}
              disabled={isSearching || !filters.entite}
            />
          </div>

          <div className="mt-2 text-sm text-gray-600">
            {searchPerformed && fermetures.length > 0 ? (
              <span>{filteredFermetures.length} fermeture(s) trouvée(s)</span>
            ) : searchPerformed ? (
              <span>Aucune fermeture trouvée</span>
            ) : (
              <span>Utilisez les filtres ci-dessus et cliquez sur "Afficher les Fermetures"</span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <Button
            label="Ajouter une fermeture de caisse"
            icon="Plus"
            color="var(--color-primary)"
            onClick={handleAddFermeture}
            disabled={!searchPerformed || !filters.entite}
          />
        </div>

        {loading && !searchPerformed ? (
          <div className="flex justify-center items-center h-64"> 
            <p className="text-gray-500">Chargement des fermetures...</p>
          </div>
        ) : !searchPerformed ? (
          <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center p-6">
              <p className="text-gray-500 mb-2">Sélectionnez une entité et cliquez sur "Afficher les Fermetures"</p>
              <p className="text-gray-400 text-sm">Aucune recherche n'a encore été effectuée</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredFermetures}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucune fermeture de caisse"
            emptyMessage="Aucune fermeture de caisse n'a été enregistrée pour les critères sélectionnés."
          />
        )}
        
        {/* Drawer de création/modification */}
        <FermetureCaisseDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          fermetureToEdit={selectedFermeture}
          selectedEntityId={getSelectedEntityId()}
          onSuccess={fetchFermetures}
          addToast={addToast}
        />
        
        {/* Conteneur de toasts */}
        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default FermetureCaisse;