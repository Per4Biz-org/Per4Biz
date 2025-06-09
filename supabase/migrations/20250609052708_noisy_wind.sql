/*
  # Ajout du champ code_user à la table com_profil

  1. Modifications
    - Ajout d'un champ `code_user` de type text NOT NULL
    - Contrainte d'unicité sur (com_contrat_client_id, code_user)
    - Protection contre modification après création
    - Génération automatique de codes temporaires pour les données existantes

  2. Sécurité
    - Fonction et trigger pour empêcher la modification du code_user
    - Mise à jour des politiques RLS

  3. Notes
    - Les profils existants recevront des codes temporaires uniques
    - Ces codes devront être mis à jour manuellement par les utilisateurs
*/

-- Étape 1: Ajouter la colonne avec une valeur par défaut temporaire
ALTER TABLE com_profil 
ADD COLUMN code_user text;

-- Étape 2: Générer des codes temporaires uniques pour les enregistrements existants
UPDATE com_profil 
SET code_user = 'USER_' || EXTRACT(EPOCH FROM created_at)::bigint || '_' || SUBSTRING(id::text, 1, 8)
WHERE code_user IS NULL;

-- Étape 3: Rendre la colonne NOT NULL maintenant qu'elle a des valeurs
ALTER TABLE com_profil 
ALTER COLUMN code_user SET NOT NULL;

-- Étape 4: Ajouter la contrainte d'unicité sur (com_contrat_client_id, code_user)
ALTER TABLE com_profil 
ADD CONSTRAINT com_profil_com_contrat_client_id_code_user_unique 
UNIQUE (com_contrat_client_id, code_user);

-- Étape 5: Fonction pour empêcher la modification du code_user
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

-- Étape 6: Trigger pour empêcher la modification du code_user
CREATE TRIGGER prevent_code_user_update_trigger
  BEFORE UPDATE ON com_profil
  FOR EACH ROW
  EXECUTE FUNCTION prevent_code_user_update();

-- Étape 7: Mise à jour des politiques RLS existantes
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

-- Étape 8: Création d'un index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_com_profil_code_user 
  ON com_profil(com_contrat_client_id, code_user);