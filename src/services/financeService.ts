// ===============================================
// 💰 Serviço Financeiro - Dados Reais do Banco
// Conecta com Supabase para buscar métricas financeiras
// ===============================================

import { supabase } from '../lib/supabase';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  invoiceCount: number;
  pendingInvoices: number;
  netProfit: number;
  profitMargin: number;
}

export interface MonthlyData {
  month: string;
  year: number;
  receitas: number;
  despesas: number;
  monthName: string;
}

export interface FinancialDashboardData {
  metrics: FinancialMetrics;
  monthlyData: MonthlyData[];
  recentInvoices: any[];
}

class FinanceService {
  // Busca métricas do mês atual
  async getCurrentMonthMetrics(companyId: string, entiteId?: string): Promise<FinancialMetrics> {
    const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    try {
      // Buscar total de receitas (ca_reel - chiffre d'affaires)
      console.log(`🔍 Buscando receitas na tabela ca_reel para período: ${startDate} a ${endDate}${entiteId ? ` (entidade: ${entiteId})` : ''}`);
      let revenueQuery = supabase
        .from('ca_reel')
        .select('montant_ttc, date_vente')
        .eq('com_contrat_client_id', companyId)
        .gte('date_vente', startDate)
        .lte('date_vente', endDate);

      // Filtrar por entidade se especificada
      if (entiteId) {
        revenueQuery = revenueQuery.eq('id_entite', entiteId);
      }

      const { data: revenueData, error: revenueError } = await revenueQuery;

      if (revenueError) {
        console.error('❌ Erro ao buscar receitas:', revenueError);
        throw revenueError;
      }

      console.log(`📊 Dados de receitas encontrados:`, {
        registros: revenueData?.length || 0,
        dados: revenueData?.slice(0, 3) // Mostra só os 3 primeiros
      });

      // Se não encontrou receitas no mês atual, vamos verificar se existe algum dado na tabela
      if (!revenueData || revenueData.length === 0) {
        console.log('🔍 Nenhuma receita encontrada no mês atual. Verificando se existem dados na tabela ca_reel...');
        const { data: anyRevenueData, error: anyRevenueError } = await supabase
          .from('ca_reel')
          .select('date_vente, montant_ttc')
          .eq('com_contrat_client_id', companyId)
          .limit(5);

        console.log(`🗃️ Dados gerais na tabela ca_reel:`, {
          registros: anyRevenueData?.length || 0,
          amostras: anyRevenueData
        });
      }

      // Buscar total de despesas (fin_facture_achat - facturas de compra)
      let expenseQuery = supabase
        .from('fin_facture_achat')
        .select('montant_ttc')
        .eq('com_contrat_client_id', companyId)
        .gte('date_facture', startDate)
        .lte('date_facture', endDate);

      // Filtrar por entidade se especificada
      if (entiteId) {
        expenseQuery = expenseQuery.eq('id_entite', entiteId);
      }

      const { data: expenseData, error: expenseError } = await expenseQuery;

      if (expenseError) throw expenseError;

      // Contar faturas totais do mês
      let countQuery = supabase
        .from('fin_facture_achat')
        .select('*', { count: 'exact', head: true })
        .eq('com_contrat_client_id', companyId)
        .gte('date_facture', startDate)
        .lte('date_facture', endDate);

      // Filtrar por entidade se especificada
      if (entiteId) {
        countQuery = countQuery.eq('id_entite', entiteId);
      }

      const { count: invoiceCount, error: countError } = await countQuery;

      if (countError) throw countError;

      // Para faturas pendentes, não há campo específico na estrutura atual
      // Vamos usar uma estimativa baseada na data de criação recente
      const { count: pendingCount, error: pendingError } = await supabase
        .from('fin_facture_achat')
        .select('*', { count: 'exact', head: true })
        .eq('com_contrat_client_id', companyId)
        .gte('created_at', format(subMonths(new Date(), 1), 'yyyy-MM-dd'));

      if (pendingError) console.warn('Erro ao contar faturas pendentes:', pendingError);

      // Calcular totais
      const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.montant_ttc || 0), 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, item) => sum + (item.montant_ttc || 0), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      return {
        totalRevenue,
        totalExpenses,
        invoiceCount: invoiceCount || 0,
        pendingInvoices: Math.min(pendingCount || 0, invoiceCount || 0), // Não pode ser maior que o total
        netProfit,
        profitMargin
      };

    } catch (error) {
      console.error('Erro ao buscar métricas financeiras:', error);
      // Retornar dados zerados em caso de erro
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        invoiceCount: 0,
        pendingInvoices: 0,
        netProfit: 0,
        profitMargin: 0
      };
    }
  }

  // Busca dados dos últimos 6 meses
  async getMonthlyData(companyId: string, entiteId?: string): Promise<MonthlyData[]> {
    const months: MonthlyData[] = [];

    try {
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        const monthName = format(date, 'MMM');
        const year = date.getFullYear();

        // Buscar receitas do mês (ca_reel)
        let revenueQuery = supabase
          .from('ca_reel')
          .select('montant_ttc, date_vente')
          .eq('com_contrat_client_id', companyId)
          .gte('date_vente', startDate)
          .lte('date_vente', endDate);

        if (entiteId) {
          revenueQuery = revenueQuery.eq('id_entite', entiteId);
        }

        const { data: revenueData, error: revenueError } = await revenueQuery;

        if (i === 0) { // Log apenas no primeiro mês para não poluir
          console.log(`📅 Mês ${monthName}/${year}: ${revenueData?.length || 0} receitas encontradas${entiteId ? ` (entidade filtrada)` : ''}`);
        }

        // Buscar despesas do mês (fin_facture_achat)
        let expenseQuery = supabase
          .from('fin_facture_achat')
          .select('montant_ttc')
          .eq('com_contrat_client_id', companyId)
          .gte('date_facture', startDate)
          .lte('date_facture', endDate);

        if (entiteId) {
          expenseQuery = expenseQuery.eq('id_entite', entiteId);
        }

        const { data: expenseData, error: expenseError } = await expenseQuery;

        if (revenueError || expenseError) {
          console.error('Erro ao buscar dados mensais:', revenueError || expenseError);
          continue;
        }

        const receitas = revenueData?.reduce((sum, item) => sum + (item.montant_ttc || 0), 0) || 0;
        const despesas = expenseData?.reduce((sum, item) => sum + (item.montant_ttc || 0), 0) || 0;

        months.push({
          month: format(date, 'yyyy-MM'),
          year,
          receitas,
          despesas,
          monthName
        });
      }

      return months;
    } catch (error) {
      console.error('Erro ao buscar dados mensais:', error);
      return [];
    }
  }

  // Busca faturas recentes
  async getRecentInvoices(companyId: string, entiteId?: string, limit: number = 5) {
    try {
      let query = supabase
        .from('fin_facture_achat')
        .select(`
          id,
          num_document,
          date_facture,
          montant_ttc,
          entite:id_entite (
            code,
            libelle
          ),
          tiers:id_tiers (
            code,
            nom
          )
        `)
        .eq('com_contrat_client_id', companyId);

      // Filtrar por entidade se especificada
      if (entiteId) {
        query = query.eq('id_entite', entiteId);
      }

      const { data, error } = await query
        .order('date_facture', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar faturas recentes:', error);
      return [];
    }
  }

  // Função principal que busca todos os dados do dashboard
  async getDashboardData(companyId: string, entiteId?: string): Promise<FinancialDashboardData> {
    try {
      const [metrics, monthlyData, recentInvoices] = await Promise.all([
        this.getCurrentMonthMetrics(companyId, entiteId),
        this.getMonthlyData(companyId, entiteId),
        this.getRecentInvoices(companyId, entiteId)
      ]);

      return {
        metrics,
        monthlyData,
        recentInvoices
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard financeiro:', error);
      throw error;
    }
  }
}

export const financeService = new FinanceService();