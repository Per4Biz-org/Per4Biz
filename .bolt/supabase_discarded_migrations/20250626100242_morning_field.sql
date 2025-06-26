/*
  # Création de la table des paramètres sociaux et RH généraux

  1. New Tables
    - `rh_param_generaux`
      - `id` (uuid, primary key)
      - `com_contrat_client_id` (uuid, foreign key)
      - `date_debut` (date, required)
      - `date_fin` (date, optional)
      - `ss_patronale` (numeric, taux de sécurité sociale patronale)
      - `ss_salariale` (numeric, taux de sécurité sociale salariale)
      - `ticket_restau_journalier` (numeric, valeur journalière du ticket restaurant)
      - `commentaire` (text, optional)
      - `actif` (boolean, default true)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())
      - `created_by` (uuid, foreign key)
      - `updated_by` (uuid, foreign key)
  
  2. Security
    - Enable RLS on `rh_param_generaux` table
    - Add policies for authenticated users
    
  3. Constraints
    - Unique constraint on (com_contrat_client_id, date_debut)
*/

-- Création de la table rh_param_generaux
CREATE TABLE IF NOT EXISTS rh_param_generaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  date_debut date NOT NULL,
  date_fin date,
  ss_patronale numeric,
  ss_salariale numeric,
  ticket_restau_journalier numeric,
  commentaire text,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT uid() REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Contrainte d'unicité sur (com_contrat_client_id, date_debut)
ALTER TABLE rh_param_generaux 
  ADD CONSTRAINT rh_param_generaux_contrat_date_unique 
  UNIQUE (com_contrat_client_id, date_debut);

-- Création d'un index sur la date de début pour optimiser les recherches
CREATE INDEX idx_rh_param_generaux_date_debut ON rh_param_generaux(date_debut);

-- Création d'un index sur le contrat client pour optimiser les recherches
CREATE INDEX idx_rh_param_generaux_contrat_client ON rh_param_generaux(com_contrat_client_id);

-- Activer RLS (Row Level Security)
ALTER TABLE rh_param_generaux ENABLE ROW LEVEL SECURITY;

-- Trigger pour mettre à jour le champ updated_at
CREATE TRIGGER update_rh_param_generaux_updated_at
BEFORE UPDATE ON rh_param_generaux
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour empêcher la modification du champ created_by
CREATE TRIGGER prevent_created_by_update_trigger
BEFORE UPDATE ON rh_param_generaux
FOR EACH ROW
EXECUTE FUNCTION prevent_created_by_update();

-- Trigger pour définir le champ updated_by
CREATE TRIGGER set_updated_by_trigger
BEFORE UPDATE ON rh_param_generaux
FOR EACH ROW
EXECUTE FUNCTION set_updated_by();

-- Politiques RLS pour les utilisateurs authentifiés
-- Politique pour la création
CREATE POLICY "Les utilisateurs peuvent créer des paramètres généraux pour leur contrat"
  ON rh_param_generaux
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE com_profil.user_id = uid()
  ));

-- Politique pour la lecture
CREATE POLICY "Les utilisateurs peuvent lire les paramètres généraux de leur contrat"
  ON rh_param_generaux
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE com_profil.user_id = uid()
  ));

-- Politique pour la modification
CREATE POLICY "Les utilisateurs peuvent modifier les paramètres généraux de leur contrat"
  ON rh_param_generaux
  FOR UPDATE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE com_profil.user_id = uid()
  ))
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE com_profil.user_id = uid()
  ));

-- Politique pour la suppression
CREATE POLICY "Les utilisateurs peuvent supprimer les paramètres généraux de leur contrat"
  ON rh_param_generaux
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE com_profil.user_id = uid()
  ));