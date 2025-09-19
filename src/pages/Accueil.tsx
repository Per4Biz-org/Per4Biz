import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import { useProfil } from '../context/ProfilContext';
import { menuItemsAccueil } from '../config/menuConfig';
import MetricCard from '../components/dashboard/MetricCard';
import ModernLineChart from '../components/dashboard/ModernLineChart';
import TestCompanyRolesLinks from '../components/TestCompanyRolesLinks';
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  FilePlus2,
  Banknote,
  UserPlus,
  Users
} from 'lucide-react';

const Accueil: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { setMenuItems } = useMenu();
  const { profil, loading } = useProfil();

  useEffect(() => {
    setMenuItems(menuItemsAccueil);
  }, [setMenuItems]);

  const name = profil?.prenom || profil?.nom || 'Admin';
  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());

  const metrics = [
    {
      icon: BarChart3,
      label: t('dashboard.metrics.revenue.label'),
      value: 'EUR 1,2M',
      helper: t('dashboard.metrics.revenue.helper'),
      trendLabel: t('dashboard.metrics.revenue.trend'),
      trendDirection: 'up' as const,
      accent: 'blue' as const,
      trendData: [820, 860, 910, 975, 1040, 1120, 1200],
      chartColor: '#3b82f6',
      chartFill: 'rgba(59, 130, 246, 0.1)'
    },
    {
      icon: Banknote,
      label: t('dashboard.metrics.cashFlow.label'),
      value: 'EUR 320K',
      helper: t('dashboard.metrics.cashFlow.helper'),
      trendLabel: t('dashboard.metrics.cashFlow.trend'),
      trendDirection: 'neutral' as const,
      accent: 'green' as const,
      trendData: [210, 240, 260, 280, 300, 315, 320],
      chartColor: '#10b981',
      chartFill: 'rgba(16, 185, 129, 0.1)'
    },
    {
      icon: Users,
      label: t('dashboard.metrics.team.label'),
      value: '54',
      helper: t('dashboard.metrics.team.helper'),
      trendLabel: t('dashboard.metrics.team.trend'),
      trendDirection: 'up' as const,
      accent: 'purple' as const,
      trendData: [46, 47, 48, 49, 51, 53, 54],
      chartColor: '#8b5cf6',
      chartFill: 'rgba(139, 92, 246, 0.1)'
    }
  ];

  const performanceSeries = [
    {
      id: 'actual',
      label: t('dashboard.chart.series.actual'),
      color: '#2563eb',
      data: [820, 860, 910, 975, 1040, 1120, 1200]
    },
    {
      id: 'target',
      label: t('dashboard.chart.series.target'),
      color: '#5b9cf6',
      data: [800, 830, 880, 940, 1000, 1080, 1160]
    }
  ];

  const performanceCategories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

  const insights = [
    {
      icon: BarChart3,
      title: t('dashboard.insights.finance.title'),
      detail: t('dashboard.insights.finance.detail'),
      helper: t('dashboard.insights.finance.helper')
    },
    {
      icon: Building2,
      title: t('dashboard.insights.operations.title'),
      detail: t('dashboard.insights.operations.detail'),
      helper: t('dashboard.insights.operations.helper')
    },
    {
      icon: FileText,
      title: t('dashboard.insights.hr.title'),
      detail: t('dashboard.insights.hr.detail'),
      helper: t('dashboard.insights.hr.helper')
    }
  ];

  const upcomingItems = [
    {
      icon: ClipboardList,
      title: t('dashboard.upcoming.items.audit.title'),
      helper: t('dashboard.upcoming.items.audit.helper')
    },
    {
      icon: FileText,
      title: t('dashboard.upcoming.items.invoices.title'),
      helper: t('dashboard.upcoming.items.invoices.helper')
    }
  ];

  const quickActions = [
    {
      icon: FilePlus2,
      label: t('dashboard.actions.items.invoice'),
      to: '/finances/mes-factures'
    },
    {
      icon: Banknote,
      label: t('dashboard.actions.items.bank'),
      to: '/banques/ecriture-bancaire'
    },
    {
      icon: UserPlus,
      label: t('dashboard.actions.items.team'),
      to: '/employes/mes-employes'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="relative grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-200/80">
                  {loading ? t('dashboard.hero.today') : `${t('dashboard.hero.today')} - ${formattedDate}`}
                </p>
                <h1 className="text-xl font-bold text-white sm:text-2xl leading-tight">
                  {loading ? t('dashboard.hero.welcome') : t('dashboard.hero.welcomeUser', { name })}
                </h1>
                <p className="text-sm text-blue-100/90 leading-relaxed max-w-xl">{t('dashboard.hero.subtitle')}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      to={action.to}
                      className="group inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105"
                    >
                      <Icon size={14} className="transition-transform group-hover:scale-110" />
                      {action.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-200/80">
                    {t('dashboard.hero.overviewLabel')}
                  </span>
                  <p className="text-xl font-bold text-white">{t('dashboard.hero.overviewValue')}</p>
                  <p className="text-xs text-blue-200/80">{t('dashboard.hero.overviewHelper')}</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wider text-blue-200/80 mb-1">
                  {t('dashboard.insights.subtitle')}
                </p>
                <p className="text-xs text-blue-100/90 leading-relaxed">{t('dashboard.insights.title')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">{t('dashboard.metrics.title')}</h2>
            <p className="text-xs text-slate-600">{t('dashboard.metrics.subtitle')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm">
            <ModernLineChart
              title={t('dashboard.chart.title')}
              subtitle={t('dashboard.chart.subtitle')}
              categories={performanceCategories}
              series={performanceSeries}
            />
          </div>

          <div className="rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm">
            <div className="space-y-1 mb-4">
              <h2 className="text-base font-bold text-slate-900">{t('dashboard.upcoming.title')}</h2>
              <p className="text-xs text-slate-600">{t('dashboard.upcoming.subtitle')}</p>
            </div>
            <ul className="space-y-3">
              {upcomingItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="group flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:border-slate-200 hover:shadow-sm">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all group-hover:bg-blue-100">
                      <Icon size={16} />
                    </span>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-semibold text-slate-900 leading-tight">{item.title}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.helper}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">{t('dashboard.insights.title')}</h2>
            <p className="text-xs text-slate-600">{t('dashboard.insights.subtitle')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {insights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group flex h-full flex-col justify-between gap-3 rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50/50 p-4 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-all group-hover:bg-blue-200 group-hover:scale-105">
                      <Icon size={16} />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">{item.detail}</p>
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 border-t border-slate-200/50 pt-2">{item.helper}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 🏢 Seção de Teste - Company Roles */}
        <section className="pt-4">
          <TestCompanyRolesLinks />
        </section>
      </div>
    </div>
  );
};

export default Accueil;

