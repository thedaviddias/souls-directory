/**
 * Centralized category configuration for souls.directory
 *
 * This is the single source of truth for all categories.
 * Used by: seed data, mock data, UI components, icon mapping
 */

import {
  BookOpen,
  Briefcase,
  Code2,
  Cog,
  Gamepad2,
  Heart,
  Lightbulb,
  type LucideIcon,
  MessageCircle,
  Palette,
  Search,
  Sparkles,
  Target,
  Theater,
  Users,
  Wrench,
} from 'lucide-react'

export interface CategoryDefinition {
  slug: string
  name: string
  description: string
  icon: LucideIcon
  color: string
  order: number
}

/**
 * All available categories - matches the souls/ folder structure plus additional useful categories
 */
export const CATEGORIES: CategoryDefinition[] = [
  // Core categories (matching souls/ folders)
  {
    slug: 'technical',
    name: 'Technical',
    description: 'Engineering, DevOps, security, and systems-focused minds',
    icon: Cog,
    color: '#00d9ff',
    order: 1,
  },
  {
    slug: 'professional',
    name: 'Professional',
    description: 'Business, productivity, and workplace assistants',
    icon: Briefcase,
    color: '#3ddc84',
    order: 2,
  },
  {
    slug: 'creative',
    name: 'Creative',
    description: 'Writers, artists, storytellers, and creative partners',
    icon: Palette,
    color: '#bf5af2',
    order: 3,
  },
  {
    slug: 'educational',
    name: 'Educational',
    description: 'Teachers, tutors, mentors, and learning guides',
    icon: BookOpen,
    color: '#ff6b6b',
    order: 4,
  },
  {
    slug: 'playful',
    name: 'Playful',
    description: 'Fun, quirky, and entertaining characters',
    icon: Theater,
    color: '#ffcc02',
    order: 5,
  },
  {
    slug: 'wellness',
    name: 'Wellness',
    description: 'Mindful, supportive, and empathetic companions',
    icon: Heart,
    color: '#10b981',
    order: 6,
  },
  // Additional useful categories
  {
    slug: 'coding',
    name: 'Coding',
    description: 'Developer assistants, debuggers, and code helpers',
    icon: Code2,
    color: '#00ff88',
    order: 7,
  },
  {
    slug: 'productivity',
    name: 'Productivity',
    description: 'Task management, planning, and workflow optimization',
    icon: Target,
    color: '#4ecdc4',
    order: 8,
  },
  {
    slug: 'research',
    name: 'Research',
    description: 'Analysis, fact-checking, and investigation specialists',
    icon: Search,
    color: '#f59e0b',
    order: 9,
  },
  {
    slug: 'communication',
    name: 'Communication',
    description: 'Writing, translation, and copywriting experts',
    icon: MessageCircle,
    color: '#8b5cf6',
    order: 10,
  },
  {
    slug: 'support',
    name: 'Support',
    description: 'Customer service, help desk, and user assistance',
    icon: Users,
    color: '#ec4899',
    order: 11,
  },
  {
    slug: 'tools',
    name: 'Tools',
    description: 'Utility-focused assistants for specific tasks',
    icon: Wrench,
    color: '#64748b',
    order: 12,
  },
  {
    slug: 'learning',
    name: 'Learning',
    description: 'Study buddies, exam prep, and knowledge guides',
    icon: Lightbulb,
    color: '#fbbf24',
    order: 13,
  },
  {
    slug: 'fun',
    name: 'Fun',
    description: 'Games, entertainment, and leisure companions',
    icon: Gamepad2,
    color: '#c44dff',
    order: 14,
  },
  {
    slug: 'experimental',
    name: 'Experimental',
    description: 'Novel, unconventional, and boundary-pushing souls',
    icon: Sparkles,
    color: '#06b6d4',
    order: 15,
  },
]

/**
 * Map of category slug to definition for quick lookup
 */
export const CATEGORY_MAP = new Map(CATEGORIES.map((cat) => [cat.slug, cat]))

/**
 * Get category definition by slug
 */
export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return CATEGORY_MAP.get(slug.toLowerCase())
}

/**
 * Get the icon component for a category slug
 */
export function getCategoryIcon(slug: string): LucideIcon {
  return getCategoryBySlug(slug)?.icon ?? Code2
}

/**
 * Get category color by slug
 */
export function getCategoryColor(slug: string): string {
  return getCategoryBySlug(slug)?.color ?? '#878787'
}

/**
 * Format categories for seed data (converts icon to slug string)
 */
export function getCategoriesForSeed() {
  return CATEGORIES.map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    description: cat.description,
    icon: cat.slug, // Store slug as icon identifier
    color: cat.color,
    order: cat.order,
  }))
}
