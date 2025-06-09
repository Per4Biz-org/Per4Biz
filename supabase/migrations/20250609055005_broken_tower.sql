/*
  # Ajout du champ code_user à la table com_tiers

  1. Modifications
    - Ajout d'un champ `code_user` de type text NOT NULL
    - Création d'un index pour optimiser les recherches

  2. Notes
    - La table com_tiers est vide, pas besoin de gérer l'historique
    - Le champ est obligatoire (NOT NULL)
*/

-- Ajout de la colonne code_user obligatoire
ALTER TABLE com_tiers 
ADD COLUMN code_user text NOT NULL;

-- Création d'un index pour optimiser les recherches sur code_user
CREATE INDEX IF NOT EXISTS idx_com_tiers_code_user 
  ON com_tiers(code_user);