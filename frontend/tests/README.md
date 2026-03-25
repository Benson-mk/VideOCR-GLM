# Playwright Tests for VideOCR-GLM

This directory contains end-to-end tests for the VideOCR-GLM application using Playwright.

## Setup

Playwright is already installed as a dev dependency. The browsers have been installed.

## Running Tests

### Start the Dev Server

Before running tests, make sure the dev server is running:

```bash
cd frontend
npm run dev
```

The server should start on `http://localhost:3000`

### Run Tests

Run all tests in Chromium:
```bash
npx playwright test --project=chromium
```

Run tests in all browsers (Chromium, Firefox, WebKit):
```bash
npx playwright test
```

Run tests in headed mode (watch the browser):
```bash
npx playwright test --headed
```

Run a specific test file:
```bash
npx playwright test app.spec.ts
```

### View Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Test Coverage

The current test suite (`app.spec.ts`) covers:

1. **Home Page Loading**
   - Verifies page title
   - Checks logo visibility
   - Validates logo text

2. **Navigation Menu**
   - Confirms all menu items are visible (Add Video, Queue, Settings, About)

3. **Page Navigation**
   - Tests navigation to Queue page
   - Tests navigation to Settings page
   - Tests navigation to About page
   - Tests navigation back to home from other pages

4. **Home Page Components**
   - Verifies Add Video form is displayed
   - Checks upload buttons are visible
   - Validates General Settings card
   - Confirms Actions card is displayed

## Test Results

All 9 tests pass successfully in Chromium:
- ✅ should load the home page
- ✅ should display navigation menu
- ✅ should navigate to Queue page
- ✅ should navigate to Settings page
- ✅ should navigate to About page
- ✅ should display Add Video form on home page
- ✅ should display General Settings card
- ✅ should display Actions card
- ✅ should navigate back to home from other pages

## Configuration

The Playwright configuration is in `playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Test directory: `./tests`
- Browsers: Chromium, Firefox, WebKit
- Reporter: HTML
- Tracing: On first retry
- Screenshots: On failure
- Video: Retain on failure

## Adding New Tests

To add new tests:

1. Create a new test file in the `tests/` directory (e.g., `queue.spec.ts`)
2. Use the Playwright test API:
   ```typescript
   import { test, expect } from '@playwright/test';

   test('your test description', async ({ page }) => {
     await page.goto('/');
     // Your test code here
   });
   ```
3. Run the tests with `npx playwright test`

## Best Practices

- Use `getByRole()` for interactive elements (buttons, links, menu items)
- Use `getByText()` for text content
- Use `locator()` with CSS selectors for more complex elements
- Always wait for navigation with `waitForURL()` after clicking links
- Use specific selectors to avoid strict mode violations
- Add descriptive test names that explain what is being tested

## Troubleshooting

### Tests timeout waiting for dev server
Make sure the dev server is running on `http://localhost:3000` before running tests.

### Strict mode violations
When `getByText()` matches multiple elements, use more specific selectors:
- Use `.filter()` to narrow down matches
- Use `locator()` with CSS classes
- Use `getByRole()` for interactive elements

### Tests fail intermittently
- Increase timeout values in `playwright.config.ts`
- Use `waitFor()` or `waitForSelector()` for dynamic content
- Check the HTML report for screenshots and videos of failed tests