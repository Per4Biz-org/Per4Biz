import { Home, User, Settings, Mail, FileText, Users, CreditCard, Landmark } from 'lucide-react';
import { supabase } from '../lib/supabase';

const handleLogout = async () => {
  await supabase.auth.signOut();
};

export const menuItemsAccueil = [
  { icon: Home, label: 'Accueil', path: '/' },
  { icon: CreditCard, label: 'Gestion Financière', path: '/finances', separator: true },
  { icon: Landmark, label: 'Gestion Bancaire', path: '/banques' },
  { icon: Users, label: 'Gestion Employés', path: '/employes' },
  { icon: User, label: 'Mon Profil', path: '/profil', separator: true},
  { icon: Settings, label: 'Paramètres', path: '/parametres-global' },
  { icon: Mail, label: 'Contact', path: '/contact' },
  { 
    icon: Users, 
    label: 'Déconnexion', 
    path: '/login',
    onClick: handleLogout
  }
];

export const menuItemsParametreGlobal = [
  { icon: Home, label: 'Paramètre Global', path: '/parametres-global' },
  { icon: CreditCard, label: 'Tiers', path: '/parametres-global/tiers' },
  { icon: CreditCard, label: 'Type Tiers', path: '/parametres-global/type-tiers', separator: true  },
  { icon: FileText, label: 'Entités', path:  '/parametres-global/entites'},
   { icon: FileText, label: 'Import', path:  '/parametres-global/import', separator: true }
];

export const menuItemsParametreGlobalImport = [
  { icon: FileText, label: 'Import Données', path: '/parametres-global/import' },
  { icon: FileText, label: 'Import Tiers', path: '/parametres-global/import/tiers' },
  { icon: FileText, label: 'Import Factures', path: '/parametres-global/import/factures'}
];

export const menuItemsGestionFinanciere = [
  { icon: Home, label: 'Gestion Financière', path: '/finances' },
  { icon: CreditCard, label: 'Saisie Factures', path: '/finances/saisie-factures' },
  { icon: FileText, label: 'Suivi CA', path: '/finances/suivi-ca' },
  { icon: FileText, label: 'Gestion Budget Dépenses', path: '/finances/budget-depense',separator: true },
  { icon: Settings, label: 'Paramètres', path: '/finances/parametres-finances', separator: true }
];

export const menuItemsParamGestionFinanciere = [
  { icon: Home, label: 'Paramètres GF', path: '/finances/parametres-finances' },
  { icon: Home, label: 'Nature Flux', path: '/finances/parametres-finances/nature-flux', separator: true},
  { icon: Home, label: 'Catégorie Flux', path: '/finances/parametres-finances/categorie-flux' },
  { icon: Home, label: 'Sous Catégorie Flux', path: '/finances/parametres-finances/sous-categorie-flux' },
  { icon: CreditCard, label: 'Paramètre Jours', path: '/finances/parametres-finances/param-jours', separator: true }
];

export const menuItemsGestionBancaire = [
  { icon: Home, label: 'Gestion Bancaire', path: '/banques' },
  { icon: CreditCard, label: 'Mouvements Bancaires', path: '/banques/mouv-bancaire' },
  { icon: FileText, label: 'Import Relevés', path: '/banques/import-releves' },
  { icon: Settings, label: 'Paramètres', path: '/banques/parametres-bancaire', separator: true }
];

  export const menuItemsParamGestionBancaire = [
    { icon: Home, label: 'Paramètres GB', path: '/banques/parametres-bancaire' },
    { icon: CreditCard, label: 'Comptes Bancaires', path: '/banques/parametres-bancaire/comptes-bancaire',separator: true },
    { icon: FileText, label: 'Mode Paiement', path: '/banques/parametres-bancaire/mode-paiement' }, 
    { icon: FileText, label: 'Type mouv Bancaire', path: '/banques/parametres-bancaire/type-mouv-bq' }, 
    { icon: FileText, label: 'Import Relevés', path: '/banques/parametres-bancaire/import-releves',separator: true },
    { icon: FileText, label: 'Format Import', path: '/banques/parametres-bancaire/format-import' }
  ];