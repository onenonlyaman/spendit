# SpendIt Release & OTA Update Management

Follow these exact steps whenever creating an update or major upgrade release for SpendIt.

## 1. Prerequisites (One-Time Setup)
Ensure the following secret is configured in the GitHub repository under **Settings → Secrets and variables → Actions**:
- `TAURI_SIGNING_PRIVATE_KEY`: Private key content from `src-tauri/spendit.key`.
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: (Empty string if passwordless).

## 2. Version Synchronization (All 3 Files Required)
Whenever bumping the version (e.g. to `v1.0.1` for OTA updates or `v2.0.0` for major upgrades), update all three files:
1. `package.json` → `"version": "x.y.z"`
2. `src-tauri/tauri.conf.json` → `"version": "x.y.z"`
3. `src/lib/updater.ts` → `CURRENT_APP_VERSION = 'x.y.z'`

## 3. Release Classification
- **In-App OTA Updates (`v1.0.x` / Minor-Patch)**: Downloaded and applied silently in-app via Tauri v2 updater with a 1-click restart prompt.
- **Major Upgrades (`v2.0.x` / Major)**: Automatically directs the user to the GitHub Releases page to download the latest platform installer.

## 4. Publishing the Release
Commit changes, tag the commit, and push to GitHub:
```bash
git add .
git commit -m "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```
GitHub Actions will automatically build the Windows `.msi` and `.exe` binaries, sign the release manifest (`latest.json`), and publish the GitHub Release to all desktop clients.
