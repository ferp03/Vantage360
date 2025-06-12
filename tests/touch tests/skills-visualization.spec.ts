import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  
  test('HU4.CA1 - Visualización de habilidades existentes', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // login
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    await page.waitForTimeout(2000);
    
    // Hacer click en el botón de avatar específico (no el de limpiar filtros)
    await page.click('button.avatar-button');
    
    // Hacer click en "Mi perfil"
    await page.waitForSelector('text=Mi perfil');
    await page.click('text=Mi perfil');
    
    // Verificar que la sección de Habilidades aparece
    await expect(page.locator('text=Habilidades')).toBeVisible();
    
    // Verificar que existe al menos una habilidad (cualquiera que sea)
    await expect(page.locator('.habilidad-etiqueta').first()).toBeVisible();
  });

});