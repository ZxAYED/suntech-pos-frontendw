import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
export default defineConfig({
  testDir: '.', testMatch: /offline-browser\.spec\.ts/, timeout: 60_000, expect:{timeout:15_000}, workers:1, fullyParallel:false,
  outputDir:'./results', reporter:[['list'],['json',{outputFile:'e2e/results/report.json'}]],
  use:{baseURL:'http://127.0.0.1:4178',headless:true,viewport:{width:1440,height:1000},trace:'retain-on-failure',screenshot:'only-on-failure',launchOptions:{...(process.env.CHROMIUM_BIN ? {executablePath:process.env.CHROMIUM_BIN} : {}),args:['--no-sandbox','--disable-dev-shm-usage']}},
  webServer:{command:'node e2e/test-server.mjs',cwd:resolve(__dirname,'..'),url:'http://127.0.0.1:4178/__test/state',reuseExistingServer:false,timeout:20_000},
});
