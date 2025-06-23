import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { parseColumnDefinitions, ParsedColumnDefinition, ColumnType } from './columnParsing';

/**
 * Normalise un numéro de compte bancaire en supprimant les zéros non significatifs à gauche
 * @param accountNumber Numéro de compte à normaliser
 * @returns Numéro de compte normalisé
 */
export function normalizeAccountNumber(accountNumber: string | null | undefined): string {
  if (!accountNumber) return '';
  
  // Supprimer les espaces et autres caractères non numériques
  const cleanedNumber = accountNumber.replace(/[^0-9]/g, '');
  
  // Supprimer les zéros non significatifs à gauche
  return cleanedNumber.replace(/^0+/, '');
}

// Constantes pour les noms de colonnes standards
export const STANDARD_COLUMN_NAMES = {
  DATE_OPERATION: ['data_lancamento', 'DATA_LANCAMENTO', 'date', 'DATE', 'date_operation', 'DATE_OPERATION'],
  DATE_VALEUR: ['data_valor', 'DATA_VALOR', 'date_valeur', 'DATE_VALEUR'],
  MONTANT: ['valor', 'VALOR', 'montant', 'MONTANT'],
  SOLDE: ['saldo', 'SALDO', 'solde', 'SOLDE'],
  DESCRIPTION: ['descricao', 'DESCRICAO', 'libelle', 'LIBELLE', 'description', 'DESCRIPTION'],
  REFERENCE: ['referencia_doc', 'REFERENCIA_DOC', 'reference', 'REFERENCE']
};

/**
 * Interface pour le format d'import
 */
export interface FormatImport {
  id: number;
  code: string;
  libelle: string;
  banque: string;
  extension: string | null;
  encodage: string;
  separateur: string;
  premiere_ligne_donnees: number;
  colonnes: string[] | null;
}

/**
 * Interface pour les options d'import
 */
export interface ImportOptions {
  formatId: number;
  format?: FormatImport;
  contratClientId: string;
  requiredColumns?: string[];
  requiredColumnPatterns?: string[];
  columnMappings?: Record<string, string>;
  dateColumns?: string[];
  numericColumns?: string[];
  validateRow?: (row: Record<string, any>) => string | null;
  formatColumns?: string[] | null; // Colonnes définies dans le format d'import
  parsedColumnDefs?: ParsedColumnDefinition[]; // Définitions de colonnes parsées
}

/**
 * Interface pour les résultats d'import
 */
export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  rawData?: any[];
}

/**
 * Fonction utilitaire pour convertir les dates Excel
 * @param excelValue Valeur numérique de date Excel
 * @returns Date au format YYYY-MM-DD ou null si conversion impossible
 */
export function parseExcelDate(excelValue: any): string | null {
  if (typeof excelValue !== 'number' && typeof excelValue !== 'string') return null;
  
  try {
    // Si c'est une chaîne, essayer de la parser comme une date
    if (typeof excelValue === 'string') {
      return parseDate(excelValue.trim());
    }
    
    // Utiliser XLSX.SSF.parse_date_code pour convertir le code de date Excel
    if (typeof XLSX.SSF?.parse_date_code !== 'function') {
      console.warn('XLSX.SSF.parse_date_code n\'est pas disponible, utilisation de la méthode alternative');
      // Méthode alternative: Excel utilise le nombre de jours depuis le 1/1/1900
      // avec un décalage de 2 jours (bug Excel historique)
      const excelEpoch = new Date(1899, 11, 30); // 30/12/1899
      const resultDate = new Date(excelEpoch);
      resultDate.setDate(excelEpoch.getDate() + excelValue);
      
      return resultDate.toISOString().split('T')[0];
    }
    
    const dateObj = XLSX.SSF.parse_date_code(excelValue);
    
    // Formater la date au format YYYY-MM-DD
    const year = dateObj.y;
    const month = String(dateObj.m).padStart(2, '0');
    const day = String(dateObj.d).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.warn(`Impossible de convertir la date Excel: ${excelValue}`, e);
    return null;
  }
}

/**
 * Fonction utilitaire pour parser les valeurs numériques avec format européen
 * @param value Valeur à convertir
 * @returns Nombre ou null si conversion impossible
 */
export function parseNumericValue(value: any): number | null {
  if (value === undefined || value === null || value === '') return null;
  
  console.log(`parseNumericValue - Entrée:`, value, `Type:`, typeof value);

  // Si c'est déjà un nombre
  if (typeof value === 'number') {
    // Corriger le cas où la valeur a perdu la virgule (ex : -6650 → -66.50)
    // Détection des grands nombres entiers qui devraient avoir 2 décimales
    if (Number.isInteger(value) && Math.abs(value) >= 100 && 
        (Math.abs(value) % 100 === 0 || Math.abs(value) % 100 < 100)) {
      console.log(`parseNumericValue - Correction de valeur Excel: ${value} → ${value/100}`);
      return value / 100;
    }
    return value;
  }

  // Convertir en chaîne pour traitement uniforme
  const valueStr = value.toString().trim();
  
  // Format portugais/européen: "1.234,56" → "1234.56"
  let normalized = valueStr;
  
  // Si la chaîne contient à la fois un point et une virgule, c'est probablement au format européen
  if (valueStr.includes('.') && valueStr.includes(',')) {
    // 1. Supprimer tous les points (séparateurs de milliers)
    // 2. Remplacer la virgule par un point (séparateur décimal)
    normalized = valueStr.replace(/\./g, '').replace(',', '.');
    console.log(`parseNumericValue - Format européen détecté: "${valueStr}" → "${normalized}"`);
  } 
  // Si la chaîne contient seulement une virgule, c'est probablement un séparateur décimal
  else if (valueStr.includes(',') && !valueStr.includes('.')) {
    // Remplacer la virgule par un point
    normalized = valueStr.replace(',', '.');
    console.log(`parseNumericValue - Virgule comme séparateur décimal: "${valueStr}" → "${normalized}"`);
  }
  // Sinon, on garde la valeur telle quelle (déjà au format anglo-saxon ou sans séparateur)
  
  const parsed = parseFloat(normalized);
  console.log(`parseNumericValue - Résultat final: "${valueStr}" → ${parsed}`);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Fonction utilitaire pour parser les dates dans différents formats
 * @param dateStr Chaîne de date à parser
 * @returns Date au format YYYY-MM-DD ou null si conversion impossible
 */
export function parseDate(value: any): string | null {
  if (value === undefined || value === null || value === '') return null;
  
  console.log(`parseDate - Entrée:`, value, `Type:`, typeof value);
  
  // Si c'est un nombre, c'est probablement une date Excel
  if (typeof value === 'number') {
    const result = parseExcelDate(value);
    console.log(`parseDate - Conversion date Excel: ${value} → ${result}`);
    return result;
  }
  
  // Convertir en chaîne pour traitement uniforme
  const dateStr = String(value).trim();
  if (!dateStr) return null;

  // Essayer différents formats de date
  try {
    // Format JJ/MM/AAAA
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/').map(Number);
      const result = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      console.log(`parseDate - Format JJ/MM/AAAA: ${dateStr} → ${result}`);
      return result;
    }

    // Format JJ/MM/AA
    if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(dateStr)) {
      const [day, month, shortYear] = dateStr.split('/').map(Number);
      const year = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;
      const result = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      console.log(`parseDate - Format JJ/MM/AA: ${dateStr} → ${result}`);
      return result;
    }

    // Format AAAA-MM-JJ
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      const [year, monthOrDay, dayOrMonth] = dateStr.split('-').map(Number);
      
      // Vérifier si le "mois" est > 12, ce qui indiquerait un format YYYY-DD-MM
      if (monthOrDay > 12) {
        // C'est probablement un format YYYY-DD-MM, donc inverser jour et mois
        const month = dayOrMonth;
        const day = monthOrDay;
        const result = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        console.log(`parseDate - Format YYYY-DD-MM: ${dateStr} → ${result}`);
        return result;
      } else {
        // Format correct YYYY-MM-DD
        const result = `${year}-${monthOrDay.toString().padStart(2, '0')}-${dayOrMonth.toString().padStart(2, '0')}`;
        console.log(`parseDate - Format YYYY-MM-DD: ${dateStr} → ${result}`);
        return result;
      }
    }

    // Format JJ-MM-AAAA
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-').map(Number);
      const result = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      console.log(`parseDate - Format JJ-MM-AAAA: ${dateStr} → ${result}`);
      return result;
    }

    // Format avec texte (ex: "15 janvier 2023")
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const result = date.toISOString().split('T')[0];
      console.log(`parseDate - Format texte: ${dateStr} → ${result}`);
      return result;
    }
  } catch (e) {
    console.warn(`Impossible de parser la date: ${dateStr}`, e);
  }

  console.log(`parseDate - Aucun format reconnu pour: ${dateStr} → null`);
  return null;
}

/**
 * Récupère un format d'import depuis la base de données
 * @param formatId ID du format d'import
 * @returns Format d'import ou null si non trouvé
 */
export async function getImportFormat(formatId: number): Promise<FormatImport | null> {
  try {
    const { data, error } = await supabase
      .from('bq_format_import')
      .select('*')
      .eq('id', formatId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération du format d\'import:', error);
    return null;
  }
}

/**
 * Vérifie si un fichier a déjà été importé
 * @param fileName Nom du fichier
 * @param contratClientId ID du contrat client
 * @returns true si le fichier existe déjà, false sinon
 */
export async function checkFileExists(fileName: string, contratClientId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('bq_import_releves_brut')
      .select('id')
      .eq('com_contrat_client_id', contratClientId)
      .eq('nom_fichier', fileName)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Erreur lors de la vérification du nom de fichier:', error);
    return false;
  }
}

/**
 * Importe un fichier Excel selon un format spécifié
 * @param file Fichier à importer
 * @param options Options d'import
 * @returns Résultat de l'import
 */
export async function importExcelFile<T>(
  file: File, 
  options: ImportOptions
): Promise<ImportResult<T>> {
  console.log('Début importExcelFile avec options:', options);
  const result: ImportResult<T> = {
    success: false,
    data: [],
    errors: []
  };

  try {
    // 1. Récupérer le format d'import
    const format = await getImportFormat(options.formatId);
    if (!format) {
      result.errors.push('Format d\'import non trouvé');
      return result;
    }
    console.log('Format d\'import récupéré:', format);
    
    // 1.1 Parser les définitions de colonnes si disponibles
    let parsedColumnDefs = options.parsedColumnDefs || [];
    if (!parsedColumnDefs.length && format.colonnes && format.colonnes.length > 0) {
      parsedColumnDefs = parseColumnDefinitions(format.colonnes);
      console.log('Définitions de colonnes parsées:', parsedColumnDefs);
    }

    // 2. Vérifier l'extension du fichier
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isExcelFile = fileExtension === 'xls' || fileExtension === 'xlsx';
    
    if (isExcelFile) {
      console.log('Traitement d\'un fichier Excel');
      // 3. Lire le fichier Excel
      const data = await readExcelFile(file, format);
      
      // Ajouter les définitions de colonnes parsées aux options
      options.formatColumns = format.colonnes;
      options.parsedColumnDefs = parsedColumnDefs;
      
      // Mettre à jour les options avec les informations de type
      if (parsedColumnDefs.length > 0) {
        // Extraire les colonnes de date et numériques des définitions
        options.dateColumns = parsedColumnDefs
          .filter(def => def.type === 'date')
          .map(def => def.sourceName);
          
        options.numericColumns = parsedColumnDefs
          .filter(def => def.type === 'montant')
          .map(def => def.sourceName);
          
        console.log('Colonnes de date détectées:', options.dateColumns);
        console.log('Colonnes numériques détectées:', options.numericColumns);
      }
      
      // 4. Convertir les données selon le format
      const processedData = processExcelData<T>(data, format, options, parsedColumnDefs);
      
      result.success = processedData.success;
      result.data = processedData.data;
      result.errors = processedData.errors;
      result.rawData = data;
      
      // Log des premières lignes traitées pour débogage
      if (processedData.data.length > 0) {
        console.log('Exemple de données traitées:', processedData.data.slice(0, 2));
      }
      
      return result;
    } else {
      result.errors.push('Format de fichier non supporté. Seuls les fichiers Excel (XLS, XLSX) sont pris en charge par cet utilitaire.');
      return result;
    }
  } catch (error: any) {
    console.error('Erreur dans importExcelFile:', error);
    result.errors.push(`Erreur lors de l'import: ${error.message}`);
    return result;
  }
}

/**
 * Lit un fichier Excel et retourne les données sous forme d'objets
 * @param file Fichier Excel à lire
 * @param format Format d'import à utiliser
 * @returns Promise avec les données du fichier
 */
async function readExcelFile(file: File, format: FormatImport): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Impossible de lire le fichier Excel'));
          return;
        }

        // Convertir les données binaires en workbook
        const workbook = XLSX.read(data, { type: 'binary' });

        // Prendre la première feuille
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Déterminer les options de conversion
        const sheetToJsonOptions: XLSX.Sheet2JSONOpts = {
          raw: true,     // Conserver les types de données originaux
          defval: null,  // Valeur par défaut pour les cellules vides
        };

        // Si le format spécifie une première ligne de données, l'utiliser comme en-tête
        if (format.premiere_ligne_donnees > 0) {
          // Utiliser la ligne spécifiée comme en-tête (0-based, donc -1)
          sheetToJsonOptions.range = format.premiere_ligne_donnees - 1;
        }

        // Si le format a des colonnes définies, les utiliser comme en-têtes
        if (format.colonnes && format.colonnes.length > 0) {
          // Extraire les noms de colonnes (sans les types)
          const columnNames = format.colonnes.map(col => {
            const parts = col.split(':');
            return parts[0].trim();
          });
          
          // Utiliser ces noms comme en-têtes
          sheetToJsonOptions.header = columnNames;
        }

        // Convertir la feuille en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, sheetToJsonOptions);

        console.log('Premières lignes du fichier Excel (après conversion):', jsonData.slice(0, 2));
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier Excel'));
    };
    
    // Lire le fichier comme un tableau binaire
    reader.readAsBinaryString(file);
  });
}

/**
 * Traite les données Excel selon le format spécifié
 * @param data Données brutes du fichier Excel
 * @param format Format d'import
 * @param options Options d'import
 * @returns Données traitées et erreurs éventuelles
 */
function processExcelData<T>(
  data: any[], 
  format: FormatImport, 
  options: ImportOptions,
  parsedColumnDefs: ParsedColumnDefinition[] = []
): ImportResult<T> {
  const result: ImportResult<T> = {
    success: false,
    data: [],
    errors: []
  };

  // Si le fichier est vide
  if (data.length === 0) {
    result.errors.push('Le fichier ne contient aucune donnée');
    return result;
  }

  // Vérifier que les colonnes requises sont présentes
  const headers = Object.keys(data[0] || {});
  console.log('En-têtes disponibles:', headers);

  // Utiliser les colonnes requises spécifiées ou les colonnes par défaut
  const requiredColumns = options.requiredColumns || ['data_lancamento', 'descricao', 'valor'];
  
  // Vérifier si les colonnes requises sont présentes
  const missingColumns = requiredColumns.filter(col => {
    // Vérifier si la colonne existe exactement
    if (headers.some(h => h.toLowerCase() === col.toLowerCase())) {
      return false;
    }
    
    // Vérifier si une colonne contient le nom requis
    if (headers.some(h => h.toLowerCase().includes(col.toLowerCase()))) {
      return false;
    }
    
    return true;
  });

  if (missingColumns.length > 0) {
    result.errors.push(`Colonnes requises manquantes: ${missingColumns.join(', ')}`);
    console.error('Colonnes manquantes:', missingColumns);
    console.error('Colonnes disponibles:', headers);
    return result;
  }

  // Traiter chaque ligne
  const processedRows: T[] = [];
  const rowErrors: string[] = [];

  console.log('Traitement de', data.length, 'lignes avec les définitions de colonnes:', parsedColumnDefs.length > 0 ? parsedColumnDefs : format.colonnes);

  data.forEach((row, index) => {
    try {
      const processedRow: Record<string, any> = {};
      
      // Appliquer les mappings de colonnes si spécifiés
      const mappings = options.columnMappings || {};
      
      // Créer un map des définitions de colonnes pour un accès rapide
      const columnDefMap = new Map<string, ParsedColumnDefinition>();
      parsedColumnDefs.forEach(def => {
        columnDefMap.set(def.sourceName.toLowerCase(), def);
      });
      
      // Traiter chaque colonne
      for (const [key, value] of Object.entries(row)) {
        // Ignorer les clés vides ou nulles
        if (key === null || key === undefined || key === '') {
          continue;
        }
        
        // Déterminer le nom de la colonne cible (utiliser le mapping ou le nom original)
        const targetKey = mappings[key] || key;
        
        // Vérifier si nous avons une définition de colonne pour cette clé
        const keyLower = key.toLowerCase();
        let columnDef = columnDefMap.get(keyLower);
        
        // Si pas de correspondance exacte, chercher une correspondance partielle
        if (!columnDef) {
          for (const [defKey, def] of columnDefMap.entries()) {
            if (keyLower.includes(defKey) || defKey.includes(keyLower)) {
              columnDef = def;
              console.log(`Correspondance partielle trouvée pour "${key}": ${def.sourceName} (${def.type})`);
              break;
            }
          }
        }
        
        // Si nous avons une définition de colonne, utiliser son type pour le traitement
        if (columnDef) {
          switch (columnDef.type) {
            case 'date':
              console.log(`Traitement de la colonne date "${key}": ${value}`);
              processedRow[targetKey] = parseDate(value);
              break;
              
            case 'montant':
              console.log(`Traitement de la colonne montant "${key}": ${value}`);
              processedRow[targetKey] = parseNumericValue(value);
              break;
              
            case 'texte':
            default:
              processedRow[targetKey] = value;
              break;
          }
          continue; // Passer à la colonne suivante
        }
        
        // Traiter les dates d'opération et de valeur
        const isDateOperationColumn = STANDARD_COLUMN_NAMES.DATE_OPERATION.some(
          dc => dc.toLowerCase() === key.toLowerCase()
        ) || key.toLowerCase().includes('data_lancamento');
        
        const isDateValeurColumn = STANDARD_COLUMN_NAMES.DATE_VALEUR.some(
          dc => dc.toLowerCase() === key.toLowerCase()
        ) || key.toLowerCase().includes('data_valor');
        
        // Traiter les dates (opération ou valeur) avec la même fonction parseDate
        if ((isDateOperationColumn || isDateValeurColumn) && value !== null) {
          console.log(`Conversion de date (${key}): ${value} (${typeof value})`);
          processedRow[targetKey] = parseDate(value);
          console.log(`Résultat conversion: ${processedRow[targetKey]}`);
        }
        // Traiter les valeurs numériques
        else if (options.numericColumns?.some(nc => nc.toLowerCase() === key.toLowerCase()) && value !== null) {
          console.log(`Avant conversion numérique: "${value}" (${typeof value})`);
          processedRow[targetKey] = parseNumericValue(value);
          console.log(`Après conversion numérique: "${value}" → ${processedRow[targetKey]}`);
        }
        // Autres valeurs
        else {
          processedRow[targetKey] = value;
        }
      }
      
      // Validation personnalisée de la ligne
      if (options.validateRow) {
        const validationError = options.validateRow(processedRow);
        if (validationError) {
          rowErrors.push(`Ligne ${index + 1}: ${validationError}`);
          return; // Passer à la ligne suivante
        }
      }
      
      processedRows.push(processedRow as unknown as T);
    } catch (error: any) {
      console.error(`Erreur ligne ${index + 1}:`, error, row);
      rowErrors.push(`Erreur lors du traitement de la ligne ${index + 1}: ${error.message}`);
    }
  });

  // Ajouter les erreurs de ligne aux erreurs globales
  result.errors.push(...rowErrors);
  
  // Définir le succès en fonction des erreurs
  result.success = result.errors.length === 0;
  result.data = processedRows;
  
  return result;
}

/**
 * Crée un import de relevés bancaires dans la base de données
 * @param fileName Nom du fichier
 * @param formatId ID du format d'import
 * @param contratClientId ID du contrat client
 * @param nbLignes Nombre de lignes importées
 * @returns ID de l'import créé ou null en cas d'erreur
 */
export async function createImportHeader(
  fileName: string,
  formatId: number,
  contratClientId: string,
  nbLignes: number
): Promise<number | null> {
  try {
    // Générer un UUID pour l'import
    const importId = crypto.randomUUID();
    
    console.log('Création de l\'entête d\'import:', {
      fileName,
      formatId,
      contratClientId,
      nbLignes
    });

    const { data, error } = await supabase
      .from('bq_import_releves_brut')
      .insert({
        com_contrat_client_id: contratClientId,
        import_id: importId,
        nom_fichier: fileName,
        id_format_import: formatId,
        nb_lignes: nbLignes,
        statut: 'EN_COURS',
        message: 'Import en cours'
      })
      .select()
      .single();

    if (error) throw error;
    console.log('Entête d\'import créé avec succès:', data);
    return data?.id || null;
  } catch (error) {
    console.error('Erreur lors de la création de l\'entête d\'import:', error);
    return null;
  }
}

/**
 * Met à jour le statut d'un import
 * @param importId ID de l'import
 * @param statut Nouveau statut
 * @param message Message associé au statut
 */
export async function updateImportStatus(
  importId: number,
  statut: 'EN_COURS' | 'TERMINE' | 'ERREUR',
  message: string
): Promise<void> {
  try {
    console.log(`Mise à jour du statut de l'import ${importId} : ${statut} - ${message}`);
    await supabase
      .from('bq_import_releves_brut')
      .update({
        statut,
        message
      })
      .eq('id', importId);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de l\'import:', error);
  }
}

/**
 * Insère les lignes de détail d'un import par lots
 * @param importId ID de l'import
 * @param contratClientId ID du contrat client
 * @param data Données à insérer
 * @param batchSize Taille des lots
 * @param progressCallback Callback pour suivre la progression
 * @returns true si succès, false sinon
 */
export async function insertImportDetails(
  importId: number,
  contratClientId: string,
  data: any[],
  batchSize: number = 100,
  progressCallback?: (current: number, total: number, message: string) => void
): Promise<boolean> {
  try {
    console.log(`Insertion de ${data.length} détails pour l'import ${importId}. Exemple de données:`, data.slice(0, 2));
    
    const batches = Math.ceil(data.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min((i + 1) * batchSize, data.length);
      const batch = data.slice(start, end);
      
      if (progressCallback) {
        progressCallback(
          end,
          data.length,
          `Import du lot ${i + 1}/${batches}...`
        );
      }

      console.log(`Traitement du lot ${i + 1}/${batches} (${batch.length} lignes)`);

      const detailsToInsert = batch.map(row => ({
        com_contrat_client_id: contratClientId,
        id_import: importId,
        traite: 'A TRAITER', // Définir explicitement le statut de traitement
        ...row
      }));

      // Les données ont déjà été traitées par processExcelData ou parseCSVFile
      // qui ont appliqué les conversions nécessaires selon les définitions de colonnes
      // du format d'import. Aucune conversion supplémentaire n'est nécessaire ici.
      
      // Normaliser le numéro de compte (conta) en supprimant les zéros non significatifs à gauche
      detailsToInsert.forEach(detail => {
        if (detail.conta) {
          detail.conta = normalizeAccountNumber(detail.conta);
        }
      });
      
      console.log(`Insertion des données déjà traitées. Exemple:`, 
        JSON.stringify(detailsToInsert.slice(0, 1), null, 2));

      const { error } = await supabase
        .from('bq_import_releves_brut_detail')
        .insert(detailsToInsert);

      if (error) {
        console.error('Erreur lors de l\'insertion des détails:', error);
        // Mettre à jour le statut de l'import en cas d'erreur
        await updateImportStatus(
          importId,
          'ERREUR',
          `Erreur lors de l'import des détails: ${error.message}`
        );
        throw error;
      }
    }
    console.log(`Insertion terminée avec succès pour l'import ${importId}`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'insertion des détails:', error);
    return false;
  }
}