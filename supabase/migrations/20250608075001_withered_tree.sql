/*
  # Renommer la table fin_nature_flux en fin_flux_nature

  1. Renommage de table
    - Renommer `fin_nature_flux` en `fin_flux_nature`
    - Renommer tous les index et contraintes associés
    - Mettre à jour les clés étrangères
    - Recréer les politiques RLS
*/

-- Renommer la table
ALTER TABLE fin_nature_flux RENAME TO fin_flux_nature;

-- Vérifier et renommer les index s'ils existent
DO $$
BEGIN
    -- Renommer l'index de clé primaire
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fin_nature_flux_pkey') THEN
        ALTER INDEX fin_nature_flux_pkey RENAME TO fin_flux_nature_pkey;
    END IF;
    
    -- Renommer l'index unique
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fin_nature_flux_com_contrat_client_id_code_key') THEN
        ALTER INDEX fin_nature_flux_com_contrat_client_id_code_key RENAME TO fin_flux_nature_com_contrat_client_id_code_key;
    END IF;
END $$;

-- Vérifier et renommer les contraintes s'elles existent
DO $$
BEGIN
    -- Renommer la contrainte de clé primaire
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_nature_flux_pkey' 
               AND table_name = 'fin_flux_nature') THEN
        ALTER TABLE fin_flux_nature RENAME CONSTRAINT fin_nature_flux_pkey TO fin_flux_nature_pkey;
    END IF;
    
    -- Renommer la contrainte unique
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_nature_flux_com_contrat_client_id_code_key' 
               AND table_name = 'fin_flux_nature') THEN
        ALTER TABLE fin_flux_nature RENAME CONSTRAINT fin_nature_flux_com_contrat_client_id_code_key TO fin_flux_nature_com_contrat_client_id_code_key;
    END IF;
    
    -- Renommer la contrainte check
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_nature_flux_code_check' 
               AND table_name = 'fin_flux_nature') THEN
        ALTER TABLE fin_flux_nature RENAME CONSTRAINT fin_nature_flux_code_check TO fin_flux_nature_code_check;
    END IF;
    
    -- Renommer la contrainte de clé étrangère vers com_contrat_client
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_nature_flux_com_contrat_client_id_fkey' 
               AND table_name = 'fin_flux_nature') THEN
        ALTER TABLE fin_flux_nature RENAME CONSTRAINT fin_nature_flux_com_contrat_client_id_fkey TO fin_flux_nature_com_contrat_client_id_fkey;
    END IF;
    
    -- Renommer la contrainte de clé étrangère vers com_entite
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_nature_flux_id_entite_fkey' 
               AND table_name = 'fin_flux_nature') THEN
        ALTER TABLE fin_flux_nature RENAME CONSTRAINT fin_nature_flux_id_entite_fkey TO fin_flux_nature_id_entite_fkey;
    END IF;
END $$;

-- Mettre à jour la clé étrangère dans fin_flux_categorie
DO $$
BEGIN
    -- Supprimer l'ancienne contrainte si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_flux_categorie_nature_flux_id_fkey' 
               AND table_name = 'fin_flux_categorie') THEN
        ALTER TABLE fin_flux_categorie DROP CONSTRAINT fin_flux_categorie_nature_flux_id_fkey;
    END IF;
    
    -- Ajouter la nouvelle contrainte
    ALTER TABLE fin_flux_categorie ADD CONSTRAINT fin_flux_categorie_nature_flux_id_fkey 
      FOREIGN KEY (nature_flux_id) REFERENCES fin_flux_nature(id) ON DELETE RESTRICT;
END $$;

-- Supprimer les anciennes politiques RLS si elles existent
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des natures de flux pour leur c" ON fin_flux_nature;
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les natures de flux de leur contr" ON fin_flux_nature;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier les natures de flux de leur c" ON fin_flux_nature;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer les natures de flux de leur " ON fin_flux_nature;

-- Recréer les politiques RLS avec les nouveaux noms complets
CREATE POLICY "Les utilisateurs peuvent créer des natures de flux pour leur contrat"
  ON fin_flux_nature
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les natures de flux de leur contrat"
  ON fin_flux_nature
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les natures de flux de leur contrat"
  ON fin_flux_nature
  FOR UPDATE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ))
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent supprimer les natures de flux de leur contrat"
  ON fin_flux_nature
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));