import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initAnalytics } from './lib/analytics'
import { getConfiguredConvexUrl } from './lib/convex-config'
import { initDesktopLogging, initFrontendSentry } from './lib/observability'
import { isTauriRuntime } from './lib/tauri'
import './index.css'

const convexUrl = getConfiguredConvexUrl() || 'https://build-placeholder.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

initFrontendSentry()
initAnalytics()
void initDesktopLogging()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex} shouldHandleCode={!isTauriRuntime()}>
      <App />
    </ConvexAuthProvider>
  </React.StrictMode>
)
