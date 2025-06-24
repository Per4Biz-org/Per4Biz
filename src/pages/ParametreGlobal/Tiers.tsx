import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { supabase } from '../../lib/supabase';
import { menuItemsParametreGlobal } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import { DataTable, Column } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { ToastContainer, ToastData } from '../../components/ui/toast';
import { TiersFormModal } from '../../components/ParametreGlobal/Tiers/TiersFormModal';
import styles from './styles.module.css';

interface Tiers {
  id: string;
  code: string;
  nom: string;
  nif: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  actif: boolean;
  id_type_tiers: string;
  created_at: string;
  updated_at: string;
  type_tiers: {
    code: string;
    libelle: string;
  };
}

const Tiers: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<Tiers | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTiers = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setTiers([]);
        return;
      }

      const { data, error } = await supabase
        .from('com_tiers')
        .select(`
          *,
          type_tiers:id_type_tiers (
            code,
            libelle
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('nom');

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des tiers:', error);
      addToast({
        label: 'Erreur lors de la récupération des tiers',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMenuItems(menuItemsParametreGlobal);
    if (!profilLoading) {
      fetchTiers();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

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

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (!profil?.com_contrat_client_id) {
        throw new Error('Aucun contrat client associé au profil');
      }

      let error;
      
      if (selectedTiers) {
        // Mode édition
        const updateData = {
          code: formData.code, 
          nom: formData.nom,
          nif: formData.nif || null,
          email: formData.email || null,
          telephone: formData.telephone || null,
          adresse: formData.adresse || null,
          code_postal: formData.code_postal || null,
          ville: formData.ville || null,
          actif: formData.actif,
          id_type_tiers: formData.id_type_tiers,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: updateError } = await supabase
          .from('com_tiers')
          .update(updateData)
          .eq('id', selectedTiers.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          nom: formData.nom, 
          nif: formData.nif || null,
          email: formData.email || null,
          telephone: formData.telephone || null,
          adresse: formData.adresse || null,
          code_postal: formData.code_postal || null,
          ville: formData.ville || null,
          actif: formData.actif,
          id_type_tiers: formData.id_type_tiers,
          com_contrat_client_id: profil.com_contrat_client_id,
          // code_user n'est plus nécessaire, remplacé par created_by
        };

        const { error: insertError } = await supabase
          .from('com_tiers')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchTiers();
      setIsModalOpen(false);
      setSelectedTiers(null);
      addToast({
        label: `Tiers ${selectedTiers ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        label: `Erreur lors de la ${selectedTiers ? 'modification' : 'création'} du tiers`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tiers: Tiers) => {
    setSelectedTiers(tiers);
    setIsModalOpen(true);
  };

  const handleDelete = async (tiers: Tiers) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver le tiers "${tiers.nom}" ?`)) {
      try {
        const { error } = await supabase
          .from('com_tiers')
          .update({ actif: false })
          .eq('id', tiers.id);

        if (error) throw error;

        await fetchTiers();
        addToast({
          label: `Le tiers "${tiers.nom}" a été désactivé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
        addToast({
          label: 'Erreur lors de la désactivation du tiers',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<Tiers>[] = [
    {
      label: 'Code',
      accessor: 'code',
      sortable: true
    },
    {
      label: 'Nom',
      accessor: 'nom',
      sortable: true
    },
    {
      label: 'Type',
      accessor: 'type_tiers',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Email',
      accessor: 'email',
      render: (value) => value || '-'
    },
    {
      label: 'Téléphone',
      accessor: 'telephone',
      render: (value) => value || '-'
    },
    {
      label: 'Ville',
      accessor: 'ville',
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

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? "Chargement..." : "Tiers"}
        description="Gérez les tiers de votre organisation"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Ajouter un tiers"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des tiers...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={tiers}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun tiers"
            emptyMessage="Aucun tiers n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        <TiersFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTiers(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedTiers}
          isSubmitting={isSubmitting}
        />
      </PageSection>
    </div>
  );
};

export default Tiers;