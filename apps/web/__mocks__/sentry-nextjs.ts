/**
 * Mock for @sentry/nextjs — prevents Sentry from initializing in tests
 */
export const captureException = () => {}
export const captureMessage = () => {}
export const addBreadcrumb = () => {}
export const setUser = () => {}
export const setTag = () => {}
export const setContext = () => {}
export const init = () => {}
export const withScope = (cb: (scope: unknown) => void) =>
  cb({ setExtra: () => {}, setTag: () => {} })
export const Severity = { Error: 'error', Warning: 'warning', Info: 'info' }
export const startSpan = () => {}
export const setMeasurement = () => {}
