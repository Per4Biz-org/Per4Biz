import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { supabase } from '../../lib/supabase';
import { menuItemsParametreGlobal } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import { DataTable, Column } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { Dropdown, DropdownOption } from '../../components/ui/dropdown';
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

interface TypeTiers {
  id: string;
  code: string;
  libelle: string;
}

const Tiers: React.FC = () => {
  const { t } = useTranslation();
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [tiers, setTiers] = useState<Tiers[]>([]);
  const [typesTiers, setTypesTiers] = useState<TypeTiers[]>([]);
  const [filteredTiers, setFilteredTiers] = useState<Tiers[]>([]);
  const [selectedTypeTiers, setSelectedTypeTiers] = useState<string>('');
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
      setFilteredTiers(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des tiers:', error);
      addToast({
        label: t('messages.errorLoadingThirdParties', 'Erreur lors de la récupération des tiers'),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTypesTiers = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setTypesTiers([]);
        return;
      }

      const { data, error } = await supabase
        .from('com_param_type_tiers')
        .select('id, code, libelle')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('actif', true)
        .order('libelle');

      if (error) throw error;
      setTypesTiers(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des types de tiers:', error);
    }
  };

  useEffect(() => {
    setMenuItems(menuItemsParametreGlobal);
    if (!profilLoading) {
      fetchTiers();
      fetchTypesTiers();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

  // Filtrer les tiers lorsque le type sélectionné change
  useEffect(() => {
    if (!selectedTypeTiers) {
      // Si aucun type n'est sélectionné, afficher tous les tiers
      setFilteredTiers(tiers);
    } else {
      // Filtrer les tiers par type
      const filtered = tiers.filter(tier => 
        tier.type_tiers.code === selectedTypeTiers
      );
      setFilteredTiers(filtered);
    }
  }, [selectedTypeTiers, tiers]);

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
        label: t('messages.thirdPartySavedSuccess', `Tiers ${selectedTiers ? 'modifié' : 'créé'} avec succès`),
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        label: t('messages.errorSavingThirdParty', `Erreur lors de la ${selectedTiers ? 'modification' : 'création'} du tiers`),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (value: string) => {
    setSelectedTypeTiers(value);
  };

  const handleEdit = (tiers: Tiers) => {
    setSelectedTiers(tiers);
    setIsModalOpen(true);
  };

  const handleDelete = async (tiers: Tiers) => {
    if (window.confirm(t('messages.confirmDeleteThirdParty', `Êtes-vous sûr de vouloir supprimer le tiers "{{name}}" ?`, { name: tiers.nom }))) {
      try {
        const { error: deleteError } = await supabase
          .from('com_tiers')
          .delete()
          .eq('id', tiers.id);

        if (deleteError) {
          // Vérifier si l'erreur est due à une contrainte de clé étrangère
          if (deleteError.message?.includes('foreign key constraint') || 
              deleteError.message?.includes('violates foreign key constraint')) {
            throw new Error(
              `Impossible de supprimer le tiers "${tiers.nom}" car il est utilisé dans d'autres parties de l'application (factures, employés, etc.). Vous pouvez le désactiver plutôt que le supprimer.`
            );
          }
          throw deleteError;
        }

        await fetchTiers();
        addToast({
          label: t('messages.thirdPartyDeletedSuccess', `Le tiers "{{name}}" a été supprimé avec succès`, { name: tiers.nom }),
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        
        // Afficher un message d'erreur plus convivial
        addToast({
          label: error.message || 'Erreur lors de la suppression du tiers',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  // Préparer les options pour le dropdown des types de tiers
  const typeTiersOptions: DropdownOption[] = [
    { value: '', label: t('pages.globalSettings.allThirdPartyTypes', 'Tous les types de tiers') },
    ...typesTiers.map(type => ({
      value: type.code,
      label: `${type.code} - ${type.libelle}`
    }))
  ];

  const columns: Column<Tiers>[] = [
    {
      label: t('table.code', 'Code'),
      accessor: 'code',
      sortable: true
    },
    {
      label: t('table.name', 'Nom'),
      accessor: 'nom',
      sortable: true
    },
    {
      label: t('table.type', 'Type'),
      accessor: 'type_tiers',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: t('table.email', 'Email'),
      accessor: 'email',
      render: (value) => value || '-'
    },
    {
      label: t('table.phone', 'Téléphone'),
      accessor: 'telephone',
      render: (value) => value || '-'
    },
    {
      label: t('table.city', 'Ville'),
      accessor: 'ville',
      render: (value) => value || '-'
    },
    {
      label: t('table.active', 'Actif'),
      accessor: 'actif',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? t('common.yes', 'Oui') : t('common.no', 'Non')}
        </span>
      )
    },
    {
      label: t('table.creationDate', 'Date de création'),
      accessor: 'created_at',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: fr })
    }
  ];

  const actions = [
    {
      label: t('table.edit', 'Éditer'),
      icon: 'edit',
      color: 'var(--color-primary)',
      onClick: handleEdit
    },
    {
      label: t('table.delete', 'Supprimer'),
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDelete
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? t('common.loading', 'Chargement...') : t('pages.globalSettings.thirdParties', 'Tiers')}
        description={t('pages.globalSettings.thirdPartiesSubtitle', 'Gérez les tiers de votre organisation')}
        className={styles.header}
      >
        <div className="mb-6 flex justify-between items-center">
          <Button
            label={t('pages.globalSettings.addThirdParty', 'Ajouter un tiers')}
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
          <div className="w-64">
            <Dropdown
              options={typeTiersOptions}
              value={selectedTypeTiers}
              onChange={handleTypeChange}
              label={t('pages.globalSettings.allThirdPartyTypes', 'Tous les types de tiers')}
              size="sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">{t('messages.loadingThirdParties', 'Chargement des tiers...')}</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredTiers}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle={t('messages.noThirdParties', 'Aucun tiers')}
            emptyMessage={t('messages.noThirdPartiesCreated', 'Aucun tiers n\'a été créé pour le moment.')}
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