/*
  # Ajout du champ paiement_caisse à la table bq_param_mode_paiement

  1. Modification
    - Ajout d'un champ `paiement_caisse` de type boolean avec valeur par défaut FALSE
    
  2. Objectif
    - Permettre d'identifier les modes de paiement utilisables en caisse
    - Faciliter le filtrage des modes de paiement dans l'interface de fermeture de caisse
    - Améliorer la gestion des paiements selon leur contexte d'utilisation
*/

-- Ajout de la colonne paiement_caisse avec valeur par défaut FALSE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bq_param_mode_paiement' AND column_name = 'paiement_caisse'
  ) THEN
    ALTER TABLE bq_param_mode_paiement ADD COLUMN paiement_caisse boolean DEFAULT FALSE;
    RAISE NOTICE 'Colonne paiement_caisse ajoutée à la table bq_param_mode_paiement';
  ELSE
    RAISE NOTICE 'La colonne paiement_caisse existe déjà dans la table bq_param_mode_paiement';
  END IF;
END $$;

-- Vérification de l'ajout de la colonne
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bq_param_mode_paiement' 
    AND column_name = 'paiement_caisse'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ La colonne paiement_caisse a été ajoutée avec succès à la table bq_param_mode_paiement';
  ELSE
    RAISE WARNING '❌ Échec de l''ajout de la colonne paiement_caisse à la table bq_param_mode_paiement';
  END IF;
END $$;