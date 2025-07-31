import { 
  Home, User, Settings, Mail, FileText, Users, CreditCard, Landmark,
  Building2, UserCheck, Globe, Import, Download, Upload, 
  Calculator, BarChart3, PieChart, DollarSign, Receipt,
  UserCog, Clock, Briefcase, Award, Target,
  Database, Folder, Filter, Tag, Calendar,
  TestTube, ShoppingCart, Banknote, TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FEATURES } from '@/config/features';

const handleLogout = async () => {
  await supabase.auth.signOut();
};

export const menuItemsComplet = [
  // 🏠 Pages principales
  ...(FEATURES.ENABLE_ACCUEIL ? [{ icon: Home, label: 'Accueil', path: '/' }] : []),
  ...(FEATURES.ENABLE_TEST_UI ? [{ icon: TestTube, label: 'Test UI', path: '/test-ui' }] : []),
  
  // ⚙️ Paramètres Globaux
  ...(FEATURES.ENABLE_PARAMETRES_GLOBAL ? [{ icon: Settings, label: 'Paramètres Global', path: '/parametres-global', separator: true }] : []),
  ...(FEATURES.ENABLE_ENTITES ? [{ icon: Building2, label: 'Entités', path: '/parametres-global/entites' }] : []),
  ...(FEATURES.ENABLE_TIERS ? [{ icon: UserCheck, label: 'Tiers', path: '/parametres-global/tiers' }] : []),
  ...(FEATURES.ENABLE_TYPE_TIERS ? [{ icon: Users, label: 'Type Tiers', path: '/parametres-global/type-tiers' }] : []),
  ...(FEATURES.ENABLE_TYPE_FACTURE ? [{ icon: Receipt, label: 'Type Facture', path: '/parametres-global/type-facture' }] : []),
  ...(FEATURES.ENABLE_IMPORT_GLOBAL ? [{ icon: Import, label: 'Import Global', path: '/parametres-global/import' }] : []),
  ...(FEATURES.ENABLE_IMPORT_CA_DETAIL ? [{ icon: Import, label: 'Import CA Détail', path: '/parametres-global/import/ca-detail' }] : []),
  ...(FEATURES.ENABLE_IMPORT_FACTURE ? [{ icon: Upload, label: 'Import Facture', path: '/parametres-global/import/facture' }] : []),
  ...(FEATURES.ENABLE_IMPORT_TIERS ? [{ icon: Download, label: 'Import Tiers', path: '/parametres-global/import/tiers' }] : []),
  
  // 🏦 Module Banques
  ...(FEATURES.ENABLE_BANQUES ? [{ icon: Landmark, label: 'Banques', path: '/banques', separator: true }] : []),
  ...(FEATURES.ENABLE_PARAMETRES_BANQUE ? [{ icon: Settings, label: 'Paramètres Banque', path: '/banques/parametres-banque' }] : []),
  ...(FEATURES.ENABLE_COMPTES_BANCAIRE ? [{ icon: CreditCard, label: 'Comptes Bancaires', path: '/banques/comptes-bancaire' }] : []),
  ...(FEATURES.ENABLE_MODE_PAIEMENT ? [{ icon: Banknote, label: 'Mode Paiement', path: '/banques/mode-paiement' }] : []),
  ...(FEATURES.ENABLE_IMPORT_FORMAT ? [{ icon: Database, label: 'Import Format', path: '/banques/import-format' }] : []),
  ...(FEATURES.ENABLE_IMPORT_RELEVES_BRUT ? [{ icon: Folder, label: 'Import Relevés Brut', path: '/banques/import-releves-brut' }] : []),
  ...(FEATURES.ENABLE_ECRITURE_BANCAIRE ? [{ icon: FileText, label: 'Écriture Bancaire', path: '/banques/ecriture-bancaire' }] : []),
  
  // 👥 Module Employés
  ...(FEATURES.ENABLE_EMPLOYES ? [{ icon: Users, label: 'Employés', path: '/employes', separator: true }] : []),
  ...(FEATURES.ENABLE_PARAMETRES_EMPLOYES ? [{ icon: Settings, label: 'Paramètres Employés', path: '/employes/parametres-employes' }] : []),
  ...(FEATURES.ENABLE_BUDGET_RH ? [{ icon: Calculator, label: 'Budget RH', path: '/employes/budget-rh' }] : []),
  ...(FEATURES.ENABLE_FICHE_PERSONNEL ? [{ icon: User, label: 'Fiche Personnel', path: '/employes/fiche-personnel' }] : []),
  ...(FEATURES.ENABLE_MES_EMPLOYES ? [{ icon: UserCog, label: 'Mes Employés', path: '/employes/mes-employes' }] : []),
  ...(FEATURES.ENABLE_PARAM_GENERAUX ? [{ icon: Settings, label: 'Param Généraux', path: '/employes/param-generaux' }] : []),
  ...(FEATURES.ENABLE_PARAM_SOUS_CATEGORIES_RH ? [{ icon: Filter, label: 'Param Sous-Catégories RH', path: '/employes/param-sous-categories-rh' }] : []),
  ...(FEATURES.ENABLE_TYPE_CONTRAT ? [{ icon: Briefcase, label: 'Type Contrat', path: '/employes/type-contrat' }] : []),
  ...(FEATURES.ENABLE_TYPE_FONCTION ? [{ icon: Award, label: 'Type Fonction', path: '/employes/type-fonction' }] : []),
  
  // 💰 Module Finances
  ...(FEATURES.ENABLE_FINANCES ? [{ icon: DollarSign, label: 'Finances', path: '/finances', separator: true }] : []),
  ...(FEATURES.ENABLE_PARAMETRES_FINANCES ? [{ icon: Settings, label: 'Paramètres Finances', path: '/finances/parametres-finances' }] : []),
  ...(FEATURES.ENABLE_SAISIE_BUDGET_ANNUEL ? [{ icon: Target, label: 'Saisie Budget Annuel', path: '/finances/saisie-budget-annuel' }] : []),
  ...(FEATURES.ENABLE_SUIVI_CA_REEL ? [{ icon: BarChart3, label: 'Suivi CA Réel', path: '/finances/suivi-ca-reel' }] : []),
  ...(FEATURES.ENABLE_SUIVI_CA_BUDGET ? [{ icon: PieChart, label: 'Suivi CA Budget', path: '/finances/suivi-ca-budget' }] : []),
  ...(FEATURES.ENABLE_TEST_DATA_TABLE_FULL ? [{ icon: TestTube, label: 'Test DataTable Full', path: '/finances/test-data-table-full' }] : []),
  ...(FEATURES.ENABLE_EDIT_FACTURE_ACHAT ? [{ icon: ShoppingCart, label: 'Edit Facture Achat', path: '/finances/edit-facture-achat' }] : []),
  ...(FEATURES.ENABLE_MES_FACTURES ? [{ icon: FileText, label: 'Mes Factures', path: '/finances/mes-factures' }] : []),
  ...(FEATURES.ENABLE_FERMETURE_CAISSE ? [{ icon: CreditCard, label: 'Fermeture Caisse', path: '/finances/fermeture-caisse' }] : []),
  ...(FEATURES.ENABLE_CA_TYPE_SERVICE ? [{ icon: Tag, label: 'CA Type Service', path: '/finances/ca-type-service' }] : []),
  ...(FEATURES.ENABLE_SOUS_CATEGORIE_FLUX ? [{ icon: Filter, label: 'Sous-Catégorie Flux', path: '/finances/sous-categorie-flux' }] : []),
  ...(FEATURES.ENABLE_NATURE_FLUX ? [{ icon: TrendingUp, label: 'Nature Flux', path: '/finances/nature-flux' }] : []),
  ...(FEATURES.ENABLE_PARAM_JOURS ? [{ icon: Calendar, label: 'Param Jours', path: '/finances/param-jours' }] : []),
  ...(FEATURES.ENABLE_CATEGORIE_FLUX ? [{ icon: Folder, label: 'Catégorie Flux', path: '/finances/categorie-flux' }] : []),
  
  // 🧪 Features avancées
  ...(FEATURES.ENABLE_TRANSLATION ? [{ icon: Globe, label: 'Traduction', path: '/translation', separator: true }] : []),
  ...(FEATURES.SHOW_ADVANCED_MENU ? [{ icon: Settings, label: 'Menu Avancé', path: '/advanced' }] : []),
  ...(FEATURES.ENABLE_STATS_PAGE ? [{ icon: BarChart3, label: 'Statistiques', path: '/stats' }] : []),
  
  // 👤 Profil et Déconnexion
  ...(FEATURES.ENABLE_PROFIL ? [{ icon: User, label: 'Mon Profil', path: '/profil', separator: true }] : []),
  { 
    icon: Users, 
    label: 'Déconnexion', 
    path: '/login',
    onClick: handleLogout
  }
];

// Menu simplificado (compatibilité)
export const menuItemsAccueil = menuItemsComplet;
export const menuItemsGestionFinanciere = menuItemsComplet;