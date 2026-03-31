import { expect, type Page } from '@playwright/test'

const KNOWN_RUNTIME_ERROR_PATTERNS = [
  'Cannot update a component (`NotificationProvider`) while rendering a different component (`ToastNotification`)',
  'Encountered two children with the same key',
  "Cannot read properties of undefined (reading 'toLowerCase')",
  'Missing or insufficient permissions',
]

export function attachKnownRuntimeErrorCollector(page: Page): () => void {
  const captured: string[] = []

  const maybeCapture = (value: string) => {
    if (!value) return

    if (KNOWN_RUNTIME_ERROR_PATTERNS.some((pattern) => value.includes(pattern))) {
      captured.push(value)
    }
  }

  const consoleHandler = (message: { type: () => string; text: () => string }) => {
    if (message.type() === 'error') {
      maybeCapture(message.text())
    }
  }

  const pageErrorHandler = (error: Error) => {
    maybeCapture(String(error?.message || error))
  }

  page.on('console', consoleHandler as any)
  page.on('pageerror', pageErrorHandler)

  return () => {
    page.off('console', consoleHandler as any)
    page.off('pageerror', pageErrorHandler)

    expect(
      captured,
      `Known runtime errors should not appear. Captured:\n${captured.join('\n\n')}`
    ).toEqual([])
  }
}
