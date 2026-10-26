# واحة Android — release notes for maintainers

- Package: `com.alhajda.waha` · versionName tracks iOS (`1.2.1`) · versionCode starts at **1** (bump for every Play upload).
- compileSdk / targetSdk **36**, minSdk 23. Capacitor 7.6.x needs **JDK 21**.
- Same web load model as iOS: live `https://waha.hajdah.com` with bundled `www/` offline tools via `errorPath`.
- Android-only native pieces:
  - `MainActivity` keeps the WebView inside system bars, display cutout and the keyboard (Android 15+ edge-to-edge).
  - `HouseDoorBrowserPlugin` implements the `HouseDoorBrowser` JS plugin the web app calls for house doors (مداد، تهجد، محسن، ألعاب، حياة) with a dark Custom Tab; iOS keeps its own WKWebView plugin.
- Permissions: INTERNET, ACCESS_COARSE_LOCATION (weather "my location", Android 12+), plus POST_NOTIFICATIONS / RECEIVE_BOOT_COMPLETED / WAKE_LOCK merged from `@capacitor/local-notifications` (prayer reminders). No camera, mic, contacts or exact-alarm permission.
- Signing: `android/keystore.properties` (gitignored) points at the upload keystore kept **outside git**. Play App Signing holds the app signing key.

```bash
npm ci && npm run cap:sync:android
cd android && ./gradlew testReleaseUnitTest lintRelease bundleRelease
# → app/build/outputs/bundle/release/app-release.aab
```
