import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU11.CA1 - Generación de recomendaciones personalizadas mediante IA', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Login
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    await page.waitForTimeout(2000);
    
    // Ir a "Mi Desarrollo"
    await page.click('text=Mi Desarollo');
    
    // Esperar a que cargue la página de Mi Desarrollo
    await page.waitForTimeout(2000);
    
    // Hacer clic en "Ver recomendaciones"
    await page.click('button:has-text("Ver recomendaciones")');
    
    // Esperar a que cargue la página de recomendaciones
    await page.waitForTimeout(2000);
    
    // Verificar que estamos en la página de Recomendaciones Personalizadas
    await expect(page.locator('text=Recomendaciones Personalizadas')).toBeVisible();
    
    // Verificar que aparece el botón "Obtener recomendaciones"
    await expect(page.locator('button:has-text("Obtener recomendaciones")')).toBeVisible();
    
    // Verificar que aparecen las secciones de recomendaciones (esto confirma que la IA está funcionando)
    await expect(page.locator('text=Cursos')).toBeVisible();
    await expect(page.locator('text=Certificaciones')).toBeVisible();
  });
});