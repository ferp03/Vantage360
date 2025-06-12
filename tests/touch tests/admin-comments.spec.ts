import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  
  test('HU6.CA1 - Acceso autorizado - Administrador puede ver comentarios', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // login
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard (sin waitForURL)
    await page.waitForTimeout(5000);
    
    // Hacer click en el botón de comentarios (icono de mensaje) del primer empleado en la columna Acciones
    await page.locator('tbody tr').first().locator('td:last-child button').first().click();
    
    // Verificar que aparece la modal de comentarios
    await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
  });

});