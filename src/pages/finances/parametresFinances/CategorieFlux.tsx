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
import { CategorieFluxForm } from '../../../components/ParametreFinances/CategorieFlux/CategorieFluxForm';
import styles from './styles.module.css';

interface CategorieFlux {
  id: string;
  code: string;
  libelle: string;
  type_flux: 'produit' | 'charge';
  nature_flux_id: string;
  id_entite: string;
  description: string | null;
  couleur: string | null;
  ordre_affichage: number;
  actif: boolean;
  created_at: string;
  entite: {
    code: string;
    libelle: string;
  };
  nature_flux: {
    code: string;
    libelle: string;
  };
}

const CategorieFlux: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [categoriesFlux, setCategoriesFlux] = useState<CategorieFlux[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategorie, setSelectedCategorie] = useState<CategorieFlux | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategoriesFlux = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setCategoriesFlux([]);
        return;
      }

      const { data, error } = await supabase
        .from('fin_flux_categorie')
        .select(`
          *,
          entite:id_entite (
            code,
            libelle
          ),
          nature_flux:nature_flux_id (
            code,
            libelle
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('ordre_affichage')
        .order('code');

      if (error) throw error;
      setCategoriesFlux(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories de flux:', error);
      addToast({
        label: 'Erreur lors de la récupération des catégories de flux',
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
      fetchCategoriesFlux();
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
      
      if (selectedCategorie) {
        // Mode édition
        const updateData = {
          code: formData.code,
          libelle: formData.libelle,
          type_flux: formData.type_flux,
          nature_flux_id: formData.nature_flux_id,
          id_entite: formData.id_entite,
          description: formData.description || null,
          couleur: formData.couleur || null,
          ordre_affichage: formData.ordre_affichage,
          actif: formData.actif,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: updateError } = await supabase
          .from('fin_flux_categorie')
          .update(updateData)
          .eq('id', selectedCategorie.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          libelle: formData.libelle,
          type_flux: formData.type_flux,
          nature_flux_id: formData.nature_flux_id,
          id_entite: formData.id_entite,
          description: formData.description || null,
          couleur: formData.couleur || null,
          ordre_affichage: formData.ordre_affichage,
          actif: formData.actif,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('fin_flux_categorie')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchCategoriesFlux();
      setIsModalOpen(false);
      setSelectedCategorie(null);
      addToast({
        label: `Catégorie de flux ${selectedCategorie ? 'modifiée' : 'créée'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        label: `Erreur lors de la ${selectedCategorie ? 'modification' : 'création'} de la catégorie de flux`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (categorie: CategorieFlux) => {
    setSelectedCategorie(categorie);
    setIsModalOpen(true);
  };

  const handleDelete = async (categorie: CategorieFlux) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie de flux "${categorie.libelle}" ?`)) {
      try {
        const { error } = await supabase
          .from('fin_flux_categorie')
          .delete()
          .eq('id', categorie.id);

        if (error) throw error;

        await fetchCategoriesFlux();
        addToast({
          label: `La catégorie de flux "${categorie.libelle}" a été supprimée avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addToast({
          label: 'Erreur lors de la suppression de la catégorie de flux',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const columns: Column<CategorieFlux>[] = [
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
      label: 'Type',
      accessor: 'type_flux',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'produit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 'produit' ? 'Produit' : 'Charge'}
        </span>
      )
    },
    {
      label: 'Nature de flux',
      accessor: 'nature_flux',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: 'Couleur',
      accessor: 'couleur',
      align: 'center',
      render: (value) => value ? (
        <div 
          className="w-6 h-6 rounded-full border border-gray-300 mx-auto"
          style={{ backgroundColor: value }}
          title={value}
        />
      ) : '-'
    },
    {
      label: 'Ordre',
      accessor: 'ordre_affichage',
      align: 'center'
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
        title={loading || profilLoading ? "Chargement..." : "Catégories de Flux"}
        description="Gérez les catégories de flux financiers de votre organisation"
        className={styles.header}
      >
        <div className="mb-6">
          <Button
            label="Créer une catégorie de flux"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des catégories de flux...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={categoriesFlux}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucune catégorie de flux"
            emptyMessage="Aucune catégorie de flux n'a été créée pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedCategorie ? 'Modifier une catégorie de flux' : 'Créer une catégorie de flux'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedCategorie(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CategorieFluxForm
                initialData={selectedCategorie ? {
                  code: selectedCategorie.code,
                  libelle: selectedCategorie.libelle,
                  type_flux: selectedCategorie.type_flux,
                  nature_flux_id: selectedCategorie.nature_flux_id || '',
                  id_entite: selectedCategorie.id_entite || '',
                  description: selectedCategorie.description || '',
                  couleur: selectedCategorie.couleur || '',
                  ordre_affichage: selectedCategorie.ordre_affichage,
                  actif: selectedCategorie.actif
                } : undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsModalOpen(false);
                  setSelectedCategorie(null);
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

export default CategorieFlux;