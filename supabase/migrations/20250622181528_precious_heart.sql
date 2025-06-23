/*
  # Renommage du champ facture_rf en facture_rh dans la table com_param_type_facture

  1. Modifications
    - Renommage de la colonne `facture_rf` en `facture_rh`
    
  2. Objectif
    - Corriger le nom du champ pour refléter sa véritable signification (RH = Ressources Humaines)
    - Maintenir la cohérence avec la nomenclature de l'application
*/

-- Renommage de la colonne facture_rf en facture_rh
ALTER TABLE com_param_type_facture 
RENAME COLUMN facture_rf TO facture_rh;

-- Vérification du renommage
DO $$
DECLARE
  column_exists BOOLEAN;
  old_column_exists BOOLEAN;
BEGIN
  -- Vérifier que la nouvelle colonne existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'com_param_type_facture' 
    AND column_name = 'facture_rh'
  ) INTO column_exists;
  
  -- Vérifier que l'ancienne colonne n'existe plus
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'com_param_type_facture' 
    AND column_name = 'facture_rf'
  ) INTO old_column_exists;
  
  IF column_exists AND NOT old_column_exists THEN
    RAISE NOTICE '✅ La colonne facture_rf a été renommée avec succès en facture_rh';
  ELSE
    IF NOT column_exists THEN
      RAISE WARNING '❌ La colonne facture_rh n''existe pas après le renommage';
    END IF;
    
    IF old_column_exists THEN
      RAISE WARNING '❌ La colonne facture_rf existe toujours après le renommage';
    END IF;
  END IF;
END $$;