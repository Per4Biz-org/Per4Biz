/*
  # Ajout du champ id_entite_payeur à la table rh_historique_contrat

  1. Modifications
    - Ajout d'un champ `id_entite_payeur` de type uuid
    - Création d'une clé étrangère vers la table com_entite
    
  2. Objectif
    - Permettre d'identifier l'entité qui paie le salaire et qui a fait le contrat
    - Faciliter la gestion des contrats multi-entités
    - Améliorer la traçabilité et la comptabilité des contrats

  3. Impact
    - Les contrats existants auront une valeur NULL pour ce champ
    - Les nouveaux contrats pourront spécifier l'entité payeuse
*/

-- Ajout de la colonne id_entite_payeur (nullable pour l'instant)
ALTER TABLE rh_historique_contrat 
ADD COLUMN id_entite_payeur uuid REFERENCES com_entite(id) ON DELETE RESTRICT;

-- Création d'un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_rh_hist_contrat_id_entite_payeur 
  ON rh_historique_contrat(id_entite_payeur);

-- Vérification de l'ajout de la colonne
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rh_historique_contrat' 
    AND column_name = 'id_entite_payeur'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ La colonne id_entite_payeur a été ajoutée avec succès à la table rh_historique_contrat';
  ELSE
    RAISE WARNING '❌ Échec de l''ajout de la colonne id_entite_payeur à la table rh_historique_contrat';
  END IF;
END $$;