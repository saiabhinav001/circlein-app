import { expect, test } from '@playwright/test'
import { hasAdminCredentials, loginAsAdmin } from './helpers/auth'
import { attachKnownRuntimeErrorCollector } from './helpers/runtime-errors'

const VIEWPORTS = [
  { name: 'small-mobile', width: 320, height: 568 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
]

const PUBLIC_ROUTES = [
  { path: '/landing', heading: null },
  { path: '/auth/signin', heading: /Sign In|Welcome back/i },
]

const AUTH_CRITICAL_ROUTES = [
  { path: '/contact', heading: /Support/i },
  { path: '/admin/contact-tickets', heading: /Support Ticket Desk/i },
  { path: '/admin/analytics', heading: /Analytics Command Center/i },
  { path: '/admin/maintenance', heading: /Maintenance Desk/i },
]

for (const viewport of VIEWPORTS) {
  test(`public surfaces stay responsive on ${viewport.name}`, async ({ page }) => {
    const assertNoKnownRuntimeErrors = attachKnownRuntimeErrorCollector(page)

    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')

      if (route.heading) {
        await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible({
          timeout: 20_000,
        })
      } else {
        await expect(page.locator('body')).toBeVisible({ timeout: 20_000 })
      }

      const overflowWidth = await page.evaluate(
        () => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
      )

      expect(
        overflowWidth,
        `Horizontal overflow on ${route.path} at ${viewport.name} (${viewport.width}x${viewport.height})`
      ).toBeLessThanOrEqual(1)
    }

    assertNoKnownRuntimeErrors()
  })

  test(`authenticated critical surfaces stay responsive on ${viewport.name}`, async ({ page }) => {
    test.skip(
      !hasAdminCredentials(),
      'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run responsive smoke tests.'
    )

    const assertNoKnownRuntimeErrors = attachKnownRuntimeErrorCollector(page)

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await loginAsAdmin(page)

    for (const route of AUTH_CRITICAL_ROUTES) {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible({
        timeout: 20_000,
      })

      if (route.path === '/admin/analytics') {
        await expect(page.getByRole('heading', { name: /Operations radar/i })).toBeVisible({
          timeout: 20_000,
        })
      }

      const overflowWidth = await page.evaluate(
        () => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
      )

      expect(
        overflowWidth,
        `Horizontal overflow on ${route.path} at ${viewport.name} (${viewport.width}x${viewport.height})`
      ).toBeLessThanOrEqual(1)
    }

    assertNoKnownRuntimeErrors()
  })
}
