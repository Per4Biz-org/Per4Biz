/*
  # Insertion des paramètres de jours d'ouverture pour l'entité CDP

  1. Données à insérer
    - Entité : CDP (code entité)
    - Années : 2024 et 2025
    - Mois : 1 à 12 (tous les mois)
    - Valeurs : nb_jours_ouverts = 25, taux_mp_prevu = 35.00

  2. Sécurité
    - Insertion conditionnelle pour éviter les doublons
    - Vérification d'existence de l'entité CDP
    - Gestion d'erreurs robuste

  3. Logs et vérifications
    - Logs détaillés pour chaque insertion
    - Vérification finale du nombre de paramètres créés
    - Messages informatifs pour le suivi
*/

-- Insertion des paramètres de jours d'ouverture pour l'entité CDP
-- Années 2024 et 2025, tous les mois (1 à 12)
-- nb_jours_ouverts = 25, taux_mp_prevu = 35.00

DO $$
DECLARE
  entite_cdp_id uuid;
  contrat_client_id uuid;
  annee_courante integer;
  mois_courante integer;
  total_count integer;
BEGIN
  -- Récupérer l'ID de l'entité avec le code "CDP"
  SELECT id, com_contrat_client_id 
  INTO entite_cdp_id, contrat_client_id
  FROM com_entite 
  WHERE code = 'CDP' 
  LIMIT 1;

  -- Vérifier que l'entité CDP existe
  IF entite_cdp_id IS NULL THEN
    RAISE NOTICE 'Entité avec le code "CDP" introuvable. Aucune donnée ajoutée.';
    RETURN;
  END IF;

  RAISE NOTICE 'Entité CDP trouvée avec ID: %, Contrat client: %', entite_cdp_id, contrat_client_id;

  -- Insérer les paramètres pour 2024 et 2025
  FOR annee_courante IN 2024..2025 LOOP
    FOR mois_courante IN 1..12 LOOP
      -- Insertion conditionnelle pour éviter les doublons
      INSERT INTO ca_param_jours_ouverture (
        com_contrat_client_id,
        id_entite,
        annee,
        mois,
        nb_jours_ouverts,
        taux_mp_prevu,
        commentaire
      )
      SELECT 
        contrat_client_id,
        entite_cdp_id,
        annee_courante,
        mois_courante,
        25,
        35.00,
        'Paramétrage initial automatique'
      WHERE NOT EXISTS (
        SELECT 1 
        FROM ca_param_jours_ouverture 
        WHERE id_entite = entite_cdp_id 
        AND annee = annee_courante 
        AND mois = mois_courante
      );
      
      -- Log pour chaque insertion
      IF FOUND THEN
        RAISE NOTICE 'Paramètre ajouté: CDP - %/% - 25 jours - 35%% MP', 
          LPAD(mois_courante::text, 2, '0'), annee_courante;
      ELSE
        RAISE NOTICE 'Paramètre déjà existant: CDP - %/% (ignoré)', 
          LPAD(mois_courante::text, 2, '0'), annee_courante;
      END IF;
    END LOOP;
  END LOOP;

  -- Compter le nombre total de paramètres ajoutés
  SELECT COUNT(*) 
  INTO total_count
  FROM ca_param_jours_ouverture 
  WHERE id_entite = entite_cdp_id 
  AND annee IN (2024, 2025);
  
  RAISE NOTICE '✅ Migration terminée. Total de % paramètre(s) pour l''entité CDP (2024-2025)', total_count;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de l''ajout des paramètres: %', SQLERRM;
END $$;

-- Vérification finale des données ajoutées
DO $$
DECLARE
  verification_count integer;
  entite_info record;
BEGIN
  -- Récupérer les informations de l'entité CDP
  SELECT e.id, e.code, e.libelle, e.com_contrat_client_id
  INTO entite_info
  FROM com_entite e
  WHERE e.code = 'CDP'
  LIMIT 1;

  IF entite_info.id IS NOT NULL THEN
    -- Compter les paramètres créés
    SELECT COUNT(*)
    INTO verification_count
    FROM ca_param_jours_ouverture
    WHERE id_entite = entite_info.id
    AND annee IN (2024, 2025);

    RAISE NOTICE '📊 Vérification finale:';
    RAISE NOTICE '   - Entité: % (%) - ID: %', entite_info.code, entite_info.libelle, entite_info.id;
    RAISE NOTICE '   - Contrat client: %', entite_info.com_contrat_client_id;
    RAISE NOTICE '   - Paramètres créés: % sur 24 attendus (2 années × 12 mois)', verification_count;
    
    IF verification_count = 24 THEN
      RAISE NOTICE '✅ Tous les paramètres ont été créés avec succès !';
    ELSE
      RAISE NOTICE '⚠️  Nombre de paramètres différent de l''attendu (24)';
    END IF;
  ELSE
    RAISE NOTICE '❌ Entité CDP non trouvée lors de la vérification';
  END IF;
END $$;

-- Vérification globale des deux entités (PQ et CDP)
DO $$
DECLARE
  total_pq integer;
  total_cdp integer;
  total_global integer;
BEGIN
  -- Compter les paramètres pour PQ
  SELECT COUNT(*)
  INTO total_pq
  FROM ca_param_jours_ouverture pjo
  JOIN com_entite e ON e.id = pjo.id_entite
  WHERE e.code = 'PQ'
  AND pjo.annee IN (2024, 2025);

  -- Compter les paramètres pour CDP
  SELECT COUNT(*)
  INTO total_cdp
  FROM ca_param_jours_ouverture pjo
  JOIN com_entite e ON e.id = pjo.id_entite
  WHERE e.code = 'CDP'
  AND pjo.annee IN (2024, 2025);

  -- Total global
  total_global := total_pq + total_cdp;

  RAISE NOTICE '🏢 Récapitulatif global des paramètres créés:';
  RAISE NOTICE '   - Entité PQ: % paramètre(s)', total_pq;
  RAISE NOTICE '   - Entité CDP: % paramètre(s)', total_cdp;
  RAISE NOTICE '   - Total: % paramètre(s) sur 48 attendus (2 entités × 2 années × 12 mois)', total_global;
  
  IF total_global = 48 THEN
    RAISE NOTICE '🎉 Paramétrage complet réussi pour les deux entités !';
  ELSE
    RAISE NOTICE '⚠️  Paramétrage incomplet. Vérifiez les données.';
  END IF;
END $$;