/*
  # Création de la table ca_budget_mensuel_detail

  1. Nouvelle Table
    - `ca_budget_mensuel_detail`
      - `id` : bigint, clé primaire générée automatiquement
      - `com_contrat_client_id` : uuid, obligatoire, FK vers com_contrat_client
      - `id_ca_budget_mensuel` : bigint, obligatoire, FK vers ca_budget_mensuel, ON DELETE CASCADE
      - `id_type_service` : uuid, obligatoire, FK vers ca_type_service
      - `id_flux_sous_categorie` : uuid, obligatoire, FK vers fin_flux_sous_categorie
      - `montant_ht` : numeric, obligatoire, défaut 0
      - `montant_ttc` : numeric, obligatoire, défaut 0
      - `nb_couverts` : integer, optionnel
      - `prix_moyen_couvert` : numeric, optionnel
      - `commentaire` : text, optionnel
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Contrainte d'unicité sur (id_ca_budget_mensuel, id_type_service, id_flux_sous_categorie)
    - Clés étrangères vers toutes les tables référencées
    - CASCADE pour la suppression du budget mensuel parent
    - RESTRICT pour les autres références

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Triggers
    - Triggers pour la mise à jour automatique des champs d'audit
    - Protection du champ created_by contre les modifications

  5. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur la contrainte d'unicité
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS ca_budget_mensuel_detail (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_ca_budget_mensuel bigint NOT NULL REFERENCES ca_budget_mensuel(id) ON DELETE CASCADE,
  id_type_service uuid NOT NULL REFERENCES ca_type_service(id) ON DELETE RESTRICT,
  id_flux_sous_categorie uuid NOT NULL REFERENCES fin_flux_sous_categorie(id) ON DELETE RESTRICT,
  
  montant_ht numeric NOT NULL DEFAULT 0,
  montant_ttc numeric NOT NULL DEFAULT 0,
  
  nb_couverts integer,
  prix_moyen_couvert numeric,
  
  commentaire text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité sur (id_ca_budget_mensuel, id_type_service, id_flux_sous_categorie)
  UNIQUE(id_ca_budget_mensuel, id_type_service, id_flux_sous_categorie)
);

-- Activation de la sécurité RLS
ALTER TABLE ca_budget_mensuel_detail ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ca_budget_mensuel_detail
CREATE POLICY "Les utilisateurs peuvent créer des détails de budget mensuel pour leur contrat"
  ON ca_budget_mensuel_detail
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les détails de budget mensuel de leur contrat"
  ON ca_budget_mensuel_detail
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les détails de budget mensuel de leur contrat"
  ON ca_budget_mensuel_detail
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

CREATE POLICY "Les utilisateurs peuvent supprimer les détails de budget mensuel de leur contrat"
  ON ca_budget_mensuel_detail
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON ca_budget_mensuel_detail
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON ca_budget_mensuel_detail
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_ca_budget_mensuel_detail_updated_at
  BEFORE UPDATE ON ca_budget_mensuel_detail
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_ca_budget_mensuel_detail_com_contrat_client_id 
  ON ca_budget_mensuel_detail(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_ca_budget_mensuel_detail_id_ca_budget_mensuel 
  ON ca_budget_mensuel_detail(id_ca_budget_mensuel);

CREATE INDEX IF NOT EXISTS idx_ca_budget_mensuel_detail_id_type_service 
  ON ca_budget_mensuel_detail(id_type_service);

CREATE INDEX IF NOT EXISTS idx_ca_budget_mensuel_detail_id_flux_sous_categorie 
  ON ca_budget_mensuel_detail(id_flux_sous_categorie);

CREATE INDEX IF NOT EXISTS idx_ca_budget_mensuel_detail_unique_constraint 
  ON ca_budget_mensuel_detail(id_ca_budget_mensuel, id_type_service, id_flux_sous_categorie);