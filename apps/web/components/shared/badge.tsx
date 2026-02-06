import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'info' | 'warning' | 'error' | 'outline'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: ReactNode
  color?: string
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface text-text-secondary',
  success: 'bg-success/10 text-success',
  info: 'bg-text/10 text-text',
  warning: 'bg-text-secondary/10 text-text-secondary',
  error: 'bg-error/10 text-error',
  outline: 'bg-transparent border border-border text-text-secondary',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  color,
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors'

  // If custom color is provided, use it
  const colorStyles = color
    ? {
        backgroundColor: `${color}15`,
        color: color,
      }
    : undefined

  return (
    <span
      className={`${baseStyles} ${!color ? variantStyles[variant] : ''} ${sizeStyles[size]} ${className}`}
      style={colorStyles}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

// Specialized badge for model tags
interface ModelBadgeProps {
  model: string
  size?: BadgeSize
}

const modelColors: Record<string, string> = {
  'claude-sonnet-4': '#bf5af2',
  'claude-opus-4': '#9d4edd',
  'gpt-4o': '#10a37f',
  'gpt-4o-mini': '#74aa9c',
  'gemini-pro': '#4285f4',
}

export function ModelBadge({ model, size = 'sm' }: ModelBadgeProps) {
  const color = modelColors[model] || '#878787'
  const displayName = model
    .replace('claude-', '')
    .replace('gpt-', 'GPT-')
    .replace('gemini-', 'Gemini ')

  return (
    <Badge size={size} color={color} icon={<Check className="w-3 h-3" />}>
      {displayName}
    </Badge>
  )
}

// Tag badge
interface TagBadgeProps {
  tag: string
  onClick?: () => void
  size?: BadgeSize
}

export function TagBadge({ tag, onClick, size = 'sm' }: TagBadgeProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 rounded-full font-medium transition-colors bg-surface text-text-secondary hover:bg-elevated hover:text-text ${sizeStyles[size]}`}
      >
        #{tag}
      </button>
    )
  }

  return (
    <Badge variant="default" size={size}>
      #{tag}
    </Badge>
  )
}
