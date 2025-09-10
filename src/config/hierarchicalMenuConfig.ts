import { Home, User, Settings, Mail, FileText, Users, CreditCard, Landmark, ChevronDown, ChevronRight } from 'lucide-react';
import { FEATURES } from '@/config/features';

export interface MenuSection {
  id: string;
  label: string;
  icon?: any;
  expanded?: boolean;
  items?: MenuItem[];
  featureFlag?: keyof typeof FEATURES;
}

export interface MenuItem {
  id: string;
  icon: any;
  label: string;
  path?: string;
  onClick?: () => Promise<void>;
  featureFlag?: keyof typeof FEATURES;
}

export const hierarchicalMenuConfig: MenuSection[] = [
  // DASHBOARDS
  {
    id: 'dashboards',
    label: 'Dashboards',
    expanded: true,
    items: [
      {
        id: 'accueil',
        icon: Home,
        label: 'Accueil',
        path: '/',
        featureFlag: 'ENABLE_ACCUEIL'
      }
    ]
  },

  // GESTION FINANCIÈRE
  {
    id: 'finances',
    label: 'Gestion Financière',
    icon: CreditCard,
    expanded: false,
    featureFlag: 'ENABLE_FINANCES',
    items: [
      {
        id: 'finances-home',
        icon: Home,
        label: 'Vue d\'ensemble',
        path: '/finances'
      },
      {
        id: 'mes-factures',
        icon: FileText,
        label: 'Mes Factures',
        path: '/finances/mes-factures',
        featureFlag: 'ENABLE_MES_FACTURES'
      },
      {
        id: 'fermeture-caisse',
        icon: CreditCard,
        label: 'Fermeture Caisse',
        path: '/finances/fermeture-caisse',
        featureFlag: 'ENABLE_FERMETURE_CAISSE'
      }
    ]
  },

  // SUIVI CA
  {
    id: 'ca-tracking',
    label: 'Suivi CA',
    icon: FileText,
    expanded: false,
    items: [
      {
        id: 'suivi-ca-reel',
        icon: FileText,
        label: 'CA Réel',
        path: '/finances/suivi-ca-reel',
        featureFlag: 'ENABLE_SUIVI_CA_REEL'
      },
      {
        id: 'suivi-ca-budget',
        icon: FileText,
        label: 'CA Budget',
        path: '/finances/suivi-ca-budget',
        featureFlag: 'ENABLE_SUIVI_CA_BUDGET'
      },
      {
        id: 'budget-depense',
        icon: FileText,
        label: 'Budget Dépenses',
        path: '/finances/budget-depense',
        featureFlag: 'ENABLE_SAISIE_BUDGET_ANNUEL'
      }
    ]
  },

  // GESTION BANCAIRE
  {
    id: 'banques',
    label: 'Gestion Bancaire',
    icon: Landmark,
    expanded: false,
    featureFlag: 'ENABLE_BANQUES',
    items: [
      {
        id: 'banques-home',
        icon: Home,
        label: 'Vue d\'ensemble',
        path: '/banques'
      },
      {
        id: 'ecriture-bancaire',
        icon: CreditCard,
        label: 'Mouvements Bancaires',
        path: '/banques/ecriture-bancaire',
        featureFlag: 'ENABLE_ECRITURE_BANCAIRE'
      },
      {
        id: 'import-releves',
        icon: FileText,
        label: 'Import Relevés',
        path: '/banques/import-releves-brut',
        featureFlag: 'ENABLE_IMPORT_RELEVES_BRUT'
      }
    ]
  },

  // GESTION RH
  {
    id: 'employes',
    label: 'Gestion Employés',
    icon: Users,
    expanded: false,
    featureFlag: 'ENABLE_EMPLOYES',
    items: [
      {
        id: 'employes-home',
        icon: Home,
        label: 'Vue d\'ensemble',
        path: '/employes'
      },
      {
        id: 'mes-employes',
        icon: Users,
        label: 'Mes Employés',
        path: '/employes/mes-employes',
        featureFlag: 'ENABLE_MES_EMPLOYES'
      },
      {
        id: 'budget-rh',
        icon: FileText,
        label: 'Budget RH',
        path: '/employes/budget-rh',
        featureFlag: 'ENABLE_BUDGET_RH'
      }
    ]
  },

  // PARAMÈTRES
  {
    id: 'parametres',
    label: 'Paramètres',
    icon: Settings,
    expanded: false,
    items: [
      {
        id: 'parametres-global',
        icon: Settings,
        label: 'Paramètres Généraux',
        path: '/parametres-global',
        featureFlag: 'ENABLE_PARAMETRES_GLOBAL'
      },
      {
        id: 'parametres-finances',
        icon: CreditCard,
        label: 'Paramètres Finances',
        path: '/finances/parametres-finances',
        featureFlag: 'ENABLE_PARAMETRES_FINANCES'
      },
      {
        id: 'parametres-banque',
        icon: Landmark,
        label: 'Paramètres Banque',
        path: '/banques/parametres-banque',
        featureFlag: 'ENABLE_PARAMETRES_BANQUE'
      },
      {
        id: 'parametres-employes',
        icon: Users,
        label: 'Paramètres RH',
        path: '/employes/parametres-employes',
        featureFlag: 'ENABLE_PARAMETRES_EMPLOYES'
      }
    ]
  },

  // USER SECTION
  {
    id: 'user',
    label: 'Utilisateur',
    expanded: false,
    items: [
      {
        id: 'profil',
        icon: User,
        label: 'Mon Profil',
        path: '/profil',
        featureFlag: 'ENABLE_PROFIL'
      },
      {
        id: 'contact',
        icon: Mail,
        label: 'Contact',
        path: '/contact'
      }
    ]
  }
];

// Fonction pour filtrer les sections et items selon les feature flags
export const filterHierarchicalMenu = (sections: MenuSection[]): MenuSection[] => {
  return sections
    .filter(section => {
      // Si la section a un featureFlag, vérifier s'il est activé
      if (section.featureFlag) {
        return FEATURES[section.featureFlag] === true;
      }
      return true;
    })
    .map(section => ({
      ...section,
      items: section.items?.filter(item => {
        // Si l'item a un featureFlag, vérifier s'il est activé
        if (item.featureFlag) {
          return FEATURES[item.featureFlag] === true;
        }
        return true;
      })
    }))
    .filter(section => {
      // Supprimer les sections qui n'ont plus d'items après filtrage
      return !section.items || section.items.length > 0;
    });
};