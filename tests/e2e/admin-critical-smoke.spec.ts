import { expect, test } from '@playwright/test'
import { attachKnownRuntimeErrorCollector } from './helpers/runtime-errors'
import { hasAdminCredentials, loginAsAdmin } from './helpers/auth'

const SAMPLE_SEARCH_RESULTS = [
  {
    id: 'photon-1',
    source: 'photon',
    displayName: "State Bank of India, ALKAPURI 'X' ROAD, Hyderabad, Telangana, India",
    shortName: 'State Bank of India',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    countryCode: 'IN',
    lat: 17.3658713,
    lon: 78.5567891,
  },
  {
    id: 'photon-1-dup',
    source: 'photon',
    displayName: "State Bank of India, ALKAPURI 'X' ROAD, Hyderabad, Telangana, India",
    shortName: 'State Bank of India',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    countryCode: 'IN',
    lat: 17.3658713,
    lon: 78.5567891,
  },
  {
    id: 'photon-2',
    source: 'photon',
    displayName: 'Hitec City, Hyderabad, Telangana, India',
    shortName: 'Hitec City',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    countryCode: 'IN',
    lat: 17.4474,
    lon: 78.3762,
  },
]

const SAMPLE_APPROXIMATE_RESULT = {
  id: 'ip-hyd',
  source: 'ip',
  displayName: 'Hyderabad, Telangana, India',
  shortName: 'Hyderabad',
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
  countryCode: 'IN',
  lat: 17.385044,
  lon: 78.486671,
}

const SAMPLE_REVERSE_RESULT = {
  id: 'reverse-hyd',
  source: 'nominatim',
  displayName: 'Banjara Hills, Hyderabad, Telangana, India',
  shortName: 'Banjara Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
  countryCode: 'IN',
  lat: 17.4121,
  lon: 78.4483,
}

test.describe('Admin critical smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAdminCredentials(), 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin smoke tests.')
    await loginAsAdmin(page)
  })

  test('location picker supports search and both location options without known runtime errors', async ({ page }) => {
    const assertNoKnownRuntimeErrors = attachKnownRuntimeErrorCollector(page)

    await page.route('**/api/geocoding/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: SAMPLE_SEARCH_RESULTS }),
      })
    })

    await page.route('**/api/geocoding/ip', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: SAMPLE_APPROXIMATE_RESULT }),
      })
    })

    await page.route('**/api/geocoding/reverse**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: SAMPLE_REVERSE_RESULT }),
      })
    })

    await page.context().grantPermissions(['geolocation'])
    await page.context().setGeolocation({ latitude: 17.4121, longitude: 78.4483 })

    await page.goto('/admin/settings')
    await page.getByRole('button', { name: /Community/i }).click()

    await expect(page.getByText('Community Location')).toBeVisible()
    await expect(page.getByRole('button', { name: /Use my browser location/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Use approximate location/i })).toBeVisible()

    const locationInput = page.locator('input[aria-label="Community location"]')
    await locationInput.fill('hyd')

    const suggestionButtons = page.locator('div.z-20 button')
    await expect(suggestionButtons.first()).toBeVisible({ timeout: 15_000 })
    await expect(suggestionButtons).toHaveCount(2)

    await suggestionButtons.first().click()
    await expect(page.getByText(/State Bank of India/i)).toBeVisible()

    await page.getByRole('button', { name: /Use approximate location/i }).click()
    await expect(page.getByText(/Hyderabad, Telangana, India/i)).toBeVisible()

    await page.getByRole('button', { name: /Use my browser location/i }).click()
    await expect(page.getByText(/Banjara Hills, Hyderabad, Telangana, India/i)).toBeVisible()

    assertNoKnownRuntimeErrors()
  })

  test('analytics command center loads for admin', async ({ page }) => {
    const assertNoKnownRuntimeErrors = attachKnownRuntimeErrorCollector(page)

    await page.goto('/admin/analytics')

    await expect(page.getByText('Analytics Command Center')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Latest weekly report')).toBeVisible({ timeout: 20_000 })

    assertNoKnownRuntimeErrors()
  })

  test('dashboard remains stable after tab switch focus', async ({ page, context }) => {
    const assertNoKnownRuntimeErrors = attachKnownRuntimeErrorCollector(page)

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)

    const navigationEntriesBefore = await page.evaluate(() => performance.getEntriesByType('navigation').length)

    const secondPage = await context.newPage()
    await secondPage.goto('/profile')
    await page.bringToFront()
    await page.waitForTimeout(1200)

    const navigationEntriesAfter = await page.evaluate(() => performance.getEntriesByType('navigation').length)

    expect(navigationEntriesAfter).toBe(navigationEntriesBefore)
    await expect(page).toHaveURL(/\/dashboard/)

    await secondPage.close()
    assertNoKnownRuntimeErrors()
  })
})
