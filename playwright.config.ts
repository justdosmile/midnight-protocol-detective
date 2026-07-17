import { defineConfig, devices } from '@playwright/test';

const productionMode = process.env.E2E_PRODUCTION === '1';
const serverOrigin = 'http://127.0.0.1:4173';
const projectPath = '/midnight-protocol-detective/';
const baseURL = productionMode ? `${serverOrigin}${projectPath}` : `${serverOrigin}/`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    locale: 'ru-RU',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: productionMode
      ? `npm run build -- --base=${projectPath} && npm run preview -- --host 127.0.0.1 --port 4173 --base=${projectPath}`
      : 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
