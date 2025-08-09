import { Home, User, Settings, Mail, FileText, Users, CreditCard, Landmark } from 'lucide-react';
import { supabase } from '../lib/supabase';

const handleLogout = async () => {
  await supabase.auth.signOut();
};

export const menuItemsAccueil = [
  { icon: Home, label: 'Accueil', path: '/' },
  { icon: FileText, label: 'Mes Factures', path: '/finances/mes-factures' },
  { icon: CreditCard, label: 'Fermeture Caisse', path: '/finances/fermeture-caisse', separator: true },
  { icon: User, label: 'Mon Profil', path: '/profil', separator: true},
  { 
    icon: Users, 
    label: 'Déconnexion', 
    path: '/login',
    onClick: handleLogout
  }
];

// Menu para gestão financière
export const menuItemsGestionFinanciere = [
  { icon: Home, label: 'Accueil', path: '/' },
  { icon: FileText, label: 'Mes Factures', path: '/finances/mes-factures' },
  { icon: CreditCard, label: 'Fermeture Caisse', path: '/finances/fermeture-caisse', separator: true },
  { icon: User, label: 'Mon Profil', path: '/profil', separator: true},
  { 
    icon: Users, 
    label: 'Déconnexion', 
    path: '/login',
    onClick: handleLogout
  }
];
