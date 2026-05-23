/*
  Finance Charts: 分类饼图 + 月度趋势柱状图 + 周期切换.
*/
import React from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { StatsData } from '../../hooks/finance'
import { useLocale } from '../../i18n'

const PIE_COLORS = ['#4a7c59', '#e07050', '#6b8cce', '#c4943a', '#9c7cb0', '#5b9e9e', '#d4876b', '#7c8c6e']

interface Props {
  stats: StatsData | null
  period: string
  onPeriodChange: (p: string) => void
}

const FinanceCharts: React.FC<Props> = ({ stats, period, onPeriodChange }) => {
  const { t } = useLocale()
  const periods = [
    { key: 'week', label: t('finance.week') },
    { key: 'month', label: t('finance.month') },
    { key: 'year', label: t('finance.year') },
  ]

  const hasCategoryData = stats && stats.category_data.length > 0
  const hasTrendData = stats && stats.trend_data.length > 0

  if (!hasCategoryData && !hasTrendData) {
    return (
      <div className="finance-charts">
        <div className="finance-chart-card finance-chart-empty">
          <p>{t('finance.noData')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="finance-charts">
      <div className="finance-chart-header">
        <h3 className="finance-charts-title">{t('finance.charts')}</h3>
        <div className="finance-period-switch">
          {periods.map((p) => (
            <button
              key={p.key}
              className={`finance-period-btn ${period === p.key ? 'active' : ''}`}
              onClick={() => onPeriodChange(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="finance-chart-grid">
        <div className="finance-chart-card">
          <h4 className="finance-chart-title">{t('finance.categoryPie')}</h4>
          {hasCategoryData ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.category_data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {stats.category_data.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : String(v || ''))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-empty">
              {t('finance.noTransactions')}
            </p>
          )}
        </div>

        <div className="finance-chart-card">
          <h4 className="finance-chart-title">{t('finance.monthlyTrend')}</h4>
          {hasTrendData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.trend_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : String(v || ''))} />
                <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-empty">
              {t('finance.noTransactions')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FinanceCharts
