import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { pt, enUS, fr } from 'date-fns/locale';

interface FactureAchat {
  id: string;
  status: 'pendente' | 'pago' | 'vencido';
  montant_ttc: number;
  date_facture: string;
  data_pagamento: string | null;
}

interface InvoiceEvolutionChartProps {
  factures: FactureAchat[];
  monthsToShow?: number;
}

export const InvoiceEvolutionChart: React.FC<InvoiceEvolutionChartProps> = ({
  factures,
  monthsToShow = 6
}) => {
  const { t, i18n } = useTranslation();

  // Selecionar locale correto para date-fns
  const getLocale = () => {
    switch (i18n.language) {
      case 'pt': return pt;
      case 'en': return enUS;
      case 'fr': return fr;
      default: return pt;
    }
  };

  // Processar dados das faturas para gráfico
  const chartData = useMemo(() => {
    const now = new Date();
    const months: any[] = [];

    // Gerar últimos N meses
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = startOfMonth(subMonths(now, i));
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM yyyy', { locale: getLocale() });

      months.push({
        month: monthKey,
        label: monthLabel,
        pendente: 0,
        pago: 0,
        vencido: 0,
        total: 0
      });
    }

    // Agrupar faturas por mês
    factures.forEach(fatura => {
      const factureDate = parseISO(fatura.date_facture);
      const monthKey = format(factureDate, 'yyyy-MM');

      const monthData = months.find(m => m.month === monthKey);
      if (monthData) {
        monthData.total++;

        if (fatura.status === 'pendente') {
          monthData.pendente++;
        } else if (fatura.status === 'pago') {
          monthData.pago++;
        } else if (fatura.status === 'vencido') {
          monthData.vencido++;
        }
      }
    });

    return months;
  }, [factures, monthsToShow, i18n.language]);

  // Configuração das cores por status
  const colors = {
    pendente: '#f59e0b',
    pago: '#22c55e',
    vencido: '#ef4444'
  };

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((item: any) => (
              <div key={item.dataKey} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700">{item.name}:</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {item.value} {t('invoices.dashboard.kpiCount', 'faturas')}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-1 mt-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-gray-900">Total:</span>
                <span className="text-sm font-bold text-blue-600">
                  {total} {t('invoices.dashboard.kpiCount', 'faturas')}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-1 mb-6">
        <h3 className="text-base font-bold text-slate-900">
          {t('invoices.chart.title', 'Evolução de Faturas')}
        </h3>
        <p className="text-xs text-slate-600">
          {t('invoices.chart.subtitle', `Distribuição por status nos últimos ${monthsToShow} meses`)}
        </p>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              opacity={0.6}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => {
                const translations: any = {
                  'pendente': t('invoices.status.pending', 'Pendente'),
                  'pago': t('invoices.status.paid', 'Pago'),
                  'vencido': t('invoices.status.overdue', 'Vencido')
                };
                return translations[value] || value;
              }}
            />
            <Bar
              dataKey="pago"
              fill={colors.pago}
              radius={[4, 4, 0, 0]}
              name="pago"
            />
            <Bar
              dataKey="pendente"
              fill={colors.pendente}
              radius={[4, 4, 0, 0]}
              name="pendente"
            />
            <Bar
              dataKey="vencido"
              fill={colors.vencido}
              radius={[4, 4, 0, 0]}
              name="vencido"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};