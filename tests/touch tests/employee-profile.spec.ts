import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  
  test('HU03.CA1 - Visualización de perfil completo del empleado', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Hacer login
    await page.fill('[name="email"]', 'abelgollum@industrias.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    await page.waitForTimeout(3000);
    
    // Hacer click en el primer empleado disponible en la tabla
    await page.locator('tbody tr').first().locator('td').first().click();
    
    // Verificar que se muestra la información del perfil del empleado
    await expect(page.locator('text=Informacion Personal')).toBeVisible();
    await expect(page.locator('text=Usuario:')).toBeVisible();
    await expect(page.locator('text=Estado Laboral:')).toBeVisible();
    await expect(page.locator('text=People Lead:')).toBeVisible();
    await expect(page.locator('text=Desde:')).toBeVisible();
    await expect(page.locator('text=Ciudad:')).toBeVisible();
    
    // Verificar secciones adicionales del perfil
    await expect(page.locator('text=Informe')).toBeVisible();
    await expect(page.locator('text=Trayectoria Laboral')).toBeVisible();
    
    // Verificar que se muestran métricas del empleado
    await expect(page.locator('text=Cargabilidad:')).toBeVisible();
    await expect(page.locator('text=Nivel:')).toBeVisible();
  });

});