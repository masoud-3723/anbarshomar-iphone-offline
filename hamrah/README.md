# AnbarShomar Hamrah for iPhone, 3.6

Existing Render origin and IndexedDB `inventory-hybrid-v1` remain unchanged. This is an installable Safari PWA, not a native IPA. It shares the original authenticated Google Apps Script center with Android 3.6. Root `dist/` (the older independent offline app) is unchanged.

The 3.6 turquoise UI has one login, company → warehouse navigation, per-company references (including per-phone offline import), worksite counting without a raw workbook, additive counts and corrections, three rounds, and warehouse-wide recents. Counts are written to local IndexedDB before sync; acknowledgements retain local entries. The local export contains this phone's records; central export requires a connection.

Build: `python3 hamrah/package-offline.py`; publish `hamrah/dist`.

All 14 UI, Excel worker, generic warehouse illustration, font and guide assets are precached with SHA-256 checks. A partial or mismatched bundle cannot activate. Cached Excel-worker initialization is checked before offline readiness. Initial install and preparing each home-screen installation require internet. Uploads, authentication and sync responses are never cached. Background sync while the PWA is closed is not claimed.

Exports are prepared before a second direct tap invokes iOS file sharing, with an explicit download fallback. Actual Save to Files must be confirmed by the user. Storage persistence is requested through the browser API and independent exports remain recommended.

Validation performed locally: 24 browser UI/RPC tests, 10 offline cache and file-save tests, and 2 full offline XLSX workflows using real bundled Excel workers. Test harnesses and workbook fixtures are kept outside the public deployment update. No physical iPhone, Safari runtime or real multiple-device reference sync was tested. No production test records or temporary production QA code are used.

Only public runtime assets, synthetic tests and build sources are included. No credentials, app data, signing keys or Android private source are published. License activation remains pending final approval.
