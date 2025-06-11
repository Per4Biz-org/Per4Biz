/*
  # Ajout des champs heure_debut et heure_fin à la table ca_type_service

  1. Modifications
    - Ajout d'un champ `heure_debut` de type time avec valeur par défaut '00:00'
    - Ajout d'un champ `heure_fin` de type time avec valeur par défaut '23:59'
    
  2. Objectif
    - Permettre de définir une plage horaire pour chaque type de service
    - Faciliter le calcul du chiffre d'affaires par créneau horaire
    - Améliorer la segmentation des services pour l'analyse des ventes

  3. Impact
    - Les types de service existants auront des valeurs par défaut (00:00-23:59)
    - Les nouveaux types de service pourront spécifier des plages horaires précises
*/

-- Ajout des colonnes avec valeurs par défaut
ALTER TABLE ca_type_service
ADD COLUMN heure_debut time DEFAULT '00:00',
ADD COLUMN heure_fin time DEFAULT '23:59';

-- Vérification de l'ajout des colonnes
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'ca_type_service'
  AND column_name IN ('heure_debut', 'heure_fin');
  
  IF col_count = 2 THEN
    RAISE NOTICE '✅ Les colonnes heure_debut et heure_fin ont été ajoutées avec succès à la table ca_type_service';
  ELSE
    RAISE WARNING '⚠️ Problème lors de l''ajout des colonnes: seulement % colonne(s) sur 2 ont été ajoutées', col_count;
  END IF;
END $$;