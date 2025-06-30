import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useProfil } from '../../context/ProfilContext';

export interface Personnel {
  id?: string;
  nom: string;
  prenom: string;
  civilite?: string;
  sexe?: string;
  date_naissance?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  numero_securite_sociale?: string;
  nif?: string;
  email_perso?: string;
  telephone?: string;
  lien_photo?: string;
  id_tiers?: string;
  actif: boolean;
  code_court: string;
  matricule: string;
}

export const useFichePersonnel = (mode: 'create' | 'edit', id?: string) => {
  const { profil } = useProfil();
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonnel = async () => {
      if (mode === 'edit' && id) {
        setLoading(true);
        try {
          console.log('Chargement du personnel avec ID:', id);
          const { data, error } = await supabase
            .from('rh_personnel')
            .select(`
              *,
              tiers:id_tiers (
                id,
                code,
                nom
              )
            `)
            .eq('id', id)
            .single();

          if (error) throw error;
          console.log('Personnel chargé:', data);
          console.log('Lien photo:', data.lien_photo);
          setPersonnel(data);
        } catch (error: any) {
          console.error('Erreur lors de la récupération du personnel:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      } else {
        // Mode création, initialiser un objet vide
        setPersonnel({
          nom: '',
          prenom: '',
          actif: true,
          code_court: '',
          matricule: ''
        });
        setLoading(false);
      }
    };

    fetchPersonnel();
  }, [mode, id]);

  const savePersonnel = async (data: Personnel): Promise<string | null> => {
    if (!profil?.com_contrat_client_id) {
      setError('Profil utilisateur incomplet');
      console.error('Profil utilisateur incomplet');
      return null;
    }

    console.log('savePersonnel - Données reçues:', data);
    console.log('savePersonnel - lien_photo:', data.lien_photo, 'Type:', typeof data.lien_photo);

    try {
      if (mode === 'edit' && id) {
        // Mode édition
        console.log('savePersonnel - Mode édition - Données à envoyer:', {
          ...data,
          com_contrat_client_id: profil.com_contrat_client_id
        });
        
        const { data: updatedData, error } = await supabase
          .from('rh_personnel')
          .update({
            ...data,
            com_contrat_client_id: profil.com_contrat_client_id
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        console.log('savePersonnel - Mise à jour réussie, données retournées:', updatedData);
        console.log('savePersonnel - lien_photo après mise à jour:', updatedData.lien_photo);
        setPersonnel(updatedData);
        return updatedData.id;
      } else {
        // Mode création
        console.log('savePersonnel - Mode création - Données à envoyer:', {
          ...data,
          com_contrat_client_id: profil.com_contrat_client_id
        });
        
        const { data: newData, error } = await supabase
          .from('rh_personnel')
          .insert({
            ...data,
            com_contrat_client_id: profil.com_contrat_client_id
          })
          .select()
          .single();

        if (error) throw error;
        console.log('savePersonnel - Création réussie, données retournées:', newData);
        console.log('savePersonnel - lien_photo après création:', newData.lien_photo);
        setPersonnel(newData);
        return newData.id;
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du personnel:', error);
      setError(error.message);
      return null;
    }
  };

  return {
    personnel,
    loading,
    error,
    savePersonnel
  };
};