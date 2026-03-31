# E2E Smoke Tests

This folder contains Playwright smoke tests for critical user-facing regressions.

## Covered critical flows

- Admin settings location picker
  - Search suggestions dedupe and render stability
  - Both location options:
    - Use my browser location
    - Use approximate location
- Admin analytics page load
- Dashboard tab-switch focus stability
- Runtime guard against known console errors:
  - NotificationProvider/ToastNotification update timing error
  - Duplicate React key error in location suggestions
  - `event.key.toLowerCase()` crash in command palette
  - Firestore permission error surfaced to UI runtime

## Required environment variables for authenticated smoke tests

Create a local `.env.e2e` file (or set in shell):

- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

If these are not set, authenticated tests are skipped.

## Run locally

1. Install browser once:

```bash
npm run test:e2e:install
```

2. Run smoke tests:

```bash
npm run test:e2e
```

3. Open HTML report:

```bash
npm run test:e2e:report
```
