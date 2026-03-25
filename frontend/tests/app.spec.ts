import { test, expect } from '@playwright/test';

test.describe('VideOCR-GLM Application', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page title contains the app name
    await expect(page).toHaveTitle(/VideOCR-GLM/);
    
    // Check if the logo is visible
    const logo = page.locator('.logo img');
    await expect(logo).toBeVisible();
    
    // Check if the logo text is visible
    const logoText = page.locator('.logo-text');
    await expect(logoText).toContainText('VideOCR-GLM');
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check if navigation menu items are visible
    await expect(page.getByText('Add Video')).toBeVisible();
    await expect(page.getByText('Queue')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
  });

  test('should navigate to Queue page', async ({ page }) => {
    await page.goto('/');
    
    // Click on Queue menu item
    await page.getByRole('menuitem', { name: 'Queue' }).click();
    
    // Wait for navigation
    await page.waitForURL('/queue', { timeout: 5000 });
    
    // Check if URL changed
    await expect(page).toHaveURL('/queue');
    
    // Check if Queue page content is visible (card title)
    await expect(page.locator('.ant-card-head-title').filter({ hasText: 'Queue' })).toBeVisible();
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.goto('/');
    
    // Click on Settings menu item
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    
    // Wait for navigation
    await page.waitForURL('/settings', { timeout: 5000 });
    
    // Check if URL changed
    await expect(page).toHaveURL('/settings');
    
    // Check if Settings page content is visible (card title)
    await expect(page.locator('.ant-card-head-title').filter({ hasText: 'Settings' })).toBeVisible();
  });

  test('should navigate to About page', async ({ page }) => {
    await page.goto('/');
    
    // Click on About menu item
    await page.getByRole('menuitem', { name: 'About' }).click();
    
    // Wait for navigation
    await page.waitForURL('/about', { timeout: 5000 });
    
    // Check if URL changed
    await expect(page).toHaveURL('/about');
    
    // Check if About page content is visible
    await expect(page.getByText('About VideOCR-GLM')).toBeVisible();
  });

  test('should display Add Video form on home page', async ({ page }) => {
    await page.goto('/');
    
    // Check if Add Video card is visible
    await expect(page.getByText('Add Video to Queue')).toBeVisible();
    
    // Check if upload button is visible
    await expect(page.getByText('Select Video File')).toBeVisible();
    
    // Check if batch add button is visible
    await expect(page.getByText('Batch Add from Folder')).toBeVisible();
  });

  test('should display General Settings card', async ({ page }) => {
    await page.goto('/');
    
    // Check if General Settings card is visible
    await expect(page.getByText('General Settings')).toBeVisible();
    
    // Check if Language dropdown is visible
    await expect(page.getByText('Language')).toBeVisible();
    
    // Check if Output Directory input is visible
    await expect(page.getByText('Output Directory')).toBeVisible();
  });

  test('should display Actions card', async ({ page }) => {
    await page.goto('/');
    
    // Check if Actions card is visible
    await expect(page.getByText('Actions')).toBeVisible();
    
    // Check if Add to Queue button is visible
    await expect(page.getByText('Add to Queue')).toBeVisible();
    
    // Check if Reset button is visible
    await expect(page.getByText('Reset')).toBeVisible();
  });

  test('should navigate back to home from other pages', async ({ page }) => {
    // Navigate to Queue
    await page.goto('/queue');
    await page.getByRole('menuitem', { name: 'Add Video' }).click();
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');
    
    // Navigate to Settings
    await page.goto('/settings');
    await page.getByRole('menuitem', { name: 'Add Video' }).click();
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');
    
    // Navigate to About
    await page.goto('/about');
    await page.getByRole('menuitem', { name: 'Add Video' }).click();
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');
  });
});
