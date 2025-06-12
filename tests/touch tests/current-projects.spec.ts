import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU14.CA4 - Visualización de proyectos actuales', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Login con usuario específico
    await page.fill('[name="email"]', 'fabiolazambrano@laboratorios.biz');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue después del login
    await page.waitForTimeout(3000);
    
    // Ir a "Proyectos"
    await page.click('text=Proyectos');
    
    // Esperar a que cargue la página de proyectos
    await page.waitForTimeout(2000);
    
    // Verificar que aparece la sección "Proyectos actuales"
    await expect(page.locator('text=Proyectos actuales:')).toBeVisible();
    
    // Verificar que hay 2 proyectos actuales (buscar el número por separado)
    await expect(page.locator('text=2').nth(1)).toBeVisible();
  });
});