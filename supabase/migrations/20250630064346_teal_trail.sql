/*
  # Refonte des tables de flux financiers

  1. Modifications structurelles
    - Rendre les colonnes id_entite NULLABLE dans fin_flux_nature et fin_flux_categorie
    - Remplacer les contraintes d'unicité existantes par de nouvelles contraintes
    - Ajouter des index pour optimiser les recherches

  2. Objectif
    - Permettre une gestion multi-entité plus souple
    - Définir des flux au niveau du contrat client (id_entite NULL)
    - Permettre des exceptions spécifiques pour certaines entités
*/

-- 1. Modifications pour la table fin_flux_nature

-- Rendre la colonne id_entite NULLABLE
ALTER TABLE public.fin_flux_nature
ALTER COLUMN id_entite DROP NOT NULL;

-- Supprimer l'ancienne contrainte d'unicité sur (id_entite, code) si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fin_flux_nature_id_entite_code_key' 
    AND conrelid = 'public.fin_flux_nature'::regclass
  ) THEN
    ALTER TABLE public.fin_flux_nature
    DROP CONSTRAINT fin_flux_nature_id_entite_code_key;
  END IF;
END $$;

-- Ajouter la nouvelle contrainte d'unicité sur (com_contrat_client_id, id_entite, code) si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fin_flux_nature_unique_contract_entity_code' 
    AND conrelid = 'public.fin_flux_nature'::regclass
  ) THEN
    ALTER TABLE public.fin_flux_nature
    ADD CONSTRAINT fin_flux_nature_unique_contract_entity_code UNIQUE (com_contrat_client_id, id_entite, code);
  END IF;
END $$;

-- Créer un index explicite pour la nouvelle contrainte d'unicité s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_fin_flux_nature_contract_entity_code'
  ) THEN
    CREATE INDEX idx_fin_flux_nature_contract_entity_code
    ON public.fin_flux_nature USING btree (com_contrat_client_id, id_entite, code);
  END IF;
END $$;

-- Créer un index supplémentaire pour les recherches par entité et code s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_fin_flux_nature_id_entite_code'
  ) THEN
    CREATE INDEX idx_fin_flux_nature_id_entite_code
    ON public.fin_flux_nature USING btree (id_entite, code);
  END IF;
END $$;


-- 2. Modifications pour la table fin_flux_categorie

-- Rendre la colonne id_entite NULLABLE
ALTER TABLE public.fin_flux_categorie
ALTER COLUMN id_entite DROP NOT NULL;

-- Supprimer l'ancienne contrainte d'unicité sur (id_entite, code) si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fin_flux_categorie_id_entite_code_key' 
    AND conrelid = 'public.fin_flux_categorie'::regclass
  ) THEN
    ALTER TABLE public.fin_flux_categorie
    DROP CONSTRAINT fin_flux_categorie_id_entite_code_key;
  END IF;
END $$;

-- Ajouter la nouvelle contrainte d'unicité sur (com_contrat_client_id, id_entite, code) si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fin_flux_categorie_unique_contract_entity_code' 
    AND conrelid = 'public.fin_flux_categorie'::regclass
  ) THEN
    ALTER TABLE public.fin_flux_categorie
    ADD CONSTRAINT fin_flux_categorie_unique_contract_entity_code UNIQUE (com_contrat_client_id, id_entite, code);
  END IF;
END $$;

-- Créer un index explicite pour la nouvelle contrainte d'unicité s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_fin_flux_categorie_contract_entity_code'
  ) THEN
    CREATE INDEX idx_fin_flux_categorie_contract_entity_code
    ON public.fin_flux_categorie USING btree (com_contrat_client_id, id_entite, code);
  END IF;
END $$;

-- Créer un index supplémentaire pour les recherches par entité et code s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_fin_flux_categorie_id_entite_code'
  ) THEN
    CREATE INDEX idx_fin_flux_categorie_id_entite_code
    ON public.fin_flux_categorie USING btree (id_entite, code);
  END IF;
END $$;


-- 3. Vérification de la table fin_flux_sous_categorie
-- Aucune modification structurelle n'est nécessaire pour cette table
-- car elle est déjà liée via id_categorie et com_contrat_client_id.
-- La contrainte d'unicité existante sur (id_categorie, code) est déjà conforme aux exigences.

-- Note: Les triggers existants (prevent_created_by_update_trigger, set_updated_by_trigger, etc.)
-- sont déjà en place et n'ont pas besoin d'être recréés après les opérations ALTER TABLE.