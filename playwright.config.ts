import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Configuración del reporteador QASE
  reporter: [
    ['html'],
    ['playwright-qase-reporter', {
      mode: 'testops',
      debug: true,
      testops: {
        api: {
          token: '756786b650e32b0902d7bd144562a43def788ed46007862a92f35e38554e5d84',
        },
        project: 'NETZMACHIN',
        uploadAttachments: true,
        run: {
          complete: true,
        },
      },
    }],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});