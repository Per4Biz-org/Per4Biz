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
  { icon: CreditCard, label: 'IVA', path: '/parametres-global/iva' },
  { icon: FileText, label: 'Entités', path:  '/parametres-global/entites' }
];

export const menuItemsGestionFinanciere = [
  { icon: Home, label: 'Gestion Financière', path: '/finances' },
  { icon: CreditCard, label: 'Saisie Factures', path: '/finances/saisie-factures' },
  { icon: FileText, label: 'Suivi CA', path: '/finances/suivi-ca' },
  { icon: Settings, label: 'Paramètres', path: '/finances/parametres-finances', separator: true }
];

export const menuItemsParamGestionFinanciere = [
  { icon: Home, label: 'Paramètres GF', path: '/finances/parametres-finances' },
  { icon: CreditCard, label: 'Paramètre Jours', path: '/finances/parametres-finances/param-jours' },
  { icon: FileText, label: 'Type mouv Bancaire', path: '/finances/parametres-finances/type-mouv-bq' }
];