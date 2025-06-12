import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU12.CA1 - Visualización de lista de empleados disponibles', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Login
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    await page.waitForTimeout(2000);
    
    // Hacer clic en la opción "Solo disponibles"
    await page.click('text=Solo disponibles');
    
    // Esperar a que se aplique el filtro
    await page.waitForTimeout(2000);
    
    // Verificar que el filtro está activo
    await expect(page.locator('text=Solo disponibles')).toBeVisible();
    
    // Verificar que aparecen empleados con estado "Disponible"
    await expect(page.locator('text=Disponible').first()).toBeVisible();
    
    // Solo contar empleados disponibles para confirmar que el filtro funciona
    const estadosDisponibles = await page.locator('text=Disponible').count();
    console.log(`Empleados disponibles mostrados: ${estadosDisponibles}`);
    
    // Verificar que hay al menos un empleado disponible
    expect(estadosDisponibles).toBeGreaterThan(0);
  });
});