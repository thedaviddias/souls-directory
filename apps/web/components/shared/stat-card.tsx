import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  delay?: number
}

export function StatCard({ label, value, icon, trend, delay = 0 }: StatCardProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-text-muted',
  }

  const TrendIcons = {
    up: ArrowUp,
    down: ArrowDown,
    neutral: ArrowRight,
  }

  return (
    <div
      className="bg-surface border border-border rounded-lg p-4 animate-slide-up"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-text-muted">{label}</span>
        {icon && <span className="text-base text-text-muted">{icon}</span>}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-2xl font-mono text-text">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>

        {trend && (
          <span
            className={`text-xs font-mono ${trendColors[trend.direction]} mb-1 flex items-center gap-0.5`}
          >
            {(() => {
              const TrendIcon = TrendIcons[trend.direction]
              return <TrendIcon className="w-3 h-3" />
            })()}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  )
}

interface StatsGridProps {
  stats: StatCardProps[]
  columns?: 2 | 3 | 4
}

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {stats.map((stat, index) => (
        <StatCard key={stat.label} {...stat} delay={index * 0.1} />
      ))}
    </div>
  )
}
