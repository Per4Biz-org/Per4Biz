/*
  # Création des tables pour la gestion des imports bruts de relevés bancaires

  1. Nouvelles Tables
    - `bq_import_releves_brut` : Table principale pour les imports de relevés
    - `bq_import_releves_brut_detail` : Table de détail pour les lignes de relevés

  2. Structure
    - Séparation entre l'entête du fichier et le détail des lignes
    - Chaque table inclut com_contrat_client_id pour lier à un contrat client
    - Champs d'audit (created_at, updated_at, created_by, updated_by)

  3. Sécurité
    - Activation de RLS sur les deux tables
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données
*/

-- =============================================
-- Table 1: bq_import_releves_brut - Entête des imports
-- =============================================
CREATE TABLE IF NOT EXISTS bq_import_releves_brut (
  id BIGSERIAL PRIMARY KEY,
  com_contrat_client_id UUID NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  import_id UUID NOT NULL,
  nom_fichier TEXT NOT NULL,
  id_format_import INT REFERENCES bq_format_import(id) ON DELETE RESTRICT,
  date_import TIMESTAMPTZ DEFAULT now(),
  nb_lignes INT,
  statut TEXT DEFAULT 'TERMINE',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité
  UNIQUE(com_contrat_client_id, nom_fichier)
);

-- Activation de la sécurité RLS
ALTER TABLE bq_import_releves_brut ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour bq_import_releves_brut
CREATE POLICY "Les utilisateurs peuvent créer des imports de relevés pour leur contrat"
  ON bq_import_releves_brut
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les imports de relevés de leur contrat"
  ON bq_import_releves_brut
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les imports de relevés de leur contrat"
  ON bq_import_releves_brut
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

CREATE POLICY "Les utilisateurs peuvent supprimer les imports de relevés de leur contrat"
  ON bq_import_releves_brut
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON bq_import_releves_brut
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON bq_import_releves_brut
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_bq_import_releves_brut_updated_at
  BEFORE UPDATE ON bq_import_releves_brut
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Table 2: bq_import_releves_brut_detail - Détail des lignes importées
-- =============================================
CREATE TABLE IF NOT EXISTS bq_import_releves_brut_detail (
  id BIGSERIAL PRIMARY KEY,
  com_contrat_client_id UUID NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_import BIGINT NOT NULL REFERENCES bq_import_releves_brut(id) ON DELETE CASCADE,
  companhia TEXT,
  produto TEXT,
  conta TEXT,
  moeda TEXT,
  data_lancamento DATE,
  data_valor DATE,
  descricao TEXT,
  valor NUMERIC(14,2),
  saldo NUMERIC(14,2),
  referencia_doc TEXT,
  source_row JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité
  UNIQUE(id_import, conta, data_lancamento, valor, saldo, descricao, referencia_doc)
);

-- Activation de la sécurité RLS
ALTER TABLE bq_import_releves_brut_detail ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour bq_import_releves_brut_detail
CREATE POLICY "Les utilisateurs peuvent créer des détails d'imports pour leur contrat"
  ON bq_import_releves_brut_detail
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les détails d'imports de leur contrat"
  ON bq_import_releves_brut_detail
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les détails d'imports de leur contrat"
  ON bq_import_releves_brut_detail
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

CREATE POLICY "Les utilisateurs peuvent supprimer les détails d'imports de leur contrat"
  ON bq_import_releves_brut_detail
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON bq_import_releves_brut_detail
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON bq_import_releves_brut_detail
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_bq_import_releves_brut_detail_updated_at
  BEFORE UPDATE ON bq_import_releves_brut_detail
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_com_contrat_client_id 
  ON bq_import_releves_brut(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_import_id 
  ON bq_import_releves_brut(import_id);

CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_id_format_import 
  ON bq_import_releves_brut(id_format_import);

CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_detail_com_contrat_client_id 
  ON bq_import_releves_brut_detail(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_detail_id_import 
  ON bq_import_releves_brut_detail(id_import);

CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_detail_conta 
  ON bq_import_releves_brut_detail(conta);

CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_detail_data_lancamento 
  ON bq_import_releves_brut_detail(data_lancamento);

-- Vérification finale
DO $$
DECLARE
  table_count INTEGER := 0;
BEGIN
  -- Vérifier que les tables ont été créées
  SELECT COUNT(*)
  INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('bq_import_releves_brut', 'bq_import_releves_brut_detail');
  
  IF table_count = 2 THEN
    RAISE NOTICE '✅ Les 2 tables pour la gestion des imports de relevés bancaires ont été créées avec succès';
  ELSE
    RAISE WARNING '⚠️ Seulement % tables sur 2 ont été créées', table_count;
  END IF;
END $$;