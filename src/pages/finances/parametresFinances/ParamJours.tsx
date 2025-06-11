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
import { ParamJoursFormModal } from '../../../components/ParametreFinances/ParamJoursFormModal';
import styles from './styles.module.css';

interface ParamJours {
  id: number;
  annee: number;
  mois: number;
  nb_jours_ouverts: number;
  taux_mp_prevu: number | null;
  commentaire: string | null;
  created_at: string;
  id_entite: string;
  entite: {
    code: string;
    libelle: string;
  };
}

const ParamJours: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [parametres, setParametres] = useState<ParamJours[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParam, setSelectedParam] = useState<ParamJours | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchParametres = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setParametres([]);
        return;
      }

      const { data, error } = await supabase
        .from('ca_param_jours_ouverture')
        .select(`
          *,
          entite:id_entite (
            code,
            libelle
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false });

      if (error) throw error;
      setParametres(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      addToast({
        label: 'Erreur lors de la récupération des paramètres de jours',
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
      fetchParametres();
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
      
      if (selectedParam) {
        // Mode édition
        const updateData = {
          annee: formData.annee,
          mois: formData.mois,
          nb_jours_ouverts: formData.nb_jours_ouverts,
          taux_mp_prevu: formData.taux_mp_prevu || null,
          commentaire: formData.commentaire || null,
          id_entite: formData.id_entite,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: updateError } = await supabase
          .from('ca_param_jours_ouverture')
          .update(updateData)
          .eq('id', selectedParam.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          annee: formData.annee,
          mois: formData.mois,
          nb_jours_ouverts: formData.nb_jours_ouverts,
          taux_mp_prevu: formData.taux_mp_prevu || null,
          commentaire: formData.commentaire || null,
          id_entite: formData.id_entite,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('ca_param_jours_ouverture')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchParametres();
      setIsModalOpen(false);
      setSelectedParam(null);
      addToast({
        label: `Paramètre ${selectedParam ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        label: `Erreur lors de la ${selectedParam ? 'modification' : 'création'} du paramètre`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (param: ParamJours) => {
    setSelectedParam(param);
    setIsModalOpen(true);
  };

  const handleDelete = async (param: ParamJours) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le paramètre pour ${getMonthName(param.mois)} ${param.annee} ?`)) {
      try {
        const { error } = await supabase
          .from('ca_param_jours_ouverture')
          .delete()
          .eq('id', param.id);

        if (error) throw error;

        await fetchParametres();
        addToast({
          label: `Le paramètre a été supprimé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la suppression du paramètre',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const getMonthName = (monthNumber: number): string => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1] || monthNumber.toString();
  };

  const columns: Column<ParamJours>[] = [
    {
      label: 'Entité',
      accessor: 'entite',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Année',
      accessor: 'annee',
      sortable: true,
      align: 'center'
    },
    {
      label: 'Mois',
      accessor: 'mois',
      sortable: true,
      render: (value) => getMonthName(value)
    },
    {
      label: 'Jours ouverts',
      accessor: 'nb_jours_ouverts',
      align: 'center',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {value} jour{value > 1 ? 's' : ''}
        </span>
      )
    },
    {
      label: 'Taux MP prévu (%)',
      accessor: 'taux_mp_prevu',
      align: 'center',
      render: (value) => value ? `${Number(value).toFixed(2)}%` : '-'
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
        title={loading || profilLoading ? "Chargement..." : "Paramètres Jours d'Ouverture"}
        description="Configurez les jours d'ouverture et les taux de matière première par entité et par mois"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Ajouter un paramètre"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des paramètres...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={parametres}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun paramètre"
            emptyMessage="Aucun paramètre de jours d'ouverture n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        <ParamJoursFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedParam(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedParam}
          isSubmitting={isSubmitting}
        />
      </PageSection>
    </div>
  );
};

export default ParamJours;