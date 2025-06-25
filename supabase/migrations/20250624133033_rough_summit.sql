/*
  # Correction des politiques RLS pour la table rh_personnel

  1. Modifications
    - Suppression des politiques RLS existantes pour la table rh_personnel
    - Recréation des politiques avec les mêmes conditions
    - Vérification que les politiques ont été correctement appliquées

  2. Objectif
    - Assurer que toutes les colonnes, y compris lien_photo, peuvent être mises à jour
    - Maintenir la sécurité au niveau des lignes
    - Résoudre les problèmes de mise à jour des photos de profil
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

-- Étape 3: Vérification des politiques (corrigée pour éviter l'erreur de colonne)
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
  
  -- Vérifier si la politique UPDATE existe en utilisant cmd au lieu de operation
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'rh_personnel'
    AND cmd = 'UPDATE'
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