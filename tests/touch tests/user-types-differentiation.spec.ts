import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  
  test('HU5.CA1 - Diferenciación de tipos de usuario', async ({ page }) => {
    // Primera parte: Usuario administrador - debe ver todas las opciones
    await page.goto('http://localhost:4200');
    
    // login con usuario administrador
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue el dashboard
    await page.waitForURL('**/empleados');
    await page.waitForTimeout(3000);
    
    // Verificar que puede acceder a la página de empleados (confirma que es admin)
    await expect(page.locator('h1')).toContainText('Disponibilidad de Empleados');
    
    // Hacer logout
    await page.click('button.avatar-button');
    await page.click('text=Log out');
    
    // Segunda parte: Usuario empleado - no debe tener acceso a empleados
    await page.goto('http://localhost:4200');
    
    // login con usuario empleado
    await page.fill('[name="email"]', 'yolmos@hotmail.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue
    await page.waitForTimeout(3000);
    
    // Verificar que NO está en la página de empleados (confirma diferenciación)
    await expect(page.locator('h1')).not.toContainText('Disponibilidad de Empleados');
  });

});