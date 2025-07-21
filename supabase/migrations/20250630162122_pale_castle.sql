/*
  # Création de la table rh_budget_mensuel

  1. Nouvelle Table
    - `rh_budget_mensuel` : Table pour gérer les prévisions mensuelles des coûts RH
      - `id` (uuid, primary key)
      - `com_contrat_client_id` (uuid, not null)
      - `id_entite` (uuid, not null)
      - `id_personnel` (uuid, not null)
      - `id_contrat` (uuid, not null)
      - `annee` (integer, not null)
      - `mois` (integer, not null)
      - `id_categorie` (uuid, not null)
      - `id_sous_categorie` (uuid, not null)
      - `montant` (numeric, not null)
      - `commentaire` (text, null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid)
      - `updated_by` (uuid)
  
  2. Security
    - Enable RLS on `rh_budget_mensuel` table
    - Add policies for authenticated users to manage their own data
    
  3. Triggers
    - Add standard triggers for audit fields
*/

-- Création de la table rh_budget_mensuel
CREATE TABLE public.rh_budget_mensuel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL,
  id_entite uuid NOT NULL,
  id_personnel uuid NOT NULL,
  id_contrat uuid NOT NULL,
  annee integer NOT NULL,
  mois integer NOT NULL CHECK (mois BETWEEN 1 AND 12),
  id_categorie uuid NOT NULL,
  id_sous_categorie uuid NOT NULL,
  montant numeric NOT NULL,
  commentaire text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid,
  
  -- Contraintes de clé étrangère
  CONSTRAINT rh_budget_mensuel_com_contrat_client_id_fkey FOREIGN KEY (com_contrat_client_id) REFERENCES public.com_contrat_client(id) ON DELETE RESTRICT,
  CONSTRAINT rh_budget_mensuel_id_entite_fkey FOREIGN KEY (id_entite) REFERENCES public.com_entite(id) ON DELETE RESTRICT,
  CONSTRAINT rh_budget_mensuel_id_personnel_fkey FOREIGN KEY (id_personnel) REFERENCES public.rh_personnel(id) ON DELETE CASCADE,
  CONSTRAINT rh_budget_mensuel_id_contrat_fkey FOREIGN KEY (id_contrat) REFERENCES public.rh_historique_contrat(id) ON DELETE RESTRICT,
  CONSTRAINT rh_budget_mensuel_id_categorie_fkey FOREIGN KEY (id_categorie) REFERENCES public.fin_flux_categorie(id) ON DELETE RESTRICT,
  CONSTRAINT rh_budget_mensuel_id_sous_categorie_fkey FOREIGN KEY (id_sous_categorie) REFERENCES public.fin_flux_sous_categorie(id) ON DELETE RESTRICT,
  CONSTRAINT rh_budget_mensuel_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT rh_budget_mensuel_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Création des index pour améliorer les performances
CREATE INDEX idx_rh_budget_mensuel_com_contrat_client_id ON public.rh_budget_mensuel(com_contrat_client_id);
CREATE INDEX idx_rh_budget_mensuel_id_entite ON public.rh_budget_mensuel(id_entite);
CREATE INDEX idx_rh_budget_mensuel_id_personnel ON public.rh_budget_mensuel(id_personnel);
CREATE INDEX idx_rh_budget_mensuel_id_contrat ON public.rh_budget_mensuel(id_contrat);
CREATE INDEX idx_rh_budget_mensuel_id_categorie ON public.rh_budget_mensuel(id_categorie);
CREATE INDEX idx_rh_budget_mensuel_id_sous_categorie ON public.rh_budget_mensuel(id_sous_categorie);
CREATE INDEX idx_rh_budget_mensuel_annee_mois ON public.rh_budget_mensuel(annee, mois);
CREATE INDEX idx_rh_budget_mensuel_personnel_annee_mois ON public.rh_budget_mensuel(id_personnel, annee, mois);

-- Activation de Row Level Security (RLS)
ALTER TABLE public.rh_budget_mensuel ENABLE ROW LEVEL SECURITY;

-- Création des politiques RLS
CREATE POLICY "Les utilisateurs peuvent créer des budgets mensuels pour leur contrat"
ON public.rh_budget_mensuel FOR INSERT
TO authenticated
WITH CHECK (com_contrat_client_id = (SELECT com_profil.com_contrat_client_id FROM public.com_profil WHERE com_profil.user_id = auth.uid()));

CREATE POLICY "Les utilisateurs peuvent lire les budgets mensuels de leur contrat"
ON public.rh_budget_mensuel FOR SELECT
TO authenticated
USING (com_contrat_client_id = (SELECT com_profil.com_contrat_client_id FROM public.com_profil WHERE com_profil.user_id = auth.uid()));

CREATE POLICY "Les utilisateurs peuvent modifier les budgets mensuels de leur contrat"
ON public.rh_budget_mensuel FOR UPDATE
TO authenticated
USING (com_contrat_client_id = (SELECT com_profil.com_contrat_client_id FROM public.com_profil WHERE com_profil.user_id = auth.uid()))
WITH CHECK (com_contrat_client_id = (SELECT com_profil.com_contrat_client_id FROM public.com_profil WHERE com_profil.user_id = auth.uid()));

CREATE POLICY "Les utilisateurs peuvent supprimer les budgets mensuels de leur contrat"
ON public.rh_budget_mensuel FOR DELETE
TO authenticated
USING (com_contrat_client_id = (SELECT com_profil.com_contrat_client_id FROM public.com_profil WHERE com_profil.user_id = auth.uid()));

-- Création des triggers standards
CREATE TRIGGER prevent_created_by_update_trigger
BEFORE UPDATE ON public.rh_budget_mensuel
FOR EACH ROW
EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER set_updated_by_trigger
BEFORE UPDATE ON public.rh_budget_mensuel
FOR EACH ROW
EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER update_rh_budget_mensuel_updated_at
BEFORE UPDATE ON public.rh_budget_mensuel
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();