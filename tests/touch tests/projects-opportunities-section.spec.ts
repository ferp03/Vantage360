import { test, expect } from '@playwright/test';

test.describe('Pruebas Automatizadas de Regresión', () => {
  test('HU9.CA1 - Existencia de sección de oportunidades (Simple)', async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:4200');
    
    // Login
    await page.fill('[name="email"]', 'xarteaga@villareal.net');
    await page.fill('[name="password"]', 'password1234');
    await page.click('button[type="submit"]');
    
    // Esperar a que cargue
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Hacer clic en "Proyectos"
    await page.click('text=Proyectos');
    
    // Esperar a que cargue la página
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Debug: Imprimir todo el texto de la página para ver qué está disponible
    const pageText = await page.textContent('body');
    console.log('=== TEXTO COMPLETO DE LA PÁGINA ===');
    console.log(pageText);
    
    // Intentar diferentes variaciones del texto
    const textVariations = [
      'Proyectos disponibles:',
      'Proyectos disponibles',
      'disponibles:',
      'disponibles',
      'Proyectos\ndisponibles:',
      'Proyectos\ndisponibles'
    ];
    
    let sectionFound = false;
    
    for (const textVariation of textVariations) {
      try {
        const element = page.locator(`text=${textVariation}`);
        const isVisible = await element.isVisible({ timeout: 1000 });
        if (isVisible) {
          console.log(`=== FOUND: "${textVariation}" ===`);
          await expect(element).toBeVisible();
          sectionFound = true;
          break;
        }
      } catch (error) {
        console.log(`"${textVariation}" no encontrado`);
      }
    }
    
    // Si no encontramos con texto, intentar con selectores más específicos
    if (!sectionFound) {
      // Buscar cualquier elemento que contenga "disponibles"
      const disponiblesElement = page.locator('*:has-text("disponibles")');
      const count = await disponiblesElement.count();
      
      if (count > 0) {
        console.log(`Encontrados ${count} elementos con "disponibles"`);
        await expect(disponiblesElement.first()).toBeVisible();
        sectionFound = true;
      }
    }
    
    if (!sectionFound) {
      // Tomar screenshot para debug
      await page.screenshot({ path: 'debug-projects-page.png' });
      throw new Error('No se encontró la sección de proyectos disponibles. Ver screenshot: debug-projects-page.png');
    }
    
    console.log('✅ Test pasado: La sección de proyectos disponibles existe');
  });
});