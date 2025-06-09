/*
  # Création des tables de gestion des tiers

  1. Nouvelles Tables
    - `com_param_type_tiers`
      - `id` (uuid, clé primaire)
      - `code` (text, requis, unique)
      - `libelle` (text, requis)
      - `actif` (boolean, défaut true)
      - `com_contrat_client_id` (uuid, FK vers com_contrat_client)
      - `created_at` (timestamptz, défaut now())
      - `updated_at` (timestamptz, défaut now(), auto-update)
    
    - `com_tiers`
      - `id` (uuid, clé primaire)
      - `nom` (text, requis)
      - `email` (text, optionnel)
      - `telephone` (text, optionnel)
      - `adresse` (text, optionnel)
      - `actif` (boolean, défaut true)
      - `id_type_tiers` (uuid, FK vers com_param_type_tiers)
      - `com_contrat_client_id` (uuid, FK vers com_contrat_client)
      - `created_at` (timestamptz, défaut now())
      - `updated_at` (timestamptz, défaut now(), auto-update)

  2. Sécurité
    - Activation RLS sur les deux tables
    - Politiques pour limiter l'accès aux données du contrat client de l'utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  3. Contraintes
    - Clés primaires et étrangères
    - Contrainte d'unicité sur le code des types de tiers
    - Triggers pour mise à jour automatique du champ updated_at
*/

-- Création de la table com_param_type_tiers
CREATE TABLE IF NOT EXISTS com_param_type_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  libelle text NOT NULL,
  actif boolean NOT NULL DEFAULT true,
  com_contrat_client_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT com_param_type_tiers_code_unique UNIQUE (code),
  CONSTRAINT com_param_type_tiers_com_contrat_client_id_fkey 
    FOREIGN KEY (com_contrat_client_id) REFERENCES com_contrat_client(id) ON DELETE RESTRICT
);

-- Création de la table com_tiers
CREATE TABLE IF NOT EXISTS com_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  email text,
  telephone text,
  adresse text,
  actif boolean NOT NULL DEFAULT true,
  id_type_tiers uuid NOT NULL,
  com_contrat_client_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT com_tiers_id_type_tiers_fkey 
    FOREIGN KEY (id_type_tiers) REFERENCES com_param_type_tiers(id) ON DELETE RESTRICT,
  CONSTRAINT com_tiers_com_contrat_client_id_fkey 
    FOREIGN KEY (com_contrat_client_id) REFERENCES com_contrat_client(id) ON DELETE RESTRICT
);

-- Activation du RLS sur les deux tables
ALTER TABLE com_param_type_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE com_tiers ENABLE ROW LEVEL SECURITY;

-- Création des triggers pour la mise à jour automatique du champ updated_at
CREATE TRIGGER update_com_param_type_tiers_updated_at
  BEFORE UPDATE ON com_param_type_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_com_tiers_updated_at
  BEFORE UPDATE ON com_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour com_param_type_tiers
CREATE POLICY "Les utilisateurs peuvent créer des types de tiers pour leur contrat"
  ON com_param_type_tiers
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les types de tiers de leur contrat"
  ON com_param_type_tiers
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les types de tiers de leur contrat"
  ON com_param_type_tiers
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

CREATE POLICY "Les utilisateurs peuvent supprimer les types de tiers de leur contrat"
  ON com_param_type_tiers
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Politiques RLS pour com_tiers
CREATE POLICY "Les utilisateurs peuvent créer des tiers pour leur contrat"
  ON com_tiers
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les tiers de leur contrat"
  ON com_tiers
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les tiers de leur contrat"
  ON com_tiers
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

CREATE POLICY "Les utilisateurs peuvent supprimer les tiers de leur contrat"
  ON com_tiers
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_com_param_type_tiers_com_contrat_client_id 
  ON com_param_type_tiers(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_com_param_type_tiers_code 
  ON com_param_type_tiers(code);

CREATE INDEX IF NOT EXISTS idx_com_tiers_com_contrat_client_id 
  ON com_tiers(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_com_tiers_id_type_tiers 
  ON com_tiers(id_type_tiers);

CREATE INDEX IF NOT EXISTS idx_com_tiers_nom 
  ON com_tiers(nom);