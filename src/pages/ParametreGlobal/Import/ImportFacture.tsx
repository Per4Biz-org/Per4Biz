import React, { useEffect, useState } from 'react';
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
import { ProgressBar } from '../../../components/ui/progress-bar';
import styles from '../styles.module.css';

interface CSVRow {
  [key: string]: string;
}

interface FactureData {
  id_import: number;
  entite: string;
  code: string;
  num_document: string;
  date_facture: string;
  mode_paiement: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  divers: number;
  vivre: number;
  bois: number;
  mnr: number;
  nrj: number;
  net: number;
}

interface TotalsData {
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  divers: number;
  vivre: number;
  bois: number;
  mnr: number;
  nrj: number;
  net: number;
}

const ImportFacture: React.FC = () => {
  const { setMenuItems } = useMenu();
  const { profil, loading: profilLoading } = useProfil();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [facturesData, setFacturesData] = useState<FactureData[]>([]);
  const [totals, setTotals] = useState<TotalsData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationErrors, setSimulationErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    currentFacture: '',
    phase: '' as 'factures' | 'lignes' | 'completed'
  });
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    setMenuItems(menuItemsParametreGlobalImport);
  }, [setMenuItems]);

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

  // Fonction pour convertir une date du format jj/mm/aaaa vers le format ISO (aaaa-mm-jj)
  const convertDateFormat = (dateString: string): string | null => {
    if (!dateString || !dateString.trim()) return null;
    
    const dateParts = dateString.trim().split('/');
    if (dateParts.length !== 3) return null;
    
    const day = dateParts[0].padStart(2, '0');
    const month = dateParts[1].padStart(2, '0');
    let year = dateParts[2];
    
    // Support des formats jj/mm/aa et jj/mm/aaaa
    if (year.length === 2) {
      // Convertir l'année sur 2 chiffres en année sur 4 chiffres
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      const yearNumber = parseInt(year);
      
      // Si l'année est supérieure à l'année actuelle + 10, on considère qu'elle appartient au siècle précédent
      if (yearNumber > (currentYear % 100) + 10) {
        year = (currentCentury - 100 + yearNumber).toString();
      } else {
        year = (currentCentury + yearNumber).toString();
      }
    } else if (year.length !== 4) {
      return null;
    }
    
    return `${year}-${month}-${day}`;
  };

  // Fonction pour valider et nettoyer les montants
  const parseAmount = (amountString: string): number => {
    if (!amountString || !amountString.trim()) return 0;
    
    const cleanAmount = amountString.trim().replace(',', '.');
    const parsed = parseFloat(cleanAmount);
    
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculer les totaux
  const calculateTotals = (data: FactureData[]): TotalsData => {
    return data.reduce((acc, facture) => ({
      montant_ht: acc.montant_ht + facture.montant_ht,
      montant_tva: acc.montant_tva + facture.montant_tva,
      montant_ttc: acc.montant_ttc + facture.montant_ttc,
      divers: acc.divers + facture.divers,
      vivre: acc.vivre + facture.vivre,
      bois: acc.bois + facture.bois,
      mnr: acc.mnr + facture.mnr,
      nrj: acc.nrj + facture.nrj,
      net: acc.net + facture.net
    }), {
      montant_ht: 0,
      montant_tva: 0,
      montant_ttc: 0,
      divers: 0,
      vivre: 0,
      bois: 0,
      mnr: 0,
      nrj: 0,
      net: 0
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      addToast({
        label: 'Veuillez sélectionner un fichier CSV',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setSelectedFile(file);
    setFacturesData([]);
    setTotals(null);
    parseCSVFile(file);
  };

  const parseCSVFile = (file: File) => {
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      delimiter: ';',
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

        // Transformer les données CSV en format FactureData
        const facturesTransformees: FactureData[] = data.map((row, index) => ({
          id_import: index + 1,
          entite: row.entite || '',
          code: row.code || '',
          num_document: row.num_document || '',
          date_facture: row.date_facture || '',
          mode_paiement: row.mode_paiement || '',
          montant_ht: parseAmount(row.montant_ht),
          montant_tva: parseAmount(row.montant_tva),
          montant_ttc: parseAmount(row.montant_ttc),
          divers: parseAmount(row.divers || row.DIVERS || '0'),
          vivre: parseAmount(row.vivre || row.VIVRE || row.vivres || row.VIVRES || '0'),
          bois: parseAmount(row.bois || row.BOIS || '0'),
          mnr: parseAmount(row.mnr || row.MNR || '0'),
          nrj: parseAmount(row.nrj || row.NRJ || '0'),
          net: parseAmount(row.net || row.NET || '0')
        }));

        // Debug : afficher les premières lignes pour vérifier le parsing
        console.log('Premières lignes CSV brutes:', data.slice(0, 2));
        console.log('Premières lignes transformées:', facturesTransformees.slice(0, 2));
        console.log('En-têtes détectés:', Object.keys(data[0] || {}));
        
        // Debug spécifique pour VIVRE
        console.log('Debug VIVRE - Première ligne CSV:', {
          vivre: data[0]?.vivre,
          VIVRE: data[0]?.VIVRE,
          vivres: data[0]?.vivres,
          VIVRES: data[0]?.VIVRES
        });
        console.log('Debug VIVRE - Première ligne transformée:', {
          vivre: facturesTransformees[0]?.vivre
        });
        
        setFacturesData(facturesTransformees);
        setTotals(calculateTotals(facturesTransformees));

        addToast({
          label: `Fichier analysé avec succès. ${facturesTransformees.length} facture(s) trouvée(s)`,
          icon: 'Check',
          color: '#22c55e'
        });

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
    if (facturesData.length === 0) {
      addToast({
        label: 'Aucune donnée à simuler',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    if (!profil?.code_user || !profil?.com_contrat_client_id) {
      addToast({
        label: 'Profil utilisateur incomplet',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setIsSimulating(true);
    const errors: string[] = [];

    try {
      // Récupérer toutes les données de référence en une fois avec les relations
      const [entitesResult, tiersResult, modesPaiementResult, sousCategoriesResult, categoriesResult] = await Promise.all([
        supabase
          .from('com_entite')
          .select('code')
          .eq('com_contrat_client_id', profil.com_contrat_client_id),
        supabase
          .from('com_tiers')
          .select('code')
          .eq('com_contrat_client_id', profil.com_contrat_client_id),
        supabase
          .from('bq_param_mode_paiement')
          .select('code')
          .eq('com_contrat_client_id', profil.com_contrat_client_id),
        supabase
          .from('fin_flux_sous_categorie')
          .select(`
            id,
            code,
            id_categorie,
            categorie:id_categorie (
              id,
              code,
              id_entite,
              entite:id_entite (
                id,
                code
              )
            )
          `)
          .eq('com_contrat_client_id', profil.com_contrat_client_id),
        supabase
          .from('fin_flux_categorie')
          .select(`
            id,
            code,
            id_entite,
            entite:id_entite (
              id,
              code
            )
          `)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
      ]);

      const entitesExistantes = new Set(entitesResult.data?.map(e => e.code) || []);
      const tiersExistants = new Set(tiersResult.data?.map(t => t.code) || []);
      const modesPaiementExistants = new Set(modesPaiementResult.data?.map(m => m.code) || []);
      
      // Créer une map pour les sous-catégories avec la clé : "code_entite:code_sous_categorie"
      const sousCategoriesParEntite = new Map();
      sousCategoriesResult.data?.forEach(sousCategorie => {
        // Récupérer le code de l'entité ou utiliser "GLOBAL" si id_entite est null
        const codeEntite = sousCategorie.categorie?.entite?.code || "GLOBAL";
        
        // Créer une clé spécifique à l'entité
        const cle = `${codeEntite}:${sousCategorie.code}`;
        sousCategoriesParEntite.set(cle, {
          id: sousCategorie.id,
          id_categorie: sousCategorie.id_categorie,
          code: sousCategorie.code,
          entite_code: codeEntite
        });
        
        // Si c'est une sous-catégorie globale, l'ajouter aussi avec le code de chaque entité
        if (codeEntite === "GLOBAL") {
          entitesExistantes.forEach(entiteCode => {
            const cleEntite = `${entiteCode}:${sousCategorie.code}`;
            sousCategoriesParEntite.set(cle, {
              id: sousCategorie.id,
              id_categorie: sousCategorie.id_categorie,
              code: sousCategorie.code,
              entite_code: "GLOBAL"
            });
          });
        }
      });

      // Créer une map pour les catégories avec la clé : "code_entite:code_categorie"
      const categoriesParEntite = new Map();
      categoriesResult.data?.forEach(categorie => {
        // Récupérer le code de l'entité ou utiliser "GLOBAL" si id_entite est null
        const codeEntite = categorie.entite?.code || "GLOBAL";
        
        // Créer une clé spécifique à l'entité
        const cle = `${codeEntite}:${categorie.code}`;
        categoriesParEntite.set(cle, {
          id: categorie.id,
          code: categorie.code,
          entite_code: codeEntite
        });
        
        // Si c'est une catégorie globale, l'ajouter aussi avec le code de chaque entité
        if (codeEntite === "GLOBAL") {
          entitesExistantes.forEach(entiteCode => {
            const cleEntite = `${entiteCode}:${categorie.code}`;
            categoriesParEntite.set(cle, {
              id: categorie.id,
              code: categorie.code,
              entite_code: "GLOBAL"
            });
          });
        }
      });

      // Analyser chaque facture
      for (let i = 0; i < facturesData.length; i++) {
        const facture = facturesData[i];
        const ligneNum = i + 1;

        // Vérifier l'entité
        if (!facture.entite) {
          errors.push(`Ligne ${ligneNum}: Entité manquante`);
        } else if (!entitesExistantes.has(facture.entite)) {
          errors.push(`Ligne ${ligneNum}: Entité "${facture.entite}" introuvable`);
        }

        // Vérifier le tiers
        if (!facture.code) {
          errors.push(`Ligne ${ligneNum}: Code tiers manquant`);
        } else if (!tiersExistants.has(facture.code)) {
          errors.push(`Ligne ${ligneNum}: Tiers "${facture.code}" introuvable`);
        }

        // Vérifier le mode de paiement
        if (!facture.mode_paiement) {
          errors.push(`Ligne ${ligneNum}: Mode de paiement manquant`);
        } else if (!modesPaiementExistants.has(facture.mode_paiement)) {
          errors.push(`Ligne ${ligneNum}: Mode de paiement "${facture.mode_paiement}" introuvable`);
        }

        // Vérifier la date
        const dateFacture = convertDateFormat(facture.date_facture);
        if (!dateFacture) {
          errors.push(`Ligne ${ligneNum}: Date invalide "${facture.date_facture}" (formats acceptés: jj/mm/aaaa ou jj/mm/aa)`);
        }

        // Vérifier les montants
        if (facture.montant_ht <= 0) {
          errors.push(`Ligne ${ligneNum}: Montant HT invalide (${facture.montant_ht})`);
        }
        if (facture.montant_ttc <= 0) {
          errors.push(`Ligne ${ligneNum}: Montant TTC invalide (${facture.montant_ttc})`);
        }

        // Vérifier les sous-catégories analytiques avec correspondance entité/sous-catégorie/catégorie
        const champsAnalytiques = [
          { nom: 'divers', montant: facture.divers, sousCategorie: 'DIVERS' },
          { nom: 'vivre', montant: facture.vivre, sousCategorie: 'VIVRE' },
          { nom: 'bois', montant: facture.bois, sousCategorie: 'BOIS' },
          { nom: 'mnr', montant: facture.mnr, sousCategorie: 'MNR' },
          { nom: 'nrj', montant: facture.nrj, sousCategorie: 'NRJ' },
          { nom: 'net', montant: facture.net, sousCategorie: 'NET' }
        ];

        let lignesFactureValides = 0;
        let totalMontantLignes = 0;

        for (const champ of champsAnalytiques) {
          if (champ.montant > 0) {
            // Créer la clé de recherche : "code_entite:code_sous_categorie"
            const cleSousCategorie = `${facture.entite}:${champ.sousCategorie}`;
            const sousCategorieInfo = sousCategoriesParEntite.get(cleSousCategorie);
            
            if (!sousCategorieInfo) {
              errors.push(`Ligne ${ligneNum}: Sous-catégorie "${champ.sousCategorie}" introuvable pour l'entité "${facture.entite}" (${champ.nom}: ${champ.montant}€)`);
            } else {
              // Vérifier que la catégorie parente existe aussi pour cette entité
              const idCategorie = sousCategorieInfo.id_categorie;
              
              // Trouver la catégorie correspondante
              const categorieCorrespondante = categoriesResult.data?.find(cat => 
                cat.id === idCategorie && cat.entite?.code === facture.entite
              );
              
              if (!categorieCorrespondante) {
                errors.push(`Ligne ${ligneNum}: Catégorie parente introuvable pour la sous-catégorie "${champ.sousCategorie}" de l'entité "${facture.entite}" (${champ.nom}: ${champ.montant}€)`);
              } else {
                // Simulation de création de ligne de facture réussie
                lignesFactureValides++;
                totalMontantLignes += champ.montant;
                
                console.log(`✅ Ligne ${ligneNum} - ${champ.nom}: Correspondance trouvée - Entité: ${facture.entite}, Sous-catégorie: ${champ.sousCategorie} (ID: ${sousCategorieInfo.id}), Catégorie: ${categorieCorrespondante.code} (ID: ${categorieCorrespondante.id})`);
              }
            }
          }
        }

        // Vérifier qu'il y a au moins une ligne analytique valide
        if (lignesFactureValides === 0) {
          errors.push(`Ligne ${ligneNum}: Aucune ligne analytique valide trouvée (tous les montants sont à 0 ou les sous-catégories sont manquantes)`);
        }

        // Optionnel : Vérifier la cohérence entre le montant HT de la facture et la somme des lignes
        if (lignesFactureValides > 0 && Math.abs(totalMontantLignes - facture.montant_ht) > 0.01) {
          errors.push(`Ligne ${ligneNum}: Incohérence entre le montant HT (${facture.montant_ht}€) et la somme des lignes analytiques (${totalMontantLignes.toFixed(2)}€)`);
        }
      }

      setSimulationErrors(errors);

      if (errors.length === 0) {
        addToast({
          label: `✅ Simulation réussie ! Aucune erreur détectée sur ${facturesData.length} facture(s) et leurs lignes analytiques`,
          icon: 'Check',
          color: '#22c55e'
        });
      } else {
        addToast({
          label: `⚠️ ${errors.length} erreur(s) détectée(s) lors de la simulation des factures et lignes`,
          icon: 'AlertTriangle',
          color: '#f59e0b'
        });
      }

    } catch (error) {
      console.error('Erreur lors de la simulation:', error);
      addToast({
        label: 'Erreur lors de la simulation d\'import des factures et lignes',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleImportToDatabase = async () => {
    if (facturesData.length === 0) {
      addToast({
        label: 'Aucune donnée à importer',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    if (!profil?.code_user || !profil?.com_contrat_client_id) {
      addToast({
        label: 'Profil utilisateur incomplet',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    setIsImporting(true);

    try {
      // Initialiser la progression
      setImportProgress({
        current: 0,
        total: facturesData.length,
        currentFacture: '',
        phase: 'factures'
      });

      let facturesImportees = 0;
      let lignesImportees = 0;
      let erreurs = 0;

      for (let index = 0; index < facturesData.length; index++) {
        const facture = facturesData[index];
        
        // Mettre à jour la progression
        setImportProgress(prev => ({
          ...prev,
          current: index + 1,
          currentFacture: facture.num_document || `Facture ${index + 1}`,
          phase: 'factures'
        }));

        try {
          // 1. Trouver l'entité
          const { data: entiteData } = await supabase
            .from('com_entite')
            .select('id')
            .eq('code', facture.entite)
            .eq('com_contrat_client_id', profil.com_contrat_client_id)
            .single();

          if (!entiteData) {
            console.warn(`Entité non trouvée: ${facture.entite}`);
            erreurs++;
            continue;
          }

          // 2. Trouver le tiers
          const { data: tiersData } = await supabase
            .from('com_tiers')
            .select('id')
            .eq('code', facture.code)
            .eq('com_contrat_client_id', profil.com_contrat_client_id)
            .single();

          if (!tiersData) {
            console.warn(`Tiers non trouvé: ${facture.code}`);
            erreurs++;
            continue;
          }

          // 3. Trouver le mode de paiement
          const { data: modePaiementData } = await supabase
            .from('bq_param_mode_paiement')
            .select('id')
            .eq('code', facture.mode_paiement)
            .eq('com_contrat_client_id', profil.com_contrat_client_id)
            .single();

          if (!modePaiementData) {
            console.warn(`Mode de paiement non trouvé: ${facture.mode_paiement}`);
            erreurs++;
            continue;
          }

          // 4. Convertir la date
          const dateFacture = convertDateFormat(facture.date_facture);
          if (!dateFacture) {
            console.warn(`Date invalide: ${facture.date_facture}`);
            erreurs++;
            continue;
          }

          // 5. Créer la facture
          const { data: factureCreee, error: factureError } = await supabase
            .from('fin_facture_achat')
            .insert({
              com_contrat_client_id: profil.com_contrat_client_id,
              id_entite: entiteData.id,
              code_user: profil.code_user || 'SYSTEM',
              num_document: facture.num_document || null,
              date_facture: dateFacture,
              montant_ht: facture.montant_ht,
              montant_tva: facture.montant_tva,
              montant_ttc: facture.montant_ttc,
              id_tiers: tiersData.id,
              id_mode_paiement: modePaiementData.id,
              commentaire: `Import historique ${format(new Date(), 'dd/MM/yyyy', { locale: fr })} ${profil.code_user}`
            })
            .select()
            .single();

          if (factureError) {
            console.error('Erreur création facture:', factureError);
            erreurs++;
            continue;
          }

          if (!factureCreee || !factureCreee.id) {
            console.error('Erreur: Facture créée mais ID manquant');
            erreurs++;
            continue;
          }

          console.log(`✅ Facture créée avec ID: ${factureCreee.id}`);

          // 6. Créer les lignes analytiques pour chaque champ non nul
          const champsAnalytiques = [
            { nom: 'divers', montant: facture.divers, sousCategorie: 'DIVERS' },
            { nom: 'vivre', montant: facture.vivre, sousCategorie: 'VIVRE' },
            { nom: 'bois', montant: facture.bois, sousCategorie: 'BOIS' },
            { nom: 'mnr', montant: facture.mnr, sousCategorie: 'MNR' },
            { nom: 'nrj', montant: facture.nrj, sousCategorie: 'NRJ' },
            { nom: 'net', montant: facture.net, sousCategorie: 'NET' }
          ];

          let lignesFactureCreees = 0;

          // Mettre à jour la phase pour les lignes
          setImportProgress(prev => ({
            ...prev,
            phase: 'lignes'
          }));

          for (const champ of champsAnalytiques) {
            if (champ.montant > 0) {
              console.log(`🔍 Recherche sous-catégorie "${champ.sousCategorie}" pour montant ${champ.montant}€,avec cette entite(facture.entite) '${facture.entite.toUpperCase()}' `, facture);
          
              // Trouver la sous-catégorie correspondante pour cette entité spécifique
              const { data: sousCategoriesData } = await supabase
                .from('fin_flux_sous_categorie')
                .select('id, id_categorie')
                .eq('com_contrat_client_id', profil.com_contrat_client_id)
                .eq('code', champ.sousCategorie) 
                .in('id_categorie', function(builder) {
                  builder
                    .select('id')
                    .from('fin_flux_categorie')
                    .where('code', '=', champ.sousCategorie)
                    .where(function() {
                      this.where('id_entite', '=', entiteData.id)
                          .orWhereNull('id_entite');
                    });
                });

              // Prendre la première sous-catégorie trouvée
              const sousCategorieData = sousCategoriesData?.[0];

              if (sousCategorieData) {
                console.log(`✅ Sous-catégorie trouvée: ${champ.sousCategorie} (ID: ${sousCategorieData.id}, Catégorie: ${sousCategorieData.id_categorie}) pour l'entité ${facture.entite}`);
                
                const ligneData = {
                  id_facture_achat: factureCreee.id,
                  com_contrat_client_id: profil.com_contrat_client_id,
                  code_user: profil.code_user,
                  id_categorie_flux: sousCategorieData.id_categorie,
                  id_sous_categorie_flux: sousCategorieData.id,
                  montant_ht: champ.montant,
                  commentaire: `Import ${champ.nom}`
                };
                
                console.log(`📝 Création ligne facture:`, ligneData);
                
                const { error: ligneError } = await supabase
                  .from('fin_facture_achat_ligne')
                  .insert(ligneData);
                
                if (ligneError) {
                  console.error(`❌ Erreur création ligne ${champ.nom}:`, ligneError);
                  console.error('Données de la ligne:', ligneData);
                } else {
                  console.log(`✅ Ligne ${champ.nom} créée avec succès`);
                  lignesFactureCreees++;
                  lignesImportees++;
                }
              } else {
                if (!sousCategoriesData || sousCategoriesData.length === 0) {
                  console.warn(`⚠️ Aucune sous-catégorie ${champ.sousCategorie} trouvée pour ${champ.nom}`);
                } else if (!sousCategorieData) {
                  console.warn(`⚠️ Sous-catégorie ${champ.sousCategorie} trouvée mais pas pour l'entité ${facture.entite}`);
                  console.warn(`Entités disponibles pour ${champ.sousCategorie}:`, 
                    sousCategoriesData.map(sc => sc.categorie?.entite?.code).filter(Boolean)
                  );
                } else {
                  console.warn(`⚠️ Problème inattendu avec la sous-catégorie ${champ.sousCategorie}`);
                }
              }
            }
          }

          console.log(`✅ Facture ${facture.num_document || 'sans numéro'} créée avec ${lignesFactureCreees} ligne(s) analytique(s)`);
          facturesImportees++;

        } catch (error) {
          console.error(`Erreur pour la facture ${facture.num_document || 'sans numéro'}:`, error);
          erreurs++;
        }
      }

      // Marquer l'import comme terminé
      setImportProgress(prev => ({
        ...prev,
        phase: 'completed'
      }));

      addToast({
        label: `Import terminé ! ${facturesImportees} facture(s) et ${lignesImportees} ligne(s) analytique(s) importée(s), ${erreurs} erreur(s)`,
        icon: 'Check',
        color: facturesImportees > 0 ? '#22c55e' : '#f59e0b'
      });

      // Réinitialiser après import réussi
      if (facturesImportees > 0) {
        setSelectedFile(null);
        setFacturesData([]);
        setTotals(null);
        setSimulationErrors([]);
        setImportProgress({
          current: 0,
          total: 0,
          currentFacture: '',
          phase: 'completed'
        });
        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      addToast({
        label: 'Erreur lors de l\'import des factures et lignes analytiques',
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `entite;code;num_document;date_facture;mode_paiement;montant_ht;montant_tva;montant_ttc;divers;vivre;bois;mnr;nrj;net
CDP;TIER001;FACT001;15/01/2024;CB;100,00;20,00;120,00;50,00;30,00;20,00;0,00;0,00;0,00
PQ;TIER002;FACT002;20/01/2024;ESPECES;250,50;50,10;300,60;100,00;80,00;70,50;0,00;0,00;0,00`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_import_factures.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Configuration des colonnes du tableau
  const columns: Column<FactureData>[] = [
    {
      label: 'ID Import',
      accessor: 'id_import',
      align: 'center',
      sortable: true
    },
    {
      label: 'Entité',
      accessor: 'entite',
      sortable: true
    },
    {
      label: 'Code Tiers',
      accessor: 'code',
      sortable: true
    },
    {
      label: 'N° Document',
      accessor: 'num_document',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      label: 'Date Facture',
      accessor: 'date_facture',
      sortable: true
    },
    {
      label: 'Mode Paiement',
      accessor: 'mode_paiement',
      sortable: true
    },
    {
      label: 'Montant HT',
      accessor: 'montant_ht',
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'Montant TVA',
      accessor: 'montant_tva',
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'Montant TTC',
      accessor: 'montant_ttc',
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'Divers',
      accessor: 'divers',
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'Vivre',
      accessor: 'vivre',
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'Bois',
      accessor: 'bois',
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'MNR',
      accessor: 'mnr',
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'NRJ',
      accessor: 'nrj',
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
    },
    {
      label: 'Net',
      accessor: 'net',
      align: 'right',
      render: (value) => `${value.toFixed(2)} €`
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
        title="Import de Factures"
        description="Importez jusqu'à 3 500 factures depuis un fichier CSV"
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
                Choisissez un fichier CSV contenant vos données de factures.
                <br />
                <span className="text-sm text-gray-500">
                  Format attendu : séparateur ";" et dates au format jj/mm/aaaa ou jj/mm/aa. Le numéro de document est optionnel.
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
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing || isImporting}
              />
              <Button
                label={isProcessing ? 'Analyse en cours...' : 'Choisir un fichier'}
                icon="Upload"
                color="var(--color-primary)"
                onClick={() => document.getElementById('csv-file-input')?.click()}
                disabled={isProcessing || isImporting}
              />
            </div>
          </div>

          {/* Tableau des données avec totaux */}
          {facturesData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Données importées ({facturesData.length} factures)
                </h3>
                <div className="flex gap-3">
                  <Button
                    label={isSimulating ? 'Simulation...' : 'Simuler l\'import'}
                    icon="Search"
                    color="#f59e0b"
                    onClick={handleSimulateImport}
                    disabled={isSimulating || isImporting}
                    size="sm"
                  />
                  <Button
                    label={isImporting ? 'Import en cours...' : 'Importer dans la base'}
                    icon="Database"
                    color="var(--color-primary)"
                    onClick={handleImportToDatabase}
                    disabled={isImporting || isSimulating}
                    size="sm"
                  />
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
                        {importProgress.current} / {importProgress.total} factures
                      </span>
                    </div>
                    
                    <ProgressBar
                      percent={(importProgress.current / importProgress.total) * 100}
                      color="#3b82f6"
                      size="md"
                      label={`${Math.round((importProgress.current / importProgress.total) * 100)}%`}
                    />
                    
                    <div className="text-sm text-blue-700">
                      {importProgress.phase === 'factures' && (
                        <span>📄 Traitement de la facture : {importProgress.currentFacture}</span>
                      )}
                      {importProgress.phase === 'lignes' && (
                        <span>📊 Création des lignes analytiques pour : {importProgress.currentFacture}</span>
                      )}
                      {importProgress.phase === 'completed' && (
                        <span>✅ Import terminé !</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <DataTable
                    columns={columns}
                    data={totals ? [
                      // Ligne de totaux en première position
                      {
                        id_import: 0,
                        entite: 'TOTAUX',
                        code: '-',
                        num_document: '-',
                        date_facture: '-',
                        mode_paiement: '-',
                        montant_ht: totals.montant_ht,
                        montant_tva: totals.montant_tva,
                        montant_ttc: totals.montant_ttc,
                        divers: totals.divers,
                        vivre: totals.vivre,
                        bois: totals.bois,
                        mnr: totals.mnr,
                        nrj: totals.nrj,
                        net: totals.net
                      } as FactureData,
                      ...facturesData
                    ] : facturesData}
                    actions={[]} // Pas d'actions pour cette table
                    defaultRowsPerPage={25}
                    rowsPerPageOptions={[25, 50, 100, 'all']}
                    emptyTitle="Aucune facture"
                    emptyMessage="Aucune facture n'a été trouvée dans le fichier."
                    className="min-w-max"
                    customRowClassName={(row, index) => 
                      index === 0 && totals ? 'bg-blue-50 font-semibold text-blue-900 border-b-2 border-blue-200' : ''
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Résultats de la simulation */}
          {simulationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 mb-3">
                    Erreurs détectées lors de la simulation ({simulationErrors.length})
                  </h3>
                  <div className="max-h-64 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {simulationErrors.map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ Corrigez ces erreurs avant de procéder à l'import réel
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informations sur l'import */}
          {facturesData.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 mb-2">Informations sur l'import</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Les entités (CDP, PQ) doivent exister dans votre base de données</li>
                    <li>• Les codes tiers (colonne 'code') doivent correspondre à des tiers existants</li>
                    <li>• Le numéro de document est optionnel (peut être vide)</li>
                    <li>• Les modes de paiement doivent être configurés dans vos paramètres bancaires</li>
                    <li>• Les sous-catégories analytiques (DIVERS, VIVRE, BOIS, MNR, NRJ, NET) doivent exister</li>
                    <li>• Votre code utilisateur ({profil?.code_user}) sera automatiquement ajouté</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default ImportFacture;