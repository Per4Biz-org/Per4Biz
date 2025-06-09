/*
  # Modification de la contrainte d'unicité de fin_flux_nature

  1. Modifications
    - Suppression de la contrainte d'unicité actuelle sur (com_contrat_client_id, code)
    - Ajout d'une nouvelle contrainte d'unicité sur (id_entite, code)

  2. Objectif
    - Permettre à chaque entité (restaurant) d'avoir ses propres codes de nature de flux
    - Éviter les conflits entre entités utilisant les mêmes codes (MP, INV, etc.)

  3. Impact
    - Les codes de nature de flux sont maintenant uniques par entité
    - Plusieurs entités peuvent utiliser les mêmes codes sans conflit
*/

-- Étape 1: Supprimer l'ancienne contrainte d'unicité
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fin_flux_nature_com_contrat_client_id_code_key' 
    AND table_name = 'fin_flux_nature'
  ) THEN
    ALTER TABLE fin_flux_nature 
    DROP CONSTRAINT fin_flux_nature_com_contrat_client_id_code_key;
  END IF;
END $$;

-- Étape 2: Ajouter la nouvelle contrainte d'unicité sur (id_entite, code)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fin_flux_nature_id_entite_code_key' 
    AND table_name = 'fin_flux_nature'
  ) THEN
    ALTER TABLE fin_flux_nature 
    ADD CONSTRAINT fin_flux_nature_id_entite_code_key 
    UNIQUE (id_entite, code);
  END IF;
END $$;

-- Étape 3: Créer un index pour optimiser les performances sur la nouvelle contrainte
CREATE INDEX IF NOT EXISTS idx_fin_flux_nature_id_entite_code 
  ON fin_flux_nature(id_entite, code);