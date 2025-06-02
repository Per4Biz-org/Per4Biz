/*
  # Création de la table com_entite

  1. Nouvelle Table
    - `com_entite`
      - `id` (uuid, clé primaire)
      - `code` (varchar)
      - `libelle` (varchar)
      - `created_at` (timestamp avec fuseau horaire)
      - `updated_at` (timestamp avec fuseau horaire)

  2. Sécurité
    - Activation de RLS sur la table
    - Ajout de politiques pour la lecture et la modification
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS com_entite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar,
  libelle varchar,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de la sécurité RLS
ALTER TABLE com_entite ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les utilisateurs authentifiés
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les entités"
  ON com_entite
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique de modification pour les utilisateurs authentifiés
CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les entités"
  ON com_entite
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_com_entite_updated_at
  BEFORE UPDATE ON com_entite
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();