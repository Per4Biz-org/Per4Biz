/*
  # Création de la table bq_import_releves_brut

  1. Nouvelle Table
    - `bq_import_releves_brut`
      - `id` : BIGSERIAL, clé primaire
      - `import_id` : UUID, identifiant unique de l'import (pour grouper les lignes)
      - `nom_fichier` : TEXT, nom du fichier importé
      - `id_format_import` : INT, référence vers bq_format_import
      - Champs spécifiques aux données bancaires :
        - `companhia`, `produto`, `conta`, `moeda` : informations bancaires
        - `data_lancamento`, `data_valor` : dates d'opération et de valeur
        - `descricao` : description de l'opération
        - `valor`, `saldo` : montants (opération et solde)
        - `referencia_doc` : référence du document
      - `source_row` : JSONB, données brutes complètes de la ligne
      - `created_at` : TIMESTAMP, date de création

  2. Contraintes
    - Clé primaire sur id
    - Clé étrangère vers bq_format_import
    - Contrainte d'unicité pour éviter les doublons

  3. Objectif
    - Stocker les données brutes importées des relevés bancaires
    - Conserver toutes les informations du fichier original
    - Permettre le retraitement ultérieur si nécessaire
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS bq_import_releves_brut (
    id BIGSERIAL PRIMARY KEY,

    import_id UUID NOT NULL,
    nom_fichier TEXT NOT NULL,
    id_format_import INT REFERENCES bq_format_import(id),

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
    created_at TIMESTAMP DEFAULT now(),

    UNIQUE (
        nom_fichier,
        conta,
        data_lancamento,
        valor,
        saldo,
        descricao,
        referencia_doc
    )
);

-- Activation de la sécurité RLS
ALTER TABLE bq_import_releves_brut ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour bq_import_releves_brut
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les relevés importés"
  ON bq_import_releves_brut
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des relevés importés"
  ON bq_import_releves_brut
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_import_id 
  ON bq_import_releves_brut(import_id);

CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_id_format_import 
  ON bq_import_releves_brut(id_format_import);

CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_data_lancamento 
  ON bq_import_releves_brut(data_lancamento);

CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_conta 
  ON bq_import_releves_brut(conta);

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'bq_import_releves_brut'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table bq_import_releves_brut a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table bq_import_releves_brut';
  END IF;
END $$;