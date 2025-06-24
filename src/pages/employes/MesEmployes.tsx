import React, { useEffect, useState } from 'react';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { supabase } from '../../lib/supabase';
import { menuItemsGestionRH } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import { DataTable, Column } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { ToastContainer, ToastData } from '../../components/ui/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import styles from './styles.module.css';
import FichePersonnel from './FichePersonnel';

interface Personnel {
  id: string;
  nom: string;
  prenom: string;
  code_court: string;
  matricule: string;
  civilite: string | null;
  sexe: string | null;
  date_naissance: string | null;
  email_perso: string | null;
  telephone: string | null;
  actif: boolean;
  created_at: string;
  tiers: {
    code: string;
    nom: string;
  };
}

const MesEmployes: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | undefined>(undefined);
  const [showFichePersonnel, setShowFichePersonnel] = useState(false);

  useEffect(() => {
    setMenuItems(menuItemsGestionRH);
    if (!profilLoading) {
      fetchPersonnel();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

  const fetchPersonnel = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setPersonnel([]);
        return;
      }

      const { data, error } = await supabase
        .from('rh_personnel')
        .select(`
          *,
          tiers:id_tiers (
            code,
            nom
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('nom');

      if (error) throw error;
      setPersonnel(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération du personnel:', error);
      addToast({
        label: 'Erreur lors de la récupération du personnel',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleEdit = (personne: Personnel) => {
    // Fonction à implémenter pour l'édition
    setSelectedPersonnelId(personne.id);
    setShowFichePersonnel(true);
  };

  const handleDelete = async (personne: Personnel) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver ${personne.prenom} ${personne.nom} ?`)) {
      try {
        const { error } = await supabase
          .from('rh_personnel')
          .update({ actif: false })
          .eq('id', personne.id);

        if (error) throw error;

        await fetchPersonnel();
        addToast({
          label: `${personne.prenom} ${personne.nom} a été désactivé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
        addToast({
          label: 'Erreur lors de la désactivation de l\'employé',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const handleAddEmploye = () => {
    setSelectedPersonnelId(undefined);
    setShowFichePersonnel(true);
  };

  const handleCloseFichePersonnel = () => {
    setShowFichePersonnel(false);
    setSelectedPersonnelId(undefined);
    fetchPersonnel(); // Rafraîchir la liste après modification
  };

  const columns: Column<Personnel>[] = [
    {
      label: 'Code',
      accessor: 'code_court',
      sortable: true
    },
    {
      label: 'Matricule',
      accessor: 'matricule',
      sortable: true
    },
    {
      label: 'Nom',
      accessor: 'nom',
      sortable: true,
      render: (value, row) => `${row.prenom} ${value}`
    },
    {
      label: 'Civilité',
      accessor: 'civilite',
      render: (value) => value || '-'
    },
    {
      label: 'Email',
      accessor: 'email_perso',
      render: (value) => value || '-'
    },
    {
      label: 'Téléphone',
      accessor: 'telephone',
      render: (value) => value || '-'
    },
    {
      label: 'Actif',
      accessor: 'actif',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
    },
    {
      label: 'Date de création',
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
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
      label: 'Désactiver',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDelete
    }
  ];

  // Si la fiche personnel est affichée, on la rend à la place de la liste
  if (showFichePersonnel) {
    return (
      <div className={styles.container}>
        <FichePersonnel 
          personnelId={selectedPersonnelId} 
          onClose={handleCloseFichePersonnel} 
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? "Chargement..." : "Mes Employés"}
        description="Gérez les employés de votre organisation"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Ajouter un employé"
            icon="UserPlus"
            color="var(--color-primary)"
            onClick={handleAddEmploye}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des employés...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={personnel}
            onRowClick={handleEdit}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun employé"
            emptyMessage="Aucun employé n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default MesEmployes;