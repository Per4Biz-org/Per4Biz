/*
  # Création de la table fin_param_mode_paiement

  1. Nouvelle Table
    - `fin_param_mode_paiement`
      - `id` (uuid, clé primaire)
      - `com_contrat_client_id` (uuid, obligatoire, FK vers com_contrat_client)
      - `code_user` (text, obligatoire, identifie l'utilisateur créateur)
      - `code` (text, obligatoire, ex: CB, ESPECES, VIREMENT)
      - `libelle` (text, obligatoire)
      - `actif` (boolean, défaut true)
      - `created_at` (timestamp, défaut now())

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
    - Index sur com_contrat_client_id pour optimiser les performances
    - Index sur code pour les recherches
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS fin_param_mode_paiement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  code_user text NOT NULL,
  code text NOT NULL,
  libelle text NOT NULL,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  -- Contrainte d'unicité sur (com_contrat_client_id, code)
  UNIQUE(com_contrat_client_id, code)
);

-- Activation de la sécurité RLS
ALTER TABLE fin_param_mode_paiement ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour fin_param_mode_paiement
CREATE POLICY "Les utilisateurs peuvent créer des modes de paiement pour leur contrat"
  ON fin_param_mode_paiement
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les modes de paiement de leur contrat"
  ON fin_param_mode_paiement
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les modes de paiement de leur contrat"
  ON fin_param_mode_paiement
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

CREATE POLICY "Les utilisateurs peuvent supprimer les modes de paiement de leur contrat"
  ON fin_param_mode_paiement
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_fin_param_mode_paiement_com_contrat_client_id 
  ON fin_param_mode_paiement(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_fin_param_mode_paiement_code 
  ON fin_param_mode_paiement(code);

CREATE INDEX IF NOT EXISTS idx_fin_param_mode_paiement_code_user 
  ON fin_param_mode_paiement(code_user);