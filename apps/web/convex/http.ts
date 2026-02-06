import { httpRouter } from 'convex/server'
import { auth } from './auth'

const http = httpRouter()

// Add OAuth callback routes for GitHub authentication
auth.addHttpRoutes(http)

export default http
