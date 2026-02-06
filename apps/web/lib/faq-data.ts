/**
 * FAQ Data - Shared between page (for schema) and content component
 */

export interface FAQItem {
  question: string
  answer: string
  category: string
}

export const faqItems: FAQItem[] = [
  // General
  {
    category: 'General',
    question: 'What is souls.directory?',
    answer:
      'souls.directory is an independent community directory of SOUL.md personality templates for OpenClaw.ai. Browse, discover, and share unique ways to customize your OpenClaw agent. Note: We are not affiliated with OpenClaw.',
  },
  {
    category: 'General',
    question: 'What is a SOUL.md file?',
    answer:
      "A SOUL.md file is the format used by OpenClaw.ai to define an agent's personality. It specifies core values, communication style, boundaries, and overall vibe. souls.directory is a community resource for sharing and discovering these personality templates.",
  },
  {
    category: 'General',
    question: 'Is it free?',
    answer:
      'Yes! Completely free. No paywalls, no premium tiers, no hidden costs. All souls are MIT licensed and free to use, modify, and distribute.',
  },
  // Using Souls
  {
    category: 'Using Souls',
    question: 'How do I use a soul?',
    answer:
      '1. Browse the directory\n2. Click on a soul you like\n3. Click "Copy to Clipboard"\n4. Paste into your OpenClaw agent\'s SOUL.md file',
  },
  {
    category: 'Using Souls',
    question: 'Can I modify a soul?',
    answer:
      "Absolutely! That's encouraged. These are starting points. Customize them to fit your needs, mix traits from different souls, and make something uniquely yours.",
  },
  {
    category: 'Using Souls',
    question: 'Which soul should I choose?',
    answer:
      'Depends on what you need:\n\n• For work: Executive Assistant, Code Reviewer, Product Manager\n• For creativity: Storyteller, Poet, Hype Person\n• For technical tasks: Security Auditor, DevOps Engineer, Architect\n• For fun: Pirate Captain, Zen Master, Film Noir Detective',
  },
  {
    category: 'Using Souls',
    question: 'Do these actually work?',
    answer:
      'Yes! Each soul has been tested with OpenClaw.ai. Community members contribute souls that have been verified to work well with OpenClaw agents. Results can vary based on your specific use case.',
  },
  // Contributing
  {
    category: 'Contributing',
    question: 'How do I submit a soul?',
    answer:
      '1. Sign in to your account\n2. Go to Dashboard > Submit Soul (or click "Submit Soul" in the navigation)\n3. Upload your SOUL.md file or import directly from GitHub\n4. Fill in the metadata (name, description, category, tags)\n5. Click Publish - your soul will be live immediately!',
  },
  {
    category: 'Contributing',
    question: 'What makes a good submission?',
    answer:
      "Good souls are:\n• Distinctive (unique personality)\n• Useful (solves a real need)\n• Well-documented (core truths, boundaries, vibe, examples)\n• Tested (you've actually used it)",
  },
  {
    category: 'Contributing',
    question: 'Do I get credit?',
    answer:
      "Yes! Your name goes in the frontmatter and shows on the soul's page. You retain copyright but grant an MIT license for others to use it.",
  },
  // Technical
  {
    category: 'Technical',
    question: "What's the tech stack?",
    answer:
      'Next.js (App Router), TypeScript, Convex, Tailwind CSS, and Vercel for hosting. We chose boring, reliable technology so we can focus on curating great souls.',
  },
  // Privacy
  {
    category: 'Privacy',
    question: 'What data do you collect?',
    answer:
      "Without an account: Page views via Plausible Analytics (no tracking, no cookies, no personal data)\n\nWith an account: GitHub username, email, avatar (from GitHub OAuth), souls you create, souls you star\n\nWe don't sell or share data.",
  },
  {
    category: 'Privacy',
    question: 'Do you use my souls for training AI?',
    answer:
      "No. Your submissions are stored in our database and displayed on the website. We don't use them to train models or sell data to anyone.",
  },
]

export const faqCategories = [...new Set(faqItems.map((item) => item.category))]
