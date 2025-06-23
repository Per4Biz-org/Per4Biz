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
import { ImportFormatFormModal } from '../../../components/ParametreBanque/ImportFormatFormModal';
import styles from './styles.module.css';

interface FormatImport {
  id: number;
  code: string;
  libelle: string;
  banque: string;
  extension: string | null;
  encodage: string;
  separateur: string;
  premiere_ligne_donnees: number;
  colonnes: string[] | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

const ImportFormat: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [formats, setFormats] = useState<FormatImport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<FormatImport | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFormats = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setFormats([]);
        return;
      }

      const { data, error } = await supabase
        .from('bq_format_import')
        .select('*')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('banque')
        .order('code');

      if (error) throw error;
      setFormats(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des formats d\'import:', error);
      addToast({
        label: 'Erreur lors de la récupération des formats d\'import',
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
      fetchFormats();
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
      
      if (selectedFormat) {
        // Mode édition
        const updateData = {
          code: formData.code,
          libelle: formData.libelle,
          banque: formData.banque,
          extension: formData.extension || null,
          encodage: formData.encodage,
          separateur: formData.separateur,
          premiere_ligne_donnees: formData.premiere_ligne_donnees,
          colonnes: formData.colonnes,
          actif: formData.actif
        };

        const { error: updateError } = await supabase
          .from('bq_format_import')
          .update(updateData)
          .eq('id', selectedFormat.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          libelle: formData.libelle,
          banque: formData.banque,
          extension: formData.extension || null,
          encodage: formData.encodage,
          separateur: formData.separateur,
          premiere_ligne_donnees: formData.premiere_ligne_donnees,
          colonnes: formData.colonnes,
          actif: formData.actif,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('bq_format_import')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchFormats();
      setIsModalOpen(false);
      setSelectedFormat(null);
      addToast({
        label: `Format d'import ${selectedFormat ? 'modifié' : 'créé'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      let errorMessage = `Erreur lors de la ${selectedFormat ? 'modification' : 'création'} du format d'import`;
      
      // Gestion des erreurs de contrainte d'unicité
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        errorMessage = 'Ce code existe déjà. Veuillez utiliser un code unique.';
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

  const handleEdit = (format: FormatImport) => {
    setSelectedFormat(format);
    setIsModalOpen(true);
  };

  const handleDelete = async (format: FormatImport) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver le format d'import "${format.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('bq_format_import')
          .update({ actif: false })
          .eq('id', format.id);

        if (error) throw error;

        await fetchFormats();
        addToast({
          label: `Le format d'import "${format.libelle}" a été désactivé avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
        addToast({
          label: 'Erreur lors de la désactivation du format d\'import',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<FormatImport>[] = [
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
      label: 'Banque',
      accessor: 'banque',
      sortable: true
    },
    {
      label: 'Extension',
      accessor: 'extension',
      render: (value) => value || '-'
    },
    {
      label: 'Encodage',
      accessor: 'encodage'
    },
    {
      label: 'Séparateur',
      accessor: 'separateur',
      render: (value) => value === '\t' ? 'Tabulation' : value
    },
    {
      label: 'Première ligne',
      accessor: 'premiere_ligne_donnees',
      align: 'center'
    },
    {
      label: 'Colonnes',
      accessor: 'colonnes',
      render: (value) => {
        if (!value || value.length === 0) return 'Non définies';
        
        // Afficher les 3 premières colonnes suivies de "..."
        const displayedColumns = value.slice(0, 3).join(', ');
        return value.length > 3 
          ? `${displayedColumns}, ... (${value.length} colonnes)` 
          : `${displayedColumns} (${value.length} colonnes)`;
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
      label: 'Dernière modification',
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
      label: 'Désactiver',
      icon: 'delete',
      color: '#ef4444',
      onClick: handleDelete
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? "Chargement..." : "Formats d'Import"}
        description="Gérez les formats d'import pour vos relevés bancaires"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Ajouter un format d'import"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des formats d'import...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={formats}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucun format d'import"
            emptyMessage="Aucun format d'import n'a été créé pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        <ImportFormatFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFormat(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedFormat}
          isSubmitting={isSubmitting}
        />
      </PageSection>
    </div>
  );
};

export default ImportFormat;