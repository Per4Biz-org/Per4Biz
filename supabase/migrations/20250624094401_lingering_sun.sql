/*
  # Création de la table rh_piece_jointe

  1. Nouvelle Table
    - `rh_piece_jointe`
      - `id` (uuid, clé primaire, générée automatiquement)
      - `com_contrat_client_id` (uuid, obligatoire, FK vers com_contrat_client)
      - `id_personnel` (uuid, obligatoire, FK vers rh_personnel)
      - `nom_fichier` (text, obligatoire)
      - `chemin_fichier` (text, obligatoire)
      - `type_fichier` (text, obligatoire)
      - `taille_fichier` (bigint, obligatoire)
      - Champs d'audit (created_at, created_by)

  2. Contraintes
    - Clé primaire sur id
    - Clés étrangères vers com_contrat_client et rh_personnel
    - Suppression en cascade pour rh_personnel (si le personnel est supprimé, ses pièces jointes le sont aussi)
    - Suppression restreinte pour com_contrat_client

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS rh_piece_jointe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_personnel uuid NOT NULL REFERENCES rh_personnel(id) ON DELETE CASCADE,
  nom_fichier text NOT NULL,
  chemin_fichier text NOT NULL,
  type_fichier text NOT NULL,
  taille_fichier bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Activation de la sécurité RLS
ALTER TABLE rh_piece_jointe ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour rh_piece_jointe
CREATE POLICY "Les utilisateurs peuvent créer des pièces jointes pour leur contrat"
  ON rh_piece_jointe
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les pièces jointes de leur contrat"
  ON rh_piece_jointe
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent supprimer les pièces jointes de leur contrat"
  ON rh_piece_jointe
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_rh_piece_jointe_com_contrat_client_id 
  ON rh_piece_jointe(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_rh_piece_jointe_id_personnel 
  ON rh_piece_jointe(id_personnel);

-- Création du bucket de stockage pour les documents du personnel
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'personnel-documents',
  'personnel-documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf', 
    'image/jpeg', 
    'image/png', 
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Création du bucket de stockage pour les photos de profil
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'personnel-photos',
  'personnel-photos',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs de voir leurs fichiers
CREATE POLICY "Les utilisateurs peuvent voir leurs documents de personnel"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('personnel-documents', 'personnel-photos') AND
  (storage.foldername(name))[1] = (
    SELECT com_contrat_client_id::text
    FROM com_profil
    WHERE user_id = auth.uid()
  )
);

-- Politique pour permettre aux utilisateurs d'uploader leurs fichiers
CREATE POLICY "Les utilisateurs peuvent uploader leurs documents de personnel"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('personnel-documents', 'personnel-photos') AND
  (storage.foldername(name))[1] = (
    SELECT com_contrat_client_id::text
    FROM com_profil
    WHERE user_id = auth.uid()
  )
);

-- Politique pour permettre aux utilisateurs de supprimer leurs fichiers
CREATE POLICY "Les utilisateurs peuvent supprimer leurs documents de personnel"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('personnel-documents', 'personnel-photos') AND
  (storage.foldername(name))[1] = (
    SELECT com_contrat_client_id::text
    FROM com_profil
    WHERE user_id = auth.uid()
  )
);

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
  bucket_exists_docs BOOLEAN;
  bucket_exists_photos BOOLEAN;
BEGIN
  -- Vérifier que la table a été créée
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'rh_piece_jointe'
  ) INTO table_exists;
  
  -- Vérifier que les buckets ont été créés
  SELECT EXISTS (
    SELECT 1 
    FROM storage.buckets 
    WHERE id = 'personnel-documents'
  ) INTO bucket_exists_docs;
  
  SELECT EXISTS (
    SELECT 1 
    FROM storage.buckets 
    WHERE id = 'personnel-photos'
  ) INTO bucket_exists_photos;
  
  IF table_exists AND bucket_exists_docs AND bucket_exists_photos THEN
    RAISE NOTICE '✅ La table rh_piece_jointe et les buckets de stockage ont été créés avec succès';
  ELSE
    IF NOT table_exists THEN
      RAISE WARNING '❌ Échec de la création de la table rh_piece_jointe';
    END IF;
    
    IF NOT bucket_exists_docs THEN
      RAISE WARNING '❌ Échec de la création du bucket personnel-documents';
    END IF;
    
    IF NOT bucket_exists_photos THEN
      RAISE WARNING '❌ Échec de la création du bucket personnel-photos';
    END IF;
  END IF;
END $$;