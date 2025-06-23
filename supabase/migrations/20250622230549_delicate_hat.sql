/*
  # Création de la table rh_historique_contrat

  1. Nouvelle Table
    - `rh_historique_contrat`
      - `id` (uuid, clé primaire, générée automatiquement)
      - `com_contrat_client_id` (uuid, obligatoire, FK vers com_contrat_client)
      - `id_personnel` (uuid, obligatoire, FK vers rh_personnel)
      - `id_type_contrat` (uuid, obligatoire, FK vers rh_type_contrat)
      - `date_debut` (date, obligatoire)
      - `date_fin` (date, optionnelle)
      - `commentaire` (text, optionnel)
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Clés étrangères vers com_contrat_client, rh_personnel et rh_type_contrat
    - Suppression restreinte pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur date_debut pour les recherches chronologiques
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS rh_historique_contrat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_personnel uuid NOT NULL REFERENCES rh_personnel(id) ON DELETE RESTRICT,
  id_type_contrat uuid NOT NULL REFERENCES rh_type_contrat(id) ON DELETE RESTRICT,
  date_debut date NOT NULL,
  date_fin date,
  commentaire text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Création des index
CREATE INDEX IF NOT EXISTS idx_rh_hist_contrat_id_personnel ON rh_historique_contrat(id_personnel);
CREATE INDEX IF NOT EXISTS idx_rh_hist_contrat_type_contrat ON rh_historique_contrat(id_type_contrat);
CREATE INDEX IF NOT EXISTS idx_rh_hist_contrat_contrat_client ON rh_historique_contrat(com_contrat_client_id);
CREATE INDEX IF NOT EXISTS idx_rh_hist_contrat_date_debut ON rh_historique_contrat(date_debut);

-- Activation de la sécurité RLS
ALTER TABLE rh_historique_contrat ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour rh_historique_contrat
CREATE POLICY "Les utilisateurs peuvent créer l'historique des contrats pour leur contrat"
  ON rh_historique_contrat
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire l'historique des contrats de leur contrat"
  ON rh_historique_contrat
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier l'historique des contrats de leur contrat"
  ON rh_historique_contrat
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

CREATE POLICY "Les utilisateurs peuvent supprimer l'historique des contrats de leur contrat"
  ON rh_historique_contrat
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON rh_historique_contrat
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON rh_historique_contrat
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_rh_historique_contrat_updated_at
  BEFORE UPDATE ON rh_historique_contrat
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'rh_historique_contrat'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table rh_historique_contrat a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table rh_historique_contrat';
  END IF;
END $$;