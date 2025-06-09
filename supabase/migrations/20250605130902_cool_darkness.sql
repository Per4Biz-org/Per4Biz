/*
  # Création de la table com_contrat_client

  1. Nouvelle Table
    - `com_contrat_client`
      - `id` (uuid, clé primaire)
      - `code` (varchar, non null)
      - `libelle` (varchar)
      - `numero_contrat` (varchar(20), non null)
      - `actif` (boolean, défaut true)
      - `date_debut` (date)
      - `date_fin` (date)
      - Champs d'audit (created_at, updated_at)

  2. Sécurité
    - Active RLS sur la table
    - Ajoute des politiques pour la lecture et la modification
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS com_contrat_client (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar NOT NULL,
  libelle varchar,
  numero_contrat varchar(20) NOT NULL,
  actif boolean DEFAULT true,
  date_debut date,
  date_fin date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de la sécurité RLS
ALTER TABLE com_contrat_client ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les utilisateurs authentifiés
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les contrats"
  ON com_contrat_client
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique de modification pour les utilisateurs authentifiés
CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les contrats"
  ON com_contrat_client
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_com_contrat_client_updated_at
  BEFORE UPDATE ON com_contrat_client
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();