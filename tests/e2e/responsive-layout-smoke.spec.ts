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
  { path: '/auth/signup', heading: /Create( your)? account|Sign up/i },
  { path: '/contact', heading: null },
  { path: '/privacy', heading: null },
  { path: '/terms', heading: null },
  { path: '/security', heading: null },
]

const AUTH_CRITICAL_ROUTES = [
  { path: '/dashboard', heading: /Good morning|Good afternoon|Good evening/i },
  { path: '/bookings', heading: /All Bookings|My Bookings/i },
  { path: '/contact', heading: /Support/i },
  { path: '/admin/users', heading: /Manage Users/i },
  { path: '/admin/deletion-requests', heading: /Deletion Requests/i },
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

  test(`authenticated command palette layout stays anchored on ${viewport.name}`, async ({ page }) => {
    test.skip(
      !hasAdminCredentials(),
      'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run responsive smoke tests.'
    )

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await loginAsAdmin(page)

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const trigger = page.getByRole('button', { name: /Search and run commands/i })
    await expect(trigger).toBeVisible({ timeout: 20_000 })
    await trigger.click()

    const paletteDialog = page.getByRole('dialog', { name: /Command palette/i })
    await expect(paletteDialog).toBeVisible({ timeout: 20_000 })

    const box = await paletteDialog.boundingBox()
    expect(box, `Command palette box should be measurable on ${viewport.name}`).not.toBeNull()

    if (box) {
      expect(box.y, `Command palette should open near top on ${viewport.name}`).toBeLessThanOrEqual(
        Math.max(180, viewport.height * 0.34)
      )
      expect(box.x, `Command palette should stay within viewport on ${viewport.name}`).toBeGreaterThanOrEqual(
        0
      )
      expect(
        box.x + box.width,
        `Command palette should stay within viewport width on ${viewport.name}`
      ).toBeLessThanOrEqual(viewport.width + 1)
    }

    await page.keyboard.press('Escape')
    await expect(paletteDialog).toBeHidden({ timeout: 10_000 })
  })

  test(`admin clear filters control remains fully visible on ${viewport.name}`, async ({ page }) => {
    test.skip(
      !hasAdminCredentials(),
      'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run responsive smoke tests.'
    )

    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await loginAsAdmin(page)

    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const searchInput = page.getByPlaceholder(/Search users or codes/i)
    await expect(searchInput).toBeVisible({ timeout: 20_000 })
    await searchInput.fill('resident')

    const clearFilters = page.getByRole('button', { name: /Clear all filters/i })
    await expect(clearFilters).toBeVisible({ timeout: 20_000 })

    const box = await clearFilters.boundingBox()
    expect(box, `Clear filters button box should be measurable on ${viewport.name}`).not.toBeNull()

    if (box) {
      expect(box.x, `Clear filters button should not overflow left on ${viewport.name}`).toBeGreaterThanOrEqual(0)
      expect(
        box.x + box.width,
        `Clear filters button should not overflow right on ${viewport.name}`
      ).toBeLessThanOrEqual(viewport.width + 1)
      expect(
        box.y + box.height,
        `Clear filters button should remain inside viewport on ${viewport.name}`
      ).toBeLessThanOrEqual(viewport.height + 1)
    }
  })
}
