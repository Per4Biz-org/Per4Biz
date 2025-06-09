/*
  # Ajout de la référence au contrat client dans la table entité

  1. Modifications
    - Ajout d'un champ `com_contrat_client_id` de type uuid
    - Création d'une clé étrangère vers la table com_contrat_client
    - Mise à jour des politiques existantes

  2. Notes
    - Le champ est nullable
    - La suppression d'un contrat est restreinte s'il est référencé par une entité
*/

-- Ajout de la colonne
ALTER TABLE com_entite 
ADD COLUMN com_contrat_client_id uuid REFERENCES com_contrat_client(id) ON DELETE RESTRICT;

-- Mise à jour des politiques existantes
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les entités" ON com_entite;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent modifier les entités" ON com_entite;

-- Recréation des politiques
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les entités"
  ON com_entite
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les entités"
  ON com_entite
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);