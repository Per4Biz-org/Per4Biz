/*
  # Ajout de la référence au contrat client dans la table fin_compte_bancaire

  1. Modifications
    - Ajout d'une colonne com_contrat_client_id de type uuid
    - Ajout d'une clé étrangère vers la table com_contrat_client
    
  2. Notes
    - La colonne est nullable pour permettre des comptes bancaires sans contrat
    - La suppression d'un contrat est restreinte s'il est lié à un compte bancaire
*/

ALTER TABLE fin_compte_bancaire
ADD COLUMN com_contrat_client_id uuid REFERENCES com_contrat_client(id) ON DELETE RESTRICT;

-- Mise à jour des politiques existantes
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les comptes bancaires" ON fin_compte_bancaire;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent modifier les comptes bancaires" ON fin_compte_bancaire;

-- Recréation des politiques
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les comptes bancaires"
  ON fin_compte_bancaire
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les comptes bancaires"
  ON fin_compte_bancaire
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);