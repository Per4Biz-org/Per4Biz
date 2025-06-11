/*
  # Création du bucket Storage et modification de la table fin_facture_achat

  1. Bucket Storage
    - Création du bucket 'factures-achat' avec accès privé
    - Configuration des politiques de sécurité pour l'accès aux fichiers
    - Organisation des fichiers par com_contrat_client_id

  2. Modification de la table fin_facture_achat
    - Ajout de la colonne 'justificatif' pour stocker le chemin du fichier
    - Le champ est nullable pour permettre des factures sans justificatif

  3. Sécurité
    - Politiques RLS pour l'accès aux fichiers basées sur le contrat client
    - Seuls les utilisateurs authentifiés peuvent accéder à leurs fichiers
*/

-- Création du bucket 'factures-achat' avec accès privé
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'factures-achat',
  'factures-achat',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs de voir leurs propres fichiers
CREATE POLICY "Les utilisateurs peuvent voir leurs fichiers de factures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'factures-achat' AND
  (storage.foldername(name))[1] = (
    SELECT com_contrat_client_id::text
    FROM com_profil
    WHERE user_id = auth.uid()
  )
);

-- Politique pour permettre aux utilisateurs d'uploader leurs fichiers
CREATE POLICY "Les utilisateurs peuvent uploader leurs fichiers de factures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'factures-achat' AND
  (storage.foldername(name))[1] = (
    SELECT com_contrat_client_id::text
    FROM com_profil
    WHERE user_id = auth.uid()
  )
);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs fichiers
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs fichiers de factures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'factures-achat' AND
  (storage.foldername(name))[1] = (
    SELECT com_contrat_client_id::text
    FROM com_profil
    WHERE user_id = auth.uid()
  )
);

-- Politique pour permettre aux utilisateurs de supprimer leurs fichiers
CREATE POLICY "Les utilisateurs peuvent supprimer leurs fichiers de factures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'factures-achat' AND
  (storage.foldername(name))[1] = (
    SELECT com_contrat_client_id::text
    FROM com_profil
    WHERE user_id = auth.uid()
  )
);

-- Vérifier si la table fin_facture_achat existe avant de la modifier
DO $$
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'fin_facture_achat'
  ) THEN
    -- Ajouter la colonne justificatif si elle n'existe pas déjà
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'fin_facture_achat' AND column_name = 'justificatif'
    ) THEN
      ALTER TABLE fin_facture_achat ADD COLUMN justificatif text DEFAULT NULL;
      RAISE NOTICE 'Colonne justificatif ajoutée à la table fin_facture_achat';
    ELSE
      RAISE NOTICE 'La colonne justificatif existe déjà dans la table fin_facture_achat';
    END IF;
  ELSE
    RAISE NOTICE 'La table fin_facture_achat n''existe pas encore';
  END IF;
END $$;