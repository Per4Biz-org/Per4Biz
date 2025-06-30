import { useState } from 'react';
import { supabase } from '../../../../../lib/supabase';
import { useProfil } from '../../../../../context/ProfilContext';
import { ToastData } from '../../../../../components/ui/toast';

export const useTiersManagement = (
  setValue?: (name: string, value: any, options?: any) => void,
  addToast: (toast: Omit<ToastData, 'id'>) => void
) => {
  const { profil } = useProfil();
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false);

  // Gérer la création d'un nouveau tiers
  const handleTiersSubmit = async (tiersData: any) => {
    try {
      if (!setValue) {
        console.error('setValue function is not provided to useTiersManagement');
        return;
      }
      
      // Vérifier si un tiers avec ce code existe déjà
      const { data: existingTiers, error: checkError } = await supabase
        .from('com_tiers')
        .select('id, code, nom')
        .eq('code', tiersData.code)
        .eq('com_contrat_client_id', profil?.com_contrat_client_id)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      // Si un tiers avec ce code existe déjà, afficher un message et proposer de l'utiliser
      if (existingTiers) {
        if (window.confirm(`Un tiers avec le code "${tiersData.code}" existe déjà (${existingTiers.nom}). Voulez-vous l'utiliser ?`)) {
          // Utiliser le tiers existant
          setValue('id_tiers', existingTiers.id);
          
          addToast({
            label: `Tiers existant "${existingTiers.nom}" sélectionné`,
            icon: 'Check',
            color: '#22c55e'
          });
          
          setIsTiersModalOpen(false);
          return;
        } else {
          // L'utilisateur ne veut pas utiliser le tiers existant
          addToast({
            label: 'Veuillez utiliser un code différent pour créer un nouveau tiers',
            icon: 'AlertTriangle',
            color: '#f59e0b'
          });
          return;
        }
      }

      // Vérifier si un type de tiers "salarié" existe
      const { data: typeTiersSalarie, error: typeTiersError } = await supabase
        .from('com_param_type_tiers')
        .select('id')
        .eq('com_contrat_client_id', profil?.com_contrat_client_id)
        .eq('salarie', true)
        .eq('actif', true)
        .limit(1);

      if (typeTiersError) {
        throw typeTiersError;
      }

      // Si aucun type de tiers salarié n'est trouvé, utiliser le type fourni
      // Sinon, utiliser le type salarié
      const id_type_tiers = (typeTiersSalarie && typeTiersSalarie.length > 0) 
        ? typeTiersSalarie[0].id 
        : tiersData.id_type_tiers;

      const { data, error } = await supabase
        .from('com_tiers') 
        .insert({
          ...tiersData,
          id_type_tiers,
          com_contrat_client_id: profil?.com_contrat_client_id,
          // code_user n'est plus nécessaire, remplacé par created_by
        })
        .select()
        .single();

      if (error) throw error;
      
      // Mettre à jour le formulaire avec le nouveau tiers
      setValue('id_tiers', data.id);
      
      addToast({
        label: 'Tiers créé avec succès',
        icon: 'Check',
        color: '#22c55e'
      });
      
      setIsTiersModalOpen(false);
    } catch (error: any) {
      console.error('Erreur lors de la création du tiers:', error);
      
      // Gestion spécifique des erreurs de contrainte d'unicité
      let errorMessage = 'Erreur lors de la création du tiers';
      
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        if (error.message.includes('com_tiers_code_unique')) {
          errorMessage = 'Un tiers avec ce code existe déjà. Veuillez utiliser un code différent.';
        }
      }
      
      addToast({
        label: errorMessage,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    }
  };

  return {
    isTiersModalOpen,
    setIsTiersModalOpen,
    handleTiersSubmit
  };
};