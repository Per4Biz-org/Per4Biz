/*
  # Ajout du champ code_user à la table com_profil

  1. Modifications
    - Ajout d'une colonne `code_user` de type text NOT NULL
    - Contrainte d'unicité sur (com_contrat_client_id, code_user)
    - Génération de codes temporaires pour les profils existants
    - Le code_user peut être modifié tant qu'il n'est pas référencé ailleurs

  2. Contraintes
    - NOT NULL sur code_user
    - Unicité sur la combinaison (com_contrat_client_id, code_user)
    - Index pour optimiser les recherches

  3. Sécurité
    - Mise à jour des politiques RLS existantes
*/

-- Étape 1: Ajouter la colonne nullable d'abord
ALTER TABLE com_profil 
ADD COLUMN IF NOT EXISTS code_user text;

-- Étape 2: Générer des codes temporaires uniques pour les enregistrements existants
UPDATE com_profil 
SET code_user = 'USER_' || EXTRACT(EPOCH FROM created_at)::bigint || '_' || SUBSTRING(id::text, 1, 8)
WHERE code_user IS NULL;

-- Étape 3: Rendre la colonne NOT NULL maintenant qu'elle a des valeurs
ALTER TABLE com_profil 
ALTER COLUMN code_user SET NOT NULL;

-- Étape 4: Ajouter la contrainte d'unicité sur (com_contrat_client_id, code_user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'com_profil_com_contrat_client_id_code_user_unique' 
    AND table_name = 'com_profil'
  ) THEN
    ALTER TABLE com_profil 
    ADD CONSTRAINT com_profil_com_contrat_client_id_code_user_unique 
    UNIQUE (com_contrat_client_id, code_user);
  END IF;
END $$;

-- Étape 5: Mise à jour des politiques RLS existantes
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

-- Étape 6: Création d'un index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_com_profil_code_user 
  ON com_profil(com_contrat_client_id, code_user);