import React, { useEffect, useState, useCallback } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsGestionFinanciere } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { DataTableFull } from '../../../components/ui/data-table-full';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { SuiviCABudgetForm } from '../../../components/finances/CA/SuiviCABudgetForm';
import { Button } from '../../../components/ui/button';
import { FilterSection } from '../../../components/filters/FilterSection';
import { 
  BudgetMensuel, 
  BudgetMensuelDetail, 
  getBudgetMotherColumns, 
  getBudgetChildColumns, 
  getMonthName 
} from '../../../utils/budgetTableColumns';
import styles from '../styles.module.css';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

const SuiviCABudget: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [budgets, setBudgets] = useState<BudgetMensuel[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<BudgetMensuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [filters, setFilters] = useState({
    entite: '',
    annee: new Date().getFullYear().toString(),
    mois: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Générer les années disponibles (année courante - 2 à année courante + 2)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
  }, [setMenuItems]);

  // Gestion des toasts avec useCallback
  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: Date.now().toString(),
    };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Récupération des budgets avec useCallback
  const fetchBudgets = useCallback(async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setBudgets([]);
        return;
      }

      const { data, error } = await supabase
        .from('ca_budget_mensuel')
        .select(`
          *,
          entite:id_entite (
            code,
            libelle
          ),
          categorie:id_flux_categorie (
            code,
            libelle,
            type_flux
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des budgets:', error);
      addToast({
        label: 'Erreur lors de la récupération des budgets',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  }, [profil?.com_contrat_client_id, addToast]);

  // Récupération des entités
  useEffect(() => {
    const fetchEntites = async () => {
      try {
        if (!profil?.com_contrat_client_id) {
          setEntites([]);
          return;
        }

        const { data, error } = await supabase
          .from('com_entite')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');

        if (error) throw error;
        setEntites(data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des entités:', error);
        addToast({
          label: 'Erreur lors de la récupération des entités',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };

    if (!profilLoading && profil?.com_contrat_client_id) {
      fetchEntites();
    }
  }, [profilLoading, profil?.com_contrat_client_id, addToast]);

  // Récupération des budgets
  useEffect(() => {
    if (!profilLoading && profil?.com_contrat_client_id) {
      fetchBudgets();
    }
  }, [profilLoading, profil?.com_contrat_client_id, fetchBudgets]);

  // Application des filtres
  useEffect(() => {
    applyFilters();
  }, [budgets, filters]);

  const applyFilters = () => {
    let filtered = [...budgets];

    // Filtre par entité
    if (filters.entite) {
      filtered = filtered.filter(budget => budget.entite.code === filters.entite);
    }

    // Filtre par année
    if (filters.annee) {
      filtered = filtered.filter(budget => budget.annee.toString() === filters.annee);
    }

    // Filtre par mois
    if (filters.mois) {
      filtered = filtered.filter(budget => budget.mois.toString() === filters.mois);
    }

    setFilteredBudgets(filtered);
  };

  const handleFilterChange = (updatedFilters: { [key: string]: any }) => {
    setFilters(updatedFilters);
  };

  // Chargement des détails du budget
  const loadBudgetDetails = async (budget: BudgetMensuel): Promise<BudgetMensuelDetail[]> => {
    try {
      const { data, error } = await supabase
        .from('ca_budget_mensuel_detail')
        .select(`
          *,
          type_service:id_type_service (
            code,
            libelle
          ),
          sous_categorie:id_flux_sous_categorie (
            code,
            libelle
          )
        `)
        .eq('id_ca_budget_mensuel', budget.id)
        .order('id_type_service');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du budget:', error);
      addToast({
        label: 'Erreur lors de la récupération des détails du budget',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return [];
    }
  };

  // Configuration des filtres
  const filterConfigs = [
    {
      name: 'entite',
      label: 'Entité',
      type: 'select' as const,
      options: entites.map(entite => entite.code)
    },
    {
      name: 'annee',
      label: 'Année',
      type: 'select' as const,
      options: availableYears
    },
    {
      name: 'mois',
      label: 'Mois',
      type: 'select' as const,
      options: Array.from({ length: 12 }, (_, i) => (i + 1).toString())
    }
  ];

  // Utilisation des colonnes définies dans l'utilitaire
  const motherColumns = getBudgetMotherColumns();
  const childColumns = getBudgetChildColumns();

  // Gestionnaire pour ouvrir la modale d'ajout de ligne
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Gestionnaire pour fermer la modale
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // Gestionnaire pour soumettre le formulaire avec useCallback
  const handleSubmitBudget = useCallback(async (budgetData: any, detailsData: any[]) => {
    setIsSubmitting(true);
    try {
      if (!profil?.com_contrat_client_id) {
        throw new Error('Aucun contrat client associé au profil');
      }

      // 1. Créer le budget mensuel
      const { data: budgetInserted, error: budgetError } = await supabase
        .from('ca_budget_mensuel')
        .insert({
          ...budgetData,
          com_contrat_client_id: profil.com_contrat_client_id
        })
        .select()
        .single();

      if (budgetError) throw budgetError;
      if (!budgetInserted) throw new Error('Erreur lors de la création du budget');

      // 2. Créer les détails du budget
      const detailsToInsert = detailsData.map(detail => ({
        ...detail,
        id_ca_budget_mensuel: budgetInserted.id,
        com_contrat_client_id: profil.com_contrat_client_id
      }));

      const { error: detailsError } = await supabase
        .from('ca_budget_mensuel_detail')
        .insert(detailsToInsert);

      if (detailsError) throw detailsError;

      // 3. Rafraîchir les données et fermer la modale
      await fetchBudgets();
      setIsModalOpen(false);
      
      addToast({
        label: 'Budget créé avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error: any) {
      console.error('Erreur lors de la création du budget:', error);
      
      let errorMessage = 'Erreur lors de la création du budget';
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        errorMessage = 'Un budget existe déjà pour cette entité, cette catégorie, ce mois et cette année';
      }
      
      addToast({
        label: errorMessage,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [profil?.com_contrat_client_id, fetchBudgets, addToast]);
  
  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? "Chargement..." : "Suivi CA Budget"}
        description="Suivez et analysez vos budgets de chiffre d'affaires par entité et période"
        className={styles.header}
      >
        <div className="mb-4 flex gap-3">
          <Button
            label="Ajouter une ligne"
            icon="Plus"
            color="var(--color-primary)"
            onClick={handleOpenModal}
          />
          <Button
            label="Saisir en ligne"
            icon="Edit"
            color="var(--color-secondary)"
            onClick={() => {}}
          />
        </div>

        <FilterSection
          filters={filterConfigs}
          values={filters}
          onChange={handleFilterChange}
          className="mb-6"
        />
        
        <div className="text-sm text-gray-600 mb-4">
          {filteredBudgets.length} budget(s) affiché(s) sur {budgets.length} au total
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des budgets...</p>
          </div>
        ) : (
          <DataTableFull
            motherColumns={motherColumns}
            childColumns={childColumns}
            className="overflow-x-auto"
            data={filteredBudgets}
            loadChildren={loadBudgetDetails}
            defaultRowsPerPage={10}
            emptyTitle="Aucun budget"
            emptyMessage="Aucun budget n'a été créé pour le moment."
            duplicateMotherRowsForExport={false}
            showSubtotals={true}
            showInlineSubtotals={false}
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />

        {/* Modale d'ajout de ligne de budget */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ajouter une ligne de budget</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 mb-6">
                <SuiviCABudgetForm
                  onSubmit={handleSubmitBudget}
                  onCancel={handleCloseModal}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}
      </PageSection>
    </div>
  );
};

export default SuiviCABudget;