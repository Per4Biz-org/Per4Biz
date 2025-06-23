/*
  # Création de la table rh_cout_mensuel

  1. Nouvelle Table
    - `rh_cout_mensuel`
      - `id` : uuid, clé primaire générée automatiquement
      - `com_contrat_client_id` : uuid, obligatoire, FK vers com_contrat_client
      - `id_entite` : uuid, obligatoire, FK vers com_entite
      - `id_personnel` : uuid, obligatoire, FK vers rh_personnel
      - `id_contrat` : uuid, obligatoire, FK vers rh_historique_contrat
      - `annee` : integer, obligatoire
      - `mois` : integer, obligatoire (entre 1 et 12)
      - `id_categorie` : uuid, obligatoire, FK vers fin_flux_categorie
      - `id_sous_categorie` : uuid, obligatoire, FK vers fin_flux_sous_categorie
      - `montant` : numeric, obligatoire
      - `commentaire` : text, optionnel
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Contrainte CHECK sur mois (entre 1 et 12)
    - Clés étrangères vers toutes les tables référencées
    - Suppression restreinte pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur les champs de recherche fréquents (annee, mois)
*/

-- Création de la table
CREATE TABLE public.rh_cout_mensuel (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL,
  id_entite uuid NOT NULL,
  id_personnel uuid NOT NULL,
  id_contrat uuid NOT NULL,
  annee integer NOT NULL,
  mois integer NOT NULL CHECK (mois BETWEEN 1 AND 12),
  id_categorie uuid NOT NULL,
  id_sous_categorie uuid NOT NULL,
  montant numeric NOT NULL,
  commentaire text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by uuid NULL DEFAULT auth.uid(),
  updated_by uuid NULL,

  CONSTRAINT rh_cout_mensuel_pkey PRIMARY KEY (id),
  CONSTRAINT rh_cout_mensuel_client_fkey FOREIGN KEY (com_contrat_client_id) REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  CONSTRAINT rh_cout_mensuel_entite_fkey FOREIGN KEY (id_entite) REFERENCES com_entite(id) ON DELETE RESTRICT,
  CONSTRAINT rh_cout_mensuel_personnel_fkey FOREIGN KEY (id_personnel) REFERENCES rh_personnel(id) ON DELETE RESTRICT,
  CONSTRAINT rh_cout_mensuel_contrat_fkey FOREIGN KEY (id_contrat) REFERENCES rh_historique_contrat(id) ON DELETE RESTRICT,
  CONSTRAINT rh_cout_mensuel_categorie_fkey FOREIGN KEY (id_categorie) REFERENCES fin_flux_categorie(id) ON DELETE RESTRICT,
  CONSTRAINT rh_cout_mensuel_sous_categorie_fkey FOREIGN KEY (id_sous_categorie) REFERENCES fin_flux_sous_categorie(id) ON DELETE RESTRICT,
  CONSTRAINT rh_cout_mensuel_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT rh_cout_mensuel_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Création des index
CREATE INDEX IF NOT EXISTS idx_rh_cout_mensuel_client ON public.rh_cout_mensuel USING btree (com_contrat_client_id);
CREATE INDEX IF NOT EXISTS idx_rh_cout_mensuel_entite ON public.rh_cout_mensuel USING btree (id_entite);
CREATE INDEX IF NOT EXISTS idx_rh_cout_mensuel_personnel ON public.rh_cout_mensuel USING btree (id_personnel);
CREATE INDEX IF NOT EXISTS idx_rh_cout_mensuel_contrat ON public.rh_cout_mensuel USING btree (id_contrat);
CREATE INDEX IF NOT EXISTS idx_rh_cout_mensuel_categorie ON public.rh_cout_mensuel USING btree (id_categorie);
CREATE INDEX IF NOT EXISTS idx_rh_cout_mensuel_sous_categorie ON public.rh_cout_mensuel USING btree (id_sous_categorie);
CREATE INDEX IF NOT EXISTS idx_rh_cout_mensuel_mois ON public.rh_cout_mensuel USING btree (annee, mois);

-- Activation de la sécurité RLS
ALTER TABLE rh_cout_mensuel ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour rh_cout_mensuel
CREATE POLICY "Les utilisateurs peuvent créer des coûts mensuels pour leur contrat"
  ON rh_cout_mensuel
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les coûts mensuels de leur contrat"
  ON rh_cout_mensuel
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les coûts mensuels de leur contrat"
  ON rh_cout_mensuel
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

CREATE POLICY "Les utilisateurs peuvent supprimer les coûts mensuels de leur contrat"
  ON rh_cout_mensuel
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON rh_cout_mensuel
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON rh_cout_mensuel
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER update_rh_cout_mensuel_updated_at
  BEFORE UPDATE ON rh_cout_mensuel
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
    WHERE table_name = 'rh_cout_mensuel'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table rh_cout_mensuel a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table rh_cout_mensuel';
  END IF;
END $$;