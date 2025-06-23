/*
  # Ajout de la colonne id_type_facture à la table fin_facture_achat

  1. Modifications
    - Ajout d'un champ `id_type_facture` de type uuid
    - Création d'une clé étrangère vers la table com_param_type_facture
    
  2. Objectif
    - Permettre de classifier les factures selon leur type
    - Faciliter le filtrage et le reporting des factures
    - Améliorer l'organisation des factures dans l'application
*/

-- Ajout de la colonne id_type_facture (nullable)
ALTER TABLE fin_facture_achat 
ADD COLUMN id_type_facture uuid REFERENCES com_param_type_facture(id) ON DELETE RESTRICT;

-- Création d'un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_id_type_facture 
  ON fin_facture_achat(id_type_facture);

-- Vérification de l'ajout de la colonne
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'fin_facture_achat' 
    AND column_name = 'id_type_facture'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ La colonne id_type_facture a été ajoutée avec succès à la table fin_facture_achat';
  ELSE
    RAISE WARNING '❌ Échec de l''ajout de la colonne id_type_facture à la table fin_facture_achat';
  END IF;
END $$;