import { supabase } from '../lib/supabase';

/**
 * Effectue un upsert dans la table ca_reel et garantit la récupération de l'ID
 * même si l'upsert ne retourne pas directement l'ID.
 * 
 * @param data Données pour l'upsert (com_contrat_client_id, id_entite, date_vente, id_flux_categorie, montant_ht, montant_ttc)
 * @returns L'ID de l'enregistrement (id_ca_reel)
 * @throws Error si l'opération échoue complètement
 */
export async function upsertCaReelWithFallback(data: {
  com_contrat_client_id: string;
  id_entite: string;
  date_vente: string;
  id_flux_categorie: string;
  montant_ht: number;
  montant_ttc?: number;
}): Promise<number> {
  console.log('Début upsertCaReelWithFallback avec données:', data);
  
  try {
    // 1. Tentative d'upsert avec returning: 'representation' et select pour récupérer l'ID
    const { data: upsertResult, error: upsertError } = await supabase
      .from('ca_reel')
      .upsert(
        {
          com_contrat_client_id: data.com_contrat_client_id,
          id_entite: data.id_entite,
          date_vente: data.date_vente,
          id_flux_categorie: data.id_flux_categorie,
          montant_ht: data.montant_ht,
          montant_ttc: data.montant_ttc || data.montant_ht // Utiliser montant_ht comme fallback si montant_ttc n'est pas fourni
        },
        {
          onConflict: 'id_entite,date_vente,id_flux_categorie',
          returning: 'representation'
        }
      )
      .select('id')
      .single();

    // Vérifier s'il y a une erreur d'upsert
    if (upsertError) {
      console.error('Erreur lors de l\'upsert ca_reel:', upsertError);
      throw new Error(`Erreur lors de l'upsert ca_reel: ${upsertError.message}`);
    }

    // 2. Vérifier si l'upsert a retourné un ID
    if (!upsertResult || !upsertResult.id) {
      console.log('Aucun ID retourné après upsert ca_reel. Tentative de récupération par select...');
      
      // Construire une clé unique pour la recherche
      const key = `${data.id_entite}|${data.date_vente}|${data.id_flux_categorie}`;
      console.log(`Recherche avec clé: ${key}`);
      
      // Effectuer un select avec les mêmes critères que la contrainte d'unicité
      const { data: selectResult, error: selectError } = await supabase
        .from('ca_reel')
        .select('id')
        .eq('id_entite', data.id_entite)
        .eq('date_vente', data.date_vente)
        .eq('id_flux_categorie', data.id_flux_categorie)
        .single();

      // Vérifier s'il y a une erreur de select
      if (selectError) {
        console.error('Erreur lors de la récupération de l\'ID ca_reel:', selectError);
        throw new Error(`Erreur lors de la récupération de l'ID ca_reel: ${selectError.message}`);
      }

      // Vérifier si le select a retourné un résultat
      if (!selectResult || !selectResult.id) {
        console.error('Aucun enregistrement trouvé après upsert ca_reel');
        throw new Error('Aucun enregistrement trouvé après upsert ca_reel');
      }

      console.log(`ID ca_reel récupéré par select: ${selectResult.id}`);
      return selectResult.id;
    }

    // 3. Si l'upsert a retourné un ID, l'utiliser directement
    console.log(`ID ca_reel retourné par upsert: ${upsertResult.id}`);
    return upsertResult.id;
  } catch (error) {
    // Capturer et relancer toutes les erreurs non gérées
    console.error('Erreur non gérée dans upsertCaReelWithFallback:', error);
    throw error;
  }
}

/**
 * Effectue un upsert dans la table ca_reel_detail et garantit la récupération de l'ID
 * même si l'upsert ne retourne pas directement l'ID.
 * 
 * @param data Données pour l'upsert (id_ca_reel, id_type_service, montant_ht, montant_ttc)
 * @returns L'ID de l'enregistrement (id_ca_reel_detail)
 * @throws Error si l'opération échoue complètement
 */
export async function upsertCaReelDetailWithFallback(data: {
  id_ca_reel: number;
  id_type_service: string;
  montant_ht: number;
  montant_ttc?: number;
}): Promise<number> {
  console.log('Début upsertCaReelDetailWithFallback avec données:', data);
  
  try {
    // 1. Tentative d'upsert avec returning: 'representation' et select pour récupérer l'ID
    const { data: upsertResult, error: upsertError } = await supabase
      .from('ca_reel_detail')
      .upsert(
        {
          id_ca_reel: data.id_ca_reel,
          id_type_service: data.id_type_service,
          montant_ht: data.montant_ht,
          montant_ttc: data.montant_ttc || data.montant_ht // Utiliser montant_ht comme fallback si montant_ttc n'est pas fourni
        },
        {
          onConflict: 'id_ca_reel,id_type_service',
          returning: 'representation'
        }
      )
      .select('id')
      .single();

    // Vérifier s'il y a une erreur d'upsert
    if (upsertError) {
      console.error('Erreur lors de l\'upsert ca_reel_detail:', upsertError);
      throw new Error(`Erreur lors de l'upsert ca_reel_detail: ${upsertError.message}`);
    }

    // 2. Vérifier si l'upsert a retourné un ID
    if (!upsertResult || !upsertResult.id) {
      console.log('Aucun ID retourné après upsert ca_reel_detail. Tentative de récupération par select...');
      
      // Construire une clé unique pour la recherche
      const key = `${data.id_ca_reel}|${data.id_type_service}`;
      console.log(`Recherche avec clé: ${key}`);
      
      // Effectuer un select avec les mêmes critères que la contrainte d'unicité
      const { data: selectResult, error: selectError } = await supabase
        .from('ca_reel_detail')
        .select('id')
        .eq('id_ca_reel', data.id_ca_reel)
        .eq('id_type_service', data.id_type_service)
        .single();

      // Vérifier s'il y a une erreur de select
      if (selectError) {
        console.error('Erreur lors de la récupération de l\'ID ca_reel_detail:', selectError);
        throw new Error(`Erreur lors de la récupération de l'ID ca_reel_detail: ${selectError.message}`);
      }

      // Vérifier si le select a retourné un résultat
      if (!selectResult || !selectResult.id) {
        console.error('Aucun enregistrement trouvé après upsert ca_reel_detail');
        throw new Error('Aucun enregistrement trouvé après upsert ca_reel_detail');
      }

      console.log(`ID ca_reel_detail récupéré par select: ${selectResult.id}`);
      return selectResult.id;
    }

    // 3. Si l'upsert a retourné un ID, l'utiliser directement
    console.log(`ID ca_reel_detail retourné par upsert: ${upsertResult.id}`);
    return upsertResult.id;
  } catch (error) {
    // Capturer et relancer toutes les erreurs non gérées
    console.error('Erreur non gérée dans upsertCaReelDetailWithFallback:', error);
    throw error;
  }
}

/**
 * Effectue un upsert dans la table ca_reel_detail_heure et garantit la récupération de l'ID
 * même si l'upsert ne retourne pas directement l'ID.
 * 
 * @param data Données pour l'upsert (id_ca_reel_detail, heure, document, pu_ht, pu_ttc, montant_ht, montant_ttc)
 * @returns L'ID de l'enregistrement (id_ca_reel_detail_heure)
 * @throws Error si l'opération échoue complètement
 */
export async function upsertCaReelDetailHeureWithFallback(data: {
  id_ca_reel_detail: number;
  heure: string;
  document?: string | null;
  pu_ht?: number | null;
  pu_ttc?: number | null;
  montant_ht: number;
  montant_ttc?: number;
}): Promise<number> {
  console.log('Début upsertCaReelDetailHeureWithFallback avec données:', data);
  
  try {
    // Normaliser les valeurs null/undefined pour document
    const document = data.document || null;
    
    // 1. Tentative d'upsert avec returning: 'representation' et select pour récupérer l'ID
    const { data: upsertResult, error: upsertError } = await supabase
      .from('ca_reel_detail_heure')
      .upsert(
        {
          id_ca_reel_detail: data.id_ca_reel_detail,
          heure: data.heure,
          document: document,
          pu_ht: data.pu_ht || null,
          pu_ttc: data.pu_ttc || null,
          montant_ht: data.montant_ht,
          montant_ttc: data.montant_ttc || data.montant_ht // Utiliser montant_ht comme fallback si montant_ttc n'est pas fourni
        },
        {
          onConflict: 'id_ca_reel_detail,heure,document',
          returning: 'representation'
        }
      )
      .select('id')
      .single();

    // Vérifier s'il y a une erreur d'upsert
    if (upsertError) {
      console.error('Erreur lors de l\'upsert ca_reel_detail_heure:', upsertError);
      throw new Error(`Erreur lors de l'upsert ca_reel_detail_heure: ${upsertError.message}`);
    }

    // 2. Vérifier si l'upsert a retourné un ID
    if (!upsertResult || !upsertResult.id) {
      console.log('Aucun ID retourné après upsert ca_reel_detail_heure. Tentative de récupération par select...');
      
      // Construire une clé unique pour la recherche
      const key = `${data.id_ca_reel_detail}|${data.heure}|${document}`;
      console.log(`Recherche avec clé: ${key}`);
      
      // Effectuer un select avec les mêmes critères que la contrainte d'unicité
      const { data: selectResult, error: selectError } = await supabase
        .from('ca_reel_detail_heure')
        .select('id')
        .eq('id_ca_reel_detail', data.id_ca_reel_detail)
        .eq('heure', data.heure)
        .eq('document', document)
        .single();

      // Vérifier s'il y a une erreur de select
      if (selectError) {
        console.error('Erreur lors de la récupération de l\'ID ca_reel_detail_heure:', selectError);
        throw new Error(`Erreur lors de la récupération de l'ID ca_reel_detail_heure: ${selectError.message}`);
      }

      // Vérifier si le select a retourné un résultat
      if (!selectResult || !selectResult.id) {
        console.error('Aucun enregistrement trouvé après upsert ca_reel_detail_heure');
        throw new Error('Aucun enregistrement trouvé après upsert ca_reel_detail_heure');
      }

      console.log(`ID ca_reel_detail_heure récupéré par select: ${selectResult.id}`);
      return selectResult.id;
    }

    // 3. Si l'upsert a retourné un ID, l'utiliser directement
    console.log(`ID ca_reel_detail_heure retourné par upsert: ${upsertResult.id}`);
    return upsertResult.id;
  } catch (error) {
    // Capturer et relancer toutes les erreurs non gérées
    console.error('Erreur non gérée dans upsertCaReelDetailHeureWithFallback:', error);
    throw error;
  }
}