import { Home, User, Settings, Mail, FileText, Users, CreditCard, Landmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FEATURES } from '@/config/features';

interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  separator?: boolean;
  onClick?: () => Promise<void>;
  featureFlag?: keyof typeof FEATURES;
}

const handleLogout = async () => {
  await supabase.auth.signOut();
};

export const menuItemsAccueil = [
  { icon: Home, label: 'Accueil', path: '/', featureFlag: 'ENABLE_ACCUEIL' },
  { icon: CreditCard, label: 'Gestion Financière', path: '/finances', separator: true, featureFlag: 'ENABLE_FINANCES' },
  { icon: Landmark, label: 'Gestion Bancaire', path: '/banques', featureFlag: 'ENABLE_BANQUES' },
  { icon: Users, label: 'Gestion Employés', path: '/employes', featureFlag: 'ENABLE_EMPLOYES' },
  { icon: User, label: 'Mon Profil', path: '/profil', separator: true, featureFlag: 'ENABLE_PROFIL'},
  { icon: Settings, label: 'Paramètres', path: '/parametres-global', featureFlag: 'ENABLE_PARAMETRES_GLOBAL' },
  { icon: Mail, label: 'Contact', path: '/contact' },
  { 
    icon: Users, 
    label: 'Déconnexion', 
    path: '/login',
    onClick: handleLogout
  }
];

export const menuItemsParametreGlobal = [
  { icon: Home, label: 'Paramètre Global', path: '/parametres-global', featureFlag: 'ENABLE_PARAMETRES_GLOBAL' },
  { icon: CreditCard, label: 'Tiers', path: '/parametres-global/tiers', featureFlag: 'ENABLE_TIERS' },
  { icon: CreditCard, label: 'Type Tiers', path: '/parametres-global/type-tiers', separator: true, featureFlag: 'ENABLE_TYPE_TIERS' },
  { icon: FileText, label: 'Type Facture', path:  '/parametres-global/type-facture', featureFlag: 'ENABLE_TYPE_FACTURE'},
  { icon: FileText, label: 'Entités', path:  '/parametres-global/entites', featureFlag: 'ENABLE_ENTITES'},
  { icon: FileText, label: 'Import', path:  '/parametres-global/import', separator: true, featureFlag: 'ENABLE_IMPORT_GLOBAL' }
];

export const menuItemsParametreGlobalImport = [
  { icon: FileText, label: 'Import Données', path: '/parametres-global/import', featureFlag: 'ENABLE_IMPORT_GLOBAL' },
  { icon: FileText, label: 'Import Tiers', path: '/parametres-global/import/tiers', featureFlag: 'ENABLE_IMPORT_TIERS' },
  { icon: FileText, label: 'Import CA Détail', path: '/parametres-global/import/import-détail-ca', featureFlag: 'ENABLE_IMPORT_CA_DETAIL' },
  { icon: FileText, label: 'Import Factures', path: '/parametres-global/import/factures', featureFlag: 'ENABLE_IMPORT_FACTURE'}
];

export const menuItemsGestionFinanciere = [
  { icon: Home, label: 'Gestion Financière', path: '/finances', featureFlag: 'ENABLE_FINANCES' },
  { icon: CreditCard, label: 'Mes Factures', path: '/finances/mes-factures', featureFlag: 'ENABLE_MES_FACTURES' },
  { icon: FileText, label: 'Fermeture Caisse', path: '/finances/fermeture-caisse', separator: true, featureFlag: 'ENABLE_FERMETURE_CAISSE' },
  { icon: FileText, label: 'Suivi CA Réel', path: '/finances/suivi-ca-reel', separator: true, featureFlag: 'ENABLE_SUIVI_CA_REEL' },
  { icon: FileText, label: 'Suivi CA Budget', path: '/finances/suivi-ca-budget', featureFlag: 'ENABLE_SUIVI_CA_BUDGET' },
  { icon: FileText, label: 'Gestion Budget Dépenses', path: '/finances/budget-depense', separator: true, featureFlag: 'ENABLE_SAISIE_BUDGET_ANNUEL' },
  { icon: Settings, label: 'Paramètres', path: '/finances/parametres-finances', separator: true, featureFlag: 'ENABLE_PARAMETRES_FINANCES' }
];

export const menuItemsParamGestionFinanciere = [
  { icon: Home, label: 'Paramètres GF', path: '/finances/parametres-finances', featureFlag: 'ENABLE_PARAMETRES_FINANCES' },
  { icon: Home, label: 'Nature Flux', path: '/finances/nature-flux', separator: true, featureFlag: 'ENABLE_NATURE_FLUX'},
  { icon: Home, label: 'Catégorie Flux', path: '/finances/categorie-flux', featureFlag: 'ENABLE_CATEGORIE_FLUX' },
  { icon: Home, label: 'Sous Catégorie Flux', path: '/finances/sous-categorie-flux', featureFlag: 'ENABLE_SOUS_CATEGORIE_FLUX' },
  { icon: CreditCard, label: 'Type Services CA', path: '/finances/ca-type-service', separator: true, featureFlag: 'ENABLE_CA_TYPE_SERVICE' },
  { icon: CreditCard, label: 'Paramètre Jours', path: '/finances/param-jours', featureFlag: 'ENABLE_PARAM_JOURS' }
];

export const menuItemsGestionBancaire = [
  { icon: Home, label: 'Gestion Bancaire', path: '/banques', featureFlag: 'ENABLE_BANQUES' },
  { icon: CreditCard, label: 'Mouvements Bancaires', path: '/banques/ecriture-bancaire', featureFlag: 'ENABLE_ECRITURE_BANCAIRE' },
  { icon: FileText, label: 'Import Relevés', path: '/banques/import-releves-brut', separator: true, featureFlag: 'ENABLE_IMPORT_RELEVES_BRUT' },
  { icon: Settings, label: 'Paramètres', path: '/banques/parametres-banque', separator: true, featureFlag: 'ENABLE_PARAMETRES_BANQUE' }
];

export const menuItemsParamGestionBancaire = [
  { icon: Home, label: 'Paramètres GB', path: '/banques/parametres-banque', featureFlag: 'ENABLE_PARAMETRES_BANQUE' },
  { icon: CreditCard, label: 'Comptes Bancaires', path: '/banques/parametres-banque/comptes-bancaire', separator: true, featureFlag: 'ENABLE_COMPTES_BANCAIRE' },
  { icon: FileText, label: 'Mode Paiement', path: '/banques/parametres-banque/mode-paiement', featureFlag: 'ENABLE_MODE_PAIEMENT' }, 
  { icon: FileText, label: 'Format Import', path: '/banques/parametres-banque/import-format', featureFlag: 'ENABLE_IMPORT_FORMAT' }
];

export const menuItemsGestionRH = [
  { icon: Home, label: 'Gestion Employés', path: '/employes', featureFlag: 'ENABLE_EMPLOYES' },
  { icon: CreditCard, label: 'Mes Employés', path: '/employes/mes-employes', featureFlag: 'ENABLE_MES_EMPLOYES' },
  { icon: FileText, label: 'Budget RH', path: '/employes/budget-rh', separator: true, featureFlag: 'ENABLE_BUDGET_RH' },
  { icon: Settings, label: 'Paramètres', path: '/employes/parametres-employes', separator: true, featureFlag: 'ENABLE_PARAMETRES_EMPLOYES' }
];

export const menuItemsParamGestionRH = [
  { icon: Home, label: 'Paramètres RH', path: '/employes/parametres-employes', featureFlag: 'ENABLE_PARAMETRES_EMPLOYES' },
  { icon: Home, label: 'Type Fonctions', path: '/employes/parametres-employes/type-fonction', separator: true, featureFlag: 'ENABLE_TYPE_FONCTION'},
  { icon: Home, label: 'Type Contrat', path: '/employes/parametres-employes/type-contrat', featureFlag: 'ENABLE_TYPE_CONTRAT' },
  { icon: Home, label: 'Param Sous-Catégories RH', path: '/employes/parametres-employes/param-sous-categories-rh', featureFlag: 'ENABLE_PARAM_SOUS_CATEGORIES_RH' },
  { icon: Home, label: 'Param Généraux', path: '/employes/parametres-employes/param-generaux', separator: true, featureFlag: 'ENABLE_PARAM_GENERAUX' }
];

// Fonction utilitaire pour filtrer les éléments de menu selon les feature flags
export const filterMenuItemsByFeatures = (menuItems: MenuItem[]): MenuItem[] => {
  return menuItems.filter(item => {
    // Si l'élément n'a pas de featureFlag, il est toujours affiché
    if (!item.featureFlag) return true;
    
    // Sinon, vérifier si le feature flag est activé
    return FEATURES[item.featureFlag] === true;
  });
};