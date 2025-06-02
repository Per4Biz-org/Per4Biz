/*
  # Création de la table com_profil

  1. Nouvelle Table
    - `com_profil`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, clé étrangère vers auth.users)
      - `nom` (text, non null)
      - `prenom` (text, non null)
      - `telephone` (text, nullable)
      - `created_at` (timestamp avec timezone, par défaut now())
      - `updated_at` (timestamp avec timezone, par défaut now())

  2. Sécurité
    - Active RLS sur la table com_profil
    - Ajoute une politique pour permettre aux utilisateurs de lire leur propre profil
    - Ajoute une politique pour permettre aux utilisateurs de modifier leur propre profil
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS com_profil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nom text NOT NULL,
  prenom text NOT NULL,
  telephone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de la sécurité RLS
ALTER TABLE com_profil ENABLE ROW LEVEL SECURITY;

-- Politique de lecture
CREATE POLICY "Les utilisateurs peuvent lire leur propre profil"
  ON com_profil
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique de modification
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON com_profil
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique d'insertion
CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
  ON com_profil
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_com_profil_updated_at
  BEFORE UPDATE ON com_profil
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();