/*
  # Rendre le champ num_document non obligatoire dans fin_facture_achat

  1. Modifications
    - Modification de la colonne `num_document` pour la rendre nullable
    - Le champ devient optionnel pour permettre des factures sans numéro de document

  2. Impact
    - Les factures existantes conservent leurs numéros de document
    - Les nouvelles factures peuvent être créées sans numéro de document
    - Améliore la flexibilité lors de l'import de données
*/

-- Rendre la colonne num_document nullable
ALTER TABLE fin_facture_achat 
ALTER COLUMN num_document DROP NOT NULL;