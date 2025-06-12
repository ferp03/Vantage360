import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU17.CA1 - Acceso a funcionalidad de carga - Administrador autorizado', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Login con administrador autorizado
    await page.fill('[name="email"]', 'sanabriaamelia@fajardo-correa.net');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    await page.waitForTimeout(2000);
    
    // Verificar que aparece el botón "Actualizar información"
    await expect(page.locator('button:has-text("Actualizar información")')).toBeVisible();
  });
});
