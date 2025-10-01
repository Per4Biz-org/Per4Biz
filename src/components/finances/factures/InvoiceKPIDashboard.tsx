import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface FactureAchat {
  id: string;
  status: 'pendente' | 'pago' | 'vencido';
  montant_ttc: number;
  data_vencimento: string | null;
  data_pagamento: string | null;
  date_facture: string;
}

interface InvoiceKPIDashboardProps {
  factures: FactureAchat[];
}

export const InvoiceKPIDashboard: React.FC<InvoiceKPIDashboardProps> = ({ factures }) => {
  const { t } = useTranslation();

  // Calcular KPIs
  const totalPendente = factures
    .filter(f => f.status === 'pendente')
    .reduce((sum, f) => sum + f.montant_ttc, 0);

  const faturasVencidas = factures.filter(f => f.status === 'vencido');
  const totalVencido = faturasVencidas.reduce((sum, f) => sum + f.montant_ttc, 0);

  const faturasPagedMes = factures.filter(f => {
    if (f.status !== 'pago') return false;
    if (!f.data_pagamento) return false;

    const dataPagamento = new Date(f.data_pagamento);
    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();

    return dataPagamento.getMonth() === mesAtual && dataPagamento.getFullYear() === anoAtual;
  });

  const kpiData = [
    {
      id: 'pending',
      label: t('invoices.dashboard.totalPending'),
      value: `${totalPendente.toFixed(2)} ${t('invoices.dashboard.kpiValue')}`,
      count: factures.filter(f => f.status === 'pendente').length,
      icon: TrendingUp,
      color: '#f59e0b',
      bg: '#fef3c7'
    },
    {
      id: 'overdue',
      label: t('invoices.dashboard.overdueInvoices'),
      value: `${totalVencido.toFixed(2)} ${t('invoices.dashboard.kpiValue')}`,
      count: faturasVencidas.length,
      icon: AlertCircle,
      color: '#ef4444',
      bg: '#fee2e2'
    },
    {
      id: 'paid',
      label: t('invoices.dashboard.paidThisMonth'),
      value: `${faturasPagedMes.length} ${t('invoices.dashboard.kpiCount')}`,
      count: faturasPagedMes.length,
      icon: CheckCircle,
      color: '#22c55e',
      bg: '#dcfce7'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {kpiData.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                {kpi.id !== 'paid' && (
                  <p className="text-sm text-gray-500 mt-1">
                    {kpi.count} {t('invoices.dashboard.kpiCount')}
                  </p>
                )}
              </div>
              <div
                className="rounded-full p-3"
                style={{ backgroundColor: kpi.bg }}
              >
                <Icon size={24} style={{ color: kpi.color }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};