import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext'; 
import { supabase } from '../../../lib/supabase';
import { menuItemsGestionBancaire } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { DataTable, Column } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { FilterSection } from '../../../components/filters/FilterSection';
import styles from '../styles.module.css';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface CompteBancaire {
  id: string;
  code: string;
  nom: string;
  id_entite: string;
}

interface EcritureBancaire {
  id: string;
  data_lancamento: string;
  data_valor: string | null;
  descricao: string | null;
  valor: number;
  saldo: number | null;
  referencia_doc: string | null;
  created_at: string;
  compte: {
    code: string;
    nom: string;
  };
  entite: {
    code: string;
    libelle: string;
  };
}

const EcritureBancaire: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [entites, setEntites] = useState<Entite[]>([]);
  const [comptesBancaires, setComptesBancaires] = useState<CompteBancaire[]>([]);
  const [filteredComptesBancaires, setFilteredComptesBancaires] = useState<CompteBancaire[]>([]);
  const [ecritures, setEcritures] = useState<EcritureBancaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [filters, setFilters] = useState({
    entite: '',
    compte: '',
    dateDebut: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'), // Premier jour du mois courant
    dateFin: format(new Date(), 'yyyy-MM-dd') // Aujourd'hui
  });

  useEffect(() => {
    setMenuItems(menuItemsGestionBancaire);
  }, [setMenuItems]);

  // Chargement des entités et comptes bancaires
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

        // Charger les comptes bancaires
        const { data: comptesData, error: comptesError } = await supabase
          .from('bq_compte_bancaire')
          .select('id, code, nom, id_entite')
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('nom');

        if (comptesError) throw comptesError;
        setComptesBancaires(comptesData || []);
        setFilteredComptesBancaires(comptesData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données de référence:', error);
        addToast({
          label: 'Erreur lors du chargement des données de référence',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };

    if (!profilLoading) {
      fetchReferenceData();
    }
  }, [profilLoading, profil?.com_contrat_client_id]);

  // Filtrer les comptes bancaires en fonction de l'entité sélectionnée
  useEffect(() => {
    if (filters.entite) {
      // Trouver l'ID de l'entité sélectionnée
      const entiteSelectionnee = entites.find(e => e.code === filters.entite);
      
      if (entiteSelectionnee) {
        // Filtrer les comptes bancaires par l'ID de l'entité
        const comptesFiltres = comptesBancaires.filter(compte => 
          compte.id_entite === entiteSelectionnee.id
        );
        setFilteredComptesBancaires(comptesFiltres);
        
        // Si le compte actuellement sélectionné n'appartient pas à cette entité, le réinitialiser
        if (filters.compte && !comptesFiltres.some(c => c.code === filters.compte)) {
          setFilters(prev => ({
            ...prev,
            compte: ''
          }));
        }
      }
    } else {
      // Si aucune entité n'est sélectionnée, afficher tous les comptes
      setFilteredComptesBancaires(comptesBancaires);
    }
  }, [filters.entite, entites, comptesBancaires]);

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

  const handleFilterChange = (updatedFilters: { [key: string]: any }) => {
    setFilters(updatedFilters);
  };

  const fetchEcritures = async () => {
    if (!profil?.com_contrat_client_id) {
      addToast({
        label: 'Profil utilisateur incomplet',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    // Vérifier que les filtres obligatoires sont renseignés
    if (!filters.dateDebut || !filters.dateFin) {
      addToast({
        label: 'Veuillez sélectionner une période',
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }
    
    setLoading(true);
    try {
      let query = supabase
        .from('bq_ecriture_bancaire')
        .select(`
          id,
          data_lancamento,
          data_valor,
          source_import_id,
          descricao,
          valor,
          saldo,
          referencia_doc,
          created_at,
          id_compte,
          compte:bq_compte_bancaire!id_compte (
            id,
            code,
            nom,
            id_entite,
            entite:com_entite!id_entite (
              id,
              code,
              libelle
            )
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .gte('data_lancamento', filters.dateDebut) 
        .lte('data_lancamento', filters.dateFin);

      // Ajouter le filtre sur l'entité seulement si une valeur est sélectionnée
      if (filters.entite) {
        // Trouver l'ID de l'entité sélectionnée
        const entiteSelectionnee = entites.find(e => e.code === filters.entite);
        if (entiteSelectionnee) {
          // Filtrer par l'ID de l'entité directement sur la table bq_compte_bancaire
          query = query.eq('bq_compte_bancaire.id_entite', entiteSelectionnee.id);
        }
      }

      // Ajouter le filtre sur le compte bancaire seulement si une valeur est sélectionnée
      if (filters.compte) {
        // Trouver l'ID du compte sélectionné
        const compteSelectionne = comptesBancaires.find(c => c.code === filters.compte);
        if (compteSelectionne) {
          // Filtrer par l'ID du compte directement
          query = query.eq('id_compte', compteSelectionne.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformation des données pour faciliter l'affichage
      let formattedData = data?.map(item => ({
        id: item.id,
        data_lancamento: item.data_lancamento,
        data_valor: item.data_valor,
        descricao: item.descricao,
        source_import_id: item.source_import_id,
        valor: item.valor,
        saldo: item.saldo,
        referencia_doc: item.referencia_doc,
        created_at: item.created_at,
        compte: item.compte || { code: '- Compte non défini', nom: 'Compte non défini', id_entite: null },
        entite: item.compte?.entite || { code: '- Entité non définie', libelle: 'Entité non définie', id: null }
      })) || [];

      // Tri côté client selon les critères demandés
      formattedData.sort((a, b) => {
        // 1. Tri par code_entite (ordre croissant)
        if (a.entite.code !== b.entite.code) {
          return a.entite.code.localeCompare(b.entite.code);
        }
        
        // 2. Tri par code_compte (ordre croissant)
        if (a.compte.code !== b.compte.code) {
          return a.compte.code.localeCompare(b.compte.code);
        }
        
        // 3. Tri par date_lancamento (ordre croissant)
        if (a.data_lancamento !== b.data_lancamento) {
          return new Date(a.data_lancamento).getTime() - new Date(b.data_lancamento).getTime();
        }
        
        // 4. Tri par source_import_id (ordre croissant)
        if (a.source_import_id !== b.source_import_id) {
          // Gérer le cas où source_import_id peut être null
          if (a.source_import_id === null) return 1;
          if (b.source_import_id === null) return -1;
          return a.source_import_id - b.source_import_id;
        }
        
        return 0;
      });

      setEcritures(formattedData);
      setDataLoaded(true);

      addToast({
        label: `${formattedData.length} écritures bancaires trouvées`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des écritures bancaires:', error);
      addToast({
        label: 'Erreur lors de la récupération des écritures bancaires',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // Configuration des filtres
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
      isEntityOption: true
    },
    {
      name: 'compte',
      label: 'Compte bancaire',
      type: 'select' as const,
      options: filteredComptesBancaires.map(compte => ({
        id: compte.id,
        code: compte.code,
        libelle: compte.nom
      })),
      isEntityOption: true
    },
    {
      name: 'dateDebut',
      label: 'Date de début',
      type: 'date' as const
    },
    {
      name: 'dateFin',
      label: 'Date de fin',
      type: 'date' as const
    }
  ];

  // Colonnes pour le tableau des écritures
  const columns: Column<EcritureBancaire>[] = [
    {
      label: 'Entité',
      accessor: 'entite',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Compte',
      accessor: 'compte',
      render: (value) => `${value.code} - ${value.nom}`
    },
    {
      label: 'Date opération',
      accessor: 'data_lancamento',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr }),
      width: '120px'
    },
    {
      label: 'Date valeur',
      accessor: 'data_valor',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: fr }) : '-',
      width: '120px'
    },
    {
      label: 'Description',
      accessor: 'descricao',
      render: (value) => value || '-'
    },
    {
      label: 'Montant',
      accessor: 'valor',
      align: 'right',
      width: '120px',
      render: (value) => {
        const formattedValue = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
        return (
          <span className={value < 0 ? 'text-red-600' : 'text-green-600'}>
            {formattedValue}
          </span>
        );
      }
    },
    {
      label: 'Solde',
      accessor: 'saldo',
      align: 'right',
      width: '120px',
      render: (value) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      }
    },
    {
      label: 'Référence',
      accessor: 'referencia_doc',
      render: (value) => value || '-',
      width: '120px'
    },
    {
      label: 'ID Source',
      accessor: 'source_import_id',
      width: '100px',
      align: 'center',
      render: (value) => value || '-'
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title="Mouvements Bancaires"
        description="Consultez et gérez vos écritures bancaires"
        className={styles.header}
      >
        {/* Section des filtres */}
        <div className="mb-6">
          <FilterSection
            filters={filterConfigs}
            values={filters}
            onChange={handleFilterChange}
            className="mb-4"
          />
          
          <div className="flex justify-end">
            <Button
              label={loading ? "Chargement..." : "Afficher les écritures"}
              icon="Search"
              color="var(--color-primary)"
              onClick={fetchEcritures}
              disabled={loading}
            />
          </div>
        </div>

        {/* Affichage des écritures uniquement après avoir cliqué sur "Afficher" */}
        {dataLoaded && (
          <div>
            <div className="text-sm text-gray-600 mb-4">
              {ecritures.length} écritures bancaires trouvées
            </div>

            <DataTable
              columns={columns}
              data={ecritures}
              defaultRowsPerPage={25}
              rowsPerPageOptions={[25, 50, 100, 'all']}
              emptyTitle="Aucune écriture bancaire"
              emptyMessage={loading ? "Chargement des écritures bancaires..." : "Aucune écriture bancaire trouvée pour les critères sélectionnés."}
            />
          </div>
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default EcritureBancaire;