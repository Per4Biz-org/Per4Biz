/*
  # Création de la table rh_historique_financier

  1. Nouvelle Table
    - `rh_historique_financier`
      - `id` : uuid, clé primaire, générée automatiquement
      - `com_contrat_client_id` : uuid, obligatoire, référence vers com_contrat_client
      - `id_contrat` : uuid, obligatoire, référence vers rh_historique_contrat
      - `date_debut` : date, obligatoire
      - `date_fin` : date, optionnelle
      - `id_categorie` : uuid, obligatoire, référence vers fin_flux_categorie
      - `id_sous_categorie` : uuid, obligatoire, référence vers fin_flux_sous_categorie
      - `montant` : numeric, obligatoire
      - `commentaire` : text, optionnel
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Clés étrangères vers com_contrat_client, rh_historique_contrat, fin_flux_categorie, fin_flux_sous_categorie
    - Suppression restreinte pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur les champs de recherche fréquents
*/

-- Création de la table
CREATE TABLE public.rh_historique_financier (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL,
  id_contrat uuid NOT NULL,
  date_debut date NOT NULL,
  date_fin date NULL,
  id_categorie uuid NOT NULL,
  id_sous_categorie uuid NOT NULL,
  montant numeric NOT NULL,
  commentaire text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by uuid NULL DEFAULT auth.uid(),
  updated_by uuid NULL,
  
  CONSTRAINT rh_historique_financier_pkey PRIMARY KEY (id),
  CONSTRAINT rh_historique_financier_contrat_fkey FOREIGN KEY (id_contrat) REFERENCES rh_historique_contrat(id) ON DELETE RESTRICT,
  CONSTRAINT rh_historique_financier_categorie_fkey FOREIGN KEY (id_categorie) REFERENCES fin_flux_categorie(id) ON DELETE RESTRICT,
  CONSTRAINT rh_historique_financier_sous_categorie_fkey FOREIGN KEY (id_sous_categorie) REFERENCES fin_flux_sous_categorie(id) ON DELETE RESTRICT,
  CONSTRAINT rh_historique_financier_com_contrat_client_id_fkey FOREIGN KEY (com_contrat_client_id) REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  CONSTRAINT rh_historique_financier_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT rh_historique_financier_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Création des index
CREATE INDEX IF NOT EXISTS idx_rh_historique_financier_contrat ON public.rh_historique_financier USING btree (id_contrat);
CREATE INDEX IF NOT EXISTS idx_rh_historique_financier_categorie ON public.rh_historique_financier USING btree (id_categorie);
CREATE INDEX IF NOT EXISTS idx_rh_historique_financier_sous_categorie ON public.rh_historique_financier USING btree (id_sous_categorie);
CREATE INDEX IF NOT EXISTS idx_rh_historique_financier_client ON public.rh_historique_financier USING btree (com_contrat_client_id);
CREATE INDEX IF NOT EXISTS idx_rh_historique_financier_date_debut ON public.rh_historique_financier USING btree (date_debut);
CREATE INDEX IF NOT EXISTS idx_rh_historique_financier_date_fin ON public.rh_historique_financier USING btree (date_fin);

-- Activation de la sécurité RLS
ALTER TABLE rh_historique_financier ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour rh_historique_financier
CREATE POLICY "Les utilisateurs peuvent créer des historiques financiers pour leur contrat"
  ON rh_historique_financier
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les historiques financiers de leur contrat"
  ON rh_historique_financier
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les historiques financiers de leur contrat"
  ON rh_historique_financier
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

CREATE POLICY "Les utilisateurs peuvent supprimer les historiques financiers de leur contrat"
  ON rh_historique_financier
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON rh_historique_financier
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON rh_historique_financier
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER update_rh_historique_financier_updated_at
  BEFORE UPDATE ON rh_historique_financier
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
    WHERE table_name = 'rh_historique_financier'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table rh_historique_financier a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table rh_historique_financier';
  END IF;
END $$;