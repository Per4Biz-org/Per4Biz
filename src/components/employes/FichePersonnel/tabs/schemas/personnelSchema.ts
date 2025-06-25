import { z } from 'zod';

// Schéma de validation avec Zod
export const personnelSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  civilite: z.string().nullable().optional(),
  sexe: z.string().nullable().optional(),
  date_naissance: z.string().nullable().optional(),
  adresse: z.string().nullable().optional(),
  code_postal: z.string().nullable().optional(),
  ville: z.string().nullable().optional(),
  pays: z.string().nullable().optional(),
  numero_securite_sociale: z.string().nullable().optional(),
  nif: z.string().nullable().optional(),
  email_perso: z.string().email('Email invalide').nullable().optional(),
  telephone: z.string().nullable().optional(),
  lien_photo: z.string().nullable().optional(),
  id_tiers: z.string().min(1, 'Le tiers est requis'),
  actif: z.boolean().default(true),
  code_court: z.string().min(1, 'Le code court est requis').max(12, 'Maximum 12 caractères'),
  matricule: z.string().min(1, 'Le matricule est requis').max(12, 'Maximum 12 caractères')
});