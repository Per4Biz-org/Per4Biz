/*
  # Ajout de la référence au contrat client dans la table com_profil

  1. Modifications
    - Ajout d'une colonne com_contrat_client_id de type uuid
    - Ajout d'une clé étrangère vers la table com_contrat_client
    
  2. Notes
    - La colonne est nullable pour permettre des profils sans contrat
    - La suppression d'un contrat est restreinte s'il est lié à un profil
*/

ALTER TABLE com_profil
ADD COLUMN IF NOT EXISTS com_contrat_client_id uuid REFERENCES com_contrat_client(id) ON DELETE RESTRICT;

-- Mise à jour des politiques existantes pour inclure le nouveau champ
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire leur propre profil" ON com_profil;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON com_profil;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur propre profil" ON com_profil;

CREATE POLICY "Les utilisateurs peuvent lire leur propre profil"
  ON com_profil
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON com_profil
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
  ON com_profil
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);