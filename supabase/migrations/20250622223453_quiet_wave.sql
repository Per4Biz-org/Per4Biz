/*
  # Création de la table rh_fonction

  1. Nouvelle Table
    - `rh_fonction`
      - `id` : uuid, clé primaire générée automatiquement
      - `com_contrat_client_id` : uuid, obligatoire, FK vers com_contrat_client
      - `code` : varchar(10), obligatoire
      - `libelle` : varchar(50), obligatoire
      - `commentaire` : text, optionnel
      - `ordre_affichage` : integer, optionnel
      - `actif` : boolean, obligatoire, défaut true
      - Champs d'audit (created_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Contrainte d'unicité sur (com_contrat_client_id, code)
    - Clé étrangère vers com_contrat_client
    - Suppression restreinte pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données
*/

-- Création de la table
CREATE TABLE public.rh_fonction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  code varchar(10) NOT NULL,
  libelle varchar(50) NOT NULL,
  commentaire text,
  ordre_affichage integer,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT rh_fonction_unique UNIQUE (com_contrat_client_id, code)
);

-- Création des index
CREATE INDEX IF NOT EXISTS idx_rh_fonction_com_contrat_client_id ON public.rh_fonction (com_contrat_client_id);
CREATE INDEX IF NOT EXISTS idx_rh_fonction_code ON public.rh_fonction (code);

-- Activation de la sécurité RLS
ALTER TABLE rh_fonction ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour rh_fonction
CREATE POLICY "Les utilisateurs peuvent créer des fonctions pour leur contrat"
  ON rh_fonction
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les fonctions de leur contrat"
  ON rh_fonction
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les fonctions de leur contrat"
  ON rh_fonction
  FOR UPDATE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ))
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent supprimer les fonctions de leur contrat"
  ON rh_fonction
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON rh_fonction
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON rh_fonction
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_rh_fonction_updated_at
  BEFORE UPDATE ON rh_fonction
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'rh_fonction'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table rh_fonction a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table rh_fonction';
  END IF;
END $$;