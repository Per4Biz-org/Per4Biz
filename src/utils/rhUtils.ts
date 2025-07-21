import { supabase } from '../lib/supabase';

/**
 * Calcule un nouveau matricule à partir des paramètres généraux RH
 * @param contratClientId ID du contrat client
 * @returns Le matricule généré ou null en cas d'erreur
 */
export async function RHCalculMatricule(contratClientId: string): Promise<string | null> {
  try {
    if (!contratClientId) {
      console.error('RHCalculMatricule: contratClientId est requis');
      return null;
    }

    // Récupérer les paramètres généraux actifs à la date d'aujourd'hui
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    const { data, error } = await supabase
      .from('rh_param_generaux')
      .select('mat_prefixe, mat_chrono, mat_nb_position')
      .eq('com_contrat_client_id', contratClientId)
      .eq('actif', true)
      .lte('date_debut', today)
      .or(`date_fin.is.null,date_fin.gt.${today}`)
      .order('date_debut', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération des paramètres généraux:', error);
      return null;
    }

    if (!data || !data.mat_prefixe) {
      console.error('Aucun paramètre général trouvé ou préfixe de matricule non défini');
      return null;
    }

    // Extraire les valeurs
    const { mat_prefixe, mat_chrono, mat_nb_position } = data;
    
    // Valeurs par défaut si non définies
    const prefixe = mat_prefixe || '';
    const chrono = (mat_chrono || 1) + 1; // Incrémenter le compteur
    const nbPosition = mat_nb_position || 3;
    
    // Formater le matricule: préfixe + chrono formaté sur nbPosition chiffres
    const matricule = `${prefixe}${chrono.toString().padStart(nbPosition, '0')}`;
    
    // Mettre à jour le compteur dans la base de données
    const { error: updateError } = await supabase
      .from('rh_param_generaux')
      .update({ mat_chrono: chrono })
      .eq('com_contrat_client_id', contratClientId)
      .eq('actif', true)
      .lte('date_debut', today)
      .or(`date_fin.is.null,date_fin.gt.${today}`)
      .order('date_debut', { ascending: false })
      .limit(1);
    
    if (updateError) {
      console.error('Erreur lors de la mise à jour du compteur de matricule:', updateError);
      // On retourne quand même le matricule calculé même si la mise à jour a échoué
    }
    
    console.log(`Nouveau matricule généré: ${matricule} (chrono: ${chrono})`);
    return matricule;
  } catch (error) {
    console.error('Erreur lors du calcul du matricule:', error);
    return null;
  }
}