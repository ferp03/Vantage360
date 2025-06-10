import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  
  test('HU2.CA1 - Verificar datos del perfil', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Hacer login con las nuevas credenciales
    await page.fill('[name="email"]', 'abelgollum@industrias.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    
    // Esperar un poco más para que todo cargue
    await page.waitForTimeout(2000);
    
    // Hacer click en el botón de avatar específico (no el de limpiar filtros)
    await page.click('button.avatar-button');
    
    // Hacer click en "Mi perfil"
    await page.waitForSelector('text=Mi perfil');
    await page.click('text=Mi perfil');
    
    // Verificar que la página del perfil cargó
    await expect(page.locator('text=Usuario:')).toBeVisible();
    await expect(page.locator('text=Estado Laboral:')).toBeVisible();
    await expect(page.locator('text=People Lead:')).toBeVisible();
    await expect(page.locator('text=Desde:')).toBeVisible();
    await expect(page.locator('text=Ciudad:')).toBeVisible();
  });

});