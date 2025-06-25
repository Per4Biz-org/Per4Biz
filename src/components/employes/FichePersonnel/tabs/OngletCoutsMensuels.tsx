import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../../../lib/supabase';
import { useProfil } from '../../../../context/ProfilContext';
import { DataTable, Column } from '../../../../components/ui/data-table';
import { FilterSection } from '../../../../components/filters/FilterSection';

interface CoutMensuel {
  id: string;
  id_personnel: string;
  id_entite: string;
  id_contrat: string;
  annee: number;
  mois: number;
  id_categorie: string;
  id_sous_categorie: string;
  montant: number;
  commentaire: string | null;
  created_at: string;
  entite: {
    code: string;
    libelle: string;
  };
  categorie: {
    code: string;
    libelle: string;
  };
  sous_categorie: {
    code: string;
    libelle: string;
  };
}

interface OngletCoutsMensuelsProps {
  personnelId?: string;
}

export const OngletCoutsMensuels: React.FC<OngletCoutsMensuelsProps> = ({ personnelId }) => {
  const { profil } = useProfil();
  const [coutsMensuels, setCoutsMensuels] = useState<CoutMensuel[]>([]);
  const [filteredCouts, setFilteredCouts] = useState<CoutMensuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    annee: new Date().getFullYear().toString(),
    mois: ''
  });

  // Générer les années disponibles (année courante - 2 à année courante + 1)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 4 }, (_, i) => (currentYear - 2 + i).toString());

  // Charger les coûts mensuels du personnel
  useEffect(() => {
    const fetchCoutsMensuels = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) {
        setCoutsMensuels([]);
        setFilteredCouts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('rh_cout_mensuel')
          .select(`
            *,
            entite:id_entite (
              code,
              libelle
            ),
            categorie:id_categorie (
              code,
              libelle
            ),
            sous_categorie:id_sous_categorie (
              code,
              libelle
            )
          `)
          .eq('id_personnel', personnelId)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('annee', { ascending: false })
          .order('mois', { ascending: false });

        if (error) throw error;
        setCoutsMensuels(data || []);
        setFilteredCouts(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des coûts mensuels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoutsMensuels();
  }, [personnelId, profil?.com_contrat_client_id]);

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...coutsMensuels];

    // Filtre par année
    if (filters.annee) {
      filtered = filtered.filter(cout => cout.annee.toString() === filters.annee);
    }

    // Filtre par mois
    if (filters.mois) {
      filtered = filtered.filter(cout => cout.mois.toString() === filters.mois);
    }

    setFilteredCouts(filtered);
  }, [coutsMensuels, filters]);

  // Gestionnaire de changement de filtre
  const handleFilterChange = (updatedFilters: { [key: string]: any }) => {
    setFilters(updatedFilters);
  };

  // Obtenir le nom du mois à partir du numéro
  const getMonthName = (monthNumber: number): string => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return format(date, 'MMMM', { locale: fr });
  };

  // Configuration des filtres
  const filterConfigs = [
    {
      name: 'annee',
      label: 'Année',
      type: 'select' as const,
      options: availableYears
    },
    {
      name: 'mois',
      label: 'Mois',
      type: 'select' as const,
      options: [
        '', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
      ].map(value => value === '' ? 'Tous les mois' : getMonthName(parseInt(value)))
    }
  ];

  // Colonnes pour le tableau des coûts mensuels
  const columns: Column<CoutMensuel>[] = [
    {
      label: 'Année',
      accessor: 'annee',
      sortable: true
    },
    {
      label: 'Mois',
      accessor: 'mois',
      sortable: true,
      render: (value) => getMonthName(value)
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
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'Commentaire',
      accessor: 'commentaire',
      render: (value) => value || '-'
    }
  ];

  if (!personnelId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        Veuillez d'abord enregistrer les informations personnelles.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Coûts mensuels</h2>
        <div className="text-sm text-gray-500">
          Lecture seule - Ces données sont calculées automatiquement
        </div>
      </div>

      <FilterSection
        filters={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        className="mb-6 flex gap-4"
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Chargement des coûts mensuels...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCouts}
          actions={[]}
          emptyTitle="Aucun coût mensuel"
          emptyMessage="Aucun coût mensuel n'a été enregistré pour ce personnel."
        />
      )}
    </div>
  );
};