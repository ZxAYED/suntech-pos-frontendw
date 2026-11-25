# Browser regression tests

These tests use the production neutral offline bundle and a local **test-only BFF fixture**. The fixture signs real ES256 test permissions. The POS screens, IndexedDB writes, service worker, receipt UI and synchronization code come from the project. The fixture does not replace a test against your real Next.js/NestJS/PostgreSQL deployment.

From the frontend directory:

```bash
npm ci
npx playwright install chromium
npm run build:offline
npm run test:e2e
```

On Linux, Playwright may additionally require its documented browser system dependencies. The default uses the Chromium installed by Playwright, so no Linux-specific executable path is required on Windows or macOS. To use an explicitly installed browser instead, set `CHROMIUM_BIN` to its executable path using your shell's environment-variable syntax.

The test server binds to localhost port 4178. Use disposable test data only. It exposes `/__test/` controls exclusively inside `e2e/test-server.mjs`; these endpoints are not included in the production application.

The scenarios cover:

1. Online checkout saves its sale/receipt/outbox before the financial upload.
2. A prepared existing POS URL starts from the installed service worker with both test servers unavailable; local unlock, checkout and restart retain the original sale.
3. A lost upload response repeats the same ID and creates one official order in the fixture.
4. Custom offline checkout preserves the difference between the sale total and amount tendered.
5. Two open tabs cannot complete the same shared cart twice.

## Result in the implementation environment

Three scenarios were attempted. Chromium could not start because the execution environment refused an operating-system socket call. The failure occurred before any application page loaded. Two additional scenarios were added afterward. **No browser pass is claimed for this environment.** Do not treat the Node/Dexie tests as proof that the service worker, physical store device or printer has passed.

Run this suite on the supported store browser. Then test the same scenarios against the actual HTTPS deployment and a disposable real backend/database before accepting customer payments offline. Record the OS/browser version, server build versions, test results and any printer output issues.
