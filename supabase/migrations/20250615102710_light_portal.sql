/*
  # Suppression de la table bq_import_releves_brut

  1. Opérations
    - Suppression des politiques RLS associées à la table
    - Suppression des index associés à la table
    - Suppression de la table elle-même

  2. Objectif
    - Nettoyer la base de données en supprimant une table qui n'est plus nécessaire
    - Préparer le terrain pour une nouvelle structure d'import de relevés bancaires
*/

-- Suppression des politiques RLS
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les relevés importés" ON bq_import_releves_brut;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent créer des relevés importés" ON bq_import_releves_brut;

-- Suppression de la table (les index seront automatiquement supprimés)
DROP TABLE IF EXISTS bq_import_releves_brut;

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'bq_import_releves_brut'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE '✅ La table bq_import_releves_brut a été supprimée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la suppression de la table bq_import_releves_brut';
  END IF;
END $$;