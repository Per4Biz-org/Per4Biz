/*
  # Ajout du champ message à la table bq_import_releves_brut_detail

  1. Modifications
    - Ajout d'un champ `message` de type TEXT
    - Le champ est nullable pour permettre des lignes sans message d'erreur
    
  2. Objectif
    - Permettre de stocker des messages d'erreur ou d'information sur chaque ligne
    - Faciliter le débogage et le suivi des problèmes d'importation
    - Améliorer la traçabilité du processus d'importation
*/

-- Ajout de la colonne message (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bq_import_releves_brut_detail' AND column_name = 'message'
  ) THEN
    ALTER TABLE bq_import_releves_brut_detail ADD COLUMN message TEXT;
    RAISE NOTICE 'Colonne message ajoutée à la table bq_import_releves_brut_detail';
  ELSE
    RAISE NOTICE 'La colonne message existe déjà dans la table bq_import_releves_brut_detail';
  END IF;
END $$;

-- Vérification de l'ajout de la colonne
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bq_import_releves_brut_detail' 
    AND column_name = 'message'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ La colonne message a été ajoutée avec succès à la table bq_import_releves_brut_detail';
  ELSE
    RAISE WARNING '❌ Échec de l''ajout de la colonne message à la table bq_import_releves_brut_detail';
  END IF;
END $$;