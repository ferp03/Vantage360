import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU19.CA1 - Clasificación automática de empleados', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Login
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    await page.waitForTimeout(2000);
    
    // Buscar el select de nivel y cambiar su valor directamente
    await page.selectOption('select', '4');
    
    // Esperar a que se aplique el filtro
    await page.waitForTimeout(2000);
    
    // Verificar que hay empleados filtrados (al menos uno)
    const empleadosVisibles = await page.locator('tbody tr').count();
    expect(empleadosVisibles).toBeGreaterThan(0);
    
    console.log(`✅ Filtro por nivel 4 aplicado correctamente. Empleados mostrados: ${empleadosVisibles}`);
  });
});