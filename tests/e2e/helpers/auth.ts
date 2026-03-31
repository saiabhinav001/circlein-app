import { expect, type Page } from '@playwright/test'

function getRequiredEnv(name: 'E2E_ADMIN_EMAIL' | 'E2E_ADMIN_PASSWORD'): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required to run authenticated smoke tests`)
  }
  return value
}

export function hasAdminCredentials(): boolean {
  return Boolean(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD)
}

export async function loginAsAdmin(page: Page): Promise<void> {
  const email = getRequiredEnv('E2E_ADMIN_EMAIL')
  const password = getRequiredEnv('E2E_ADMIN_PASSWORD')

  await page.goto('/auth/signin')

  await expect(page.locator('#email')).toBeVisible()
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)

  await page.locator('form').getByRole('button', { name: /^Sign in$/ }).click()

  await page.waitForURL(/\/dashboard|\/admin\/onboarding/, { timeout: 20_000 })
}
