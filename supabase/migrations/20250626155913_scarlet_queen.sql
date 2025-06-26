/*
  # Ajout des champs de gestion de matricule

  1. Nouvelles Colonnes
    - `mat_prefixe` (varchar(6)) - Préfixe du matricule (ex: "MEL")
    - `mat_chrono` (integer) - Compteur qui s'incrémente à chaque création de matricule
    - `mat_nb_position` (integer) - Nombre de positions pour afficher le chrono (ex: 3 pour "MEL006")
*/

-- Ajout des colonnes pour la gestion du matricule
ALTER TABLE public.rh_param_generaux 
ADD COLUMN IF NOT EXISTS mat_prefixe varchar(6),
ADD COLUMN IF NOT EXISTS mat_chrono integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS mat_nb_position integer DEFAULT 3;

-- Commentaires explicatifs sur les colonnes
COMMENT ON COLUMN public.rh_param_generaux.mat_prefixe IS 'Préfixe du matricule (ex: MEL)';
COMMENT ON COLUMN public.rh_param_generaux.mat_chrono IS 'Compteur qui s''incrémente à chaque création de matricule';
COMMENT ON COLUMN public.rh_param_generaux.mat_nb_position IS 'Nombre de positions pour afficher le chrono (ex: 3 pour MEL006)';