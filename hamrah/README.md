# AnbarShomar Hamrah for iPhone, 2.0

This is a separate static PWA for the hybrid inventory workflow. It uses the SAME authenticated Google Apps Script center as Android v2. The old root dist/ iPhone offline app remains unchanged, and a separate Render static origin is used so its service worker and local counts cannot be replaced accidentally.

No database, credentials, signing keys, private source archive or inventory records are stored in this repository. Only the public HTTPS center URL is configured in dist/app.js; admin password/team code are entered in the client and exchanged for expiring tokens.

Build: python3 hamrah/package-offline.py, publish hamrah/dist.

All UI, font and the complete Excel worker are precached together with SHA-256 verification. A corrupted or partial release cannot activate. The readiness check verifies both complete cache and actual Excel-worker initialization from cache. RPC POST responses are never cached. Offline writes go to IndexedDB first; automatic sync retains the local entries. Local and central XLSX exports stay separate.

File output is prepared before an explicit second tap calls navigator.share, preserving iOS user activation; explicit download is retained as fallback. User must verify Save to Files. Physical iPhone execution has not been tested. Storage persistence is requested only through the documented browser API, with independent file export recommended.

Tests: node hamrah/tests/offline-and-share.cjs. UI unit tests use jsdom and fake-indexeddb: install those as dev dependencies outside production assets, then node --test hamrah/tests/simple-ui.test.mjs. Browser QA is performed separately. No TestFlight/native IPA is claimed. First offline preparation requires internet; automatic sync resumes while open or on next login.
