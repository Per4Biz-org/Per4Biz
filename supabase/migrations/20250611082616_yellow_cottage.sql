/*
  # Ajout des paramètres de jours d'ouverture pour l'entité PQ

  1. Données ajoutées
    - Entité ciblée : Restaurant avec le code "PQ"
    - Période : Années 2024 et 2025 (24 mois au total)
    - Valeurs : nb_jours_ouverts = 25, taux_mp_prevu = 35.00

  2. Sécurité
    - Vérification d'existence de l'entité PQ
    - Évitement des doublons avec WHERE NOT EXISTS
    - Gestion d'erreurs et logs détaillés

  3. Résultat
    - 24 enregistrements (2 années × 12 mois)
    - Paramétrage uniforme pour faciliter les tests
*/

-- Insertion des paramètres de jours d'ouverture pour l'entité PQ
-- Années 2024 et 2025, tous les mois (1 à 12)
-- nb_jours_ouverts = 25, taux_mp_prevu = 35.00

DO $$
DECLARE
  entite_pq_id uuid;
  contrat_client_id uuid;
  annee_courante integer;
  mois_courante integer;
  total_count integer;
BEGIN
  -- Récupérer l'ID de l'entité avec le code "PQ"
  SELECT id, com_contrat_client_id 
  INTO entite_pq_id, contrat_client_id
  FROM com_entite 
  WHERE code = 'PQ' 
  LIMIT 1;

  -- Vérifier que l'entité PQ existe
  IF entite_pq_id IS NULL THEN
    RAISE NOTICE 'Entité avec le code "PQ" introuvable. Aucune donnée ajoutée.';
    RETURN;
  END IF;

  RAISE NOTICE 'Entité PQ trouvée avec ID: %, Contrat client: %', entite_pq_id, contrat_client_id;

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
        entite_pq_id,
        annee_courante,
        mois_courante,
        25,
        35.00,
        'Paramétrage initial automatique'
      WHERE NOT EXISTS (
        SELECT 1 
        FROM ca_param_jours_ouverture 
        WHERE id_entite = entite_pq_id 
        AND annee = annee_courante 
        AND mois = mois_courante
      );
      
      -- Log pour chaque insertion
      IF FOUND THEN
        RAISE NOTICE 'Paramètre ajouté: PQ - %/% - 25 jours - 35%% MP', 
          LPAD(mois_courante::text, 2, '0'), annee_courante;
      ELSE
        RAISE NOTICE 'Paramètre déjà existant: PQ - %/% (ignoré)', 
          LPAD(mois_courante::text, 2, '0'), annee_courante;
      END IF;
    END LOOP;
  END LOOP;

  -- Compter le nombre total de paramètres ajoutés
  SELECT COUNT(*) 
  INTO total_count
  FROM ca_param_jours_ouverture 
  WHERE id_entite = entite_pq_id 
  AND annee IN (2024, 2025);
  
  RAISE NOTICE '✅ Migration terminée. Total de % paramètre(s) pour l''entité PQ (2024-2025)', total_count;

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
  -- Récupérer les informations de l'entité PQ
  SELECT e.id, e.code, e.libelle, e.com_contrat_client_id
  INTO entite_info
  FROM com_entite e
  WHERE e.code = 'PQ'
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
    RAISE NOTICE '❌ Entité PQ non trouvée lors de la vérification';
  END IF;
END $$;