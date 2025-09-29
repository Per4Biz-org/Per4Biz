
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr, enUS, pt } from 'date-fns/locale';


interface Entite {
  id: string;
  code: string;
  libelle: string;
}

interface CompteBancaire {
  id: string;
  code: string;
  nom: string;
  id_entite: string;
}

interface EcritureBancaire {
  id: string;
  data_lancamento: string;
  data_valor: string | null;
  descricao: string | null;
  valor: number;
  saldo: number | null;
  referencia_doc: string | null;
  created_at: string;
  compte: {
    code: string;
    nom: string;
  };
  entite: {
    code: string;
    libelle: string;
  };
}

const EcritureBancaire: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setMenuItems } = useMenu();


  // Função para obter o locale de data baseado no idioma actual
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'pt': return pt;
      case 'en': return enUS;
      case 'fr': return fr;
      default: return pt; // Fallback para português
    }
  };

  // Função para obter o locale de formatação de números/moeda
  const getNumberLocale = () => {
    switch (i18n.language) {
      case 'pt': return 'pt-PT';
      case 'en': return 'en-US';
      case 'fr': return 'fr-FR';
      default: return 'pt-PT'; // Fallback para português
    }
  };
  const { profil, loading: profilLoading } = useProfil();
  const [entites, setEntites] = useState<Entite[]>([]);
  const [comptesBancaires, setComptesBancaires] = useState<CompteBancaire[]>([]);
  const [filteredComptesBancaires, setFilteredComptesBancaires] = useState<CompteBancaire[]>([]);
  const [ecritures, setEcritures] = useState<EcritureBancaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [filters, setFilters] = useState({
    entite: '',
    compte: '',
    dateDebut: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'), // Primeiro dia do mês actual
    dateFin: format(new Date(), 'yyyy-MM-dd') // Hoje
  });

  useEffect(() => {
    setMenuItems(menuItemsGestionBancaire);
  }, [setMenuItems]);

  // Carregamento das entidades e contas bancárias
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!profil?.com_contrat_client_id) return;

      try {
        // Carregar as entidades
        const { data: entitesData, error: entitesError } = await supabase
          .from('com_entite')
          .select('id, code, libelle')
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('libelle');

        if (entitesError) throw entitesError;
        setEntites(entitesData || []);

        // Carregar as contas bancárias
        const { data: comptesData, error: comptesError } = await supabase
          .from('bq_compte_bancaire')
          .select('id, code, nom, id_entite')
          .eq('actif', true)
          .eq('com_contrat_client_id', profil.com_contrat_client_id)
          .order('nom');

        if (comptesError) throw comptesError;
        setComptesBancaires(comptesData || []);
        setFilteredComptesBancaires(comptesData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données de référence:', error);
        addToast({
          label: t('bankEntries.errors.fetchReferenceDataError'),
          icon: 'AlertTriangle',
          color: '#ef4444'
        });
      }
    };

    if (!profilLoading) {
      fetchReferenceData();
    }
  }, [profilLoading, profil?.com_contrat_client_id]);

  // Filtrar as contas bancárias com base na entidade seleccionada
  useEffect(() => {
    if (filters.entite) {
      // Encontrar o ID da entidade seleccionada
      const entiteSelectionnee = entites.find(e => e.code === filters.entite);
      
      if (entiteSelectionnee) {
        // Filtrar as contas bancárias pelo ID da entidade
        const comptesFiltres = comptesBancaires.filter(compte => 
          compte.id_entite === entiteSelectionnee.id
        );
        setFilteredComptesBancaires(comptesFiltres);
        
        // Se a conta actualmente seleccionada não pertence a esta entidade, reinicializar
        if (filters.compte && !comptesFiltres.some(c => c.code === filters.compte)) {
          setFilters(prev => ({
            ...prev,
            compte: ''
          }));
        }
      }
    } else {
      // Se nenhuma entidade estiver seleccionada, mostrar todas as contas
      setFilteredComptesBancaires(comptesBancaires);
    }
  }, [filters.entite, entites, comptesBancaires]);

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

  const handleFilterChange = (updatedFilters: { [key: string]: any }) => {
    setFilters(updatedFilters);
  };

  const fetchEcritures = async () => {
    if (!profil?.com_contrat_client_id) {
      addToast({
        label: t('bankEntries.errors.incompleteUserProfile'),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
      return;
    }

    // Verificar se os filtros obrigatórios estão preenchidos
    if (!filters.dateDebut || !filters.dateFin) {
      addToast({
        label: t('bankEntries.errors.selectPeriodError'),
        icon: 'AlertTriangle',
        color: '#f59e0b'
      });
      return;
    }
    
    setLoading(true);
    try {
      let query = supabase
        .from('bq_ecriture_bancaire')
        .select(`
          id,
          data_lancamento,
          data_valor,
          source_import_id,
          descricao,
          valor,
          saldo,
          referencia_doc,
          created_at,
          id_compte,
          compte:bq_compte_bancaire!id_compte (
            id,
            code,
            nom,
            id_entite,
            entite:com_entite!id_entite (
              id,
              code,
              libelle
            )
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .gte('data_lancamento', filters.dateDebut) 
        .lte('data_lancamento', filters.dateFin);

      // Adicionar o filtro na entidade apenas se um valor estiver seleccionado
      if (filters.entite) {
        // Encontrar o ID da entidade seleccionada
        const entiteSelectionnee = entites.find(e => e.code === filters.entite);
        if (entiteSelectionnee) {
          // Filtrar pelo ID da entidade directamente na tabela bq_compte_bancaire
          query = query.eq('bq_compte_bancaire.id_entite', entiteSelectionnee.id);
        }
      }

      // Adicionar o filtro na conta bancária apenas se um valor estiver seleccionado
      if (filters.compte) {
        // Encontrar o ID da conta seleccionada
        const compteSelectionne = comptesBancaires.find(c => c.code === filters.compte);
        if (compteSelectionne) {
          // Filtrar pelo ID da conta directamente
          query = query.eq('id_compte', compteSelectionne.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformação dos dados para facilitar a exibição
      let formattedData = data?.map(item => ({
        id: item.id,
        data_lancamento: item.data_lancamento,
        data_valor: item.data_valor,
        descricao: item.descricao,
        source_import_id: item.source_import_id,
        valor: item.valor,
        saldo: item.saldo,
        referencia_doc: item.referencia_doc,
        created_at: item.created_at,
        compte: item.compte || { code: t('bankEntries.defaultValues.undefinedAccount'), nom: t('bankEntries.defaultValues.undefinedAccount'), id_entite: null },
        entite: item.compte?.entite || { code: t('bankEntries.defaultValues.undefinedEntity'), libelle: t('bankEntries.defaultValues.undefinedEntity'), id: null }
      })) || [];

      // Ordenação no lado cliente conforme os critérios solicitados
      formattedData.sort((a, b) => {
        // 1. Ordenação por code_entite (ordem crescente)
        if (a.entite.code !== b.entite.code) {
          return a.entite.code.localeCompare(b.entite.code);
        }
        
        // 2. Ordenação por code_compte (ordem crescente)
        if (a.compte.code !== b.compte.code) {
          return a.compte.code.localeCompare(b.compte.code);
        }
        
        // 3. Ordenação por data_lancamento (ordem crescente)
        if (a.data_lancamento !== b.data_lancamento) {
          return new Date(a.data_lancamento).getTime() - new Date(b.data_lancamento).getTime();
        }
        
        // 4. Ordenação por source_import_id (ordem crescente)
        if (a.source_import_id !== b.source_import_id) {
          // Gerir o caso onde source_import_id pode ser null
          if (a.source_import_id === null) return 1;
          if (b.source_import_id === null) return -1;
          return a.source_import_id - b.source_import_id;
        }
        
        return 0;
      });

      setEcritures(formattedData);
      setDataLoaded(true);

      addToast({
        label: t('bankEntries.entriesFound', { count: formattedData.length }),
        icon: 'Check',
        color: '#22c55e'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des écritures bancaires:', error);
      addToast({
        label: t('bankEntries.errors.fetchEntriesError'),
        icon: 'AlertTriangle',
        color: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  // Configuração dos filtros
  const filterConfigs = [
    {
      name: 'entite',
      label: t('bankEntries.filters.entity'),
      type: 'select' as const,
      options: entites.map(entite => ({
        id: entite.id,
        code: entite.code,
        libelle: entite.libelle
      })),
      isEntityOption: true
    },
    {
      name: 'compte',
      label: t('bankEntries.filters.bankAccount'),
      type: 'select' as const,
      options: filteredComptesBancaires.map(compte => ({
        id: compte.id,
        code: compte.code,
        libelle: compte.nom
      })),
      isEntityOption: true
    },
    {
      name: 'dateDebut',
      label: t('bankEntries.filters.startDate'),
      type: 'date' as const
    },
    {
      name: 'dateFin',
      label: t('bankEntries.filters.endDate'),
      type: 'date' as const
    }
  ];

  // Colunas para a tabela dos lançamentos
  const columns: Column<EcritureBancaire>[] = [
    {
      label: t('bankEntries.columns.entity'),
      accessor: 'entite',
      render: (value) => `${value.code} - ${value.libelle}`
    },
    {
      label: t('bankEntries.columns.account'),
      accessor: 'compte',
      render: (value) => `${value.code} - ${value.nom}`
    },
    {
      label: t('bankEntries.columns.operationDate'),
      accessor: 'data_lancamento',
      render: (value) => format(new Date(value), 'dd/MM/yyyy', { locale: getDateLocale() }),
      width: '120px'
    },
    {
      label: t('bankEntries.columns.valueDate'),
      accessor: 'data_valor',
      render: (value) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: getDateLocale() }) : '-',
      width: '120px'
    },
    {
      label: t('bankEntries.columns.description'),
      accessor: 'descricao',
      render: (value) => value || '-'
    },
    {
      label: t('bankEntries.columns.amount'),
      accessor: 'valor',
      align: 'right',
      width: '120px',
      render: (value) => {
        const formattedValue = new Intl.NumberFormat(getNumberLocale(), {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
        return (
          <span className={value < 0 ? 'text-red-600' : 'text-green-600'}>
            {formattedValue}
          </span>
        );
      }
    },
    {
      label: t('bankEntries.columns.balance'),
      accessor: 'saldo',
      align: 'right',
      width: '120px',
      render: (value) => {
        if (value === null) return '-';
        return new Intl.NumberFormat(getNumberLocale(), {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      }
    },
    {
      label: t('bankEntries.columns.reference'),
      accessor: 'referencia_doc',
      render: (value) => value || '-',
      width: '120px'
    },
    {
      label: t('bankEntries.columns.sourceId'),
      accessor: 'source_import_id',
      width: '100px',
      align: 'center',
      render: (value) => value || '-'
    }
  ];

  return (
    <div className={styles.container}>
      <PageSection
        title={t('bankEntries.title') || 'Movimentos Bancários'}
        description={t('bankEntries.description') || 'Consulte e gira os seus lançamentos bancários'}
        className={styles.header}
      >
        {/* Secção dos filtros */}
        <div className="mb-6">
          <FilterSection
            filters={filterConfigs}
            values={filters}
            onChange={handleFilterChange}
            className="mb-4"
          />
          
          <div className="flex justify-end">
            <Button
              label={loading ? t('bankEntries.loading') : t('bankEntries.showEntries')}
              icon="Search"
              color="var(--color-primary)"
              onClick={fetchEcritures}
              disabled={loading}
            />
          </div>
        </div>

        {/* Exibição dos lançamentos apenas após clicar em "Mostrar" */}
        {dataLoaded && (
          <div>
            <div className="text-sm text-gray-600 mb-4">
              {t('bankEntries.entriesFound', { count: ecritures.length })}
            </div>

            <DataTable
              columns={columns}
              data={ecritures}
              defaultRowsPerPage={25}
              rowsPerPageOptions={[25, 50, 100, 'all']}
              emptyTitle={t('bankEntries.noEntries')}
              emptyMessage={loading ? t('bankEntries.loadingEntries') : t('bankEntries.noEntriesMessage')}
            />
          </div>
        )}

        <ToastContainer toasts={toasts} onClose={closeToast} />
      </PageSection>
    </div>
  );
};

export default EcritureBancaire;