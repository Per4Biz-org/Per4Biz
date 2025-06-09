/*
  # Correction finale de la contrainte d'unicité de fin_flux_sous_categorie

  1. Nettoyage
    - Supprimer la colonne id_entite si elle a été ajoutée par erreur
    - Supprimer toutes les anciennes contraintes d'unicité
    - Supprimer les anciens index

  2. Nouvelle contrainte
    - Ajouter la contrainte d'unicité sur (id_categorie, code)
    - Créer l'index correspondant

  3. Logique
    - L'unicité se fait au niveau de la catégorie parente
    - Chaque catégorie peut avoir ses propres codes de sous-catégories
    - L'entité est accessible via la relation id_categorie -> fin_flux_categorie -> id_entite
*/

-- Étape 1: Supprimer la colonne id_entite si elle existe (ajoutée par erreur)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fin_flux_sous_categorie' AND column_name = 'id_entite'
  ) THEN
    -- Supprimer d'abord la contrainte de clé étrangère si elle existe
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fin_flux_sous_categorie_id_entite_fkey' 
      AND table_name = 'fin_flux_sous_categorie'
    ) THEN
      ALTER TABLE fin_flux_sous_categorie 
      DROP CONSTRAINT fin_flux_sous_categorie_id_entite_fkey;
    END IF;
    
    -- Supprimer la contrainte d'unicité sur id_entite si elle existe
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fin_flux_sous_categorie_id_entite_code_key' 
      AND table_name = 'fin_flux_sous_categorie'
    ) THEN
      ALTER TABLE fin_flux_sous_categorie 
      DROP CONSTRAINT fin_flux_sous_categorie_id_entite_code_key;
    END IF;
    
    -- Supprimer la colonne
    ALTER TABLE fin_flux_sous_categorie DROP COLUMN id_entite;
  END IF;
END $$;

-- Étape 2: Supprimer toutes les anciennes contraintes d'unicité
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte sur com_contrat_client_id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fin_flux_sous_categorie_com_contrat_client_id_code_key' 
    AND table_name = 'fin_flux_sous_categorie'
  ) THEN
    ALTER TABLE fin_flux_sous_categorie 
    DROP CONSTRAINT fin_flux_sous_categorie_com_contrat_client_id_code_key;
  END IF;
END $$;

-- Étape 3: Supprimer les anciens index
DROP INDEX IF EXISTS idx_fin_flux_sous_categorie_id_entite_code;

-- Étape 4: Ajouter la nouvelle contrainte d'unicité sur (id_categorie, code)
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

-- Étape 5: Créer l'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_fin_flux_sous_categorie_id_categorie_code 
  ON fin_flux_sous_categorie(id_categorie, code);

-- Étape 6: Vérifier que la structure est correcte
DO $$
BEGIN
  -- Vérifier que la colonne id_entite n'existe plus
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fin_flux_sous_categorie' AND column_name = 'id_entite'
  ) THEN
    RAISE EXCEPTION 'La colonne id_entite existe encore dans fin_flux_sous_categorie';
  END IF;
  
  -- Vérifier que la contrainte d'unicité existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fin_flux_sous_categorie_id_categorie_code_key' 
    AND table_name = 'fin_flux_sous_categorie'
  ) THEN
    RAISE EXCEPTION 'La contrainte d''unicité sur (id_categorie, code) n''existe pas';
  END IF;
  
  RAISE NOTICE 'Structure de fin_flux_sous_categorie corrigée avec succès';
END $$;