import React, { useEffect, useState, useCallback } from 'react';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsGestionFinanciere } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { FilterSection } from '../../../components/filters/FilterSection';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import styles from '../styles.module.css';

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

const SuiviCAReel: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [filters, setFilters] = useState({
    entite: '',
    annee: new Date().getFullYear().toString()
  });
  
  // Générer les années disponibles (année courante - 2 à année courante + 2)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
  }, [setMenuItems]);

  // Gestion des toasts
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
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
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
      } finally {
        setLoading(false);
      }
    };

    if (!profilLoading && profil?.com_contrat_client_id) {
      fetchEntites();
    }
  }, [profilLoading, profil?.com_contrat_client_id, addToast]);

  const handleFilterChange = (updatedFilters: { [key: string]: any }) => {
    setFilters(updatedFilters);
  };

  // Configuration des filtres
  const filterConfigs = [
    {
      name: 'entite',
      label: 'Entité',
      type: 'select' as const,
      options: entites,
      isEntityOption: true
    },
    {
      name: 'annee',
      label: 'Année',
      type: 'select' as const,
      options: availableYears
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? "Chargement..." : "Suivi CA Réel"}
        description="Suivez et analysez votre chiffre d'affaires réel par entité et période"
        className={styles.header}
      >
        <FilterSection
          filters={filterConfigs}
          values={filters}
          onChange={handleFilterChange}
          className="mb-6"
        />
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des données...</p>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">
              Cette page est en cours de développement.
              <br />
              Filtres sélectionnés: Entité {filters.entite || "(Toutes)"}, Année {filters.annee}
            </p>
          </div>
        )}
        
        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default SuiviCAReel;