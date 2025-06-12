import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU15.CA1 - Visualización de información básica', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Login
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    await page.waitForTimeout(2000);
    
    // Hacer click en el botón de avatar específico
    await page.click('button.avatar-button');
    
    // Hacer click en "Mi perfil"
    await page.waitForSelector('text=Mi perfil');
    await page.click('text=Mi perfil');
    
    // Esperar a que cargue la página del perfil
    await page.waitForTimeout(2000);
    
    // Verificar la sección "Informacion Personal"
    await expect(page.locator('text=Informacion Personal')).toBeVisible();
    
    // Verificar el email
    await expect(page.locator('text=xarteaga@villareal.net')).toBeVisible();
    
    // Verificar el usuario
    await expect(page.locator('text=Usuario: Laura')).toBeVisible();
    
    // Verificar el estado laboral
    await expect(page.locator('text=Estado Laboral: Activo')).toBeVisible();
    
    // Verificar el people lead
    await expect(page.locator('text=People Lead: sara15')).toBeVisible();
    
    // Verificar la fecha de inicio
    await expect(page.locator('text=Desde: Junio de 2022')).toBeVisible();
    
    // Verificar la ciudad
    await expect(page.locator('text=Ciudad: Acapulco')).toBeVisible();
  });
});