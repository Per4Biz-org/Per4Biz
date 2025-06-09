/*
  # Correction pour permettre la modification du code_user

  1. Modifications
    - Suppression de la fonction prevent_code_user_update()
    - Suppression du trigger prevent_code_user_update_trigger
    - Le code_user devient modifiable tant qu'il n'est pas référencé ailleurs

  2. Notes
    - La contrainte d'unicité reste en place
    - La logique métier pour empêcher la modification quand le code est référencé 
      devra être implémentée au niveau applicatif
*/

-- Supprimer le trigger qui empêche la modification
DROP TRIGGER IF EXISTS prevent_code_user_update_trigger ON com_profil;

-- Supprimer la fonction qui empêche la modification
DROP FUNCTION IF EXISTS prevent_code_user_update();

-- Le code_user est maintenant modifiable
-- La contrainte d'unicité reste en place pour éviter les doublons
-- La logique métier pour empêcher la modification quand le code est utilisé 
-- comme référence devra être gérée au niveau applicatif