import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface Profil {
  id: string;
  user_id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfilContextType {
  profil: Profil | null;
  loading: boolean;
  error: string | null;
  updateProfil: (data: Partial<Profil>) => Promise<void>;
}

const ProfilContext = createContext<ProfilContextType | undefined>(undefined);

export const useProfil = () => {
  const context = useContext(ProfilContext);
  if (context === undefined) {
    throw new Error('useProfil doit être utilisé à l\'intérieur d\'un ProfilProvider');
  }
  return context;
};

export const ProfilProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfil(null);
      setLoading(false);
      return;
    }

    const fetchProfil = async () => {
      try {
        const { data, error } = await supabase
          .from('com_profil')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfil(data);
      } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err);
        setError('Impossible de charger les informations du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfil();
  }, [user]);

  const updateProfil = async (data: Partial<Profil>) => {
    if (!user || !profil) return;

    try {
      const { error } = await supabase
        .from('com_profil')
        .update(data)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfil({ ...profil, ...data });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError('Impossible de mettre à jour le profil');
      throw err;
    }
  };

  return (
    <ProfilContext.Provider value={{ profil, loading, error, updateProfil }}>
      {children}
    </ProfilContext.Provider>
  );
};