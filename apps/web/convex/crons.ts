import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Recalculate trending scores every hour at minute 0
crons.hourly('calculate-trending', { minuteUTC: 0 }, internal.trending.calculateTrendingScores)

export default crons
