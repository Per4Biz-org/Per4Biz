import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useProfil } from '../../../../context/ProfilContext';
import { DataTable, Column } from '../../../ui/data-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CoutMensuel {
  id: string;
  annee: number;
  mois: number;
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

interface CoutsMensuelsTabProps {
  personnelId: string | undefined;
  addToast: (toast: any) => void;
}

const CoutsMensuelsTab: React.FC<CoutsMensuelsTabProps> = ({ personnelId, addToast }) => {
  const { profil } = useProfil();
  const [coutsMensuels, setCoutsMensuels] = useState<CoutMensuel[]>([]);
  const [loading, setLoading] = useState(true);

  // Chargement des coûts mensuels
  useEffect(() => {
    const fetchCoutsMensuels = async () => {
      if (!personnelId || !profil?.com_contrat_client_id) return;

      try {
        setLoading(true);
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
      } catch (error) {
        console.error('Erreur lors du chargement des coûts mensuels:', error);
        addToast({
          label: 'Erreur lors du chargement des coûts mensuels',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCoutsMensuels();
  }, [personnelId, profil?.com_contrat_client_id, addToast]);

  const getMonthName = (month: number): string => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1] || '';
  };

  const columns: Column<CoutMensuel>[] = [
    {
      label: 'Période',
      accessor: 'mois',
      render: (value, row) => `${getMonthName(value)} ${row.annee}`
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
    },
    {
      label: 'Date de création',
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    }
  ];

  if (!personnelId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-700">Veuillez d'abord enregistrer les informations personnelles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Coûts mensuels</h2>
        <div className="text-sm text-gray-500">
          Les coûts mensuels sont en lecture seule et sont générés automatiquement.
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Chargement des coûts mensuels...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={coutsMensuels}
          actions={[]}
          defaultRowsPerPage={10}
          emptyTitle="Aucun coût mensuel"
          emptyMessage="Aucun coût mensuel n'a été enregistré pour cet employé."
        />
      )}
    </div>
  );
};

export default CoutsMensuelsTab;