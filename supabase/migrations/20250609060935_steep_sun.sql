/*
  # Ajout du champ MP à la table com_param_type_tiers

  1. Modifications
    - Ajout d'un champ `MP` de type boolean
    - Non obligatoire (nullable)
    - Valeur par défaut : FALSE
    - Signification : Matière Première

  2. Notes
    - Le champ permet d'identifier si un type de tiers correspond à une matière première
    - Utile pour la classification et le filtrage des types de tiers
*/

-- Ajout du champ MP (Matière Première) avec valeur par défaut FALSE
ALTER TABLE com_param_type_tiers 
ADD COLUMN MP boolean DEFAULT FALSE;