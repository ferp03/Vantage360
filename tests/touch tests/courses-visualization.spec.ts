import { test, expect } from '@playwright/test';
import { qase } from 'playwright-qase-reporter';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU7.CA3 - Visualización de cursos', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Login
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue completamente después del login
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Hacer clic en "Mi Desarollo" (nota: tiene una 'r', no doble 'rr')
    // Usar el selector más específico basado en el código HTML
    await page.click('a[routerLink="/cursos_certificados"]');
    
    // Alternativa si el selector anterior no funciona:
    // await page.click('text=Mi Desarollo');
    
    // Esperar a que cargue la página de cursos y certificados
    await page.waitForLoadState('networkidle');
    
    // Verificar que estamos en la página correcta
    // Como va a /cursos_certificados, verificar que estamos en esa URL
    await expect(page).toHaveURL(/.*cursos_certificados.*/);
    
    // Verificar que las 4 secciones principales están visibles
    // Usar selectores más específicos para evitar ambigüedad
    await expect(page.locator('span:has-text("Mis Cursos")')).toBeVisible();
    await expect(page.locator('span:has-text("Mis Certificados")')).toBeVisible();
    await expect(page.locator('span:has-text("Subir Certificado")')).toBeVisible();
    await expect(page.locator('span:has-text("Recomendaciones")')).toBeVisible();
    
    // Hacer click en el botón "Ver mis cursos"
    await page.click('button:has-text("Ver mis cursos")');
    
    // Esperar a que cargue la nueva página
    await page.waitForLoadState('networkidle');
    
    // Verificar que aparece la página de cursos
    await expect(page.locator('h1:has-text("Mis Cursos"), h2:has-text("Mis Cursos")').first()).toBeVisible();
    
    // Verificar elementos básicos de los cursos
    await expect(page.locator('text=Progreso:').first()).toBeVisible({ timeout: 10000 });
  });
});