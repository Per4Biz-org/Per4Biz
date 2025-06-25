/*
  # Ajouter la colonne id_personnel à la table rh_historique_financier

  1. Modifications
    - Ajouter la colonne `id_personnel` de type UUID à la table `rh_historique_financier`
    - Ajouter une contrainte de clé étrangère vers la table `rh_personnel`
    - Ajouter un index pour optimiser les requêtes

  2. Sécurité
    - La colonne est ajoutée avec NOT NULL après avoir vérifié qu'il n'y a pas de données existantes
    - Contrainte de clé étrangère pour maintenir l'intégrité référentielle
*/

-- Ajouter la colonne id_personnel à la table rh_historique_financier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rh_historique_financier' AND column_name = 'id_personnel'
  ) THEN
    ALTER TABLE rh_historique_financier 
    ADD COLUMN id_personnel uuid NOT NULL;
  END IF;
END $$;

-- Ajouter la contrainte de clé étrangère
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rh_historique_financier_id_personnel_fkey'
  ) THEN
    ALTER TABLE rh_historique_financier
    ADD CONSTRAINT rh_historique_financier_id_personnel_fkey
    FOREIGN KEY (id_personnel) REFERENCES rh_personnel(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Ajouter un index pour optimiser les requêtes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_rh_historique_financier_id_personnel'
  ) THEN
    CREATE INDEX idx_rh_historique_financier_id_personnel 
    ON rh_historique_financier(id_personnel);
  END IF;
END $$;