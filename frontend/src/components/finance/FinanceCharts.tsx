import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { StatsData } from '../../hooks/finance'

interface Props {
  stats: StatsData | null
  period: string
  onPeriodChange: (p: string) => void
}

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#2563eb']

const FinanceCharts: React.FC<Props> = ({ stats, period, onPeriodChange }) => {
  const data = stats?.category_data ?? []

  return (
    <div className="dashboard-charts">
      <div className="dashboard-period-switch">
        {(['week', 'month', 'year'] as const).map(p => (
          <button
            key={p}
            className={`dashboard-period-btn ${period === p ? 'active' : ''}`}
            onClick={() => onPeriodChange(p)}
          >
            {p === 'week' ? '周' : p === 'month' ? '月' : '年'}
          </button>
        ))}
      </div>

      {data.length > 0 ? (
        <div className="dashboard-pie-wrap">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={58}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="dashboard-pie-legend">
            {data.map((d, i) => {
              const total = data.reduce((s, x) => s + x.value, 0)
              return (
                <div key={i} className="dashboard-pie-legend-item">
                  <span className="dashboard-pie-dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="dashboard-pie-label">{d.name}</span>
                  <span className="dashboard-pie-pct">{total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'}%</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="chart-empty">暂无分类数据</div>
      )}
    </div>
  )
}

export default FinanceCharts
