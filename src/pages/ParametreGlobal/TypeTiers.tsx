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
import { TypeTiersFormModal } from '../../components/ParametreGlobal/Tiers/TypeTiersFormModal';
import styles from './styles.module.css';

interface TypeTiers {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
  mp: boolean;
  salarie: boolean;
  created_at: string;
  updated_at: string;
}

const TypeTiers: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [typesTiers, setTypesTiers] = useState<TypeTiers[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypeTiers, setSelectedTypeTiers] = useState<TypeTiers | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTypesTiers = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setTypesTiers([]);
        return;
      }

      const { data, error } = await supabase
        .from('com_param_type_tiers')
        .select('*')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('code');

      if (error) throw error;
      setTypesTiers(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de tiers:', error);
      addToast({
        label: 'Erreur lors de la récupération des types de tiers',
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
      fetchTypesTiers();
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

  const handleSubmit = async (formData: { code: string; libelle: string; actif: boolean; mp: boolean }) => {
    setIsSubmitting(true);
    try {
      if (!profil?.com_contrat_client_id) {
        throw new Error('Aucun contrat client associé au profil');
      }

      let error;
      
      if (selectedTypeTiers) {
        // Mode édition
        const updateData = {
          code: formData.code,
          libelle: formData.libelle,
          actif: formData.actif,
          mp: formData.mp,
          salarie: formData.salarie,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: updateError } = await supabase
          .from('com_param_type_tiers')
          .update(updateData)
          .eq('id', selectedTypeTiers.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          libelle: formData.libelle,
          actif: formData.actif,
          mp: formData.mp,
          salarie: formData.salarie,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('com_param_type_tiers')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchTypesTiers();
      setIsModalOpen(false);
      setSelectedTypeTiers(null);
      addToast({
        label: `Type de tiers ${selectedTypeTiers ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        label: `Erreur lors de la ${selectedTypeTiers ? 'modification' : 'création'} du type de tiers`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (typeTiers: TypeTiers) => {
    setSelectedTypeTiers(typeTiers);
    setIsModalOpen(true);
  };

  const handleDelete = async (typeTiers: TypeTiers) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver le type de tiers "${typeTiers.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('com_param_type_tiers')
          .update({ actif: false })
          .eq('id', typeTiers.id);

        if (error) throw error;

        await fetchTypesTiers();
        addToast({
          label: `Le type de tiers "${typeTiers.libelle}" a été désactivé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
        addToast({
          label: 'Erreur lors de la désactivation du type de tiers',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<TypeTiers>[] = [
    {
      label: 'Code',
      accessor: 'code',
      sortable: true
    },
    {
      label: 'Libellé',
      accessor: 'libelle',
      sortable: true
    },
    {
      label: 'Matière Première',
      accessor: 'mp',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
    },
    {
      label: 'Salarié',
      accessor: 'salarie',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
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
        title={loading || profilLoading ? "Chargement..." : "Types de Tiers"}
        description="Gérez les types de tiers de votre organisation"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Ajouter un type de tiers"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des types de tiers...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={typesTiers}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun type de tiers"
            emptyMessage="Aucun type de tiers n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        <TypeTiersFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTypeTiers(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedTypeTiers}
          isSubmitting={isSubmitting}
        />
      </PageSection>
    </div>
  );
};

export default TypeTiers;