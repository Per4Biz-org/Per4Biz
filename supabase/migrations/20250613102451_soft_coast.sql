/*
  # Ajout du champ id_flux_sous_categorie à la table ca_type_service

  1. Modifications
    - Ajout d'un champ `id_flux_sous_categorie` de type uuid
    - Création d'une clé étrangère vers la table fin_flux_sous_categorie
    - Le champ est nullable (non obligatoire pour l'instant)
    
  2. Objectif
    - Permettre d'associer un type de service à une sous-catégorie de flux
    - Faciliter la classification et le reporting des services
    - Préparer la structure pour des fonctionnalités futures

  3. Impact
    - Les types de service existants conservent leur fonctionnement actuel (champ nullable)
    - Les nouveaux types de service peuvent être liés à une sous-catégorie
*/

-- Ajout de la colonne id_flux_sous_categorie (nullable)
ALTER TABLE ca_type_service 
ADD COLUMN id_flux_sous_categorie uuid REFERENCES fin_flux_sous_categorie(id) ON DELETE RESTRICT;

-- Création d'un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_ca_type_service_id_flux_sous_categorie 
  ON ca_type_service(id_flux_sous_categorie);

-- Vérification de l'ajout de la colonne
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ca_type_service' 
    AND column_name = 'id_flux_sous_categorie'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ La colonne id_flux_sous_categorie a été ajoutée avec succès à la table ca_type_service';
  ELSE
    RAISE WARNING '❌ Échec de l''ajout de la colonne id_flux_sous_categorie à la table ca_type_service';
  END IF;
END $$;