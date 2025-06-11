import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsParamGestionBancaire } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { DataTable, Column } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { ModePaiementFormModal } from '../../../components/ParametreBanque/ModePaiementFormModal';
import styles from './styles.module.css';

interface ModePaiement {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
  code_user: string;
  created_at: string;
}

const ModePaiement: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [modesPaiement, setModesPaiement] = useState<ModePaiement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModePaiement, setSelectedModePaiement] = useState<ModePaiement | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchModesPaiement = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setModesPaiement([]);
        return;
      }

      const { data, error } = await supabase
        .from('bq_param_mode_paiement')
        .select('*')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('code');

      if (error) throw error;
      setModesPaiement(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des modes de paiement:', error);
      addToast({
        label: 'Erreur lors de la récupération des modes de paiement',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMenuItems(menuItemsParamGestionBancaire);
    if (!profilLoading) {
      fetchModesPaiement();
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
      
      if (selectedModePaiement) {
        // Mode édition
        const updateData = {
          code: formData.code,
          libelle: formData.libelle,
          actif: formData.actif
        };

        const { error: updateError } = await supabase
          .from('bq_param_mode_paiement')
          .update(updateData)
          .eq('id', selectedModePaiement.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          libelle: formData.libelle,
          actif: formData.actif,
          com_contrat_client_id: profil.com_contrat_client_id,
          code_user: profil.code_user || ''
        };

        const { error: insertError } = await supabase
          .from('bq_param_mode_paiement')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchModesPaiement();
      setIsModalOpen(false);
      setSelectedModePaiement(null);
      addToast({
        label: `Mode de paiement ${selectedModePaiement ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        label: `Erreur lors de la ${selectedModePaiement ? 'modification' : 'création'} du mode de paiement`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (modePaiement: ModePaiement) => {
    setSelectedModePaiement(modePaiement);
    setIsModalOpen(true);
  };

  const handleDelete = async (modePaiement: ModePaiement) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver le mode de paiement "${modePaiement.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('bq_param_mode_paiement')
          .update({ actif: false })
          .eq('id', modePaiement.id);

        if (error) throw error;

        await fetchModesPaiement();
        addToast({
          label: `Le mode de paiement "${modePaiement.libelle}" a été désactivé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
        addToast({
          label: 'Erreur lors de la désactivation du mode de paiement',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<ModePaiement>[] = [
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
        title={loading || profilLoading ? "Chargement..." : "Modes de Paiement"}
        description="Gérez les modes de paiement de votre organisation"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Ajouter un mode de paiement"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des modes de paiement...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={modesPaiement}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun mode de paiement"
            emptyMessage="Aucun mode de paiement n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        <ModePaiementFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedModePaiement(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedModePaiement}
          isSubmitting={isSubmitting}
        />
      </PageSection>
    </div>
  );
};

export default ModePaiement;