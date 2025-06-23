/**
 * Utilitaire pour le parsing des définitions de colonnes au format "nom : type"
 */

/**
 * Types de colonnes supportés
 */
export type ColumnType = 'texte' | 'date' | 'montant';

/**
 * Interface pour une définition de colonne parsée
 */
export interface ParsedColumnDefinition {
  sourceName: string;    // Nom original dans la définition (ex: "companhia")
  targetName: string;    // Nom standardisé en minuscules (ex: "companhia")
  type: ColumnType;      // Type de la colonne (texte, date, montant)
  originalDefinition: string; // Définition originale complète (ex: "companhia : texte")
}

/**
 * Parse une définition de colonne au format "nom : type"
 * @param definition Définition de colonne (ex: "companhia : texte")
 * @returns Objet ParsedColumnDefinition ou null si le format est invalide
 */
export function parseColumnDefinition(definition: string): ParsedColumnDefinition | null {
  // Nettoyer la définition
  const cleanDefinition = definition.trim();
  
  // Vérifier si la définition est vide
  if (!cleanDefinition) {
    return null;
  }
  
  // Vérifier si la définition contient un séparateur ":"
  if (!cleanDefinition.includes(':')) {
    // Si pas de séparateur, considérer que c'est juste un nom de colonne de type texte
    return {
      sourceName: cleanDefinition,
      targetName: cleanDefinition.toLowerCase(),
      type: 'texte',
      originalDefinition: cleanDefinition
    };
  }
  
  // Diviser la définition en nom et type
  const [nameRaw, typeRaw] = cleanDefinition.split(':').map(part => part.trim());
  
  // Vérifier que le nom n'est pas vide
  if (!nameRaw) {
    return null;
  }
  
  // Déterminer le type (par défaut: texte)
  let type: ColumnType = 'texte';
  
  if (typeRaw) {
    const typeLower = typeRaw.toLowerCase();
    
    if (typeLower === 'date' || typeLower.includes('date')) {
      type = 'date';
    } else if (typeLower === 'montant' || typeLower.includes('montant') || 
               typeLower === 'nombre' || typeLower.includes('nombre') || 
               typeLower === 'number' || typeLower.includes('numeric')) {
      type = 'montant';
    }
  }
  
  return {
    sourceName: nameRaw,
    targetName: nameRaw.toLowerCase(),
    type,
    originalDefinition: cleanDefinition
  };
}

/**
 * Parse un tableau de définitions de colonnes
 * @param definitions Tableau de définitions de colonnes
 * @returns Tableau d'objets ParsedColumnDefinition (les définitions invalides sont ignorées)
 */
export function parseColumnDefinitions(definitions: string[]): ParsedColumnDefinition[] {
  return definitions
    .map(def => parseColumnDefinition(def))
    .filter((def): def is ParsedColumnDefinition => def !== null);
}