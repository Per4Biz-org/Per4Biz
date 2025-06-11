/*
  # Création de la table ca_budget_mensuel

  1. Nouvelle Table
    - `ca_budget_mensuel`
      - `id` : bigint, clé primaire générée automatiquement
      - `com_contrat_client_id` : uuid, obligatoire, FK vers com_contrat_client
      - `id_entite` : uuid, obligatoire, FK vers com_entite
      - `annee` : integer, obligatoire
      - `mois` : integer, obligatoire (entre 1 et 12)
      - `id_flux_categorie` : uuid, obligatoire, FK vers fin_flux_categorie
      - `montant_ht` : numeric, obligatoire, défaut 0
      - `montant_ttc` : numeric, obligatoire, défaut 0
      - `nb_jours_ouverts` : integer, optionnel
      - `nb_couverts` : integer, optionnel
      - `prix_moyen_couvert` : numeric, optionnel
      - `commentaire` : text, optionnel
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Contrainte d'unicité sur (id_entite, annee, mois, id_flux_categorie)
    - Contrainte CHECK sur mois (entre 1 et 12)
    - Clés étrangères vers com_contrat_client, com_entite et fin_flux_categorie

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
CREATE TABLE IF NOT EXISTS ca_budget_mensuel (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_entite uuid NOT NULL REFERENCES com_entite(id) ON DELETE RESTRICT,
  
  annee integer NOT NULL,
  mois integer NOT NULL CHECK (mois BETWEEN 1 AND 12),
  
  id_flux_categorie uuid NOT NULL REFERENCES fin_flux_categorie(id) ON DELETE RESTRICT,
  
  montant_ht numeric NOT NULL DEFAULT 0,
  montant_ttc numeric NOT NULL DEFAULT 0,
  
  nb_jours_ouverts integer,
  nb_couverts integer,
  prix_moyen_couvert numeric,
  
  commentaire text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité sur (id_entite, annee, mois, id_flux_categorie)
  UNIQUE(id_entite, annee, mois, id_flux_categorie)
);

-- Activation de la sécurité RLS
ALTER TABLE ca_budget_mensuel ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ca_budget_mensuel
CREATE POLICY "Les utilisateurs peuvent créer des budgets mensuels pour leur contrat"
  ON ca_budget_mensuel
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les budgets mensuels de leur contrat"
  ON ca_budget_mensuel
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les budgets mensuels de leur contrat"
  ON ca_budget_mensuel
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

CREATE POLICY "Les utilisateurs peuvent supprimer les budgets mensuels de leur contrat"
  ON ca_budget_mensuel
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON ca_budget_mensuel
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON ca_budget_mensuel
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_ca_budget_mensuel_updated_at
  BEFORE UPDATE ON ca_budget_mensuel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_ca_budget_mensuel_com_contrat_client_id 
  ON ca_budget_mensuel(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_ca_budget_mensuel_id_entite 
  ON ca_budget_mensuel(id_entite);

CREATE INDEX IF NOT EXISTS idx_ca_budget_mensuel_id_flux_categorie 
  ON ca_budget_mensuel(id_flux_categorie);

CREATE INDEX IF NOT EXISTS idx_ca_budget_mensuel_annee_mois 
  ON ca_budget_mensuel(annee, mois);

CREATE INDEX IF NOT EXISTS idx_ca_budget_mensuel_entite_annee_mois_categorie 
  ON ca_budget_mensuel(id_entite, annee, mois, id_flux_categorie);