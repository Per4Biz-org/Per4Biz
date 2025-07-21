/*
  # Création de la table rh_param_sous_categorie

  1. New Tables
    - `rh_param_sous_categorie`
      - `id` (uuid, primary key)
      - `com_contrat_client_id` (uuid, not null)
      - `id_sous_categorie` (uuid, not null)
      - `soumis_charge_patronale` (boolean, not null)
      - `soumis_charge_salariale` (boolean, not null)
      - `actif` (boolean, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid)
      - `updated_by` (uuid)
  2. Security
    - Enable RLS on `rh_param_sous_categorie` table
    - Add policies for authenticated users to read/write their own data
*/

-- Création de la table rh_param_sous_categorie
CREATE TABLE public.rh_param_sous_categorie (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    com_contrat_client_id uuid NOT NULL,
    id_sous_categorie uuid NOT NULL,
    soumis_charge_patronale boolean NOT NULL DEFAULT FALSE,
    soumis_charge_salariale boolean NOT NULL DEFAULT FALSE,
    actif boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid DEFAULT auth.uid(),
    updated_by uuid,

    CONSTRAINT rh_param_sous_categorie_unique_contract_sous_categorie UNIQUE (com_contrat_client_id, id_sous_categorie),
    CONSTRAINT rh_param_sous_categorie_com_contrat_client_id_fkey FOREIGN KEY (com_contrat_client_id) REFERENCES public.com_contrat_client(id) ON DELETE RESTRICT,
    CONSTRAINT rh_param_sous_categorie_id_sous_categorie_fkey FOREIGN KEY (id_sous_categorie) REFERENCES public.fin_flux_sous_categorie(id) ON DELETE RESTRICT,
    CONSTRAINT rh_param_sous_categorie_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT rh_param_sous_categorie_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Ajout de commentaires pour la documentation
COMMENT ON TABLE public.rh_param_sous_categorie IS 'Paramètres spécifiques aux sous-catégories RH pour les charges patronales et salariales.';
COMMENT ON COLUMN public.rh_param_sous_categorie.id IS 'Identifiant unique de la sous-catégorie RH.';
COMMENT ON COLUMN public.rh_param_sous_categorie.com_contrat_client_id IS 'Identifiant du contrat client (multi-tenant).';
COMMENT ON COLUMN public.rh_param_sous_categorie.id_sous_categorie IS 'Identifiant de la sous-catégorie de flux financier.';
COMMENT ON COLUMN public.rh_param_sous_categorie.soumis_charge_patronale IS 'Indique si la sous-catégorie est soumise aux charges patronales.';
COMMENT ON COLUMN public.rh_param_sous_categorie.soumis_charge_salariale IS 'Indique si la sous-catégorie est soumise aux charges salariales.';
COMMENT ON COLUMN public.rh_param_sous_categorie.actif IS 'Statut d''activité de l''enregistrement.';
COMMENT ON COLUMN public.rh_param_sous_categorie.created_at IS 'Date et heure de création de l''enregistrement.';
COMMENT ON COLUMN public.rh_param_sous_categorie.updated_at IS 'Date et heure de la dernière mise à jour de l''enregistrement.';
COMMENT ON COLUMN public.rh_param_sous_categorie.created_by IS 'Utilisateur ayant créé l''enregistrement.';
COMMENT ON COLUMN public.rh_param_sous_categorie.updated_by IS 'Utilisateur ayant mis à jour l''enregistrement en dernier.';

-- Activation de Row Level Security (RLS)
ALTER TABLE public.rh_param_sous_categorie ENABLE ROW LEVEL SECURITY;

-- Création des politiques RLS
-- Politique pour permettre aux utilisateurs authentifiés de lire leurs propres paramètres
CREATE POLICY "Les utilisateurs authentifiés peuvent lire leurs paramètres de sous-catégorie RH"
ON public.rh_param_sous_categorie FOR SELECT
TO authenticated
USING (com_contrat_client_id = (SELECT com_profil.com_contrat_client_id FROM public.com_profil WHERE com_profil.user_id = auth.uid()));

-- Politique pour permettre aux utilisateurs authentifiés de créer leurs propres paramètres
CREATE POLICY "Les utilisateurs authentifiés peuvent créer leurs paramètres de sous-catégorie RH"
ON public.rh_param_sous_categorie FOR INSERT
TO authenticated
WITH CHECK (com_contrat_client_id = (SELECT com_profil.com_contrat_client_id FROM public.com_profil WHERE com_profil.user_id = auth.uid()));

-- Politique pour permettre aux utilisateurs authentifiés de modifier leurs propres paramètres
CREATE POLICY "Les utilisateurs authentifiés peuvent modifier leurs paramètres de sous-catégorie RH"
ON public.rh_param_sous_categorie FOR UPDATE
TO authenticated
USING (com_contrat_client_id = (SELECT com_profil.com_contrat_client_id FROM public.com_profil WHERE com_profil.user_id = auth.uid()))
WITH CHECK (com_contrat_client_id = (SELECT com_profil.com_contrat_client_id FROM public.com_profil WHERE com_profil.user_id = auth.uid()));

-- Politique pour permettre aux utilisateurs authentifiés de supprimer leurs propres paramètres
CREATE POLICY "Les utilisateurs authentifiés peuvent supprimer leurs paramètres de sous-catégorie RH"
ON public.rh_param_sous_categorie FOR DELETE
TO authenticated
USING (com_contrat_client_id = (SELECT com_profil.com_contrat_client_id FROM public.com_profil WHERE com_profil.user_id = auth.uid()));

-- Application des triggers standards
CREATE TRIGGER prevent_created_by_update_trigger
BEFORE UPDATE ON public.rh_param_sous_categorie
FOR EACH ROW
EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER set_updated_by_trigger
BEFORE UPDATE ON public.rh_param_sous_categorie
FOR EACH ROW
EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER update_rh_param_sous_categorie_updated_at
BEFORE UPDATE ON public.rh_param_sous_categorie
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();