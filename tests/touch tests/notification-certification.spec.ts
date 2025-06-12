import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU8.CA1 - Notificación automática de certificación próxima a vencer', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Login
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    await page.waitForTimeout(3000);
    
    // Buscar el botón de notificaciones (campana)
    await page.click('.notification-button');
    
    // Esperar a que aparezca el menú
    await page.waitForTimeout(1000);
    
    // Verificar que aparece el menú de notificaciones
    await expect(page.locator('text=Notificaciones')).toBeVisible();
  });
});