/*
  # Création de la table fin_ferm_multibanc

  1. Nouvelle Table
    - `fin_ferm_multibanc`
      - `id` (bigserial, clé primaire)
      - `com_contrat_client_id` (uuid, obligatoire, FK vers com_contrat_client)
      - `fin_ferm_caisse_id` (bigint, obligatoire, FK vers fin_ferm_caisse)
      - `periode` (text, obligatoire, ex: "TPE 1", "SumUp", etc.)
      - `montant_brut` (numeric(12,2), obligatoire)
      - `montant_reel` (numeric(12,2), obligatoire)
      - `commentaire` (text, optionnel)
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Clés étrangères vers com_contrat_client et fin_ferm_caisse
    - Suppression en cascade pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS fin_ferm_multibanc (
  id bigserial PRIMARY KEY,
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE CASCADE,
  fin_ferm_caisse_id bigint NOT NULL REFERENCES fin_ferm_caisse(id) ON DELETE CASCADE,
  
  periode text NOT NULL, -- Ex : "TPE 1", "SumUp", etc.
  montant_brut numeric(12,2) NOT NULL,
  montant_reel numeric(12,2) NOT NULL,
  commentaire text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Activation de la sécurité RLS
ALTER TABLE fin_ferm_multibanc ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour fin_ferm_multibanc
CREATE POLICY "Les utilisateurs peuvent créer des entrées multibanc pour leur contrat"
  ON fin_ferm_multibanc
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les entrées multibanc de leur contrat"
  ON fin_ferm_multibanc
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les entrées multibanc de leur contrat"
  ON fin_ferm_multibanc
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

CREATE POLICY "Les utilisateurs peuvent supprimer les entrées multibanc de leur contrat"
  ON fin_ferm_multibanc
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON fin_ferm_multibanc
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON fin_ferm_multibanc
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_fin_ferm_multibanc_updated_at
  BEFORE UPDATE ON fin_ferm_multibanc
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_fin_ferm_multibanc_com_contrat_client_id 
  ON fin_ferm_multibanc(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_fin_ferm_multibanc_fin_ferm_caisse_id 
  ON fin_ferm_multibanc(fin_ferm_caisse_id);

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'fin_ferm_multibanc'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table fin_ferm_multibanc a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table fin_ferm_multibanc';
  END IF;
END $$;