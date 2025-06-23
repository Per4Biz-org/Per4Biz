/*
  # Création des tables pour le chiffre d'affaires réel

  1. Nouvelles Tables
    - `ca_reel` : Niveau entité / date / catégorie de flux
    - `ca_reel_detail` : Niveau type de service
    - `ca_reel_detail_heure` : Niveau heure (granularité maximale)

  2. Contraintes
    - Clés primaires sur id (BIGINT auto-généré)
    - Clés uniques sur les combinaisons appropriées
    - Clés étrangères avec contraintes d'intégrité
    - Suppression en cascade pour les relations parent-enfant

  3. Sécurité
    - Activation de RLS sur toutes les tables
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Triggers
    - Triggers pour la mise à jour automatique des champs d'audit
    - Protection du champ created_by contre les modifications
*/

-- =============================================
-- Table 1: ca_reel - Niveau entité / date / catégorie
-- =============================================
CREATE TABLE IF NOT EXISTS ca_reel (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_entite uuid NOT NULL REFERENCES com_entite(id) ON DELETE RESTRICT,
  date_vente date NOT NULL,
  id_flux_categorie uuid NOT NULL REFERENCES fin_flux_categorie(id) ON DELETE RESTRICT,
  montant_ht numeric DEFAULT 0,
  montant_ttc numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité
  UNIQUE(id_entite, date_vente, id_flux_categorie)
);

-- Activation de la sécurité RLS
ALTER TABLE ca_reel ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ca_reel
CREATE POLICY "Les utilisateurs peuvent créer des CA réels pour leur contrat"
  ON ca_reel
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les CA réels de leur contrat"
  ON ca_reel
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les CA réels de leur contrat"
  ON ca_reel
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

CREATE POLICY "Les utilisateurs peuvent supprimer les CA réels de leur contrat"
  ON ca_reel
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON ca_reel
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON ca_reel
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_ca_reel_updated_at
  BEFORE UPDATE ON ca_reel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_ca_reel_com_contrat_client_id 
  ON ca_reel(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_ca_reel_id_entite 
  ON ca_reel(id_entite);

CREATE INDEX IF NOT EXISTS idx_ca_reel_date_vente 
  ON ca_reel(date_vente);

CREATE INDEX IF NOT EXISTS idx_ca_reel_id_flux_categorie 
  ON ca_reel(id_flux_categorie);

CREATE INDEX IF NOT EXISTS idx_ca_reel_entite_date_categorie 
  ON ca_reel(id_entite, date_vente, id_flux_categorie);

-- =============================================
-- Table 2: ca_reel_detail - Niveau type de service
-- =============================================
CREATE TABLE IF NOT EXISTS ca_reel_detail (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_ca_reel bigint NOT NULL REFERENCES ca_reel(id) ON DELETE CASCADE,
  id_type_service uuid NOT NULL REFERENCES ca_type_service(id) ON DELETE RESTRICT,
  montant_ht numeric DEFAULT 0,
  montant_ttc numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité
  UNIQUE(id_ca_reel, id_type_service)
);

-- Activation de la sécurité RLS
ALTER TABLE ca_reel_detail ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ca_reel_detail
CREATE POLICY "Les utilisateurs peuvent créer des détails de CA réel pour leur contrat"
  ON ca_reel_detail
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
    FROM ca_reel
    WHERE ca_reel.id = id_ca_reel
    AND ca_reel.com_contrat_client_id = (
      SELECT com_profil.com_contrat_client_id
      FROM com_profil
      WHERE (com_profil.user_id = auth.uid())
    )
  ));

CREATE POLICY "Les utilisateurs peuvent lire les détails de CA réel de leur contrat"
  ON ca_reel_detail
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM ca_reel
    WHERE ca_reel.id = id_ca_reel
    AND ca_reel.com_contrat_client_id = (
      SELECT com_profil.com_contrat_client_id
      FROM com_profil
      WHERE (com_profil.user_id = auth.uid())
    )
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les détails de CA réel de leur contrat"
  ON ca_reel_detail
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM ca_reel
    WHERE ca_reel.id = id_ca_reel
    AND ca_reel.com_contrat_client_id = (
      SELECT com_profil.com_contrat_client_id
      FROM com_profil
      WHERE (com_profil.user_id = auth.uid())
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM ca_reel
    WHERE ca_reel.id = id_ca_reel
    AND ca_reel.com_contrat_client_id = (
      SELECT com_profil.com_contrat_client_id
      FROM com_profil
      WHERE (com_profil.user_id = auth.uid())
    )
  ));

CREATE POLICY "Les utilisateurs peuvent supprimer les détails de CA réel de leur contrat"
  ON ca_reel_detail
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM ca_reel
    WHERE ca_reel.id = id_ca_reel
    AND ca_reel.com_contrat_client_id = (
      SELECT com_profil.com_contrat_client_id
      FROM com_profil
      WHERE (com_profil.user_id = auth.uid())
    )
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON ca_reel_detail
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON ca_reel_detail
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_ca_reel_detail_updated_at
  BEFORE UPDATE ON ca_reel_detail
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_ca_reel_detail_id_ca_reel 
  ON ca_reel_detail(id_ca_reel);

CREATE INDEX IF NOT EXISTS idx_ca_reel_detail_id_type_service 
  ON ca_reel_detail(id_type_service);

-- =============================================
-- Table 3: ca_reel_detail_heure - Niveau heure
-- =============================================
CREATE TABLE IF NOT EXISTS ca_reel_detail_heure (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_ca_reel_detail bigint NOT NULL REFERENCES ca_reel_detail(id) ON DELETE CASCADE,
  heure text NOT NULL,
  document text,
  pu_ht numeric,
  pu_ttc numeric,
  montant_ht numeric DEFAULT 0,
  montant_ttc numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité
  UNIQUE(id_ca_reel_detail, heure, document)
);

-- Activation de la sécurité RLS
ALTER TABLE ca_reel_detail_heure ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ca_reel_detail_heure
CREATE POLICY "Les utilisateurs peuvent créer des détails horaires de CA pour leur contrat"
  ON ca_reel_detail_heure
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
    FROM ca_reel_detail
    JOIN ca_reel ON ca_reel_detail.id_ca_reel = ca_reel.id
    WHERE ca_reel_detail.id = id_ca_reel_detail
    AND ca_reel.com_contrat_client_id = (
      SELECT com_profil.com_contrat_client_id
      FROM com_profil
      WHERE (com_profil.user_id = auth.uid())
    )
  ));

CREATE POLICY "Les utilisateurs peuvent lire les détails horaires de CA de leur contrat"
  ON ca_reel_detail_heure
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM ca_reel_detail
    JOIN ca_reel ON ca_reel_detail.id_ca_reel = ca_reel.id
    WHERE ca_reel_detail.id = id_ca_reel_detail
    AND ca_reel.com_contrat_client_id = (
      SELECT com_profil.com_contrat_client_id
      FROM com_profil
      WHERE (com_profil.user_id = auth.uid())
    )
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les détails horaires de CA de leur contrat"
  ON ca_reel_detail_heure
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM ca_reel_detail
    JOIN ca_reel ON ca_reel_detail.id_ca_reel = ca_reel.id
    WHERE ca_reel_detail.id = id_ca_reel_detail
    AND ca_reel.com_contrat_client_id = (
      SELECT com_profil.com_contrat_client_id
      FROM com_profil
      WHERE (com_profil.user_id = auth.uid())
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM ca_reel_detail
    JOIN ca_reel ON ca_reel_detail.id_ca_reel = ca_reel.id
    WHERE ca_reel_detail.id = id_ca_reel_detail
    AND ca_reel.com_contrat_client_id = (
      SELECT com_profil.com_contrat_client_id
      FROM com_profil
      WHERE (com_profil.user_id = auth.uid())
    )
  ));

CREATE POLICY "Les utilisateurs peuvent supprimer les détails horaires de CA de leur contrat"
  ON ca_reel_detail_heure
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM ca_reel_detail
    JOIN ca_reel ON ca_reel_detail.id_ca_reel = ca_reel.id
    WHERE ca_reel_detail.id = id_ca_reel_detail
    AND ca_reel.com_contrat_client_id = (
      SELECT com_profil.com_contrat_client_id
      FROM com_profil
      WHERE (com_profil.user_id = auth.uid())
    )
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON ca_reel_detail_heure
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON ca_reel_detail_heure
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_ca_reel_detail_heure_updated_at
  BEFORE UPDATE ON ca_reel_detail_heure
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_ca_reel_detail_heure_id_ca_reel_detail 
  ON ca_reel_detail_heure(id_ca_reel_detail);

CREATE INDEX IF NOT EXISTS idx_ca_reel_detail_heure_heure 
  ON ca_reel_detail_heure(heure);

CREATE INDEX IF NOT EXISTS idx_ca_reel_detail_heure_document 
  ON ca_reel_detail_heure(document);

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
  AND table_name IN ('ca_reel', 'ca_reel_detail', 'ca_reel_detail_heure');
  
  IF table_count = 3 THEN
    RAISE NOTICE '✅ Les 3 tables de chiffre d''affaires réel ont été créées avec succès';
  ELSE
    RAISE WARNING '⚠️ Seulement % tables sur 3 ont été créées', table_count;
  END IF;
END $$;