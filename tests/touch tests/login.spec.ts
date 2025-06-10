import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  
  test('HU1.CA6 - Inicio de sesión correcto', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Llenar el campo de correo
    await page.fill('[name="email"]', 'abelgollum@industrias.com');
    
    // Llenar el campo de contraseña
    await page.fill('[name="password"]', 'password123');
    
    // Hacer click en el botón de iniciar sesión
    await page.click('button[type="submit"]');
    
    // Esperar a que la página del dashboard cargue completamente
    await page.waitForURL('**/empleados');
    
    // Verificar que el login fue exitoso
    await expect(page.locator('h1')).toContainText('Disponibilidad de Empleados');
  });

});