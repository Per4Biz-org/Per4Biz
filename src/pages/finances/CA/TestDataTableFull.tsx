import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { menuItemsGestionFinanciere } from '../../../config/menuConfig';
import { supabase } from '../../../lib/supabase';
import { PageSection } from '../../../components/ui/page-section';
import { DataTableFull, Column } from '../../../components/ui/data-table-full';
import { DataTableCascade, Column as CascadeColumn } from '../../../components/ui/data-table-cascade';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import styles from '../styles.module.css';

// Types pour les données de test
interface MotherData {
  id: string;
  entite: string;
  annee: number;
  mois: number;
  categorie: string;
  type: string;
  montant_ht: number;
  montant_ttc: number;
}

interface ChildData {
  id: string;
  mother_id: string;
  service: string;
  sous_categorie: string;
  jours_ouverts: number | null;
  couverts: number | null;
  prix_moyen: number | null;
  montant_ht: number;
  montant_ttc: number;
}

// Types pour les données réelles de la base de données
interface BudgetMensuel {
  id: number;
  id_entite: string;
  annee: number;
  mois: number;
  id_flux_categorie: string;
  montant_ht: number;
  montant_ttc: number;
  nb_jours_ouverts: number | null;
  nb_couverts: number | null;
  prix_moyen_couvert: number | null;
  commentaire: string | null;
  created_at: string;
  entite: {
    code: string;
    libelle: string;
  };
  categorie: {
    code: string;
    libelle: string;
    type_flux: string;
  };
}

interface BudgetMensuelDetail {
  id: number;
  id_ca_budget_mensuel: number;
  id_type_service: string;
  id_flux_sous_categorie: string;
  montant_ht: number;
  montant_ttc: number;
  nb_couverts: number | null;
  prix_moyen_couvert: number | null;
  nb_jours_ouverts: number | null;
  commentaire: string | null;
  created_at: string;
  type_service: {
    code: string;
    libelle: string;
  };
  sous_categorie: {
    code: string;
    libelle: string;
  };
}

const TestDataTableFull: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRealData, setLoadingRealData] = useState(true);

  // Données de test pour la démonstration
  const [motherData, setMotherData] = useState<MotherData[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetMensuel[]>([]);

  useEffect(() => {
    setMenuItems(menuItemsGestionFinanciere);
    
    // Simuler un chargement de données
    setTimeout(() => {
      setMotherData(generateTestData());
      setLoading(false);
    }, 1000);
    
    // Charger les vraies données de la base de données
    if (!profilLoading && profil?.com_contrat_client_id) {
      fetchBudgetData();
    }
  }, [setMenuItems]);

  // Fonction pour charger les données réelles de la base de données
  const fetchBudgetData = async () => {
    try {
      if (!profil?.com_contrat_client_id) {
        setBudgetData([]);
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
      setBudgetData(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des budgets:', error);
      addToast({
        label: 'Erreur lors de la récupération des budgets',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoadingRealData(false);
    }
  };

  // Fonction pour charger les détails d'un budget
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

  // Fonction pour générer des données de test
  const generateTestData = (): MotherData[] => {
    const entites = ['Restaurant Paris', 'Restaurant Lyon', 'Restaurant Marseille'];
    const categories = [
      { nom: 'Ventes Nourriture', type: 'produit' },
      { nom: 'Ventes Boissons', type: 'produit' },
      { nom: 'Achats Matières', type: 'charge' },
      { nom: 'Frais Personnel', type: 'charge' }
    ];
    
    const data: MotherData[] = [];
    
    // Générer des données pour 3 entités, 2 mois, 4 catégories
    entites.forEach((entite, entiteIndex) => {
      for (let mois = 1; mois <= 2; mois++) {
        categories.forEach((categorie, catIndex) => {
          const baseAmount = 10000 + (entiteIndex * 5000) + (mois * 1000) + (catIndex * 500);
          const montantHt = baseAmount * (Math.random() * 0.4 + 0.8); // Variation aléatoire
          const montantTtc = montantHt * 1.2; // TVA 20%
          
          data.push({
            id: `${entiteIndex}-${mois}-${catIndex}`,
            entite,
            annee: 2024,
            mois,
            categorie: categorie.nom,
            type: categorie.type,
            montant_ht: Math.round(montantHt * 100) / 100,
            montant_ttc: Math.round(montantTtc * 100) / 100
          });
        });
      }
    });
    
    return data;
  };

  // Fonction pour charger les données enfants (simulée)
  const loadChildData = async (row: MotherData): Promise<ChildData[]> => {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const services = ['Petit-déjeuner', 'Déjeuner', 'Dîner'];
    const sousCategories = [
      'Entrées', 'Plats', 'Desserts', 'Boissons chaudes', 'Boissons froides'
    ];
    
    // Nombre aléatoire d'enfants entre 2 et 5
    const childCount = Math.floor(Math.random() * 4) + 2;
    const children: ChildData[] = [];
    
    // Générer des données enfants aléatoires
    for (let i = 0; i < childCount; i++) {
      const service = services[i % services.length];
      const sousCategorie = sousCategories[Math.floor(Math.random() * sousCategories.length)];
      const joursOuverts = Math.floor(Math.random() * 10) + 20; // 20-30 jours
      const couverts = Math.floor(Math.random() * 500) + 500; // 500-1000 couverts
      const prixMoyen = Math.floor(Math.random() * 20) + 10; // 10-30€
      
      // Répartir le montant total entre les enfants
      const ratio = 1 / childCount + (Math.random() * 0.2 - 0.1); // Variation aléatoire
      const montantHt = row.montant_ht * ratio;
      const montantTtc = row.montant_ttc * ratio;
      
      children.push({
        id: `${row.id}-child-${i}`,
        mother_id: row.id,
        service,
        sous_categorie: sousCategorie,
        jours_ouverts: joursOuverts,
        couverts: couverts,
        prix_moyen: prixMoyen,
        montant_ht: Math.round(montantHt * 100) / 100,
        montant_ttc: Math.round(montantTtc * 100) / 100
      });
    }
    
    return children;
  };

  const getMonthName = (monthNumber: number): string => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1] || monthNumber.toString();
  };

  const motherColumns: Column<MotherData>[] = [
    {
      label: 'Entité',
      accessor: 'entite',
      sortable: true
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
      label: 'Catégorie',
      accessor: 'categorie',
      sortable: true
    },
    {
      label: 'Type',
      accessor: 'type',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'produit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 'produit' ? 'Produit' : 'Charge'}
        </span>
      )
    },
    {
      label: 'Montant HT',
      accessor: 'montant_ht',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'Montant TTC',
      accessor: 'montant_ttc',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)} €`
    }
  ];

  const childColumns: Column<ChildData>[] = [
    {
      label: 'Service',
      accessor: 'service'
    },
    {
      label: 'Sous-catégorie',
      accessor: 'sous_categorie'
    },
    {
      label: 'Montant HT',
      accessor: 'montant_ht',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'Montant TTC',
      accessor: 'montant_ttc',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'Jours ouverts',
      accessor: 'jours_ouverts',
      align: 'center',
      render: (value) => value ? `${value} jours` : '-'
    },
    {
      label: 'Couverts',
      accessor: 'couverts',
      align: 'center',
      render: (value) => value ? value.toString() : '-'
    },
    {
      label: 'Prix moyen',
      accessor: 'prix_moyen',
      align: 'right',
      render: (value) => value ? `${Number(value).toFixed(2)} €` : '-'
    }
  ];

  // Colonnes pour le tableau DataTableCascade avec les vraies données
  const budgetColumns: CascadeColumn<BudgetMensuel>[] = [
    {
      label: 'Entité',
      accessor: 'entite',
      sortable: true,
      render: (value) => value.code
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
      label: 'Catégorie',
      accessor: 'categorie',
      sortable: true,
      render: (value) => value.code
    },
    {
      label: 'Type',
      accessor: 'categorie',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value.type_flux === 'produit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value.type_flux === 'produit' ? 'Produit' : 'Charge'}
        </span>
      )
    },
    {
      label: 'Montant HT',
      accessor: 'montant_ht',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'Montant TTC',
      accessor: 'montant_ttc',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)} €`
    }
  ];

  const budgetDetailColumns: CascadeColumn<BudgetMensuelDetail>[] = [
    {
      label: 'Type de service',
      accessor: 'type_service',
      render: (value) => value.code
    },
    {
      label: 'Sous-catégorie',
      accessor: 'sous_categorie',
      render: (value) => value.code
    },
    {
      label: 'Montant HT',
      accessor: 'montant_ht',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'Montant TTC',
      accessor: 'montant_ttc',
      align: 'right',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'Jours ouverts',
      accessor: 'nb_jours_ouverts',
      align: 'center',
      render: (value) => value ? `${value} jour${value > 1 ? 's' : ''}` : '-'
    },
    {
      label: 'Couverts',
      accessor: 'nb_couverts',
      align: 'center',
      render: (value) => value ? value.toString() : '-'
    },
    {
      label: 'Prix moyen',
      accessor: 'prix_moyen_couvert',
      align: 'right',
      render: (value) => value ? `${Number(value).toFixed(2)} €` : '-'
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={loading || profilLoading ? "Chargement..." : "Test DataTableFull"}
        description="Page de démonstration du composant DataTableFull avec toutes ses options"
        className={styles.header}
      >
        <div className="mb-4 text-sm text-gray-600">
          Cette page permet de tester les différentes options du composant DataTableFull.
          Utilisez les toggles au-dessus du tableau pour activer/désactiver les fonctionnalités.
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des données de test...</p>
          </div>
        ) : (
          <DataTableFull
            motherColumns={motherColumns}
            childColumns={childColumns}
            data={motherData}
            loadChildren={loadChildData}
            defaultRowsPerPage={10}
            emptyTitle="Aucune donnée"
            emptyMessage="Aucune donnée de test n'a été générée."
            duplicateMotherRowsForExport={false}
            showSubtotals={true}
            showInlineSubtotals={true}
          />
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
      
      <PageSection
        title="Test DataTableCascade avec données réelles"
        description="Démonstration du composant DataTableCascade avec les tables ca_budget_mensuel et ca_budget_mensuel_detail"
        className="mt-8"
      >
        <div className="mb-4 text-sm text-gray-600">
          Ce tableau utilise le composant DataTableCascade pour afficher les données réelles de la base de données.
          Cliquez sur une ligne pour afficher ses détails.
        </div>

        {loadingRealData ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Chargement des données réelles...</p>
          </div>
        ) : (
          <DataTableCascade
            columns={budgetColumns}
            data={budgetData}
            childColumns={budgetDetailColumns}
            loadChildren={loadBudgetDetails}
            defaultRowsPerPage={10}
            emptyTitle="Aucun budget"
            emptyMessage="Aucun budget n'a été créé pour le moment."
          />
        )}
      </PageSection>
    </div>
  );
};

export default TestDataTableFull;