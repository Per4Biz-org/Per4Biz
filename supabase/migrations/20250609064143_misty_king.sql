/*
  # Modification de la contrainte d'unicité de fin_flux_categorie

  1. Modifications
    - Suppression de la contrainte d'unicité sur (com_contrat_client_id, code)
    - Ajout d'une nouvelle contrainte d'unicité sur (id_entite, code)
    - Création d'un index pour optimiser les performances

  2. Objectif
    - Permettre à chaque restaurant (entité) d'avoir ses propres codes de catégories de flux
    - Éviter les conflits entre les codes des différents restaurants
    - Maintenir l'unicité au niveau approprié (entité)
*/

-- Étape 1: Supprimer l'ancienne contrainte d'unicité
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fin_flux_categorie_com_contrat_client_id_code_key' 
    AND table_name = 'fin_flux_categorie'
  ) THEN
    ALTER TABLE fin_flux_categorie 
    DROP CONSTRAINT fin_flux_categorie_com_contrat_client_id_code_key;
  END IF;
END $$;

-- Étape 2: Ajouter la nouvelle contrainte d'unicité sur (id_entite, code)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fin_flux_categorie_id_entite_code_key' 
    AND table_name = 'fin_flux_categorie'
  ) THEN
    ALTER TABLE fin_flux_categorie 
    ADD CONSTRAINT fin_flux_categorie_id_entite_code_key 
    UNIQUE (id_entite, code);
  END IF;
END $$;

-- Étape 3: Créer un index pour optimiser les performances sur la nouvelle contrainte
CREATE INDEX IF NOT EXISTS idx_fin_flux_categorie_id_entite_code 
  ON fin_flux_categorie(id_entite, code);