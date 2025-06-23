/*
  # Ajout de champs de classification à la table com_param_type_facture

  1. Modifications
    - Ajout de trois champs booléens pour classifier les types de facture:
      - `facture_exploitation` : boolean, défaut FALSE
      - `facture_rf` : boolean, défaut FALSE
      - `facture_autres` : boolean, défaut FALSE
    
  2. Objectif
    - Permettre de catégoriser les types de facture selon leur nature
    - Faciliter le filtrage et la recherche des factures par catégorie
    - Améliorer la classification des factures pour les rapports financiers

  3. Impact
    - Les types de facture existants auront par défaut toutes les valeurs à FALSE
    - Les nouveaux types de facture pourront être classifiés lors de leur création
*/

-- Ajout des trois champs booléens avec valeur par défaut FALSE
ALTER TABLE com_param_type_facture 
ADD COLUMN facture_exploitation boolean DEFAULT FALSE,
ADD COLUMN facture_rf boolean DEFAULT FALSE,
ADD COLUMN facture_autres boolean DEFAULT FALSE;

-- Vérification de l'ajout des colonnes
DO $$
DECLARE
  columns_exist BOOLEAN;
  column_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'com_param_type_facture' 
  AND column_name IN ('facture_exploitation', 'facture_rf', 'facture_autres');
  
  columns_exist := column_count = 3;
  
  IF columns_exist THEN
    RAISE NOTICE '✅ Les trois colonnes de classification ont été ajoutées avec succès à la table com_param_type_facture';
  ELSE
    RAISE WARNING '⚠️ Seulement % colonne(s) sur 3 ont été ajoutées à la table com_param_type_facture', column_count;
  END IF;
END $$;