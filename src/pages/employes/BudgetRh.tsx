import React, { useEffect, useState } from 'react';
import { useMenu } from '../../context/MenuContext';
import { useProfil } from '../../context/ProfilContext';
import { menuItemsGestionRH } from '../../config/menuConfig';
import { PageSection } from '../../components/ui/page-section';
import { Button } from '../../components/ui/button';
import { Dropdown, DropdownOption } from '../../components/ui/dropdown';
import { ToastContainer, ToastData } from '../../components/ui/toast';
import { BudgetTableRH } from '../../components/employes/BudgetRH/BudgetTableRH';
import { BudgetRHExportButtons } from '../../components/employes/BudgetRH/BudgetRHExportButtons';
import { useBudgetRHCalculations } from '../../hooks/employes/useBudgetRHCalculations';
import styles from './styles.module.css';

const BudgetRh: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [entites, setEntites] = useState<{id: string, code: string, libelle: string}[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedEntiteId, setSelectedEntiteId] = useState<string>('');
  const [showBudget, setShowBudget] = useState(false);
  
  const {
    budgetData,
    loading: calculationLoading,
    error: calculationError,
    calculateBudget
  } = useBudgetRHCalculations();

  // Configurer le menu
  useEffect(() => {
    setMenuItems(menuItemsGestionRH);
  }, [setMenuItems]);

  // Charger les entités
  useEffect(() => {
    const fetchEntites = async () => {
      if (!profil?.com_contrat_client_id) return;
      
      try {
        const { data, error } = await supabase
          .from('com_entite')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true)
          .order('libelle');
          
        if (error) throw error;
        setEntites(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des entités:', error);
        addToast({
          label: 'Erreur lors du chargement des entités',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };
    
    if (!profilLoading) {
      fetchEntites();
    }
  }, [profilLoading, profil?.com_contrat_client_id]);

  // Gestion des toasts
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

  // Gestionnaire pour le changement d'année
  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  // Gestionnaire pour le changement d'entité
  const handleEntiteChange = (value: string) => {
    setSelectedEntiteId(value);
  };

  // Gestionnaire pour afficher le budget
  const handleShowBudget = () => {
    setShowBudget(true);
    calculateBudget(parseInt(selectedYear), selectedEntiteId || null);
  };

  // Générer les options pour les années (année courante - 2 à année courante + 2)
  const currentYear = new Date().getFullYear();
  const yearOptions: DropdownOption[] = Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - 2 + i).toString(),
    label: (currentYear - 2 + i).toString()
  }));

  // Générer les options pour les entités
  const entiteOptions: DropdownOption[] = [
    { value: '', label: 'Tous les restaurants' },
    ...entites.map(entite => ({
      value: entite.id,
      label: `${entite.code} - ${entite.libelle}`
    }))
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title="Budget Prévisionnel RH"
        description="Visualisez le budget prévisionnel RH calculé en temps réel à partir des données existantes"
        className={styles.header}
      >
        <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Filtres</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année
              </label>
              <Dropdown
                options={yearOptions}
                value={selectedYear}
                onChange={handleYearChange}
                label="Sélectionner une année"
                size="sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant
              </label>
              <Dropdown
                options={entiteOptions}
                value={selectedEntiteId}
                onChange={handleEntiteChange}
                label="Tous les restaurants"
                size="sm"
              />
            </div>
            
            <div className="flex items-end">
              <Button
                label={calculationLoading ? "Calcul en cours..." : "Afficher le Budget"}
                icon="Calculator"
                color="var(--color-primary)"
                onClick={handleShowBudget}
                disabled={calculationLoading}
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Le budget est calculé dynamiquement à partir des données RH existantes (contrats, affectations, historique financier).</p>
            <p>Les charges patronales et salariales sont calculées selon les paramètres définis dans les paramètres généraux RH.</p>
          </div>
        </div>
        
        {calculationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Erreur lors du calcul du budget</p>
            <p>{calculationError}</p>
          </div>
        )}
        
        {showBudget && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Budget RH {selectedYear}
                {selectedEntiteId ? ` - ${entites.find(e => e.id === selectedEntiteId)?.libelle || ''}` : ' - Tous les restaurants'}
              </h2>
              
              <BudgetRHExportButtons 
                data={budgetData} 
                year={selectedYear}
                entiteName={selectedEntiteId ? entites.find(e => e.id === selectedEntiteId)?.libelle || '' : 'Tous les restaurants'}
              />
            </div>
            
            {calculationLoading ? (
              <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Calcul du budget en cours...</p>
                  <p className="text-sm text-gray-500 mt-2">Cette opération peut prendre quelques instants</p>
                </div>
              </div>
            ) : budgetData.length === 0 ? (
              <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-center p-6">
                  <p className="text-gray-600 mb-2">Aucune donnée de budget disponible</p>
                  <p className="text-gray-500 text-sm">Vérifiez que des employés avec des contrats et des historiques financiers existent pour cette période</p>
                </div>
              </div>
            ) : (
              <BudgetTableRH data={budgetData} year={parseInt(selectedYear)} />
            )}
          </>
        )}
        
        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default BudgetRh;