import React, { useEffect } from 'react';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { supabase } from '../../lib/supabase';
import { menuItemsParametreGlobal } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import { DataTable, Column } from '../../components/ui/data-table';
import { ToastContainer, ToastData } from '../../components/ui/toast';
import { EntiteForm } from '../../components/ParametreGlobal/Entite/EntiteForm';
import { Button } from '../../components/ui/button';
import styles from './styles.module.css';

interface Entite {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
  created_at: string;
}

const Entites: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [entites, setEntites] = React.useState<Entite[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedEntite, setSelectedEntite] = React.useState<Entite | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [toasts, setToasts] = React.useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (formData: { code: string; libelle: string; actif: boolean }) => {
    setIsSubmitting(true);
    try {
      if (!profil?.com_contrat_client_id) {
        throw new Error('Aucun contrat client associé au profil');
      }

      let error;
      
      if (selectedEntite) {
        // Mode édition
        const updateData = {
          ...formData,
          com_contrat_client_id: profil.com_contrat_client_id
        };
        
        const { error: updateError } = await supabase
          .from('com_entite')
          .update(updateData)
          .eq('id', selectedEntite.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          ...formData,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('com_entite')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchEntites();
      setIsModalOpen(false);
      setSelectedEntite(null);
      addToast({
        label: `Entité ${selectedEntite ? 'modifiée' : 'créée'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error(`Erreur lors de la ${selectedEntite ? 'modification' : 'création'}:`, error);
      addToast({
        label: `Erreur lors de la ${selectedEntite ? 'modification' : 'création'} de l'entité`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entite: Entite) => {
    setSelectedEntite(entite);
    setIsModalOpen(true);
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

  const handleDelete = async (entite: Entite) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'entité "${entite.libelle}" ?`)) {
      try {
        const { error: deleteError } = await supabase
          .from('com_entite')
          .delete()
          .eq('id', entite.id);

        if (deleteError) throw deleteError;

        // Recharger les données après la suppression
        await fetchEntites();
        
        addToast({
          label: `L'entité "${entite.libelle}" a été supprimée avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la suppression de l\'entité',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
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
        .select('*')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('code', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des entités:', error);
        return;
      }

      setEntites(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des entités:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    setMenuItems(menuItemsParametreGlobal);
    if (!profilLoading) {
      fetchEntites();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

  const columns: Column<Entite>[] = [
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
        title={loading || profilLoading ? "Chargement..." : "Gestion des Entités"}
        description="Gérez les différentes entités de votre organisation"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Créer une entité"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des entités...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={entites}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucune entité"
            emptyMessage="Aucune entité n'a été créée pour le moment."
          />
        )}
        <ToastContainer toasts={toasts} onClose={closeToast} />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedEntite ? 'Modifier une entité' : 'Créer une entité'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedEntite(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <EntiteForm
                initialData={selectedEntite || undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsModalOpen(false);
                  setSelectedEntite(null);
                }}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}
      </PageSection>
    </div>
  );
};

export default Entites;