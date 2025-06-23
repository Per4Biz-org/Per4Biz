import Papa from 'papaparse';
import { FormatImport, normalizeAccountNumber } from '../../../utils/excelImportUtils';
import { parseDate, parseNumericValue } from '../../../utils/excelImportUtils';
import { parseColumnDefinitions, ParsedColumnDefinition } from '../../../utils/columnParsing';

interface CSVRow {
  [key: string]: string;
}

interface ParseCSVResult {
  success: boolean;
  data: CSVRow[];
  errors: string[];
}

/**
 * Parse un fichier CSV selon un format d'import spécifié
 * @param file Fichier CSV à parser
 * @param format Format d'import à utiliser
 * @returns Résultat du parsing avec les données et les erreurs éventuelles
 */
export async function parseCSVFile(
  file: File, 
  format: FormatImport, 
  parsedColumnDefs: ParsedColumnDefinition[] = []
): Promise<ParseCSVResult> {
  return new Promise((resolve) => {
    // Si les définitions de colonnes ne sont pas fournies, les parser à partir du format
    if (parsedColumnDefs.length === 0 && format.colonnes && format.colonnes.length > 0) {
      parsedColumnDefs = parseColumnDefinitions(format.colonnes);
      console.log('Définitions de colonnes parsées:', parsedColumnDefs);
    }
    
    // Déterminer le séparateur
    // Utiliser directement le séparateur défini dans le format
    let delimiter = format.separateur;
    
    // Correction pour le séparateur tabulation qui est stocké comme '\t' dans la base
    if (delimiter === '\\t') delimiter = '\t';

    console.log(`Utilisation du séparateur: "${delimiter}" pour le fichier CSV`);

    // Préparer les options de parsing
    const parseOptions: Papa.ParseConfig = {
      header: true,
      skipEmptyLines: true,
      delimiter,
      encoding: format.encodage || 'utf-8',
      transformHeader: (header) => header.trim(),
      // Désactiver la détection automatique du délimiteur
      delimitersToGuess: [],
    };
    
    // Si le format a des colonnes définies, les utiliser comme en-têtes
    if (format.colonnes && format.colonnes.length > 0) {
      // Extraire les noms de colonnes (sans les types)
      const columnNames = parsedColumnDefs.length > 0
        ? parsedColumnDefs.map(def => def.sourceName)
        : format.colonnes.map(col => col.split(':')[0].trim());
        
      console.log('Noms de colonnes extraits pour le mapping CSV:', columnNames);
      
      // Utiliser les noms de colonnes comme en-têtes si la première ligne ne contient pas d'en-têtes
      if (format.premiere_ligne_donnees > 1) {
        parseOptions.header = columnNames;
      }
    }

    // Lire le contenu du fichier pour le déboguer
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        // Afficher les premières lignes pour le débogage
        const lines = content.split('\n').slice(0, 5);
        console.log('Premières lignes du fichier CSV:', lines);
        
        // Vérifier si le séparateur est correct
        const firstLine = lines[0];
        const countDelimiter = (firstLine.match(new RegExp(delimiter, 'g')) || []).length;
        console.log(`Nombre d'occurrences du séparateur "${delimiter}" dans la première ligne: ${countDelimiter}`);
        
        // Si le séparateur défini ne semble pas être le bon, essayer de le détecter
        if (countDelimiter < 2) {
          const potentialDelimiters = [',', ';', '\t', '|'];
          const counts = potentialDelimiters.map(d => {
            const regex = new RegExp(d === '\t' ? '\t' : d, 'g');
            return {
              delimiter: d,
              count: (firstLine.match(regex) || []).length
            };
          });
          
          // Trouver le délimiteur le plus fréquent
          const bestDelimiter = counts.sort((a, b) => b.count - a.count)[0];
          console.log('Délimiteur détecté automatiquement:', bestDelimiter);
          
          if (bestDelimiter.count > countDelimiter) {
            console.log(`Remplacement du délimiteur "${delimiter}" par "${bestDelimiter.delimiter}"`);
            delimiter = bestDelimiter.delimiter;
            parseOptions.delimiter = delimiter;
          }
        }
      }
    // Analyser le fichier avec PapaParse
    Papa.parse(file, {
      ...parseOptions,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('Erreurs de parsing CSV:', results.errors);
          
          // Vérifier si les erreurs sont liées au séparateur
          const separatorErrors = results.errors.filter(err => 
            err.message.includes('Too many fields') || 
            err.message.includes('Too few fields')
          );
          
          if (separatorErrors.length > 0) {
            resolve({
              success: false,
              data: [],
              errors: [
                ...separatorErrors.map(err => `${err.message}`),
                `Le séparateur utilisé dans le fichier ne correspond pas à celui défini dans le format (${delimiter === '\t' ? 'Tabulation' : delimiter}).`,
                `Vérifiez que votre fichier CSV utilise bien le séparateur ${delimiter === '\t' ? 'Tabulation' : delimiter} entre chaque colonne.`
              ]
            });
            return;
          }
          
          resolve({
            success: false,
            data: [],
            errors: results.errors.map(err => `Ligne ${err.row}: ${err.message}`)
          });
          return;
        }

        let data = results.data as CSVRow[];
        
        console.log('Données brutes après parsing CSV:', data.slice(0, 2));
        
        // Si le format a des colonnes définies et que nous avons désactivé l'en-tête automatique,
        // nous devons mapper manuellement les colonnes
        if (format.colonnes && format.colonnes.length > 0 && Array.isArray(parseOptions.header)) {
          // Extraire les noms de colonnes (sans les types)
          const columnNames = parsedColumnDefs.length > 0
            ? parsedColumnDefs.map(def => def.sourceName)
            : format.colonnes.map(col => col.split(':')[0].trim());
          
          // Créer un map des définitions de colonnes pour un accès rapide
          const columnDefMap = new Map<string, ParsedColumnDefinition>();
          parsedColumnDefs.forEach(def => {
            columnDefMap.set(def.sourceName.toLowerCase(), def);
          });
          
          // Mapper les données en utilisant les noms de colonnes extraits
          data = results.data.map((row: any) => {
            const mappedRow: CSVRow = {};
            
            // Convertir la ligne en tableau si ce n'est pas déjà le cas
            const rowArray = Array.isArray(row) ? row : Object.values(row);
            
            // Associer chaque valeur au nom de colonne correspondant
            columnNames.forEach((columnName, index) => {
              if (index < rowArray.length) {
                const value = rowArray[index];
                
                // Récupérer la définition de colonne si disponible
                const columnDef = columnDefMap.get(columnName.toLowerCase());
                
                // Traiter la valeur selon le type de la colonne
                if (columnDef) {
                  switch (columnDef.type) {
                    case 'date':
                      mappedRow[columnName] = parseDate(value) || value?.toString() || '';
                      break;
                      
                    case 'montant':
                      const numValue = parseNumericValue(value);
                      mappedRow[columnName] = numValue !== null ? numValue.toString() : value?.toString() || '';
                      break;
                      
                    case 'texte':
                    default:
                      mappedRow[columnName] = value?.toString() || '';
                      break;
                  }
                } else {
                  // Si pas de définition, traiter comme du texte
                  mappedRow[columnName] = value?.toString() || '';
                }
                
                // Normaliser le numéro de compte (conta) en supprimant les zéros non significatifs à gauche
                if (columnName.toLowerCase() === 'conta' && mappedRow[columnName]) {
                  mappedRow[columnName] = normalizeAccountNumber(mappedRow[columnName]);
                }
              }
            });
            
            return mappedRow;
          });
        }
        
        if (data.length === 0) {
          resolve({
            success: false,
            data: [],
            errors: ['Le fichier ne contient aucune donnée']
          });
          return;
        }

        // Vérifier que toutes les colonnes définies dans le format sont présentes
        const availableColumns = Object.keys(data[0]);
        console.log('Colonnes disponibles dans le fichier:', availableColumns);
        
        // Extraire les noms de colonnes des définitions
        const requiredColumns = parsedColumnDefs.map(def => def.sourceName);
        console.log('Colonnes requises selon le format:', requiredColumns);
        
        // Vérifier les colonnes manquantes
        const missingColumns = requiredColumns.filter(col => 
          !availableColumns.some(header => 
            header.toLowerCase() === col.toLowerCase()
          )
        );

        if (missingColumns.length > 0) {
          resolve({
            success: false,
            data: [],
            errors: [
              `Colonnes manquantes: ${missingColumns.join(', ')}`,
              `Vérifiez que l'ordre des colonnes dans le fichier correspond à celui défini dans le format d'import.`,
              `Colonnes attendues: ${requiredColumns.join(', ')}`,
              `Colonnes trouvées: ${availableColumns.join(', ')}`
            ]
          });
          return;
        }

        // Traiter les dates et les valeurs numériques pour les colonnes qui n'ont pas encore été traitées
        const processedData = data.map(row => {
          const processedRow = { ...row };
          
          // Appliquer le traitement selon les définitions de colonnes
          parsedColumnDefs.forEach(def => {
            const columnName = def.sourceName;
            
            // Vérifier si la colonne existe dans la ligne
            if (columnName in row) {
              const value = row[columnName];
              
              // Traiter selon le type
              switch (def.type) {
                case 'date':
                  // Convertir en date et s'assurer que null est retourné si la conversion échoue
                  const parsedDate = parseDate(value);
                  processedRow[columnName] = parsedDate;
                  console.log(`Conversion date pour ${columnName}: "${value}" → ${parsedDate}`);
                  break;
                  
                case 'montant':
                  const numValue = parseNumericValue(value);
                  processedRow[columnName] = numValue;
                  console.log(`Conversion montant pour ${columnName}: "${value}" → ${numValue}`);
                  break;
                  
                case 'texte':
                default:
                  // Garder la valeur telle quelle
                  break;
              }
            }
          });
          
          return processedRow;
        });

        console.log('Données traitées après conversion des types:', processedData.slice(0, 2));

        resolve({
          success: true,
          data: processedData,
          errors: []
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [`Erreur lors de l'analyse du fichier: ${error.message}`]
        });
      },
      beforeFirstChunk: (chunk) => {
        // Ignorer les premières lignes selon le format
        if (format.premiere_ligne_donnees > 1) {
          const lines = chunk.split('\n');
          console.log(`Ignorer les ${format.premiere_ligne_donnees - 1} premières lignes du fichier`);
          return lines.slice(format.premiere_ligne_donnees - 1).join('\n');
        }
        return chunk;
      }
    });
    };
    
    reader.readAsText(file, format.encodage || 'utf-8');
  });
}