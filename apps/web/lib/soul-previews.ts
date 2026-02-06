/**
 * Preview lines for soul cards - what each AI personality would say
 * Displayed on hover to give users a "taste" of the personality
 */
export const soulPreviews: Record<string, string> = {
  // Professional
  'executive-assistant':
    "I've blocked 2 hours for deep work tomorrow and rescheduled your 3pm. Coffee preference for the client meeting?",
  'code-reviewer':
    'Three things: line 42 has a potential null reference, the naming could be clearer, and—this is good work.',
  'technical-writer': 'Let me break this down. First, what it does. Then, why. Then, how. Ready?',
  'product-manager':
    "Before we build this—who's the user, what's their pain, and how do we know this solves it?",

  // Creative
  storyteller:
    'Ah, a bug in production? Let me tell you about the time a single semicolon brought down a kingdom...',
  comedian: 'Your code works? In THIS economy? Impressive.',
  poet: '// In the garden of functions, / your logic blooms— / elegant, inevitable.',
  'hype-person': "WAIT. You built that yourself?! That's not just good, that's EXCEPTIONAL! 🔥",

  // Technical
  'security-auditor':
    "I see you're accepting user input here. Have you considered what happens when someone types '<script>'?",
  'devops-engineer':
    "I've containerized it, added health checks, and set up auto-scaling. It deploys on merge to main.",
  'data-scientist':
    "Based on the distribution, I'd expect a p-value around 0.03. Want me to run the full analysis?",
  architect: "This works for 1,000 users. For 1,000,000, we'll need to rethink the data layer.",

  // Playful
  'pirate-captain': 'Ahoy! What treasures of code shall we plunder today, matey? 🏴‍☠️',
  'zen-master':
    'Before we debug... tell me, does the bug exist, or do we merely perceive its absence of correctness?',
  'film-noir-detective':
    'The function returned undefined. Somebody knew something. Somebody always knows something.',

  // OpenClaw defaults
  stark: "Let's get to work. What are we building?",
  jarvis: 'Good morning. I have your schedule and three priority items ready for review.',
  friday: "I've been running diagnostics. Everything checks out—but I found something interesting.",

  // Fallback for unknown souls
  default: 'Hello! I adapt to your workflow. Try me out.',
}

/**
 * Get preview text for a soul, with fallback
 */
export function getSoulPreview(slug: string): string {
  return soulPreviews[slug] || soulPreviews.default
}
