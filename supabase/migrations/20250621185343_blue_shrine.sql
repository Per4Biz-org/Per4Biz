/*
  # Suppression du champ heure_fermeture de la table fin_ferm_caisse

  1. Modifications
    - Suppression de la colonne `heure_fermeture` de type time
    
  2. Objectif
    - Simplifier la structure de la table
    - Éliminer un champ redondant puisque la date de fermeture est suffisante
    - Améliorer la cohérence des données

  3. Impact
    - Les fermetures de caisse existantes perdront l'information d'heure
    - Les applications clientes devront être mises à jour pour ne plus utiliser ce champ
*/

-- Suppression de la colonne heure_fermeture
ALTER TABLE fin_ferm_caisse 
DROP COLUMN IF EXISTS heure_fermeture;

-- Vérification de la suppression
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'fin_ferm_caisse' 
    AND column_name = 'heure_fermeture'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE WARNING '❌ Échec de la suppression de la colonne heure_fermeture de la table fin_ferm_caisse';
  ELSE
    RAISE NOTICE '✅ La colonne heure_fermeture a été supprimée avec succès de la table fin_ferm_caisse';
  END IF;
END $$;