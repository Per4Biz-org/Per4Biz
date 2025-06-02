/*
  # Ajout du champ actif à la table com_entite

  1. Modifications
    - Ajout d'un champ `actif` de type boolean avec valeur par défaut TRUE
    - Le champ est nullable pour maintenir la cohérence avec les autres champs de la table

  2. Notes
    - Utilisation de DO $$ BEGIN ... END $$ pour une migration sûre et idempotente
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'com_entite' AND column_name = 'actif'
  ) THEN
    ALTER TABLE com_entite ADD COLUMN actif boolean DEFAULT TRUE;
  END IF;
END $$;