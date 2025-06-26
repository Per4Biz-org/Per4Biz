/*
  # Modification des contraintes de clé étrangère pour permettre la suppression en cascade

  1. Modifications
    - Modification des contraintes de clé étrangère dans les tables liées à rh_personnel
    - Ajout de ON DELETE CASCADE pour permettre la suppression en cascade
    - Concerne les tables: rh_piece_jointe, rh_historique_contrat, rh_historique_financier, rh_cout_mensuel
*/

-- Modification de la contrainte de clé étrangère pour rh_piece_jointe
ALTER TABLE rh_piece_jointe 
  DROP CONSTRAINT IF EXISTS rh_piece_jointe_id_personnel_fkey,
  ADD CONSTRAINT rh_piece_jointe_id_personnel_fkey 
  FOREIGN KEY (id_personnel) REFERENCES rh_personnel(id) ON DELETE CASCADE;

-- Modification de la contrainte de clé étrangère pour rh_historique_contrat
ALTER TABLE rh_historique_contrat 
  DROP CONSTRAINT IF EXISTS rh_historique_contrat_id_personnel_fkey,
  ADD CONSTRAINT rh_historique_contrat_id_personnel_fkey 
  FOREIGN KEY (id_personnel) REFERENCES rh_personnel(id) ON DELETE CASCADE;

-- Modification de la contrainte de clé étrangère pour rh_historique_financier
ALTER TABLE rh_historique_financier 
  DROP CONSTRAINT IF EXISTS rh_historique_financier_id_personnel_fkey,
  ADD CONSTRAINT rh_historique_financier_id_personnel_fkey 
  FOREIGN KEY (id_personnel) REFERENCES rh_personnel(id) ON DELETE CASCADE;

-- Modification de la contrainte de clé étrangère pour rh_cout_mensuel
ALTER TABLE rh_cout_mensuel 
  DROP CONSTRAINT IF EXISTS rh_cout_mensuel_personnel_fkey,
  ADD CONSTRAINT rh_cout_mensuel_personnel_fkey 
  FOREIGN KEY (id_personnel) REFERENCES rh_personnel(id) ON DELETE CASCADE;

-- Modification de la contrainte de clé étrangère pour rh_affectation
ALTER TABLE rh_affectation 
  DROP CONSTRAINT IF EXISTS rh_affectation_id_personnel_fkey,
  ADD CONSTRAINT rh_affectation_id_personnel_fkey 
  FOREIGN KEY (id_personnel) REFERENCES rh_personnel(id) ON DELETE CASCADE;