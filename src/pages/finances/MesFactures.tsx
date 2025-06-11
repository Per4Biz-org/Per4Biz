import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { supabase } from '../../lib/supabase';
import { menuItemsGestionFinanciere } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import { DataTable, Column } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { FilterSection } from '../../components/filters/FilterSection';
import { ToastContainer, ToastData } from '../../components/ui/toast';
import styles from './styles.module.css';

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
  const [factures, setFactures] = useState<FactureAchat[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<FactureAchat[]>([]);
  const [filters, setFilters] = useState({
    entite: '',
    annee: ''
  });
  
  // Générer les années disponibles (3 dernières années + année courante + 2 prochaines)
  const availableYears = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 3 + i);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const fetchFactures = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setFactures([]);
        return;
      }

      const { data, error } = await supabase
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
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('date_facture', { ascending: false });

      if (error) throw error;
      setFactures(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      addToast({
        label: 'Erreur lors de la récupération des factures',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error('Erreur lors de la récupération des entités:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...factures];

    // Filtre par entité
    if (filters.entite) {
      filtered = filtered.filter(facture => facture.entite.id === filters.entite);
    }

    // Filtre par année
    if (filters.annee) {
      filtered = filtered.filter(facture => {
        const factureYear = new Date(facture.date_facture).getFullYear();
        return factureYear.toString() === filters.annee;
      });
    }

    setFilteredFactures(filtered);
  };

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
    if (!profilLoading) {
      fetchFactures();
      fetchEntites();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

  useEffect(() => {
    applyFilters();
  }, [factures, filters]);

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
    // TODO: Implémenter l'édition de facture
    addToast({
      label: `Édition de la facture ${facture.num_document || facture.id}`,
      icon: 'Edit',
      color: 'var(--color-primary)'
    });
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
  };

  const filterConfigs = [
    {
      name: 'entite',
      label: 'Entité',
      type: 'select' as const,
      options: entites.map(entite => (entite.code))
    },
    {
      name: 'annee',
      label: 'Année',
      type: 'select' as const,
      options: availableYears
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
      label: 'Pièce jointe',
      accessor: 'lien_piece_jointe',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
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
        className={styles.header}
      >
        <FilterSection
          filters={filterConfigs}
          values={filters}
          onChange={handleFilterChange}
          className="mb-6"
        />

        <div className="mb-4 text-sm text-gray-600">
          {filteredFactures.length} facture(s) affichée(s) sur {factures.length} au total
        </div>

        <div className="mb-6">
          <Button
            label="Nouvelle facture"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => {
              // TODO: Implémenter la création de facture
              addToast({
                label: 'Fonctionnalité de création en cours de développement',
                icon: 'Info',
                color: 'var(--color-primary)'
              });
            }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des factures...</p>
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
      </PageSection>
    </div>
  );
};

export default MesFactures;