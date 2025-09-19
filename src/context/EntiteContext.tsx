import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useProfil } from './ProfilContext';

interface Entite {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
}

interface EntiteContextType {
  entites: Entite[];
  selectedEntite: Entite | null;
  selectedEntiteId: string | null;
  setSelectedEntiteId: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  refetchEntites: () => Promise<void>;
}

const EntiteContext = createContext<EntiteContextType | undefined>(undefined);

export const useEntite = () => {
  const context = useContext(EntiteContext);
  if (context === undefined) {
    throw new Error('useEntite must be used within an EntiteProvider');
  }
  return context;
};

interface EntiteProviderProps {
  children: ReactNode;
}

export const EntiteProvider: React.FC<EntiteProviderProps> = ({ children }) => {
  const [entites, setEntites] = useState<Entite[]>([]);
  const [selectedEntiteId, setSelectedEntiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profil } = useProfil();

  const fetchEntites = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!profil?.com_contrat_client_id) {
        setEntites([]);
        setLoading(false);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('com_entite')
        .select('id, code, libelle, actif')
        .eq('actif', true)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .order('libelle');

      if (supabaseError) {
        throw supabaseError;
      }

      setEntites(data || []);
      
      // Se não há entidade selecionada e temos entidades disponíveis, selecionar a primeira
      if (!selectedEntiteId && data && data.length > 0) {
        setSelectedEntiteId(data[0].id);
      }
      
    } catch (err) {
      console.error('Erro ao carregar entidades:', err);
      setError('Erro ao carregar entidades');
    } finally {
      setLoading(false);
    }
  };

  const refetchEntites = async () => {
    await fetchEntites();
  };

  // Carregar entidades quando o contexto do perfil estiver disponível
  useEffect(() => {
    if (profil?.com_contrat_client_id) {
      fetchEntites();
    } else {
      setLoading(false);
      setEntites([]);
    }
  }, [profil?.com_contrat_client_id]);

  // Encontrar a entidade selecionada baseada no ID
  const selectedEntite = entites.find(entite => entite.id === selectedEntiteId) || null;

  const value: EntiteContextType = {
    entites,
    selectedEntite,
    selectedEntiteId,
    setSelectedEntiteId,
    loading,
    error,
    refetchEntites
  };

  return (
    <EntiteContext.Provider value={value}>
      {children}
    </EntiteContext.Provider>
  );
};