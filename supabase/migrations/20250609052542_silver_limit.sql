/*
  # Ajout du champ code_user à la table com_profil

  1. Modifications
    - Ajout d'un champ `code_user` de type text NOT NULL
    - Contrainte d'unicité sur (com_contrat_client_id, code_user)
    - Politique RLS pour empêcher la modification du code_user après création
    - Trigger pour bloquer les modifications du code_user

  2. Contraintes
    - Le champ est obligatoire (NOT NULL)
    - Unique dans le contexte du contrat client
    - Non modifiable après création (protection par trigger)

  3. Sécurité
    - Mise à jour des politiques RLS existantes
    - Ajout d'une protection contre la modification du code_user
*/

-- Ajout de la colonne code_user
ALTER TABLE com_profil 
ADD COLUMN code_user text NOT NULL DEFAULT '';

-- Suppression de la valeur par défaut après ajout (pour forcer la saisie manuelle)
ALTER TABLE com_profil 
ALTER COLUMN code_user DROP DEFAULT;

-- Ajout de la contrainte d'unicité sur (com_contrat_client_id, code_user)
ALTER TABLE com_profil 
ADD CONSTRAINT com_profil_com_contrat_client_id_code_user_unique 
UNIQUE (com_contrat_client_id, code_user);

-- Fonction pour empêcher la modification du code_user
CREATE OR REPLACE FUNCTION prevent_code_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si code_user est modifié
  IF OLD.code_user IS DISTINCT FROM NEW.code_user THEN
    RAISE EXCEPTION 'Le code_user ne peut pas être modifié après création';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour empêcher la modification du code_user
CREATE TRIGGER prevent_code_user_update_trigger
  BEFORE UPDATE ON com_profil
  FOR EACH ROW
  EXECUTE FUNCTION prevent_code_user_update();

-- Mise à jour des politiques RLS existantes
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire leur propre profil" ON com_profil;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON com_profil;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur propre profil" ON com_profil;

-- Recréation des politiques avec le nouveau champ
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

-- Création d'un index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_com_profil_code_user 
  ON com_profil(com_contrat_client_id, code_user);