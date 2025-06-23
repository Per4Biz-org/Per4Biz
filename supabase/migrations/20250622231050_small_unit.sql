/*
  # Création de la table rh_affectation

  1. Nouvelle Table
    - `rh_affectation`
      - `id` (uuid, clé primaire, générée automatiquement)
      - `com_contrat_client_id` (uuid, obligatoire, FK vers com_contrat_client)
      - `id_entite` (uuid, obligatoire, FK vers com_entite)
      - `id_personnel` (uuid, obligatoire, FK vers rh_personnel)
      - `id_contrat` (uuid, obligatoire, FK vers rh_historique_contrat)
      - `id_fonction` (uuid, obligatoire, FK vers rh_fonction)
      - `date_debut` (date, obligatoire)
      - `date_fin` (date, optionnelle)
      - `actif` (boolean, défaut true)
      - `commentaire` (text, optionnel)
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Clés étrangères vers toutes les tables référencées
    - Suppression restreinte pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
*/

-- Création de la table
CREATE TABLE public.rh_affectation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL,
  id_entite uuid NOT NULL,
  id_personnel uuid NOT NULL,
  id_contrat uuid NOT NULL,
  id_fonction uuid NOT NULL,
  date_debut date NOT NULL,
  date_fin date NULL,
  actif boolean NULL DEFAULT true,
  commentaire text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by uuid NULL DEFAULT auth.uid(),
  updated_by uuid NULL,
  
  CONSTRAINT rh_affectation_pkey PRIMARY KEY (id),
  CONSTRAINT rh_affectation_com_contrat_client_id_fkey FOREIGN KEY (com_contrat_client_id) REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  CONSTRAINT rh_affectation_id_entite_fkey FOREIGN KEY (id_entite) REFERENCES com_entite(id) ON DELETE RESTRICT,
  CONSTRAINT rh_affectation_id_personnel_fkey FOREIGN KEY (id_personnel) REFERENCES rh_personnel(id) ON DELETE RESTRICT,
  CONSTRAINT rh_affectation_id_contrat_fkey FOREIGN KEY (id_contrat) REFERENCES rh_historique_contrat(id) ON DELETE RESTRICT,
  CONSTRAINT rh_affectation_id_fonction_fkey FOREIGN KEY (id_fonction) REFERENCES rh_fonction(id) ON DELETE RESTRICT,
  CONSTRAINT rh_affectation_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT rh_affectation_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Création des index
CREATE INDEX IF NOT EXISTS idx_rh_affectation_com_contrat_client_id ON public.rh_affectation USING btree (com_contrat_client_id);
CREATE INDEX IF NOT EXISTS idx_rh_affectation_id_entite ON public.rh_affectation USING btree (id_entite);
CREATE INDEX IF NOT EXISTS idx_rh_affectation_id_personnel ON public.rh_affectation USING btree (id_personnel);
CREATE INDEX IF NOT EXISTS idx_rh_affectation_id_contrat ON public.rh_affectation USING btree (id_contrat);
CREATE INDEX IF NOT EXISTS idx_rh_affectation_id_fonction ON public.rh_affectation USING btree (id_fonction);
CREATE INDEX IF NOT EXISTS idx_rh_affectation_date_debut ON public.rh_affectation USING btree (date_debut);
CREATE INDEX IF NOT EXISTS idx_rh_affectation_date_fin ON public.rh_affectation USING btree (date_fin);
CREATE INDEX IF NOT EXISTS idx_rh_affectation_actif ON public.rh_affectation USING btree (actif);

-- Activation de la sécurité RLS
ALTER TABLE rh_affectation ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour rh_affectation
CREATE POLICY "Les utilisateurs peuvent créer des affectations pour leur contrat"
  ON rh_affectation
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les affectations de leur contrat"
  ON rh_affectation
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les affectations de leur contrat"
  ON rh_affectation
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

CREATE POLICY "Les utilisateurs peuvent supprimer les affectations de leur contrat"
  ON rh_affectation
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON rh_affectation
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON rh_affectation
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER update_rh_affectation_updated_at
  BEFORE UPDATE ON rh_affectation
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
    WHERE table_name = 'rh_affectation'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table rh_affectation a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table rh_affectation';
  END IF;
END $$;