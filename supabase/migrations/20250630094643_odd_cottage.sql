/*
  # Correction pour la gestion des photos de personnel

  1. Ajout d'un trigger pour mettre à jour le champ lien_photo
     - Assure que les valeurs vides sont correctement converties en NULL
     - Empêche les problèmes de stockage avec des chaînes vides
*/

-- Créer une fonction pour normaliser les valeurs vides en NULL
CREATE OR REPLACE FUNCTION normalize_empty_strings()
RETURNS TRIGGER AS $$
BEGIN
  -- Convertir les chaînes vides en NULL pour lien_photo
  IF NEW.lien_photo = '' THEN
    NEW.lien_photo := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour appliquer la normalisation avant INSERT ou UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'normalize_empty_strings_trigger' 
    AND tgrelid = 'rh_personnel'::regclass
  ) THEN
    CREATE TRIGGER normalize_empty_strings_trigger
    BEFORE INSERT OR UPDATE ON rh_personnel
    FOR EACH ROW
    EXECUTE FUNCTION normalize_empty_strings();
  END IF;
END $$;

-- Mettre à jour les enregistrements existants pour corriger les chaînes vides
UPDATE rh_personnel
SET lien_photo = NULL
WHERE lien_photo = '';