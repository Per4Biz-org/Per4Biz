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
import { Dropdown, DropdownOption } from '../../../components/ui/dropdown';
import { SousCategorieFluxForm } from '../../../components/ParametreFinances/SousCategorieFlux/SousCategorieFluxForm';
import styles from './styles.module.css';

interface SousCategorieFlux {
  id: string;
  code: string;
  libelle: string;
  id_categorie: string;
  description: string | null;
  ordre_affichage: number;
  actif: boolean;
  created_at: string;
  categorie: {
    code: string;
    libelle: string;
    entite: {
      code: string;
      libelle: string;
    };
  };
}

const SousCategorieFlux: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [sousCategoriesFlux, setSousCategoriesFlux] = useState<SousCategorieFlux[]>([]);
  const [categoriesFlux, setCategoriesFlux] = useState<{id: string, code: string, libelle: string}[]>([]);
  const [filteredSousCategoriesFlux, setFilteredSousCategoriesFlux] = useState<SousCategorieFlux[]>([]);
  const [selectedCategorieFlux, setSelectedCategorieFlux] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSousCategorie, setSelectedSousCategorie] = useState<SousCategorieFlux | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSousCategoriesFlux = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setSousCategoriesFlux([]);
        return;
      }

      const { data, error } = await supabase
        .from('fin_flux_sous_categorie')
        .select(`
          *,
          categorie:id_categorie (
            code,
            libelle,
            id_entite,
            entite:id_entite (
              code,
              libelle
            )
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('ordre_affichage')
        .order('code');

      if (error) throw error;
      setSousCategoriesFlux(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des sous-catégories de flux:', error);
      addToast({
        label: 'Erreur lors de la récupération des sous-catégories de flux',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesFlux = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setCategoriesFlux([]);
        return;
      }

      const { data, error } = await supabase
        .from('fin_flux_categorie')
        .select('id, code, libelle')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('actif', true)
        .order('code');

      if (error) throw error;
      setCategoriesFlux(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories de flux:', error);
    }
  };

  useEffect(() => {
    setMenuItems(menuItemsParamGestionFinanciere);
    if (!profilLoading) {
      fetchSousCategoriesFlux();
      fetchCategoriesFlux();
    }
  }, [setMenuItems, profilLoading, profil?.com_contrat_client_id]);

  // Filtrer les sous-catégories lorsque la catégorie sélectionnée change
  useEffect(() => {
    if (!selectedCategorieFlux) {
      // Si aucune catégorie n'est sélectionnée, afficher toutes les sous-catégories
      setFilteredSousCategoriesFlux(sousCategoriesFlux);
    } else {
      // Filtrer les sous-catégories par catégorie
      const filtered = sousCategoriesFlux.filter(sousCategorie => 
        sousCategorie.id_categorie === selectedCategorieFlux
      );
      setFilteredSousCategoriesFlux(filtered);
    }
  }, [selectedCategorieFlux, sousCategoriesFlux]);

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
      
      if (selectedSousCategorie) {
        // Mode édition
        const updateData = {
          code: formData.code,
          libelle: formData.libelle,
          id_categorie: formData.id_categorie,
          description: formData.description || null,
          ordre_affichage: formData.ordre_affichage,
          actif: formData.actif,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: updateError } = await supabase
          .from('fin_flux_sous_categorie')
          .update(updateData)
          .eq('id', selectedSousCategorie.id);
        error = updateError;
      } else {
        // Mode création
        const insertData = {
          code: formData.code,
          libelle: formData.libelle,
          id_categorie: formData.id_categorie,
          description: formData.description || null,
          ordre_affichage: formData.ordre_affichage,
          actif: formData.actif,
          com_contrat_client_id: profil.com_contrat_client_id
        };

        const { error: insertError } = await supabase
          .from('fin_flux_sous_categorie')
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      await fetchSousCategoriesFlux();
      setIsModalOpen(false);
      setSelectedSousCategorie(null);
      addToast({
        label: `Sous-catégorie de flux ${selectedSousCategorie ? 'modifiée' : 'créée'} avec succès`,
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        label: `Erreur lors de la ${selectedSousCategorie ? 'modification' : 'création'} de la sous-catégorie de flux`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (sousCategorie: SousCategorieFlux) => {
    setSelectedSousCategorie(sousCategorie);
    setIsModalOpen(true);
  };

  const handleDelete = async (sousCategorie: SousCategorieFlux) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la sous-catégorie de flux "${sousCategorie.libelle}" ? Cette action est irréversible et peut échouer si la sous-catégorie est utilisée dans des factures.`)) {
      try {
        const { error } = await supabase
          .from('fin_flux_sous_categorie')
          .delete()
          .eq('id', sousCategorie.id);

        if (error) throw error;

        await fetchSousCategoriesFlux();
        addToast({
          label: `La sous-catégorie de flux "${sousCategorie.libelle}" a été supprimée avec succès`,
          icon: 'Check',
          color: '#22c55e'
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        
        // Message d'erreur spécifique pour les contraintes de clé étrangère
        let errorMessage = 'Erreur lors de la suppression de la sous-catégorie de flux';
        
        if (error.message?.includes('foreign key constraint') || 
            error.message?.includes('violates foreign key constraint')) {
          errorMessage = 'Impossible de supprimer cette sous-catégorie car elle est utilisée dans des factures ou d\'autres éléments. Veuillez la désactiver plutôt que la supprimer.';
        }
        
        addToast({
          label: errorMessage,
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    }
  };

  const handleCategorieFluxChange = (value: string) => {
    setSelectedCategorieFlux(value);
  };

  // Préparer les options pour le dropdown des catégories de flux
  const categorieFluxOptions: DropdownOption[] = [
    { value: '', label: 'Toutes les catégories de flux' },
    ...categoriesFlux.map(categorie => ({
      value: categorie.id,
      label: `${categorie.code} - ${categorie.libelle}`
    }))
  ];

  const columns: Column<SousCategorieFlux>[] = [
    {
      label: 'Entité',
      accessor: 'categorie',
      render: (value) => value.entite ? `${value.entite.code} - ${value.entite.libelle}` : 'Global (toutes les entités)'
    },
    {
      label: 'Catégorie de flux',
      accessor: 'categorie',
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
        title={loading || profilLoading ? "Chargement..." : "Sous-Catégories de Flux"}
        description="Gérez les sous-catégories de flux financiers de votre organisation"
        className={styles.header}
      >
        <div className="mb-6 flex justify-between items-center">
          <Button
            label="Ajouter une sous-catégorie"
            icon="Plus"
            color="var(--color-primary)"
            onClick={() => setIsModalOpen(true)}
          />
          <div className="w-64">
            <Dropdown
              options={categorieFluxOptions}
              value={selectedCategorieFlux}
              onChange={handleCategorieFluxChange}
              label="Toutes les catégories de flux"
              size="sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des sous-catégories de flux...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredSousCategoriesFlux}
            actions={actions}
            defaultRowsPerPage={10}
            emptyTitle="Aucune sous-catégorie de flux"
            emptyMessage="Aucune sous-catégorie de flux n'a été créée pour le moment."
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedSousCategorie ? 'Modifier une sous-catégorie de flux' : 'Ajouter une sous-catégorie de flux'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedSousCategorie(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SousCategorieFluxForm
                initialData={selectedSousCategorie ? {
                  code: selectedSousCategorie.code,
                  libelle: selectedSousCategorie.libelle,
                  id_categorie: selectedSousCategorie.id_categorie,
                  id_entite: selectedSousCategorie.categorie?.id_entite || null,
                  description: selectedSousCategorie.description || '',
                  ordre_affichage: selectedSousCategorie.ordre_affichage,
                  actif: selectedSousCategorie.actif
                } : undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsModalOpen(false);
                  setSelectedSousCategorie(null);
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

export default SousCategorieFlux;