/*
  # Modification de la contrainte d'unicité de fin_flux_sous_categorie

  1. Modifications
    - Suppression de la contrainte d'unicité sur (com_contrat_client_id, code)
    - Ajout d'une nouvelle contrainte d'unicité sur (id_entite, code)
    - Création d'un index pour optimiser les performances

  2. Objectif
    - Permettre à chaque restaurant (entité) d'avoir ses propres codes de sous-catégories
    - Éviter les conflits entre les codes des différents restaurants
    - Maintenir l'unicité au niveau approprié (entité)

  3. Impact
    - Les codes de sous-catégories sont maintenant uniques par entité
    - Plusieurs entités peuvent utiliser les mêmes codes sans conflit
    - Cohérence avec les modifications des tables fin_flux_nature et fin_flux_categorie
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

-- Étape 2: Ajouter la nouvelle contrainte d'unicité sur (id_entite, code)
-- Note: Nous devons d'abord ajouter la colonne id_entite si elle n'existe pas
DO $$
BEGIN
  -- Vérifier si la colonne id_entite existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fin_flux_sous_categorie' AND column_name = 'id_entite'
  ) THEN
    -- Ajouter la colonne id_entite en récupérant la valeur depuis la catégorie parente
    ALTER TABLE fin_flux_sous_categorie 
    ADD COLUMN id_entite uuid;
    
    -- Mettre à jour les valeurs existantes
    UPDATE fin_flux_sous_categorie 
    SET id_entite = (
      SELECT fc.id_entite 
      FROM fin_flux_categorie fc 
      WHERE fc.id = fin_flux_sous_categorie.id_categorie
    );
    
    -- Rendre la colonne NOT NULL
    ALTER TABLE fin_flux_sous_categorie 
    ALTER COLUMN id_entite SET NOT NULL;
    
    -- Ajouter la contrainte de clé étrangère
    ALTER TABLE fin_flux_sous_categorie 
    ADD CONSTRAINT fin_flux_sous_categorie_id_entite_fkey 
    FOREIGN KEY (id_entite) REFERENCES com_entite(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Étape 3: Ajouter la nouvelle contrainte d'unicité sur (id_entite, code)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fin_flux_sous_categorie_id_entite_code_key' 
    AND table_name = 'fin_flux_sous_categorie'
  ) THEN
    ALTER TABLE fin_flux_sous_categorie 
    ADD CONSTRAINT fin_flux_sous_categorie_id_entite_code_key 
    UNIQUE (id_entite, code);
  END IF;
END $$;

-- Étape 4: Créer un index pour optimiser les performances sur la nouvelle contrainte
CREATE INDEX IF NOT EXISTS idx_fin_flux_sous_categorie_id_entite_code 
  ON fin_flux_sous_categorie(id_entite, code);