import { supabase } from '../lib/supabase';
import { ToastData } from '../components/ui/toast';
import { normalizeAccountNumber } from './excelImportUtils';

// Codes d'erreur pour une meilleure traçabilité
export enum BankEntryErrorCode {
  NO_ACCOUNTS = 'BE001',
  ACCOUNT_NOT_FOUND = 'BE002',
  DUPLICATE_CHECK_FAILED = 'BE003',
  ENTRY_CREATION_FAILED = 'BE004',
  ENTRY_UPDATE_FAILED = 'BE005',
  GENERAL_ERROR = 'BE999'
}

// Interface pour le suivi de progression
export interface ProcessProgress {
  total: number;
  processed: number;
  created: number;
  duplicates: number;
  errors: number;
  currentLine: string;
  phase: string;
}

interface ProcessResult {
  success: boolean;
  created: number;
  duplicates: number;
  errors: number;
  errorMessages: string[];
}

/**
 * Génère un message d'erreur formaté avec code et description
 * @param code Code d'erreur
 * @param message Message d'erreur
 * @param details Détails supplémentaires
 * @returns Message d'erreur formaté
 */
function formatErrorMessage(code: BankEntryErrorCode, message: string, details?: string): string {
  let formattedMessage = `[${code}] ${message}`;
  if (details) {
    formattedMessage += ` - ${details}`;
  }
  return formattedMessage;
}

/**
 * Traite les lignes d'import de relevés bancaires pour créer des écritures bancaires
 * @param contratClientId ID du contrat client
 * @param addToast Fonction pour afficher des notifications
 * @param onProgress Fonction de callback pour suivre la progression
 * @returns Résultat du traitement
 */
export async function processBankEntries(
  contratClientId: string,
  addToast: (toast: Omit<ToastData, 'id'>) => void,
  onProgress?: (progress: ProcessProgress) => void
): Promise<ProcessResult> {
  console.log('Début du traitement des écritures bancaires');
  
  const result: ProcessResult = {
    success: false,
    created: 0,
    duplicates: 0,
    errors: 0,
    errorMessages: []
  };

  // Initialiser l'objet de progression
  const progress: ProcessProgress = {
    total: 0,
    processed: 0,
    created: 0,
    duplicates: 0,
    errors: 0,
    currentLine: '',
    phase: 'Initialisation'
  };

  try {
    // Informer de l'état initial
    onProgress?.(progress);
    
    progress.phase = 'Récupération des comptes bancaires';
    onProgress?.(progress);
    
    // 1. Récupérer tous les comptes bancaires pour ce contrat client
    const { data: comptesBancaires, error: comptesError } = await supabase
      .from('bq_compte_bancaire')
      .select('id, code, iban')
      .eq('com_contrat_client_id', contratClientId)
      .eq('actif', true);

    if (comptesError) {
      throw new Error(formatErrorMessage(
        BankEntryErrorCode.GENERAL_ERROR,
        "Impossible d'accéder aux comptes bancaires",
        `Détail technique: ${comptesError.message}`
      ));
    }

    if (!comptesBancaires || comptesBancaires.length === 0) {
      throw new Error(formatErrorMessage(
        BankEntryErrorCode.NO_ACCOUNTS,
        "Aucun compte bancaire actif trouvé",
        "Veuillez créer au moins un compte bancaire actif avant d'importer des relevés"
      ));
    }

    console.log(`${comptesBancaires.length} comptes bancaires trouvés`);
    progress.phase = `${comptesBancaires.length} comptes bancaires trouvés`;
    onProgress?.(progress);

    // Créer une Map pour faciliter la recherche des comptes par IBAN
    const comptesMap = new Map<string, string>();
    comptesBancaires.forEach(compte => {
      // Normaliser l'IBAN en supprimant les espaces pour la comparaison
      const ibanNormalized = compte.iban.replace(/\s+/g, '');
      comptesMap.set(ibanNormalized, compte.id);
      
      // Ajouter aussi une version avec les 10 derniers caractères pour les cas où seule la fin est stockée
      if (ibanNormalized.length > 10) {
        const ibanEnd = ibanNormalized.slice(-10);
        comptesMap.set(ibanEnd, compte.id);
      }
    });

    progress.phase = 'Récupération des lignes à traiter';
    onProgress?.(progress);
    
    // 2. Récupérer les lignes à traiter
    const { data: lignesATraiter, error: lignesError } = await supabase
      .from('bq_import_releves_brut_detail')
      .select('*')
      .eq('com_contrat_client_id', contratClientId)
      .in('traite', ['A TRAITER', 'ERREUR']);

    if (lignesError) {
      throw new Error(formatErrorMessage(
        BankEntryErrorCode.GENERAL_ERROR,
        "Impossible d'accéder aux lignes à traiter",
        `Détail technique: ${lignesError.message}`
      ));
    }

    if (!lignesATraiter || lignesATraiter.length === 0) {
      addToast({
        label: 'Aucune ligne à traiter ou en erreur trouvée',
        icon: 'Info',
        color: '#3b82f6'
      });
      return {
        success: true,
        created: 0,
        duplicates: 0,
        errors: 0,
        errorMessages: []
      };
    }

    console.log(`${lignesATraiter.length} lignes à traiter ou en erreur trouvées`);
    
    // Mettre à jour la progression
    progress.total = lignesATraiter.length;
    progress.phase = `Traitement de ${lignesATraiter.length} lignes (statuts: A TRAITER, ERREUR)`;
    onProgress?.(progress);

    // 3. Traiter chaque ligne
    for (let i = 0; i < lignesATraiter.length; i++) {
      const ligne = lignesATraiter[i];
      
      // Mettre à jour la progression
      progress.processed = i + 1;
      progress.currentLine = `Ligne ${i + 1}/${lignesATraiter.length}: ${ligne.descricao || 'Sans description'} (${ligne.valor} ${ligne.moeda || 'EUR'})`;
      progress.phase = 'Recherche du compte bancaire';
      onProgress?.(progress);
      
      try {
        // Normaliser le numéro de compte en supprimant les espaces
        const contaNormalized = (ligne.conta || '').replace(/\s+/g, '');
        // Normaliser le numéro de compte en supprimant les zéros non significatifs à gauche
        const contaNormalizedWithoutLeadingZeros = normalizeAccountNumber(contaNormalized);
        
        // Rechercher le compte bancaire correspondant
        let idCompte: string | undefined;
        
        // Essayer de trouver une correspondance exacte
        if (comptesMap.has(contaNormalizedWithoutLeadingZeros)) {
          idCompte = comptesMap.get(contaNormalizedWithoutLeadingZeros);
        } else if (comptesMap.has(contaNormalized)) {
          idCompte = comptesMap.get(contaNormalized);
        } else {
          // Essayer de trouver une correspondance partielle
          for (const [iban, id] of comptesMap.entries()) {
            if (contaNormalizedWithoutLeadingZeros.includes(iban) || 
                iban.includes(contaNormalizedWithoutLeadingZeros) ||
                contaNormalized.includes(iban) || 
                iban.includes(contaNormalized)) {
              idCompte = id;
              break;
            }
          }
        }

        if (!idCompte) {
          console.error(`Aucun compte bancaire trouvé pour: ${ligne.conta} (normalisé: ${contaNormalizedWithoutLeadingZeros})`);
          result.errors++;
          const errorMessage = formatErrorMessage(
            BankEntryErrorCode.ACCOUNT_NOT_FOUND,
            `Compte bancaire non trouvé`,
            `Numéro "${ligne.conta}" (normalisé: "${contaNormalizedWithoutLeadingZeros}") ne correspond à aucun IBAN configuré`
          );
          result.errorMessages.push(`Ligne ${ligne.id}: ${errorMessage}`);
          
          // Mettre à jour la progression
          progress.errors++;
          progress.phase = `Erreur: Compte bancaire non trouvé`;
          onProgress?.(progress);
          
          // Mettre à jour la ligne comme erreur
          await supabase
            .from('bq_import_releves_brut_detail')
            .update({ 
              traite: 'ERREUR',
              message: errorMessage
            })
            .eq('id', ligne.id);
            
          continue;
        }

        progress.phase = 'Vérification des doublons';
        onProgress?.(progress);
        
        // 4. Vérifier si l'écriture existe déjà en tenant compte des valeurs null
        let query = supabase
          .from('bq_ecriture_bancaire')
          .select('id')
          .eq('id_compte', idCompte)
          .eq('data_lancamento', ligne.data_lancamento);
        
        // Utiliser .eq() pour les valeurs non nulles et .is() pour les valeurs null
        if (ligne.valor === null) {
          query = query.is('valor', null);
        } else {
          query = query.eq('valor', ligne.valor);
        }
        
        if (ligne.descricao === null || ligne.descricao === undefined || ligne.descricao === '') {
          query = query.is('descricao', null);
        } else {
          query = query.eq('descricao', ligne.descricao);
        }
        
        if (ligne.saldo === null) {
          query = query.is('saldo', null);
        } else {
          query = query.eq('saldo', ligne.saldo);
        }
        
        const { data: ecrituresExistantes, error: ecrituresError } = await query;

        if (ecrituresError) {
          console.error(`Erreur technique lors de la vérification des doublons: ${ecrituresError.message}`);
          result.errors++;
          const errorMessage = formatErrorMessage(
            BankEntryErrorCode.DUPLICATE_CHECK_FAILED,
            `Impossible de vérifier les doublons`,
            `Détail technique: ${ecrituresError.message}`
          );
          result.errorMessages.push(`Ligne ${ligne.id}: ${errorMessage}`);
          
          // Mettre à jour la progression
          progress.errors++;
          progress.phase = `Erreur: Vérification des doublons impossible`;
          onProgress?.(progress);
          
          // Mettre à jour la ligne comme erreur
          await supabase
            .from('bq_import_releves_brut_detail')
            .update({ 
              traite: 'ERREUR',
              message: errorMessage
            })
            .eq('id', ligne.id);
            
          continue;
        }

        if (ecrituresExistantes && ecrituresExistantes.length > 0) {
          // Cas 2 - Doublon trouvé
          const idEcritureExistante = ecrituresExistantes[0].id;
          
          // Mettre à jour la ligne comme doublon
          await supabase
            .from('bq_import_releves_brut_detail')
            .update({
              traite: 'DOUBLON',
              id_bq_mouvement: idEcritureExistante
            })
            .eq('id', ligne.id);
            
          result.duplicates++;
          progress.duplicates++;
          progress.phase = `Doublon trouvé pour la ligne ${i + 1}/${lignesATraiter.length}`;
          onProgress?.(progress);
          
          console.log(`Doublon trouvé pour la ligne ${ligne.id}, écriture existante: ${idEcritureExistante}`);
        } else {
          // Cas 1 - Nouvelle écriture à créer
          progress.phase = `Création d'une nouvelle écriture pour la ligne ${i + 1}/${lignesATraiter.length}`;
          onProgress?.(progress);
          
          // Préparer les données pour l'insertion en gérant correctement les valeurs null
          const insertData = {
            com_contrat_client_id: contratClientId,
            id_compte: idCompte,
            data_lancamento: ligne.data_lancamento,
            data_valor: ligne.data_valor,
            descricao: ligne.descricao,
            valor: ligne.valor,
            saldo: ligne.saldo,
            referencia_doc: ligne.referencia_doc,
            source_import_id: ligne.id
          };
          
          // Vérifier que les valeurs numériques ne sont pas des chaînes "null"
          if (insertData.valor === "null") insertData.valor = null;
          if (insertData.saldo === "null") insertData.saldo = null;
          
          const { data: nouvelleEcriture, error: insertError } = await supabase
            .from('bq_ecriture_bancaire')
            .insert(insertData)
            .select()
            .single();

          if (insertError) {
            console.error(`Erreur technique lors de l'insertion de l'écriture: ${insertError.message}`);
            result.errors++;
            const errorMessage = formatErrorMessage(
              BankEntryErrorCode.ENTRY_CREATION_FAILED,
              `Impossible de créer l'écriture bancaire`,
              `Détail technique: ${insertError.message}`
            );
            result.errorMessages.push(`Ligne ${ligne.id}: ${errorMessage}`);
            
            // Mettre à jour la progression
            progress.errors++;
            progress.phase = `Erreur: Création de l'écriture impossible`;
            onProgress?.(progress);
            
            // Mettre à jour la ligne comme erreur
            await supabase
              .from('bq_import_releves_brut_detail')
              .update({ 
                traite: 'ERREUR',
                message: errorMessage
              })
              .eq('id', ligne.id);
              
            continue;
          }

          // Mettre à jour la ligne comme créée
          await supabase
            .from('bq_import_releves_brut_detail')
            .update({
              traite: 'CREER',
              id_bq_mouvement: nouvelleEcriture.id,
              message: 'Écriture bancaire créée avec succès'
            })
            .eq('id', ligne.id);
            
          result.created++;
          progress.created++;
          progress.phase = `Écriture créée pour la ligne ${i + 1}/${lignesATraiter.length}`;
          onProgress?.(progress);
          
          console.log(`Nouvelle écriture créée pour la ligne ${ligne.id}, ID: ${nouvelleEcriture.id}`);
        }
      } catch (error: any) {
        console.error(`Erreur lors du traitement de la ligne ${ligne.id}:`, error);
        result.errors++;
        const errorMessage = formatErrorMessage(
          BankEntryErrorCode.GENERAL_ERROR,
          `Erreur inattendue lors du traitement`,
          error.message
        );
        result.errorMessages.push(`Ligne ${ligne.id}: ${errorMessage}`);
        
        // Mettre à jour la progression
        progress.errors++;
        progress.phase = `Erreur: ${error.message}`;
        onProgress?.(progress);
        
        // Mettre à jour la ligne comme erreur
        await supabase
          .from('bq_import_releves_brut_detail')
          .update({ 
            traite: 'ERREUR',
            message: errorMessage
          })
          .eq('id', ligne.id);
      }
    }

    // Finalisation
    progress.phase = 'Traitement terminé';
    onProgress?.(progress);
    
    // 5. Résumé du traitement
    result.success = true;
    
    // Afficher un toast avec le résumé
    const message = `Traitement terminé: ${result.created} écriture(s) créée(s), ${result.duplicates} doublon(s), ${result.errors} erreur(s)`;
    const detailMessage = result.errors > 0 
      ? "Consultez les détails des imports pour voir les erreurs spécifiques"
      : "";
    
    if (result.errors > 0) {
      addToast({
        label: `${message}. ${detailMessage}`,
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
    } else {
      addToast({
        label: message,
        icon: 'Check',
        color: '#22c55e'
      });
    }

    return result;
  } catch (error: any) {
    console.error('Erreur lors du traitement des écritures bancaires:', error);
    
    // Mettre à jour la progression en cas d'erreur globale
    progress.phase = `Erreur globale: ${error.message}`;
    progress.errors++;
    onProgress?.(progress);
    
    addToast({
      label: `Erreur lors du traitement: ${error.message}`,
      icon: 'AlertTriangle',
      color: '#ef4444'
    });
    
    return {
      success: false,
      created: result.created,
      duplicates: result.duplicates,
      errors: result.errors + 1,
      errorMessages: [...result.errorMessages, error.message]
    };
  }
}