import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU10.CA1 - Verificar Trayectoria Laboral en perfil', async ({ page }) => {
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
    
    // Hacer scroll hasta abajo para encontrar "Trayectoria Laboral"
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Verificar que aparece la sección "Trayectoria Laboral"
    await expect(page.locator('text=Trayectoria Laboral')).toBeVisible();
    
    // Verificar elementos de los proyectos en la trayectoria
    // Proyecto 1: Vantage360, Agile
    await expect(page.locator('text=Vantage360, Agile')).toBeVisible();
    await expect(page.locator('text=Accenture').first()).toBeVisible();
    await expect(page.locator('text=Proyecto actual')).toBeVisible();
    await expect(page.locator('text=data structures (Básico)')).toBeVisible();
    await expect(page.locator('text=agile practices (Básico)')).toBeVisible();
    
    // Proyecto 2: MiTec, Agile
    await expect(page.locator('text=MiTec, Agile')).toBeVisible();
    await expect(page.locator('text=Python (Intermedio)')).toBeVisible();
    
    // Verificar fechas de los proyectos
    await expect(page.locator('text=2024-02-22')).toBeVisible();
    await expect(page.locator('text=2021-07-08 - 2024-02-21')).toBeVisible();
    
    // Verificar que hay botón de Editar
    await expect(page.locator('button:has-text("Editar")').first()).toBeVisible();
  });
});