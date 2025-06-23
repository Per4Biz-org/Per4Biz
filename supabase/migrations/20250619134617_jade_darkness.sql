/*
  # Création de la table bq_ecriture_bancaire

  1. Nouvelle Table
    - `bq_ecriture_bancaire`
      - `id` : BIGSERIAL, clé primaire
      - `com_contrat_client_id` : UUID, obligatoire, référence com_contrat_client(id)
      - `id_compte` : UUID, obligatoire, référence bq_compte_bancaire(id)
      - `data_lancamento` : DATE, obligatoire (date d'opération)
      - `data_valor` : DATE (date de valeur)
      - `descricao` : TEXT (description de l'opération)
      - `valor` : NUMERIC(14,2), obligatoire (montant de l'opération)
      - `saldo` : NUMERIC(14,2) (solde après opération)
      - `referencia_doc` : TEXT (référence du document)
      - `lien_piece_jointe` : TEXT (lien vers une pièce jointe)
      - `source_import_id` : BIGINT, référence bq_import_releves_brut_detail(id)
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Contrainte d'unicité sur (id_compte, data_lancamento, valor, descricao, saldo)
    - Clés étrangères vers com_contrat_client, bq_compte_bancaire et bq_import_releves_brut_detail
    - Suppression restreinte pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur les champs de recherche fréquents (dates, montants)
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS bq_ecriture_bancaire (
  id BIGSERIAL PRIMARY KEY,
  com_contrat_client_id UUID NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_compte UUID NOT NULL REFERENCES bq_compte_bancaire(id) ON DELETE RESTRICT,
  data_lancamento DATE NOT NULL,
  data_valor DATE,
  descricao TEXT,
  valor NUMERIC(14,2) NOT NULL,
  saldo NUMERIC(14,2),
  referencia_doc TEXT,
  lien_piece_jointe TEXT,
  source_import_id BIGINT REFERENCES bq_import_releves_brut_detail(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité
  UNIQUE(id_compte, data_lancamento, valor, descricao, saldo)
);

-- Activation de la sécurité RLS
ALTER TABLE bq_ecriture_bancaire ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour bq_ecriture_bancaire
CREATE POLICY "Les utilisateurs peuvent créer des écritures bancaires pour leur contrat"
  ON bq_ecriture_bancaire
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les écritures bancaires de leur contrat"
  ON bq_ecriture_bancaire
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les écritures bancaires de leur contrat"
  ON bq_ecriture_bancaire
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

CREATE POLICY "Les utilisateurs peuvent supprimer les écritures bancaires de leur contrat"
  ON bq_ecriture_bancaire
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON bq_ecriture_bancaire
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON bq_ecriture_bancaire
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_bq_ecriture_bancaire_updated_at
  BEFORE UPDATE ON bq_ecriture_bancaire
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_bq_ecriture_bancaire_com_contrat_client_id 
  ON bq_ecriture_bancaire(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_bq_ecriture_bancaire_id_compte 
  ON bq_ecriture_bancaire(id_compte);

CREATE INDEX IF NOT EXISTS idx_bq_ecriture_bancaire_data_lancamento 
  ON bq_ecriture_bancaire(data_lancamento);

CREATE INDEX IF NOT EXISTS idx_bq_ecriture_bancaire_data_valor 
  ON bq_ecriture_bancaire(data_valor);

CREATE INDEX IF NOT EXISTS idx_bq_ecriture_bancaire_valor 
  ON bq_ecriture_bancaire(valor);

CREATE INDEX IF NOT EXISTS idx_bq_ecriture_bancaire_source_import_id 
  ON bq_ecriture_bancaire(source_import_id);

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'bq_ecriture_bancaire'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table bq_ecriture_bancaire a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table bq_ecriture_bancaire';
  END IF;
END $$;