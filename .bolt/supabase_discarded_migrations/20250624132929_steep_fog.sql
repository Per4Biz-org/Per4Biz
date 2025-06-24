/*
  # Correction des politiques RLS pour permettre la mise à jour du champ lien_photo

  1. Modifications
    - Suppression des politiques RLS existantes pour la table rh_personnel
    - Création de nouvelles politiques plus permissives
    - Ajout d'une politique spécifique pour UPDATE
    
  2. Objectif
    - Résoudre le problème de mise à jour du champ lien_photo
    - Assurer que toutes les colonnes, y compris lien_photo, peuvent être mises à jour
    - Maintenir la sécurité en limitant l'accès aux données du contrat client de l'utilisateur
*/

-- Étape 1: Supprimer les politiques existantes pour rh_personnel
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer du personnel pour leur contrat" ON rh_personnel;
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire le personnel de leur contrat" ON rh_personnel;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier le personnel de leur contrat" ON rh_personnel;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer le personnel de leur contrat" ON rh_personnel;

-- Étape 2: Recréer les politiques avec des expressions plus permissives
-- Politique pour INSERT
CREATE POLICY "Les utilisateurs peuvent créer du personnel pour leur contrat"
  ON rh_personnel
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Politique pour SELECT
CREATE POLICY "Les utilisateurs peuvent lire le personnel de leur contrat"
  ON rh_personnel
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Politique pour UPDATE - plus permissive
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

-- Politique pour DELETE
CREATE POLICY "Les utilisateurs peuvent supprimer le personnel de leur contrat"
  ON rh_personnel
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Étape 3: Vérification des politiques
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
  
  -- Vérifier si la politique UPDATE existe
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'rh_personnel'
    AND operation = 'UPDATE'
  ) INTO update_policy_exists;
  
  RAISE NOTICE 'Vérification des politiques RLS:';
  RAISE NOTICE '- Nombre total de politiques pour rh_personnel: %', policy_count;
  RAISE NOTICE '- Politique UPDATE existe: %', CASE WHEN update_policy_exists THEN 'Oui' ELSE 'Non' END;
  
  IF policy_count = 4 AND update_policy_exists THEN
    RAISE NOTICE '✅ Les politiques RLS ont été correctement configurées';
  ELSE
    RAISE WARNING '⚠️ Configuration des politiques RLS incomplète';
  END IF;
END $$;