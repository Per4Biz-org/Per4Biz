/*
  # Suppression du champ code_user de la table rh_personnel

  1. Modifications
    - Suppression de la colonne `code_user` de la table rh_personnel
    - Suppression de l'index associé à cette colonne
    
  2. Objectif
    - Simplifier la structure de la table
    - Éliminer un champ redondant qui n'est plus nécessaire
*/

-- Suppression de l'index sur code_user s'il existe
DROP INDEX IF EXISTS idx_rh_personnel_code_user;

-- Suppression de la colonne code_user
ALTER TABLE rh_personnel 
DROP COLUMN IF EXISTS code_user;

-- Vérification de la suppression
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rh_personnel' 
    AND column_name = 'code_user'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE WARNING '❌ Échec de la suppression de la colonne code_user de la table rh_personnel';
  ELSE
    RAISE NOTICE '✅ La colonne code_user a été supprimée avec succès de la table rh_personnel';
  END IF;
END $$;