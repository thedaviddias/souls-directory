/**
 * Model badge - displays a single LLM model name (e.g. Claude Sonnet 4.5, GPT-4o).
 */

function formatModelLabel(model: string): string {
  const normalized = model.toLowerCase().replace(/_/g, '-')
  if (normalized.startsWith('claude')) {
    return normalized.replace(/^claude-/, 'Claude ').replace(/-/g, ' ')
  }
  if (normalized.startsWith('gpt')) {
    return normalized.replace(/^gpt-/, 'GPT-').replace(/-/g, ' ')
  }
  if (normalized.startsWith('gemini')) {
    return normalized.replace(/^gemini-/, 'Gemini ').replace(/-/g, ' ')
  }
  if (normalized.startsWith('llama')) {
    return normalized.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
  if (normalized.startsWith('deepseek')) {
    return normalized
      .replace(/^deepseek-/, 'DeepSeek ')
      .replace(/-/g, ' ')
      .toUpperCase()
  }
  if (normalized.startsWith('minimax')) {
    return normalized
      .replace(/^minimax-/, 'MiniMax ')
      .replace(/-/g, ' ')
      .toUpperCase()
  }
  if (normalized.startsWith('kimi')) {
    return normalized
      .replace(/^kimi-/, 'Kimi ')
      .replace(/-/g, ' ')
      .toUpperCase()
  }
  if (normalized.startsWith('grok')) {
    return normalized.replace(/^grok-/, 'Grok ').replace(/-/g, ' ')
  }
  return model
}

interface ModelBadgeProps {
  model: string
  className?: string
}

export function ModelBadge({ model, className = '' }: ModelBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border border-border bg-elevated px-2 py-0.5 text-xs font-mono text-text-secondary ${className}`}
      title={model}
    >
      {formatModelLabel(model)}
    </span>
  )
}

interface ModelBadgesProps {
  models: string[]
  className?: string
}

export function ModelBadges({ models, className = '' }: ModelBadgesProps) {
  if (!models?.length) return null
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {models.slice(0, 5).map((m) => (
        <ModelBadge key={m} model={m} />
      ))}
      {models.length > 5 && (
        <span className="text-xs text-text-muted font-mono">+{models.length - 5}</span>
      )}
    </div>
  )
}
