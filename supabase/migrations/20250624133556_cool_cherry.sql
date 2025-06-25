/*
  # Nettoyage des politiques RLS pour rh_personnel

  1. Modifications
    - Suppression de la politique permissive temporaire "Allow update rh_personnel"
    - Vérification que les politiques standard sont correctement appliquées
    
  2. Objectif
    - Rétablir la sécurité standard après les tests de mise à jour
    - S'assurer que seuls les utilisateurs autorisés peuvent modifier les données
    - Maintenir l'intégrité du système de sécurité
*/

-- Étape 1: Supprimer la politique permissive temporaire
DROP POLICY IF EXISTS "Allow update rh_personnel" ON rh_personnel;

-- Étape 2: Vérifier que les politiques standard existent toujours
DO $$
DECLARE
  policy_count INTEGER;
  update_policy_exists BOOLEAN;
BEGIN
  -- Compter les politiques pour rh_personnel
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE tablename = 'rh_personnel';
  
  -- Vérifier si la politique UPDATE standard existe
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'rh_personnel'
    AND cmd = 'UPDATE'
    AND policyname = 'Les utilisateurs peuvent modifier le personnel de leur contrat'
  ) INTO update_policy_exists;
  
  RAISE NOTICE 'Vérification des politiques RLS:';
  RAISE NOTICE '- Nombre total de politiques pour rh_personnel: %', policy_count;
  RAISE NOTICE '- Politique UPDATE standard existe: %', CASE WHEN update_policy_exists THEN 'Oui' ELSE 'Non' END;
  
  -- Si la politique UPDATE standard n'existe pas, la recréer
  IF NOT update_policy_exists THEN
    RAISE NOTICE 'Recréation de la politique UPDATE standard...';
    
    CREATE POLICY "Les utilisateurs peuvent modifier le personnel de leur contrat"
      ON rh_personnel
      FOR UPDATE
      TO authenticated
      USING (com_contrat_client_id = (
        SELECT com_profil.com_contrat_client_id
        FROM com_profil
        WHERE (com_profil.user_id = auth.uid())
      ))
      WITH CHECK (com_contrat_client_id = (
        SELECT com_profil.com_contrat_client_id
        FROM com_profil
        WHERE (com_profil.user_id = auth.uid())
      ));
  END IF;
  
  -- Vérification finale
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE tablename = 'rh_personnel';
  
  RAISE NOTICE '✅ Configuration finale: % politiques RLS pour rh_personnel', policy_count;
END $$;