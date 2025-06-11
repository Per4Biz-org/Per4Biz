/*
  # Migration corrigée pour ajouter les colonnes d'audit created_by et updated_by

  1. Fonctions
    - `set_updated_by()` : Met à jour automatiquement updated_by avec auth.uid()
    - `prevent_created_by_update()` : Empêche la modification de created_by après insertion
    - `add_audit_columns(target_table)` : Ajoute les colonnes et triggers à une table

  2. Colonnes ajoutées
    - `created_by` : uuid DEFAULT auth.uid(), FK vers auth.users(id) ON DELETE SET NULL
    - `updated_by` : uuid, FK vers auth.users(id) ON DELETE SET NULL

  3. Triggers
    - `set_updated_by_trigger` : BEFORE UPDATE pour mettre à jour updated_by
    - `prevent_created_by_update_trigger` : BEFORE UPDATE pour protéger created_by

  4. Sécurité
    - Compatible avec RLS
    - Gestion des suppressions d'utilisateurs avec ON DELETE SET NULL
    - Protection contre la modification de created_by
*/

-- Fonction pour mettre à jour automatiquement updated_by
CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour empêcher la modification de created_by
CREATE OR REPLACE FUNCTION prevent_created_by_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher la modification de created_by après insertion
  IF OLD.created_by IS DISTINCT FROM NEW.created_by THEN
    NEW.created_by := OLD.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter les colonnes d'audit à une table
CREATE OR REPLACE FUNCTION add_audit_columns(target_table text)
RETURNS void AS $$
BEGIN
  -- Ajouter created_by si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = target_table 
    AND column_name = 'created_by'
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL', target_table);
    RAISE NOTICE 'Colonne created_by ajoutée à la table %', target_table;
  ELSE
    RAISE NOTICE 'Colonne created_by existe déjà dans la table %', target_table;
  END IF;

  -- Ajouter updated_by si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = target_table 
    AND column_name = 'updated_by'
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL', target_table);
    RAISE NOTICE 'Colonne updated_by ajoutée à la table %', target_table;
  ELSE
    RAISE NOTICE 'Colonne updated_by existe déjà dans la table %', target_table;
  END IF;

  -- Créer le trigger pour updated_by
  EXECUTE format('DROP TRIGGER IF EXISTS set_updated_by_trigger ON %I', target_table);
  EXECUTE format('CREATE TRIGGER set_updated_by_trigger 
    BEFORE UPDATE ON %I 
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_by()', target_table);

  -- Créer le trigger pour empêcher la modification de created_by
  EXECUTE format('DROP TRIGGER IF EXISTS prevent_created_by_update_trigger ON %I', target_table);
  EXECUTE format('CREATE TRIGGER prevent_created_by_update_trigger 
    BEFORE UPDATE ON %I 
    FOR EACH ROW 
    EXECUTE FUNCTION prevent_created_by_update()', target_table);

  RAISE NOTICE 'Triggers d''audit créés pour la table %', target_table;
END;
$$ LANGUAGE plpgsql;

-- Application des colonnes d'audit à toutes les tables existantes
DO $$
DECLARE
  table_record RECORD;
  tables_processed INTEGER := 0;
BEGIN
  RAISE NOTICE 'Début de l''ajout des colonnes d''audit...';
  
  -- Parcourir toutes les tables de l'application
  FOR table_record IN 
    SELECT t.tablename 
    FROM pg_tables t
    WHERE t.schemaname = 'public' 
    AND t.tablename NOT LIKE 'pg_%' 
    AND t.tablename NOT LIKE 'supabase_%'
    AND t.tablename NOT IN ('users') -- Exclure la table users d'auth
    ORDER BY t.tablename
  LOOP
    BEGIN
      -- Ajouter les colonnes d'audit à chaque table
      PERFORM add_audit_columns(table_record.tablename);
      tables_processed := tables_processed + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors du traitement de la table % : %', table_record.tablename, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Colonnes d''audit ajoutées à % tables applicatives', tables_processed;
END $$;

-- Supprimer la fonction temporaire
DROP FUNCTION IF EXISTS add_audit_columns(text);

-- Mise à jour des valeurs existantes pour created_by (optionnel)
-- Les nouvelles insertions auront automatiquement auth.uid() comme valeur par défaut
DO $$
DECLARE
  table_record RECORD;
  update_count INTEGER;
  total_updates INTEGER := 0;
BEGIN
  RAISE NOTICE 'Mise à jour des valeurs created_by existantes...';
  
  FOR table_record IN 
    SELECT t.tablename 
    FROM pg_tables t
    WHERE t.schemaname = 'public' 
    AND t.tablename NOT LIKE 'pg_%' 
    AND t.tablename NOT LIKE 'supabase_%'
    AND t.tablename NOT IN ('users')
    AND EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' 
      AND c.table_name = t.tablename 
      AND c.column_name = 'created_by'
    )
    ORDER BY t.tablename
  LOOP
    BEGIN
      -- Compter les enregistrements qui seront mis à jour
      EXECUTE format('SELECT COUNT(*) FROM %I WHERE created_by IS NULL', table_record.tablename) INTO update_count;
      
      IF update_count > 0 THEN
        -- Mettre à jour created_by pour les enregistrements existants qui n'ont pas de valeur
        -- (On laisse NULL pour les données historiques - pas de valeur par défaut forcée)
        EXECUTE format('UPDATE %I SET created_by = NULL WHERE created_by IS NULL', table_record.tablename);
        total_updates := total_updates + update_count;
        RAISE NOTICE 'Table % : % enregistrements traités', table_record.tablename, update_count;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors de la mise à jour de la table % : %', table_record.tablename, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Mise à jour terminée : % enregistrements traités au total', total_updates;
END $$;

-- Vérification finale
DO $$
DECLARE
  table_record RECORD;
  missing_columns INTEGER := 0;
  total_tables INTEGER := 0;
BEGIN
  RAISE NOTICE 'Vérification finale des colonnes d''audit...';
  
  FOR table_record IN 
    SELECT t.tablename 
    FROM pg_tables t
    WHERE t.schemaname = 'public' 
    AND t.tablename NOT LIKE 'pg_%' 
    AND t.tablename NOT LIKE 'supabase_%'
    AND t.tablename NOT IN ('users')
    ORDER BY t.tablename
  LOOP
    total_tables := total_tables + 1;
    
    -- Vérifier created_by
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = table_record.tablename 
      AND column_name = 'created_by'
    ) THEN
      RAISE WARNING 'Colonne created_by manquante dans la table %', table_record.tablename;
      missing_columns := missing_columns + 1;
    END IF;
    
    -- Vérifier updated_by
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = table_record.tablename 
      AND column_name = 'updated_by'
    ) THEN
      RAISE WARNING 'Colonne updated_by manquante dans la table %', table_record.tablename;
      missing_columns := missing_columns + 1;
    END IF;
  END LOOP;
  
  IF missing_columns = 0 THEN
    RAISE NOTICE '✅ Vérification réussie : toutes les colonnes d''audit ont été ajoutées aux % tables', total_tables;
  ELSE
    RAISE WARNING '⚠️ Vérification échouée : % colonnes manquantes sur % tables', missing_columns, total_tables;
  END IF;
END $$;