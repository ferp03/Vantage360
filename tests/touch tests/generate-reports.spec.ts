import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU18.CA1 - Generación de reportes de desempeño', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Login
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    await page.waitForTimeout(2000);
    
    // Verificar que aparece el botón "Generar reporte"
    await expect(page.locator('button:has-text("Generar reporte")')).toBeVisible();
  });
});