import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Basic Tests', () => {
  
  test(qase(1, 'First test with QASE integration'), async ({ page }) => {
    // Navegar a una página web simple
    await page.goto('https://playwright.dev');
    
    // Verificar que el título contiene "Playwright"
    await expect(page).toHaveTitle(/Playwright/);
    
    // Verificar que hay un enlace "Get started"
    await expect(page.getByRole('link', { name: 'Get started' })).toBeVisible();
  });

});