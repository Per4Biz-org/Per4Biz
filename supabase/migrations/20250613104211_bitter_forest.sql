/*
  # Rendre le champ id_flux_sous_categorie obligatoire dans ca_type_service

  1. Modifications
    - Mise à jour des enregistrements existants avec id_flux_sous_categorie NULL
    - Modification de la colonne pour la rendre NOT NULL
    
  2. Objectif
    - Assurer que tous les types de service sont associés à une sous-catégorie
    - Renforcer l'intégrité des données pour les analyses et rapports
*/

-- Étape 1: Identifier les enregistrements avec id_flux_sous_categorie NULL
DO $$
DECLARE
  null_count INTEGER;
  first_sous_categorie_id uuid;
BEGIN
  -- Compter les enregistrements avec id_flux_sous_categorie NULL
  SELECT COUNT(*) 
  INTO null_count
  FROM ca_type_service
  WHERE id_flux_sous_categorie IS NULL;
  
  IF null_count > 0 THEN
    RAISE NOTICE 'Trouvé % enregistrement(s) avec id_flux_sous_categorie NULL. Mise à jour automatique...', null_count;
    
    -- Pour chaque enregistrement NULL, trouver une sous-catégorie valide de la même entité
    FOR i IN 1..null_count LOOP
      -- Pour chaque type de service avec id_flux_sous_categorie NULL
      UPDATE ca_type_service ts
      SET id_flux_sous_categorie = (
        -- Trouver la première sous-catégorie disponible pour l'entité du type de service
        SELECT sc.id
        FROM fin_flux_sous_categorie sc
        JOIN fin_flux_categorie fc ON sc.id_categorie = fc.id
        WHERE fc.id_entite = ts.id_entite
        AND sc.actif = true
        LIMIT 1
      )
      WHERE ts.id = (
        SELECT id FROM ca_type_service 
        WHERE id_flux_sous_categorie IS NULL 
        LIMIT 1
      );
      
      -- Vérifier si la mise à jour a réussi
      GET DIAGNOSTICS null_count = ROW_COUNT;
      IF null_count = 0 THEN
        -- Si aucune sous-catégorie n'est disponible pour cette entité, créer une sous-catégorie temporaire
        RAISE NOTICE 'Aucune sous-catégorie disponible pour certaines entités. Utilisation d''une valeur par défaut...';
        
        -- Trouver une sous-catégorie existante à utiliser comme valeur par défaut
        SELECT id INTO first_sous_categorie_id
        FROM fin_flux_sous_categorie
        LIMIT 1;
        
        IF first_sous_categorie_id IS NULL THEN
          RAISE EXCEPTION 'Aucune sous-catégorie n''existe dans la base de données. Impossible de continuer.';
        END IF;
        
        -- Mettre à jour tous les enregistrements restants avec cette sous-catégorie par défaut
        UPDATE ca_type_service
        SET id_flux_sous_categorie = first_sous_categorie_id
        WHERE id_flux_sous_categorie IS NULL;
        
        RAISE NOTICE 'Tous les enregistrements ont été mis à jour avec une sous-catégorie par défaut.';
        EXIT; -- Sortir de la boucle car tous les enregistrements ont été mis à jour
      END IF;
    END LOOP;
  ELSE
    RAISE NOTICE 'Aucun enregistrement avec id_flux_sous_categorie NULL trouvé.';
  END IF;
END $$;

-- Étape 2: Vérifier qu'il n'y a plus d'enregistrements avec id_flux_sous_categorie NULL
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) 
  INTO null_count
  FROM ca_type_service
  WHERE id_flux_sous_categorie IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Il reste encore % enregistrement(s) avec id_flux_sous_categorie NULL après la mise à jour.', null_count;
  ELSE
    RAISE NOTICE 'Tous les enregistrements ont maintenant une valeur pour id_flux_sous_categorie.';
  END IF;
END $$;

-- Étape 3: Modifier la colonne pour la rendre NOT NULL
ALTER TABLE ca_type_service 
ALTER COLUMN id_flux_sous_categorie SET NOT NULL;

-- Étape 4: Vérification de la modification
DO $$
DECLARE
  is_not_nullable BOOLEAN;
BEGIN
  SELECT is_nullable = 'NO'
  INTO is_not_nullable
  FROM information_schema.columns
  WHERE table_name = 'ca_type_service'
  AND column_name = 'id_flux_sous_categorie';
  
  IF is_not_nullable THEN
    RAISE NOTICE '✅ La colonne id_flux_sous_categorie est maintenant NOT NULL';
  ELSE
    RAISE WARNING '❌ Échec de la modification: la colonne id_flux_sous_categorie est toujours nullable';
  END IF;
END $$;