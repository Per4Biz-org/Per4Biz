/*
  # Ajout des champs de sous-catégories pour les charges

  1. Nouveaux Champs
    - `id_sous_categorie_charge_patronale` (uuid, nullable) - Référence vers la sous-catégorie pour les charges patronales
    - `id_sous_categorie_charge_salariale` (uuid, nullable) - Référence vers la sous-catégorie pour les charges salariales
  
  2. Contraintes
    - Clés étrangères vers fin_flux_sous_categorie avec ON DELETE RESTRICT
  
  3. Indexes
    - Ajout d'index pour améliorer les performances des requêtes
*/

-- Ajout des champs pour les sous-catégories de charges
ALTER TABLE public.rh_param_sous_categorie
ADD COLUMN IF NOT EXISTS id_sous_categorie_charge_patronale uuid,
ADD COLUMN IF NOT EXISTS id_sous_categorie_charge_salariale uuid;

-- Ajout des contraintes de clé étrangère
ALTER TABLE public.rh_param_sous_categorie
ADD CONSTRAINT rh_param_sous_categorie_id_sous_categorie_charge_patronale_fkey
FOREIGN KEY (id_sous_categorie_charge_patronale)
REFERENCES public.fin_flux_sous_categorie(id)
ON DELETE RESTRICT;

ALTER TABLE public.rh_param_sous_categorie
ADD CONSTRAINT rh_param_sous_categorie_id_sous_categorie_charge_salariale_fkey
FOREIGN KEY (id_sous_categorie_charge_salariale)
REFERENCES public.fin_flux_sous_categorie(id)
ON DELETE RESTRICT;

-- Création des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_rh_param_sous_categorie_charge_patronale
ON public.rh_param_sous_categorie(id_sous_categorie_charge_patronale);

CREATE INDEX IF NOT EXISTS idx_rh_param_sous_categorie_charge_salariale
ON public.rh_param_sous_categorie(id_sous_categorie_charge_salariale);

-- Ajout de commentaires pour la documentation
COMMENT ON COLUMN public.rh_param_sous_categorie.id_sous_categorie_charge_patronale IS 'Référence vers la sous-catégorie où enregistrer les charges patronales calculées';
COMMENT ON COLUMN public.rh_param_sous_categorie.id_sous_categorie_charge_salariale IS 'Référence vers la sous-catégorie où enregistrer les charges salariales calculées';