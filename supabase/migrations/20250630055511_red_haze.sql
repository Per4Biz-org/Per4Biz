/*
  # Ajout du champ salarie à la table fin_flux_nature

  1. Modifications
    - Ajout du champ `salarie` (boolean) à la table `fin_flux_nature` avec valeur par défaut FALSE
*/

-- Ajout du champ salarie à la table fin_flux_nature
ALTER TABLE public.fin_flux_nature 
ADD COLUMN IF NOT EXISTS salarie BOOLEAN DEFAULT FALSE;

-- Ajout d'un commentaire sur le champ
COMMENT ON COLUMN public.fin_flux_nature.salarie IS 'Indique si cette nature de flux est liée aux salariés';