// ===============================================
// 👥 Serviço RH - Dados Reais do Banco
// Conecta com Supabase para buscar dados de funcionários
// ===============================================

import { supabase } from '../lib/supabase';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface HRMetrics {
  totalEmployees: number;
  activeEmployees: number;
  monthlyBudget: number;
  averageSalary: number;
}

export interface MonthlyHRData {
  month: string;
  year: number;
  orcamento: number;
  funcionarios: number;
  monthName: string;
}

export interface HRDashboardData {
  metrics: HRMetrics;
  monthlyData: MonthlyHRData[];
}

class HRService {
  // Busca métricas atuais de RH
  async getCurrentHRMetrics(companyId: string, entiteId?: string): Promise<HRMetrics> {
    try {
      console.log(`👥 Buscando dados de funcionários para company: ${companyId}${entiteId ? ` (entidade: ${entiteId})` : ''}`);

      // Buscar funcionários ativos
      let personnelQuery = supabase
        .from('rh_personnel')
        .select('id, actif')
        .eq('com_contrat_client_id', companyId);

      // Filtrar por entidade se especificada (assumindo que existe campo id_entite)
      if (entiteId) {
        personnelQuery = personnelQuery.eq('id_entite', entiteId);
      }

      const { data: personnelData, error: personnelError } = await personnelQuery;

      if (personnelError) throw personnelError;

      // Calcular totais
      const totalEmployees = personnelData?.length || 0;
      const activeEmployees = personnelData?.filter(p => p.actif).length || 0;

      // Buscar dados financeiros de RH (histórico de contratos)
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      let contractQuery = supabase
        .from('rh_historique_contrat')
        .select('salaire_brut')
        .eq('com_contrat_client_id', companyId)
        .gte('date_debut', startDate)
        .lte('date_fin', endDate);

      if (entiteId) {
        contractQuery = contractQuery.eq('id_entite', entiteId);
      }

      const { data: contractData, error: contractError } = await contractQuery;

      if (contractError) {
        console.warn('⚠️ Erro ao buscar contratos, usando estimativa:', contractError);
      }

      // Calcular salário médio e orçamento mensal
      const salaries = contractData?.map(c => c.salaire_brut).filter(s => s && s > 0) || [];
      const averageSalary = salaries.length > 0
        ? salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length
        : activeEmployees * 1500; // Estimativa se não houver dados

      const monthlyBudget = averageSalary * activeEmployees;

      console.log(`✅ Métricas RH calculadas:`, {
        totalFuncionarios: totalEmployees,
        ativos: activeEmployees,
        salarioMedio: averageSalary,
        orcamentoMensal: monthlyBudget
      });

      return {
        totalEmployees,
        activeEmployees,
        monthlyBudget,
        averageSalary
      };

    } catch (error) {
      console.error('Erro ao buscar métricas de RH:', error);
      // Retornar dados zerados em caso de erro
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        monthlyBudget: 0,
        averageSalary: 0
      };
    }
  }

  // Busca dados dos últimos 6 meses
  async getMonthlyHRData(companyId: string, entiteId?: string): Promise<MonthlyHRData[]> {
    const months: MonthlyHRData[] = [];

    try {
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        const monthName = format(date, 'MMM');
        const year = date.getFullYear();

        // Buscar funcionários ativos no período
        let personnelQuery = supabase
          .from('rh_personnel')
          .select('id, actif, created_at')
          .eq('com_contrat_client_id', companyId)
          .lte('created_at', endDate);

        if (entiteId) {
          personnelQuery = personnelQuery.eq('id_entite', entiteId);
        }

        const { data: personnelData, error: personnelError } = await personnelQuery;

        if (personnelError) {
          console.error('Erro ao buscar funcionários do mês:', personnelError);
          continue;
        }

        const funcionarios = personnelData?.filter(p => p.actif).length || 0;

        // Buscar contratos do período para calcular orçamento
        let contractQuery = supabase
          .from('rh_historique_contrat')
          .select('salaire_brut')
          .eq('com_contrat_client_id', companyId)
          .gte('date_debut', startDate)
          .lte('date_debut', endDate);

        if (entiteId) {
          contractQuery = contractQuery.eq('id_entite', entiteId);
        }

        const { data: contractData } = await contractQuery;

        // Calcular orçamento do mês
        const salaries = contractData?.map(c => c.salaire_brut).filter(s => s && s > 0) || [];
        const averageSalary = salaries.length > 0
          ? salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length
          : 1500; // Estimativa

        const orcamento = averageSalary * funcionarios;

        months.push({
          month: format(date, 'yyyy-MM'),
          year,
          orcamento,
          funcionarios,
          monthName
        });
      }

      return months;
    } catch (error) {
      console.error('Erro ao buscar dados mensais de RH:', error);
      return [];
    }
  }

  // Função principal que busca todos os dados do dashboard
  async getHRDashboardData(companyId: string, entiteId?: string): Promise<HRDashboardData> {
    try {
      const [metrics, monthlyData] = await Promise.all([
        this.getCurrentHRMetrics(companyId, entiteId),
        this.getMonthlyHRData(companyId, entiteId)
      ]);

      return {
        metrics,
        monthlyData
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard de RH:', error);
      throw error;
    }
  }
}

export const hrService = new HRService();