/*
  # Création de la table bq_format_import

  1. Nouvelle Table
    - `bq_format_import`
      - `id` (SERIAL, clé primaire)
      - `code` (TEXT, unique, non null, ex: 'BCP_TSV')
      - `libelle` (TEXT, non null, ex: 'BCP - Fichier texte tabulé')
      - `banque` (TEXT, non null, ex: 'BCP')
      - `extension` (TEXT, optionnel, ex: 'xls', 'csv')
      - `encodage` (TEXT, défaut 'utf-8', ex: 'utf-8', 'latin1')
      - `separateur` (TEXT, défaut '\t', ex: ',', ';', '\t')
      - `premiere_ligne_donnees` (INT, défaut 1, lignes à ignorer avant les données)
      - `colonnes` (TEXT[], liste des noms de colonnes dans l'ordre)
      - `actif` (BOOLEAN, défaut TRUE)
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Contrainte d'unicité sur code
    - Clé étrangère vers com_contrat_client

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur code pour optimiser les recherches
    - Index sur banque pour les filtres fréquents
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS bq_format_import (
  id SERIAL PRIMARY KEY,
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  banque TEXT NOT NULL,
  extension TEXT,
  encodage TEXT DEFAULT 'utf-8',
  separateur TEXT DEFAULT '\t',
  premiere_ligne_donnees INT DEFAULT 1,
  colonnes TEXT[],
  actif BOOLEAN DEFAULT TRUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité sur code par contrat client
  UNIQUE(com_contrat_client_id, code)
);

-- Activation de la sécurité RLS
ALTER TABLE bq_format_import ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour bq_format_import
CREATE POLICY "Les utilisateurs peuvent créer des formats d'import pour leur contrat"
  ON bq_format_import
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les formats d'import de leur contrat"
  ON bq_format_import
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les formats d'import de leur contrat"
  ON bq_format_import
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

CREATE POLICY "Les utilisateurs peuvent supprimer les formats d'import de leur contrat"
  ON bq_format_import
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON bq_format_import
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON bq_format_import
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_bq_format_import_updated_at
  BEFORE UPDATE ON bq_format_import
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_bq_format_import_com_contrat_client_id 
  ON bq_format_import(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_bq_format_import_code 
  ON bq_format_import(code);

CREATE INDEX IF NOT EXISTS idx_bq_format_import_banque 
  ON bq_format_import(banque);

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'bq_format_import'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table bq_format_import a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table bq_format_import';
  END IF;
END $$;