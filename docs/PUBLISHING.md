# 🚀 Publishing to Google Play

End-to-end guide to get **Kedai Kopi Clicker** onto the Google Play Store.

> **Big picture:** create a signing key → build a signed `.aab` → make a Play
> Console account → create the app + fill the listing → upload the `.aab` →
> promote through test tracks → submit for review.

---

## 0. One-time accounts & costs

- A **Google account**.
- A **Google Play Developer account** — one-time **US $25** fee, at
  <https://play.google.com/console>. Approval can take a day or two.

---

## 1. Create a signing keystore

The keystore signs every release. **You use the same key forever** — back it up
safely; if you lose it you can't update the app.

```bash
keytool -genkeypair -v \
  -keystore kedaikopi-release.keystore \
  -alias kedaikopi \
  -keyalg RSA -keysize 4096 -validity 10000
```

It asks for a store password, a key password, and your name/org. Then put the
file in `android/keystore/` and create **`android/keystore/keystore.properties`**:

```properties
storeFile=/absolute/path/to/kedaikopi-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=kedaikopi
keyPassword=YOUR_KEY_PASSWORD
```

> 🔒 **Both files are git-ignored on purpose.** Keep an **encrypted backup**
> somewhere off your machine (password manager, encrypted drive). Also **enable
> Google Play App Signing** during upload — Google then holds a copy of the
> signing key as a safety net.

---

## 2. Build the release bundle (.aab)

Google Play wants an **App Bundle** (`.aab`), not an APK:

```bash
export JAVA_HOME=/path/to/jdk-21
npx cap sync android
cd android
./gradlew bundleRelease --no-daemon
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

Make sure `versionCode` in `android/app/build.gradle` is **higher** than any
previous upload (see [BUILD.md § 6](BUILD.md#6-bumping-the-version)).

---

## 3. Create the app in Play Console

1. Go to <https://play.google.com/console> → **Create app**.
2. Fill: app name (**Kedai Kopi Clicker**), default language, **Game**, **Free**.
3. Accept the developer program & US export declarations.

---

## 4. Complete the store listing

Under **Grow → Store presence → Main store listing**:

| Field | What to put |
|-------|-------------|
| **App name** | Kedai Kopi Clicker (≤ 30 chars) |
| **Short description** | ≤ 80 chars, keyword-rich — e.g. *"Idle café tycoon: grow a cozy coffee shop, no ads."* |
| **Full description** | ≤ 4000 chars — features, how it plays. Use keywords: *idle, café, coffee, tycoon, clicker, management*. |
| **App icon** | 512×512 PNG, 32-bit |
| **Feature graphic** | 1024×500 PNG/JPG (shown at the top of the listing) |
| **Phone screenshots** | 2–8 images. Use the ones in `docs/screenshots/` or capture fresh: `adb exec-out screencap -p > shot.png`. **This is the #1 driver of installs — make them good.** |

A short (15–30s) **promo video** (YouTube link) is optional but boosts installs.

---

## 5. Content rating, data safety & the rest

Play Console gates release behind a checklist (**Policy → App content**):

- **Privacy policy** — required for most apps. Since this game collects nothing,
  a one-paragraph policy hosted anywhere (GitHub Pages, a Google Doc set to
  public) is enough: *"This app does not collect, store, or share any personal
  data. All progress is saved locally on your device."*
- **Data safety** — declare **no data collected / no data shared** (all state is
  local `localStorage`). It's honest and makes the listing look trustworthy.
- **Content rating** — fill the questionnaire (this game → rated *Everyone*).
- **Target audience**, **Ads** (declare **no ads**), **Government app** (no).
- **App category** → Games → Simulation (or Casual).

---

## 6. Upload & roll out through tracks

Play has staged release tracks — go **Test → Internal testing** first:

1. **Internal testing** → **Create new release** → upload `app-release.aab`.
2. When prompted, **opt into Play App Signing** (recommended).
3. Add release notes, save, **review**, **roll out**.
4. Add tester emails, share the opt-in link, install from Play on a real device,
   make sure it runs.

Then promote upward as you gain confidence:

```
Internal testing  →  Closed testing  →  Open testing  →  Production
```

**Production** is the public launch. The first production submission goes through
**Google review** (can take a few hours to a few days).

> New personal developer accounts may need a period of **closed testing with ≥ 12
> testers for ~14 days** before they can publish to production. Play Console will
> tell you if this applies.

---

## 7. Updating later

1. Bump `versionCode` (+1) and `versionName` in `android/app/build.gradle`.
2. `npx cap sync android && ./gradlew bundleRelease`.
3. Play Console → your track → **Create new release** → upload the new `.aab` →
   roll out.

---

## Checklist

- [ ] Keystore created + **backed up** (encrypted, off-machine)
- [ ] `keystore.properties` filled (git-ignored)
- [ ] `versionCode` bumped
- [ ] Signed `.aab` built
- [ ] Icon (512²) + feature graphic (1024×500) + 2–8 screenshots
- [ ] Short + full description (with keywords)
- [ ] Privacy policy URL
- [ ] Data safety = *no data collected*
- [ ] Content rating done
- [ ] Uploaded to a test track, installed & verified on a real phone
- [ ] Promoted to Production & submitted for review
