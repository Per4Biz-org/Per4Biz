import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsParamGestionFinanciere } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { DataTable, Column } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { NatureFluxForm } from '../../../components/ParametreFinances/NatureFlux/NatureFluxForm';
import styles from './styles.module.css';

interface NatureFlux {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  id_entite: string;
  actif: boolean;
  created_at: string;
  entite: {
    code: string;
    libelle: string;
  };
  salarie: boolean;
}

const NatureFlux: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [naturesFlux, setNaturesFlux] = useState<NatureFlux[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNature, setSelectedNature] = useState<NatureFlux | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNaturesFlux = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setNaturesFlux([]);
        return;
      }

      const { data, error } = await supabase
        .from('fin_flux_nature')
        .select(`
          *,
          entite:id_entite (
            code,
            libelle
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('code');

      if (error) throw error;
      setNaturesFlux(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des natures de flux:', error);
      addToast({
        label: 'Erreur lors de la récupération des natures de flux',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMenuItems(menuItemsParamGestionFinanciere);
    if (!profilLoading) {
      fetchNaturesFlux();
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

  const handleSubmit = async (formData: {
      code: string;
      libelle: string;
      description?: string;
      id_entite: string | null;
      actif: boolean;
      salarie: boolean;
    }
  ) => {
    setIsSubmitting(true);
    try {
      if (!profil?.com_contrat_client_id) {
        throw new Error('Aucun contrat client associé au profil');
      }

      let error;
      
      if (selectedNature) {
        // Mode édition
        const updateData = {
          code: formData.code,
          libelle: formData.libelle,
          description: formData.description || null,
          id_entite: formData.id_entite || null,
          actif: formData.actif,
          salarie: formData.salarie,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: updateError } = await supabase
          .from('fin_flux_nature')
          .update(updateData)
          .eq('id', selectedNature.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          libelle: formData.libelle,
          description: formData.description || null,
          id_entite: formData.id_entite || null,
          actif: formData.actif,
          salarie: formData.salarie,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('fin_flux_nature')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchNaturesFlux();
      setIsModalOpen(false);
      setSelectedNature(null);
      addToast({
        label: `Nature de flux ${selectedNature ? 'modifiée' : 'créée'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        label: `Erreur lors de la ${selectedNature ? 'modification' : 'création'} de la nature de flux`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (nature: NatureFlux) => {
    setSelectedNature(nature);
    setIsModalOpen(true);
  };

  const handleDelete = async (nature: NatureFlux) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver la nature de flux "${nature.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('fin_flux_nature')
          .update({ actif: false })
          .eq('id', nature.id);

        if (error) throw error;

        await fetchNaturesFlux();
        addToast({
          label: `La nature de flux "${nature.libelle}" a été désactivée avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la désactivation de la nature de flux',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<NatureFlux>[] = [
    {
      label: 'Entité',
      accessor: 'entite',
      render: (value) => value ? `${value.code} - ${value.libelle}` : 'Global (toutes les entités)'
    },
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
      label: 'Description',
      accessor: 'description',
      render: (value) => value || '-'
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
        title={loading || profilLoading ? "Chargement..." : "Natures de Flux"}
        description="Gérez les natures de flux financiers de votre organisation"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Créer une nature de flux"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des natures de flux...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={naturesFlux}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucune nature de flux"
            emptyMessage="Aucune nature de flux n'a été créée pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedNature ? 'Modifier une nature de flux' : 'Créer une nature de flux'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedNature(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <NatureFluxForm
                initialData={selectedNature ? {
                  code: selectedNature.code,
                  libelle: selectedNature.libelle,
                  description: selectedNature.description || '',
                  id_entite: selectedNature.id_entite || '',
                  actif: selectedNature.actif,
                  salarie: selectedNature.salarie || false
                } : undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsModalOpen(false);
                  setSelectedNature(null);
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

export default NatureFlux;