/*
  # Création de la table com_param_type_facture

  1. Nouvelle Table
    - `com_param_type_facture`
      - `id` (uuid, clé primaire, générée automatiquement)
      - `code` (text, requis, unique, ex: RH, FOURNISSEUR, NOTE_FRAIS)
      - `libelle` (text, requis)
      - `actif` (boolean, défaut true)
      - `com_contrat_client_id` (uuid, obligatoire, FK vers com_contrat_client)
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Contrainte d'unicité sur (com_contrat_client_id, code)
    - Clé étrangère vers com_contrat_client
    - Suppression restreinte pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur les champs de recherche fréquents
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS com_param_type_facture (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  libelle text NOT NULL,
  actif boolean DEFAULT true,
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité sur (com_contrat_client_id, code)
  UNIQUE(com_contrat_client_id, code)
);

-- Activation de la sécurité RLS
ALTER TABLE com_param_type_facture ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour com_param_type_facture
CREATE POLICY "Les utilisateurs peuvent créer des types de facture pour leur contrat"
  ON com_param_type_facture
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les types de facture de leur contrat"
  ON com_param_type_facture
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les types de facture de leur contrat"
  ON com_param_type_facture
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

CREATE POLICY "Les utilisateurs peuvent supprimer les types de facture de leur contrat"
  ON com_param_type_facture
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON com_param_type_facture
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON com_param_type_facture
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_com_param_type_facture_updated_at
  BEFORE UPDATE ON com_param_type_facture
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_com_param_type_facture_com_contrat_client_id 
  ON com_param_type_facture(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_com_param_type_facture_code 
  ON com_param_type_facture(code);

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'com_param_type_facture'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table com_param_type_facture a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table com_param_type_facture';
  END IF;
END $$;