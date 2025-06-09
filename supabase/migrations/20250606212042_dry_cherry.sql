/*
  # Création de la table fin_nature_flux

  1. Nouvelle Table
    - `fin_nature_flux`
      - `id` (uuid, clé primaire)
      - `com_contrat_client_id` (uuid, obligatoire, clé étrangère vers com_contrat_client)
      - `code` (text, requis, 12 caractères max, unique par contrat)
      - `libelle` (text, requis)
      - `description` (text, optionnel)
      - `actif` (boolean, défaut true)
      - `created_at` (timestamp avec timezone, par défaut now())

  2. Contraintes
    - Clé primaire sur id
    - Clé étrangère vers com_contrat_client
    - Contrainte d'unicité sur (com_contrat_client_id, code)
    - Restrictions NOT NULL sur les champs obligatoires

  3. Sécurité
    - Activation de RLS
    - Politiques d'accès basées sur le contrat client du profil utilisateur
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS fin_nature_flux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  code text NOT NULL CHECK (length(code) <= 12),
  libelle text NOT NULL,
  description text,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  -- Contrainte d'unicité du code par contrat
  UNIQUE(com_contrat_client_id, code)
);

-- Activation de la sécurité RLS
ALTER TABLE fin_nature_flux ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : autoriser uniquement si com_contrat_client_id correspond à celui du profil
CREATE POLICY "Les utilisateurs peuvent lire les natures de flux de leur contrat"
  ON fin_nature_flux
  FOR SELECT
  TO authenticated
  USING (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );

-- Politique d'insertion : autoriser uniquement si la valeur de com_contrat_client_id correspond à celle du profil
CREATE POLICY "Les utilisateurs peuvent créer des natures de flux pour leur contrat"
  ON fin_nature_flux
  FOR INSERT
  TO authenticated
  WITH CHECK (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );

-- Politique de mise à jour : même filtre que SELECT
CREATE POLICY "Les utilisateurs peuvent modifier les natures de flux de leur contrat"
  ON fin_nature_flux
  FOR UPDATE
  TO authenticated
  USING (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );

-- Politique de suppression : même filtre que SELECT
CREATE POLICY "Les utilisateurs peuvent supprimer les natures de flux de leur contrat"
  ON fin_nature_flux
  FOR DELETE
  TO authenticated
  USING (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );