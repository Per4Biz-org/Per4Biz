/*
  # Renommage de la table fin_param_mode_paiement en bq_param_mode_paiement

  1. Renommage de table
    - Renommer `fin_param_mode_paiement` en `bq_param_mode_paiement`
    - Renommer tous les index et contraintes associés
    - Recréer les politiques RLS avec les nouveaux noms

  2. Contraintes et index
    - Mise à jour de tous les noms de contraintes
    - Mise à jour de tous les noms d'index
    - Conservation de toutes les fonctionnalités existantes

  3. Sécurité
    - Recréation des politiques RLS avec les nouveaux noms
    - Maintien de la sécurité au niveau ligne
*/

-- Renommer la table
ALTER TABLE fin_param_mode_paiement RENAME TO bq_param_mode_paiement;

-- Vérifier et renommer les index s'ils existent
DO $$
BEGIN
    -- Renommer l'index de clé primaire
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fin_param_mode_paiement_pkey') THEN
        ALTER INDEX fin_param_mode_paiement_pkey RENAME TO bq_param_mode_paiement_pkey;
    END IF;
    
    -- Renommer l'index unique
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fin_param_mode_paiement_com_contrat_client_id_code_key') THEN
        ALTER INDEX fin_param_mode_paiement_com_contrat_client_id_code_key RENAME TO bq_param_mode_paiement_com_contrat_client_id_code_key;
    END IF;
    
    -- Renommer les index personnalisés
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fin_param_mode_paiement_com_contrat_client_id') THEN
        ALTER INDEX idx_fin_param_mode_paiement_com_contrat_client_id RENAME TO idx_bq_param_mode_paiement_com_contrat_client_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fin_param_mode_paiement_code') THEN
        ALTER INDEX idx_fin_param_mode_paiement_code RENAME TO idx_bq_param_mode_paiement_code;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_fin_param_mode_paiement_code_user') THEN
        ALTER INDEX idx_fin_param_mode_paiement_code_user RENAME TO idx_bq_param_mode_paiement_code_user;
    END IF;
END $$;

-- Vérifier et renommer les contraintes s'elles existent
DO $$
BEGIN
    -- Renommer la contrainte de clé primaire
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_param_mode_paiement_pkey' 
               AND table_name = 'bq_param_mode_paiement') THEN
        ALTER TABLE bq_param_mode_paiement RENAME CONSTRAINT fin_param_mode_paiement_pkey TO bq_param_mode_paiement_pkey;
    END IF;
    
    -- Renommer la contrainte unique
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_param_mode_paiement_com_contrat_client_id_code_key' 
               AND table_name = 'bq_param_mode_paiement') THEN
        ALTER TABLE bq_param_mode_paiement RENAME CONSTRAINT fin_param_mode_paiement_com_contrat_client_id_code_key TO bq_param_mode_paiement_com_contrat_client_id_code_key;
    END IF;
    
    -- Renommer la contrainte de clé étrangère
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_param_mode_paiement_com_contrat_client_id_fkey' 
               AND table_name = 'bq_param_mode_paiement') THEN
        ALTER TABLE bq_param_mode_paiement RENAME CONSTRAINT fin_param_mode_paiement_com_contrat_client_id_fkey TO bq_param_mode_paiement_com_contrat_client_id_fkey;
    END IF;
END $$;

-- Supprimer les anciennes politiques RLS
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des modes de paiement pour leur contrat" ON bq_param_mode_paiement;
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les modes de paiement de leur contrat" ON bq_param_mode_paiement;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier les modes de paiement de leur contrat" ON bq_param_mode_paiement;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer les modes de paiement de leur contrat" ON bq_param_mode_paiement;

-- Recréer les politiques RLS avec les nouveaux noms
CREATE POLICY "Les utilisateurs peuvent créer des modes de paiement pour leur contrat"
  ON bq_param_mode_paiement
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les modes de paiement de leur contrat"
  ON bq_param_mode_paiement
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les modes de paiement de leur contrat"
  ON bq_param_mode_paiement
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

CREATE POLICY "Les utilisateurs peuvent supprimer les modes de paiement de leur contrat"
  ON bq_param_mode_paiement
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));