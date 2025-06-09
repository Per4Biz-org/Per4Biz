/*
  # Correction de la contrainte d'unicité pour fin_flux_sous_categorie

  1. Modifications
    - Suppression de l'ancienne contrainte d'unicité sur (com_contrat_client_id, code)
    - Ajout d'une nouvelle contrainte d'unicité sur (id_categorie, code)
    - L'unicité est maintenant au niveau de la catégorie de flux parente

  2. Logique
    - Chaque catégorie de flux peut avoir ses propres codes de sous-catégories
    - Pas de conflit entre les sous-catégories de différentes catégories
    - Maintien de l'unicité au niveau approprié dans la hiérarchie

  3. Index
    - Création d'un index pour optimiser les performances
*/

-- Étape 1: Supprimer l'ancienne contrainte d'unicité
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fin_flux_sous_categorie_com_contrat_client_id_code_key' 
    AND table_name = 'fin_flux_sous_categorie'
  ) THEN
    ALTER TABLE fin_flux_sous_categorie 
    DROP CONSTRAINT fin_flux_sous_categorie_com_contrat_client_id_code_key;
  END IF;
END $$;

-- Étape 2: Ajouter la nouvelle contrainte d'unicité sur (id_categorie, code)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fin_flux_sous_categorie_id_categorie_code_key' 
    AND table_name = 'fin_flux_sous_categorie'
  ) THEN
    ALTER TABLE fin_flux_sous_categorie 
    ADD CONSTRAINT fin_flux_sous_categorie_id_categorie_code_key 
    UNIQUE (id_categorie, code);
  END IF;
END $$;

-- Étape 3: Créer un index pour optimiser les performances sur la nouvelle contrainte
CREATE INDEX IF NOT EXISTS idx_fin_flux_sous_categorie_id_categorie_code 
  ON fin_flux_sous_categorie(id_categorie, code);