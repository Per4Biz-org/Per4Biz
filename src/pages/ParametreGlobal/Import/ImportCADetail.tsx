import React, { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMenu } from '../../../context/MenuContext';
import { useProfil } from '../../../context/ProfilContext';
import { supabase } from '../../../lib/supabase';
import { menuItemsParametreGlobalImport } from '../../../config/menuConfig';
import { PageSection } from '../../../components/ui/page-section';
import { DataTable, Column } from '../../../components/ui/data-table';
import { Button } from '../../../components/ui/button';
import { ToastContainer, ToastData } from '../../../components/ui/toast';
import { Upload, FileText, AlertTriangle, Check, Download, Database } from 'lucide-react';
import { upsertCaReelWithFallback, upsertCaReelDetailWithFallback, upsertCaReelDetailHeureWithFallback } from '../../../utils/caReelUtils';
import { XCircle } from 'lucide-react';
import { Toggle } from '../../../components/ui/toggle';
import styles from '../styles.module.css';

interface ImportProgress {
  current: number;
  total: number;
  phase: 'preparation' | 'ca_reel' | 'ca_reel_detail' | 'ca_reel_detail_heure' | 'completed';
  message: string;
}

interface ImportError {
  type: string;
  message: string;
  details?: string;
  count?: number;
}

interface CSVRow {
  [key: string]: string;
}

interface CADetailData {
  id_import: number;
  entite: string;
  id_entite?: string;
  date: string;
  date_obj?: Date;
  heure: string;
  document: string;
  pu_ht: number;
  pu_ttc: number;
  montant_ht: number;
  montant_ttc: number;
  id_type_service?: string;
  type_service?: {
    id: string;
    code: string;
    libelle: string;
  };
  id_flux_sous_categorie?: string;
  sous_categorie?: {
    id: string;
    code: string;
    libelle: string;
  };
  id_flux_categorie?: string;
  categorie?: {
    id: string;
    code: string;
    libelle: string;
  };
  erreur?: string;
}

interface TotalsData {
  montant_ht: number;
  montant_ttc: number;
}

interface Entite {
  id: string;
  code: string;
  libelle: string;
}

const ImportCADetail: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caDetailData, setCADetailData] = useState<CADetailData[]>([]);
  const [totals, setTotals] = useState<TotalsData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [typeServiceMap, setTypeServiceMap] = useState<Map<string, any>>(new Map());
  const [sousCategorieMap, setSousCategorieMap] = useState<Map<string, any>>(new Map());
  const [categorieMap, setCategorieMap] = useState<Map<string, any>>(new Map());
  const [entitesMap, setEntitesMap] = useState<Map<string, string>>(new Map());
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    phase: 'preparation',
    message: 'Préparation des données...'
  });
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [showOnlyNonValidated, setShowOnlyNonValidated] = useState(false);

  useEffect(() => {
    setMenuItems(menuItemsParametreGlobalImport);
  }, [setMenuItems]);

  // Charger les entités au démarrage
  useEffect(() => {
    const fetchEntites = async () => {
      if (!profil?.com_contrat_client_id) return;

      try {
        const { data, error } = await supabase
          .from('com_entite')
          .select('id, code, libelle')
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .eq('actif', true);

        if (error) throw error;
        
        setEntites(data || []);
        
        // Créer une map code -> id pour faciliter la recherche
        const map = new Map<string, string>();
        data?.forEach(entite => {
          map.set(entite.code.toUpperCase(), entite.id);
        });
        setEntitesMap(map);
      } catch (error) {
        console.error('Erreur lors du chargement des entités:', error);
        addToast({
          label: 'Erreur lors du chargement des entités',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };

    if (!profilLoading && profil?.com_contrat_client_id) {
      fetchEntites();
    }
  }, [profilLoading, profil?.com_contrat_client_id]);

  // Charger les types de service, sous-catégories et catégories
  useEffect(() => {
    const fetchServiceData = async () => {
      if (!profil?.com_contrat_client_id) return;

      try {
        // Récupérer les types de service
        const { data: typesServiceData, error: typesServiceError } = await supabase
          .from('ca_type_service')
          .select(`
            id, 
            code, 
            libelle, 
            id_entite,
            heure_debut,
            heure_fin,
            id_flux_sous_categorie
          `)
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id);

        if (typesServiceError) throw typesServiceError;
        
        // Créer une map des types de service
        const serviceMap = new Map();
        typesServiceData?.forEach(ts => {
          serviceMap.set(ts.id, {
            id: ts.id,
            code: ts.code,
            libelle: ts.libelle,
            id_entite: ts.id_entite,
            heure_debut: ts.heure_debut,
            heure_fin: ts.heure_fin,
            id_flux_sous_categorie: ts.id_flux_sous_categorie
          });
        });
        setTypeServiceMap(serviceMap);

        // Récupérer les sous-catégories
        const { data: sousCategoriesData, error: sousCategoriesError } = await supabase
          .from('fin_flux_sous_categorie')
          .select(`
            id,
            code,
            libelle,
            id_categorie
          `)
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id);

        if (sousCategoriesError) throw sousCategoriesError;
        
        // Créer une map des sous-catégories
        const scMap = new Map();
        sousCategoriesData?.forEach(sc => {
          scMap.set(sc.id, {
            id: sc.id,
            code: sc.code,
            libelle: sc.libelle,
            id_categorie: sc.id_categorie
          });
        });
        setSousCategorieMap(scMap);

        // Récupérer les catégories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('fin_flux_categorie')
          .select(`
            id,
            code,
            libelle,
            id_entite
          `)
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id);

        if (categoriesError) throw categoriesError;
        
        // Créer une map des catégories
        const catMap = new Map();
        categoriesData?.forEach(cat => {
          catMap.set(cat.id, {
            id: cat.id,
            code: cat.code,
            libelle: cat.libelle,
            id_entite: cat.id_entite
          });
        });
        setCategorieMap(catMap);

      } catch (error) {
        console.error('Erreur lors du chargement des données de service:', error);
        addToast({
          label: 'Erreur lors du chargement des données de service',
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };

    if (!profilLoading && profil?.com_contrat_client_id) {
      fetchServiceData();
    }
  }, [profilLoading, profil?.com_contrat_client_id]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: Date.now().toString(),
    };
    setToasts(prev => [...prev, newToast]);
  };

  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fonction pour nettoyer et convertir les montants
  const parseAmount = (amountString: string): number => {
    if (!amountString || !amountString.trim()) return 0;
    
    // Supprimer les espaces et remplacer les virgules par des points
    const cleanAmount = amountString.trim().replace(/\s+/g, '').replace(',', '.');
    const parsed = parseFloat(cleanAmount);
    
    return isNaN(parsed) ? 0 : parsed;
  };

  // Fonction pour convertir les formats d'heure
  const formatHeure = (heureString: string): string => {
    if (!heureString || !heureString.trim()) return '';
    
    const heure = heureString.trim().toUpperCase();
    
    // Si déjà au format HH:MM, retourner tel quel
    if (/^\d{1,2}:\d{2}$/.test(heure)) {
      return heure.length === 4 ? `0${heure}` : heure; // Ajouter un 0 si nécessaire (ex: 7:00 -> 07:00)
    }
    
    // Si au format 7H ou 07H, convertir en HH:MM
    if (/^\d{1,2}H\d{0,2}$/.test(heure)) {
      const parts = heure.split('H');
      const hours = parts[0].padStart(2, '0');
      const minutes = parts[1] ? parts[1].padStart(2, '0') : '00';
      return `${hours}:${minutes}`;
    }
    
    // Si juste un nombre (ex: 7 ou 07), considérer comme heure pleine
    if (/^\d{1,2}$/.test(heure)) {
      return `${heure.padStart(2, '0')}:00`;
    }
    
    // Si au format 7H ou 07H sans minutes
    if (/^\d{1,2}H$/.test(heure)) {
      return `${heure.replace('H', '').padStart(2, '0')}:00`;
    }
    
    // Format non reconnu, retourner tel quel
    return heure;
  };

  // Fonction pour convertir une date du format JJ/MM/AA ou JJ/MM/AAAA en objet Date
  const parseDate = (dateString: string): Date | null => {
    if (!dateString || !dateString.trim()) return null;
    
    const dateParts = dateString.trim().split('/');
    if (dateParts.length !== 3) return null;
    
    let day = parseInt(dateParts[0], 10);
    let month = parseInt(dateParts[1], 10) - 1; // Les mois commencent à 0 en JavaScript
    let year = parseInt(dateParts[2], 10);
    
    // Gérer les années sur 2 chiffres
    if (year < 100) {
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      year = century + year;
    }
    
    const date = new Date(year, month, day);
    
    // Vérifier que la date est valide
    if (isNaN(date.getTime())) return null;
    
    return date;
  };

  // Fonction pour vérifier si une heure est dans une tranche horaire
  const heureDansTranche = (heure: string, debut: string, fin: string): boolean => {
    // Convertir les heures en minutes depuis minuit pour faciliter la comparaison
    const convertirEnMinutes = (h: string): number => {
      const [hh, mm] = h.includes(":") ? h.split(":").map(Number) : h.split("H").map(Number);
      return parseInt(hh.toString()) * 60 + (parseInt(mm.toString()) || 0);
    };
    
    // Traiter les horaires de nuit (00:00, 01:00, 02:00, 03:00) comme étant 23:00
    let heureMinutes = convertirEnMinutes(heure);
    const heureValue = parseInt(heure.split(':')[0]);
    
    if (heureValue >= 0 && heureValue <= 3) {
      heureMinutes = convertirEnMinutes('23:00');
      
      // Ajouter un toast informatif uniquement la première fois
      if (!window.nightHourToastShown) {
        addToast({
          label: 'Les horaires entre 00:00 et 03:00 sont considérés comme appartenant au service de 23:00',
          icon: 'Info',
          color: '#3b82f6',
          duration: 5000
        });
        window.nightHourToastShown = true;
      }
    }
    
    const debutMinutes = convertirEnMinutes(debut);
    const finMinutes = convertirEnMinutes(fin);
    
    // Gérer le cas où la fin est le lendemain (ex: 23:00 - 02:00)
    if (finMinutes < debutMinutes) {
      return heureMinutes >= debutMinutes || heureMinutes <= finMinutes;
    }
    
    return heureMinutes >= debutMinutes && heureMinutes <= finMinutes;
  };

  // Calculer les totaux
  const calculateTotals = (data: CADetailData[]): TotalsData => {
    return data.reduce((acc, detail) => ({
      montant_ht: acc.montant_ht + detail.montant_ht,
      montant_ttc: acc.montant_ttc + detail.montant_ttc
    }), {
      montant_ht: 0,
      montant_ttc: 0
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      addToast({
        label: 'Veuillez sélectionner un fichier CSV ou TXT',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setSelectedFile(file);
    setCADetailData([]);
    setTotals(null);
    parseCSVFile(file);
  };

  const parseCSVFile = (file: File) => {
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      delimiter: ';', // Utiliser le point-virgule comme séparateur
      complete: (results) => {
        if (results.errors.length > 0) {
          addToast({
            label: `Erreur lors de l'analyse du fichier: ${results.errors[0].message}`,
            icon: 'AlertTriangle',
            color: '#ef4444'
          });
          setIsProcessing(false);
          return;
        }

        const data = results.data as CSVRow[];
        if (data.length === 0) {
          addToast({
            label: 'Le fichier CSV est vide',
            icon: 'AlertTriangle',
            color: '#ef4444'
          });
          setIsProcessing(false);
          return;
        }

        // Vérifier que les colonnes requises sont présentes
        const requiredColumns = ['entite', 'date', 'heure', 'document', 'pu_ht', 'pu_ttc', 'montant_ht', 'montant_ttc'];
        const missingColumns = requiredColumns.filter(col => !Object.keys(data[0]).includes(col));
        
        if (missingColumns.length > 0) {
          addToast({
            label: `Colonnes manquantes dans le fichier: ${missingColumns.join(', ')}`,
            icon: 'AlertTriangle',
            color: '#ef4444'
          });
          setIsProcessing(false);
          return;
        }

        // Transformer les données CSV en format CADetailData
        const caDetailsTransformes: CADetailData[] = data.map((row, index) => {
          // Nettoyer et formater les données
          const entiteCode = row.entite?.trim().toUpperCase() || '';
          const id_entite = entitesMap.get(entiteCode);
          const dateStr = row.date?.trim() || '';
          const date_obj = parseDate(dateStr);
          const heure = formatHeure(row.heure?.trim() || '');
          const document = row.document?.trim() || '';
          const pu_ht = parseAmount(row.pu_ht);
          const pu_ttc = parseAmount(row.pu_ttc);
          const montant_ht = parseAmount(row.montant_ht);
          const montant_ttc = parseAmount(row.montant_ttc);
          
          // Vérifier les erreurs potentielles
          let erreur = '';
          if (!entiteCode) erreur = 'Entité manquante';
          else if (!id_entite) erreur = `Entité "${entiteCode}" non trouvée`;
          else if (!date_obj) erreur = `Date "${dateStr}" invalide`;
          else if (!heure) erreur = 'Heure manquante';
          
          return {
            id_import: index + 1,
            entite: entiteCode,
            id_entite,
            date: dateStr,
            date_obj,
            heure,
            document,
            pu_ht,
            pu_ttc,
            montant_ht,
            montant_ttc,
            erreur: erreur || undefined
          };
        });

        // Calculer les totaux
        const totalsData = calculateTotals(caDetailsTransformes);

        setCADetailData(caDetailsTransformes);
        setTotals(totalsData);

        // Afficher un résumé des erreurs
        const lignesAvecErreurs = caDetailsTransformes.filter(d => d.erreur).length;
        if (lignesAvecErreurs > 0) {
          addToast({
            label: `Fichier analysé avec ${lignesAvecErreurs} erreur(s) sur ${caDetailsTransformes.length} ligne(s)`,
            icon: 'AlertTriangle',
            color: '#f59e0b'
          });
        } else {
          addToast({
            label: `Fichier analysé avec succès. ${caDetailsTransformes.length} ligne(s) trouvée(s)`,
            icon: 'Check',
            color: '#22c55e'
          });
        }

        setIsProcessing(false);
      },
      error: (error) => {
        addToast({
          label: `Erreur lors de la lecture du fichier: ${error.message}`,
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
        setIsProcessing(false);
      }
    });
  };

  const handleSimulateImport = async () => {
    if (caDetailData.length === 0) {
      addToast({
        label: 'Aucune donnée à simuler',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setIsSimulating(true);
    let enrichedData = [...caDetailData];

    try {
      // Récupérer les types de service pour chaque entité
      const typesServicePromises = Array.from(entitesMap.values()).map(async (entiteId) => {
        const { data, error } = await supabase
          .from('ca_type_service')
          .select(`
            id, 
            code, 
            libelle, 
            id_entite,
            heure_debut,
            heure_fin,
            id_flux_sous_categorie
          `)
          .eq('actif', true)
          .eq('id_entite', entiteId);

        if (error) throw error;
        return data || [];
      });

      const typesServiceResults = await Promise.all(typesServicePromises);
      const typesService = typesServiceResults.flat();

      // Enrichir les données avec les types de service correspondants
      enrichedData = caDetailData.map(detail => {
        if (!detail.id_entite || !detail.heure) {
          return { ...detail };
        }

        // Trouver le type de service correspondant à l'heure
        const matchingService = typesService.find(ts => 
          ts.id_entite === detail.id_entite && 
          ts.heure_debut && 
          ts.heure_fin && 
          heureDansTranche(detail.heure, ts.heure_debut, ts.heure_fin)
        );

        if (matchingService) {
          // Récupérer la sous-catégorie associée au type de service
          const sousCategorieId = matchingService.id_flux_sous_categorie;
          const sousCategorie = sousCategorieMap.get(sousCategorieId);
          
          // Récupérer la catégorie associée à la sous-catégorie
          let categorie = null;
          if (sousCategorie) {
            const categorieId = sousCategorie.id_categorie;
            categorie = categorieMap.get(categorieId);
            
            // Si on n'a pas trouvé la catégorie dans la map, essayer de la récupérer depuis la base de données
            if (!categorie && categorieId) {
              // Effectuer une requête pour récupérer les détails de la catégorie
              supabase
                .from('fin_flux_categorie')
                .select('id, code, libelle, id_entite')
                .eq('id', categorieId)
                .single()
                .then(({ data, error }) => {
                  if (!error && data) {
                    // Mettre à jour la map des catégories
                    const newCategorieMap = new Map(categorieMap);
                    newCategorieMap.set(categorieId, {
                      id: data.id,
                      code: data.code,
                      libelle: data.libelle,
                      id_entite: data.id_entite
                    });
                    setCategorieMap(newCategorieMap);
                    
                    // Mettre à jour les données enrichies
                    setCADetailData(currentData => 
                      currentData.map(item => 
                        item.id_import === detail.id_import
                          ? {
                              ...item,
                              id_flux_categorie: data.id,
                              categorie: {
                                id: data.id,
                                code: data.code,
                                libelle: data.libelle
                              }
                            }
                          : item
                      )
                    );
                  }
                });
            }
          }
          
          return {
            ...detail,
            id_type_service: matchingService.id,
            type_service: {
              id: matchingService.id,
              code: matchingService.code,
              libelle: matchingService.libelle
            },
            id_flux_sous_categorie: sousCategorieId,
            sous_categorie: sousCategorie ? {
              id: sousCategorie.id,
              code: sousCategorie.code,
              libelle: sousCategorie.libelle
            } : undefined,
            id_flux_categorie: categorie?.id,
            categorie: categorie ? {
              id: categorie.id,
              code: categorie.code,
              libelle: categorie.libelle
            } : undefined
          };
        } else {
          return {
            ...detail,
            erreur: detail.erreur || `Aucun type de service trouvé pour l'heure ${detail.heure}`
          };
        }
      });

      // Mettre à jour les données avec les informations enrichies
      setCADetailData(enrichedData);

      // Vérifier s'il y a des erreurs
      const lignesAvecErreurs = enrichedData.filter(d => d.erreur).length;
      if (lignesAvecErreurs > 0) {
        addToast({
          label: `Simulation terminée avec ${lignesAvecErreurs} erreur(s) sur ${enrichedData.length} ligne(s)`,
          icon: 'AlertTriangle',
          color: '#f59e0b'
        });
      } else {
        addToast({
          label: `Simulation réussie ! Toutes les ${enrichedData.length} lignes sont valides`,
          icon: 'Check',
          color: '#22c55e'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la simulation:', error);
      addToast({
        label: 'Erreur lors de la simulation',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Fonction pour importer les données dans la base
  const handleImportToDatabase = async () => {
    if (caDetailData.length === 0) {
      addToast({
        label: 'Aucune donnée à importer',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    if (!profil?.com_contrat_client_id) {
      addToast({
        label: 'Profil utilisateur incomplet',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    // Vérifier que toutes les lignes sont valides
    const lignesAvecErreurs = caDetailData.filter(d => d.erreur);
    if (lignesAvecErreurs.length > 0) {
      addToast({
        label: `Import impossible : ${lignesAvecErreurs.length} ligne(s) contiennent des erreurs`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setIsImporting(true);
    setImportProgress({
      current: 0,
      total: caDetailData.length,
      phase: 'preparation',
      message: 'Préparation des données...'
    });

    try {
      // Étape 1: Regrouper les données par (id_entite, date, id_flux_categorie)
      const groupedByEntiteDateCategorie = new Map<string, CADetailData[]>();
      
      caDetailData.forEach(detail => {
        if (!detail.id_entite || !detail.date_obj || !detail.id_flux_categorie) return;
        
        const dateISO = detail.date_obj.toISOString().split('T')[0]; // Format YYYY-MM-DD
        const key = `${detail.id_entite}|${dateISO}|${detail.id_flux_categorie}`;
        
        if (!groupedByEntiteDateCategorie.has(key)) {
          groupedByEntiteDateCategorie.set(key, []);
        }
        
        groupedByEntiteDateCategorie.get(key)?.push(detail);
      });

      setImportProgress(prev => ({
        ...prev,
        phase: 'ca_reel',
        message: 'Étape 1/3 : Création des lignes ca_reel...'
      }));

      // Étape 2: Créer ou mettre à jour les lignes ca_reel
      const caReelResults = new Map<string, number>(); // Clé -> id_ca_reel
      let caReelCount = 0;
      let caReelDetailCount = 0;
      let caReelDetailHeureCount = 0;
      let errorCount = 0;
      const errors: ImportError[] = [];

      // Log du contrat client pour le débogage
      console.log('Contrat client ID utilisé pour l\'import:', profil.com_contrat_client_id);

      // Traiter chaque groupe (entité, date, catégorie)
      for (const [key, details] of groupedByEntiteDateCategorie.entries()) {
        try {
          const [id_entite, date_vente, id_flux_categorie] = key.split('|');
          
          // Calculer les totaux pour ce groupe
          const montant_ht = details.reduce((sum, detail) => sum + detail.montant_ht, 0);
          const montant_ttc = details.reduce((sum, detail) => sum + detail.montant_ttc, 0);
          
          // Log des données pour le débogage
          console.log('Données pour upsert ca_reel:', {
            key,
            id_entite,
            date_vente,
            id_flux_categorie,
            montant_ht,
            montant_ttc
          });

          // Mettre à jour la progression
          setImportProgress(prev => ({
            ...prev,
            current: caReelCount + 1,
            total: groupedByEntiteDateCategorie.size,
            message: `Étape 1/3 : Traitement ca_reel: ${date_vente}`
          }));
          
          // Préparer les données pour l'upsert avec l'utilitaire
          const caReelUpsertData = {
            com_contrat_client_id: profil.com_contrat_client_id,
            id_entite,
            date_vente,
            id_flux_categorie,
            montant_ht,
            montant_ttc
          };
          
          console.log('Données complètes pour upsert ca_reel:', caReelUpsertData);
          
          // Utiliser l'utilitaire qui garantit la récupération de l'ID
          let id_ca_reel: number;
          try {
            id_ca_reel = await upsertCaReelWithFallback(caReelUpsertData);
            console.log('ID ca_reel obtenu:', id_ca_reel);
            
            caReelResults.set(key, id_ca_reel);
            caReelCount++;
          } catch (caReelError) {
            console.error('Erreur lors de l\'upsert ca_reel:', caReelError);
            throw caReelError;
          }
          
          // Étape 3: Regrouper les détails par type de service
          const groupedByTypeService = new Map<string, CADetailData[]>();
          
          details.forEach(detail => {
            if (!detail.id_type_service) return;
            
            if (!groupedByTypeService.has(detail.id_type_service)) {
              groupedByTypeService.set(detail.id_type_service, []);
            }
            
            groupedByTypeService.get(detail.id_type_service)?.push(detail);
          });
          
          // Étape 4: Créer ou mettre à jour les lignes ca_reel_detail
          setImportProgress(prev => ({
            ...prev,
            phase: 'ca_reel_detail',
            message: `Étape 2/3 : Création des détails par service pour ${date_vente}`
          }));
          
          const caReelDetailResults = new Map<string, number>(); // id_type_service -> id_ca_reel_detail
          
          for (const [id_type_service, serviceDetails] of groupedByTypeService.entries()) {
            try {
              // Calculer les totaux pour ce type de service
              const montant_ht = serviceDetails.reduce((sum, detail) => sum + detail.montant_ht, 0);
              const montant_ttc = serviceDetails.reduce((sum, detail) => sum + detail.montant_ttc, 0);
              
              // Préparer les données pour l'upsert avec l'utilitaire
              const caReelDetailUpsertData = {
                id_ca_reel,
                id_type_service,
                montant_ht,
                montant_ttc
              };
              
              console.log('Données pour upsert ca_reel_detail:', caReelDetailUpsertData);
              
              // Utiliser l'utilitaire qui garantit la récupération de l'ID
              let id_ca_reel_detail: number;
              try {
                id_ca_reel_detail = await upsertCaReelDetailWithFallback(caReelDetailUpsertData);
                console.log('ID ca_reel_detail obtenu:', id_ca_reel_detail);
                
                caReelDetailResults.set(id_type_service, id_ca_reel_detail);
                caReelDetailCount++;
              } catch (caReelDetailError) {
                console.error('Erreur lors de l\'upsert ca_reel_detail:', caReelDetailError);
                throw caReelDetailError;
              }
              
              // Étape 5: Créer les lignes ca_reel_detail_heure
              setImportProgress(prev => ({
                ...prev,
                phase: 'ca_reel_detail_heure',
                message: `Étape 3/3 : Création des détails horaires pour ${date_vente}`
              }));
              
              // Regrouper par heure et document pour éviter les doublons
              const heureDocumentMap = new Map<string, CADetailData>();
              
              serviceDetails.forEach(detail => {
                const key = `${detail.heure}|${detail.document || ''}`;
                
                // Si cette combinaison existe déjà, additionner les montants
                if (heureDocumentMap.has(key)) {
                  const existing = heureDocumentMap.get(key)!;
                  existing.montant_ht += detail.montant_ht;
                  existing.montant_ttc += detail.montant_ttc;
                  // Garder le PU du premier enregistrement
                } else {
                  heureDocumentMap.set(key, { ...detail });
                }
              });
              
              // Insérer chaque ligne horaire unique
              for (const detail of heureDocumentMap.values()) {
                // Log des données pour le débogage
                const caReelDetailHeureUpsertData = {
                  id_ca_reel_detail,
                  heure: detail.heure,
                  document: detail.document || null,
                  pu_ht: detail.pu_ht,
                  pu_ttc: detail.pu_ttc,
                  montant_ht: detail.montant_ht,
                  montant_ttc: detail.montant_ttc
                };
                
                console.log('Données pour upsert ca_reel_detail_heure:', caReelDetailHeureUpsertData);
                
                try {
                  // Utiliser l'utilitaire qui garantit la récupération de l'ID
                  const id_ca_reel_detail_heure = await upsertCaReelDetailHeureWithFallback(caReelDetailHeureUpsertData);
                  console.log('ID ca_reel_detail_heure obtenu:', id_ca_reel_detail_heure);
                  caReelDetailHeureCount++;
                } catch (heureError) {
                  console.error('Erreur lors de l\'upsert ca_reel_detail_heure:', heureError);
                  throw heureError;
                }
              }
              
            } catch (error) {
              console.error(`Erreur lors du traitement du type de service ${id_type_service}:`, error);
              errorCount++;
              errors.push({
                type: 'Type de service',
                message: `Erreur lors du traitement du type de service`,
                details: `ID: ${id_type_service}, Erreur: ${(error as Error).message}`
              });
            }
          }
          
        } catch (error) {
          console.error(`Erreur lors du traitement du groupe ${key}:`, error, 'Stack:', (error as Error).stack);
          errorCount++;
          const [id_entite, date_vente, id_flux_categorie] = key.split('|');
          errors.push({
            type: 'Groupe CA',
            message: `Erreur lors du traitement du groupe (entité, date, catégorie)`,
            details: `Date: ${date_vente}, Erreur: ${(error as Error).message}`
          });
        }
      }

      // Marquer l'import comme terminé
      setImportProgress(prev => ({
        ...prev,
        phase: 'completed',
        message: 'Import terminé'
      }));

      // Regrouper les erreurs similaires
      const groupedErrors = errors.reduce((acc: ImportError[], error) => {
        const existingError = acc.find(e => e.type === error.type && e.message === error.message);
        if (existingError) {
          existingError.count = (existingError.count || 1) + 1;
        } else {
          acc.push({ ...error, count: 1 });
        }
        return acc;
      }, []);

      // Stocker les erreurs pour affichage dans la modale
      setImportErrors(groupedErrors);

      addToast({
        label: `Import terminé ! ${caReelCount} ligne(s) dans ca_reel, ${caReelDetailCount} dans ca_reel_detail, ${caReelDetailHeureCount} dans ca_reel_detail_heure, ${errorCount} erreur(s)`,
        icon: 'Check',
        color: '#22c55e'
      });

      // Ouvrir la modale d'erreurs si des erreurs ont été rencontrées
      if (errorCount > 0) {
        setIsErrorModalOpen(true);
      }

      // Réinitialiser après import réussi
      if (caReelCount > 0) {
        setSelectedFile(null);
        setCADetailData([]);
        setTotals(null);
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      addToast({
        label: `Erreur lors de l'import: ${(error as Error).message}`,
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      
      // Ajouter l'erreur globale à la liste
      setImportErrors([{
        type: 'Erreur globale',
        message: 'Erreur lors de l\'import des données',
        details: (error as Error).message
      }]);
      
      // Ouvrir la modale d'erreurs
      setIsErrorModalOpen(true);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `entite;date;heure;document;pu_ht;pu_ttc;montant_ht;montant_ttc
CDP;15/01/2024;07:30;TICKET001;15,50;17,05;15,50;17,05
CDP;15/01/2024;12:15;TICKET002;25,00;27,50;50,00;55,00
PQ;16/01/2024;19:45;TICKET003;32,50;35,75;97,50;107,25
PQ;16/01/2024;8H;TICKET004;12,00;13,20;24,00;26,40`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_import_ca_detail.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrer les données en fonction de l'option "Non Validée"
  const filteredData = React.useMemo(() => {
    if (!showOnlyNonValidated) {
      return caDetailData;
    }
    return caDetailData.filter(detail => detail.erreur);
  }, [caDetailData, showOnlyNonValidated]);

  // Configuration des colonnes du tableau
  const columns: Column<CADetailData>[] = [
    {
      label: 'ID Import',
      accessor: 'id_import',
      align: 'center',
      width: '80px'
    },
    {
      label: 'Entité',
      accessor: 'entite',
      width: '80px'
    },
    {
      label: 'Date',
      accessor: 'date',
      width: '100px'
    },
    {
      label: 'Heure',
      accessor: 'heure',
      width: '80px'
    },
    {
      label: 'Document',
      accessor: 'document',
      width: '120px'
    },
    {
      label: 'PU HT',
      accessor: 'pu_ht',
      align: 'right',
      width: '100px',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'PU TTC',
      accessor: 'pu_ttc',
      align: 'right',
      width: '100px',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'Montant HT',
      accessor: 'montant_ht',
      align: 'right',
      width: '120px',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'Montant TTC',
      accessor: 'montant_ttc',
      align: 'right',
      width: '100px',
      render: (value) => `${Number(value).toFixed(2)} €`
    },
    {
      label: 'ID Entité',
      accessor: 'id_entite',
      width: '100px',
      render: (value) => value || '-'
    },
    {
      label: 'Type Service',
      accessor: 'type_service',
      width: '120px',
      render: (value) => value ? `${value.code} - ${value.libelle}` : '-'
    },
    {
      label: 'ID Type Service',
      accessor: 'id_type_service',
      width: '100px',
      render: (value) => value || '-'
    },
    {
      label: 'Sous-catégorie',
      accessor: 'sous_categorie',
      width: '120px',
      render: (value) => value ? `${value.code} - ${value.libelle}` : '-'
    },
    {
      label: 'ID Sous-catégorie',
      accessor: 'id_flux_sous_categorie',
      width: '100px',
      render: (value) => value || '-'
    },
    {
      label: 'Catégorie',
      accessor: 'categorie',
      width: '120px',
      render: (value) => value ? `${value.code} - ${value.libelle}` : '-'
    },
    {
      label: 'ID Catégorie',
      accessor: 'id_flux_categorie',
      width: '100px',
      render: (value) => value || '-'
    },
    {
      label: 'Statut',
      accessor: 'erreur',
      width: '200px',
      render: (value) => value ? (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {value}
        </span>
      ) : (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Valide
        </span>
      )
    }
  ];

  if (profilLoading) {
    return (
      <div className={styles.container}>
        <PageSection>
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-gray-600">Chargement...</p>
          </div>
        </PageSection>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageSection
        title="Import Détail CA"
        description="Importez les données détaillées de chiffre d'affaires depuis un fichier CSV"
        className={styles.header}
      >
        <div className="space-y-6">
          {/* Sélection de fichier */}
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionner un fichier CSV
              </h3>
              <p className="text-gray-600 mb-4">
                Choisissez un fichier CSV contenant vos données de CA détaillées.
                <br />
                <span className="text-sm text-gray-500">
                  Format attendu : séparateur ";" avec les colonnes entite, date, heure, document, pu_ht, pu_ttc, montant_ht, montant_ttc.
                </span>
                <br />
                <button
                  onClick={downloadTemplate}
                  className="text-blue-600 hover:text-blue-800 underline text-sm mt-1 inline-flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Télécharger un modèle
                </button>
              </p>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing || isSimulating}
              />
              <Button
                label={isProcessing ? 'Analyse en cours...' : 'Choisir un fichier'}
                icon="Upload"
                color="var(--color-primary)"
                onClick={() => document.getElementById('csv-file-input')?.click()}
                disabled={isProcessing || isSimulating}
              />
            </div>
          </div>

          {/* Tableau des données avec totaux */}
          {caDetailData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Données importées ({caDetailData.length} lignes)
                  {showOnlyNonValidated && filteredData.length !== caDetailData.length && 
                    <span className="ml-2 text-sm text-gray-500">
                      ({filteredData.length} non validées)
                    </span>
                  }
                </h3>
                <div className="flex items-center gap-3">
                  <Toggle
                    checked={showOnlyNonValidated}
                    onChange={setShowOnlyNonValidated}
                    label="Non Validée"
                    icon="AlertCircle"
                    size="sm"
                  />
                  <div className="flex gap-3">
                    <Button
                      label={isSimulating ? 'Simulation...' : 'Simuler l\'import'}
                      icon="Search"
                      color="#f59e0b"
                      onClick={handleSimulateImport}
                      disabled={isSimulating || isProcessing}
                      size="sm"
                    />
                   <Button
                     label={isImporting ? "Import en cours..." : "Importer dans la base"}
                     icon="Database"
                     color="var(--color-primary)"
                     onClick={handleImportToDatabase}
                     disabled={isImporting || isSimulating || isProcessing || caDetailData.some(d => d.erreur)}
                     size="sm"
                   />
                    <Button
                      label="Exporter CSV"
                      icon="FileDown"
                      color="#22c55e"
                      onClick={() => {
                        // Fonctionnalité d'export à implémenter
                        addToast({
                          label: 'Fonctionnalité d\'export en cours de développement',
                          icon: 'Info',
                          color: '#3b82f6'
                        });
                      }}
                      disabled={isSimulating || isProcessing || caDetailData.length === 0}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Barre de progression pendant l'import */}
              {isImporting && (
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-blue-900">
                        Import en cours...
                      </h4>
                      <span className="text-sm text-blue-700">
                        {importProgress.phase === 'ca_reel' && `${importProgress.current} / ${importProgress.total} groupes`}
                        {importProgress.phase === 'ca_reel_detail' && 'Création des détails par service'}
                        {importProgress.phase === 'ca_reel_detail_heure' && 'Création des détails horaires'}
                        {importProgress.phase === 'completed' && 'Terminé'}
                      </span>
                    </div>
                    
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${importProgress.phase === 'completed' ? 100 : 
                                  importProgress.phase === 'ca_reel' ? 
                                  Math.round((importProgress.current / Math.max(importProgress.total, 1)) * 100) : 
                                  importProgress.phase === 'ca_reel_detail' ? 70 : 
                                  importProgress.phase === 'ca_reel_detail_heure' ? 90 : 30}%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="text-sm text-blue-700">
                      {importProgress.message}
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <DataTable
                    columns={columns}
                    data={totals ? [
                      ...(showOnlyNonValidated ? [] : [{
                          id_import: 0,
                          entite: 'TOTAUX',
                          date: '-',
                          heure: '-',
                          document: '-',
                          pu_ht: 0,
                          pu_ttc: 0,
                          montant_ht: totals.montant_ht,
                          montant_ttc: totals.montant_ttc
                        } as CADetailData]),
                      ...filteredData
                    ] : caDetailData}
                    actions={[]} // Pas d'actions pour cette table
                    defaultRowsPerPage={25}
                    rowsPerPageOptions={[25, 50, 100, 'all']}
                    emptyTitle="Aucune donnée"
                    emptyMessage="Aucune donnée n'a été trouvée dans le fichier."
                    className="min-w-max"
                    customRowClassName={(row, index) => 
                      index === 0 && totals ? 'bg-blue-50 font-semibold text-blue-900 border-b-2 border-blue-200' : 
                      row.erreur ? 'bg-red-50' : ''
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Informations sur l'import */}
          {caDetailData.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 mb-2">Informations sur l'import</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Les codes entité (CDP, PQ) doivent correspondre à des entités existantes</li>
                    <li>• Les dates doivent être au format JJ/MM/AAAA ou JJ/MM/AA</li>
                    <li>• Les heures sont acceptées aux formats HH:MM, HH, H:MM, HH ou H</li>
                    <li>• Les montants doivent être numériques (espaces et virgules sont acceptés)</li>
                    <li>• Chaque ligne doit correspondre à un type de service selon l'heure</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <ToastContainer toasts={toasts} onClose={closeToast} />
        
        {/* Modale de rapport d'erreurs */}
        {isErrorModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center text-red-600">
                  <XCircle className="w-6 h-6 mr-2" />
                  Rapport d'erreurs d'importation
                </h2>
                <button
                  onClick={() => setIsErrorModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 mb-4">
                  Des erreurs ont été rencontrées lors de l'importation des données. Veuillez consulter le rapport ci-dessous pour plus de détails.
                </p>
                
                {importErrors.length === 0 ? (
                  <div className="p-4 bg-gray-100 rounded-lg text-center">
                    <p className="text-gray-500">Aucune erreur détaillée disponible</p>
                  </div>
                ) : (
                  <div className="border border-red-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-red-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Type d'erreur</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Message</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Occurrences</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-red-100">
                        {importErrors.map((error, index) => (
                          <tr key={index} className="hover:bg-red-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{error.type}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div>{error.message}</div>
                              {error.details && (
                                <div className="text-xs text-gray-500 mt-1">{error.details}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                              {error.count ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  {error.count}
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <p>Ces erreurs n'ont pas empêché l'importation des données valides.</p>
                </div>
                <Button
                  label="Fermer"
                  color="#6B7280"
                  onClick={() => setIsErrorModalOpen(false)}
                  size="sm"
                />
              </div>
            </div>
          </div>
        )}
      </PageSection>
    </div>
  );
};

export default ImportCADetail;