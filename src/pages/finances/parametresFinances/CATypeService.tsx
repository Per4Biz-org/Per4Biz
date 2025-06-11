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
import { CATypeServiceFormModal } from '../../../components/finances/parametresFinances/CATypeServiceFormModal';
import styles from './styles.module.css';

interface CATypeService {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  ordre_affichage: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
  id_entite: string;
  heure_debut: string | null;
  heure_fin: string | null;
  entite: {
    code: string;
    libelle: string;
  };
}

const CATypeService: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [typesService, setTypesService] = useState<CATypeService[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypeService, setSelectedTypeService] = useState<CATypeService | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTypesService = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setTypesService([]);
        return;
      }

      const { data, error } = await supabase
        .from('ca_type_service')
        .select(`
          *,
          entite:id_entite (
            code,
            libelle
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('ordre_affichage')
        .order('code');

      if (error) throw error;
      setTypesService(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de service:', error);
      addToast({
        label: 'Erreur lors de la récupération des types de service',
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
      fetchTypesService();
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
      
      if (selectedTypeService) {
        // Mode édition
        const updateData = {
          code: formData.code,
          libelle: formData.libelle,
          description: formData.description || null,
          ordre_affichage: formData.ordre_affichage,
          actif: formData.actif,
          id_entite: formData.id_entite,
          heure_debut: formData.heure_debut || null,
          heure_fin: formData.heure_fin || null
        };

        const { error: updateError } = await supabase
          .from('ca_type_service')
          .update(updateData)
          .eq('id', selectedTypeService.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          libelle: formData.libelle,
          description: formData.description || null,
          ordre_affichage: formData.ordre_affichage,
          actif: formData.actif,
          id_entite: formData.id_entite,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('ca_type_service')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchTypesService();
      setIsModalOpen(false);
      setSelectedTypeService(null);
      addToast({
        label: `Type de service ${selectedTypeService ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      let errorMessage = `Erreur lors de la ${selectedTypeService ? 'modification' : 'création'} du type de service`;
      
      // Gestion des erreurs de contrainte d'unicité
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        errorMessage = 'Ce code existe déjà pour cette entité. Veuillez utiliser un code unique.';
      }
      
      addToast({
        label: errorMessage,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (typeService: CATypeService) => {
    setSelectedTypeService(typeService);
    setIsModalOpen(true);
  };

  const handleDelete = async (typeService: CATypeService) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le type de service "${typeService.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('ca_type_service')
          .delete()
          .eq('id', typeService.id);

        if (error) throw error;

        await fetchTypesService();
        addToast({
          label: `Le type de service "${typeService.libelle}" a été supprimé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la suppression du type de service',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<CATypeService>[] = [
    {
      label: 'Entité',
      accessor: 'entite',
      render: (value) => `${value.code} - ${value.libelle}`
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
      label: 'Ordre',
      accessor: 'ordre_affichage',
      align: 'center',
      sortable: true
    },
    {
      label: 'Horaires',
      accessor: 'heure_debut',
      align: 'center',
      render: (value, row) => {
        if (row.heure_debut && row.heure_fin) {
          return `${row.heure_debut.substring(0, 5)} - ${row.heure_fin.substring(0, 5)}`;
        }
        return '-';
      }
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
      label: 'Date de modification',
      accessor: 'updated_at',
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
      label: 'Supprimer',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDelete
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? "Chargement..." : "Types de Services CA"}
        description="Gérez les types de services pour le calcul du chiffre d'affaires par entité"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Ajouter un type de service"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des types de service...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={typesService}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun type de service"
            emptyMessage="Aucun type de service n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        <CATypeServiceFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTypeService(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedTypeService}
          isSubmitting={isSubmitting}
        />
      </PageSection>
    </div>
  );
};

export default CATypeService;