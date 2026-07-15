# 🔨 Build Guide

How to build and run **Kedai Kopi Clicker** from source.

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 18+ | for `npm` + Capacitor CLI |
| **JDK** | **21** (required) | JDK 17 fails with `invalid source release: 21` |
| **Android SDK** | platform 34, build-tools 34 | via Android Studio or `cmdline-tools` |
| **adb** | any | to install onto a phone |
| **Gradle** | — | uses the bundled wrapper (`./gradlew`), no manual install |

### Point the build at JDK 21

Every Gradle command must run with `JAVA_HOME` set to a **JDK 21** install:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64   # adjust to your path
java -version                                         # should print 21.x
```

### Tell Gradle where the Android SDK is

Create `android/local.properties` (git-ignored) with your SDK path:

```properties
sdk.dir=/home/you/Android/Sdk
```

---

## 2. Install dependencies

```bash
npm install
```

This pulls Capacitor + the local-notifications plugin into `node_modules/`.

---

## 3. The dev loop

The game is plain web code in **`www/`**. After any change there, copy it into
the native project:

```bash
npx cap sync android
```

`cap sync` copies `www/` → `android/app/src/main/assets/public/` and refreshes
native plugins. **Always run it before building** or your changes won't ship.

---

## 4. Debug build (fast, no keystore needed)

```bash
cd android
./gradlew assembleDebug --no-daemon
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Install onto a connected phone (USB debugging on):

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

`-r` reinstalls **without wiping save data** (progress lives in `localStorage`).

> **Phone keeps dropping off `adb`?** Re-plug the cable, then
> `adb kill-server && adb start-server && adb devices`. As a fallback, copy the
> APK to the phone and tap it in a file manager to sideload.

---

## 5. Release build (signed)

A signed release needs a **keystore**. If you don't have one yet, create it
(see [PUBLISHING.md § 1](PUBLISHING.md#1-create-a-signing-keystore)).

Then create **`android/keystore/keystore.properties`** (git-ignored):

```properties
storeFile=/absolute/path/to/kedaikopi-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=kedaikopi
keyPassword=YOUR_KEY_PASSWORD
```

`build.gradle` reads this file **only if it exists** — so cloning the repo
without it still builds fine (the release APK just comes out unsigned).

Build:

```bash
cd android
# APK (sideload / direct install)
./gradlew assembleRelease --no-daemon
# → app/build/outputs/apk/release/app-release.apk

# AAB (what Google Play wants)
./gradlew bundleRelease --no-daemon
# → app/build/outputs/bundle/release/app-release.aab
```

---

## 6. Bumping the version

Before each release, edit `android/app/build.gradle`:

```gradle
versionCode 39          // must increase by 1 every Play upload
versionName "1.13.2"    // human-readable
```

`versionCode` **must** be higher than any build already uploaded to Play, or the
upload is rejected.

---

## Common gotchas

- **`invalid source release: 21`** → you're on JDK 17. Set `JAVA_HOME` to JDK 21.
- **Gradle download timeouts** → the wrapper points at a Gradle distribution URL;
  keep a local copy if your network is flaky. Don't use `--offline` for a fresh
  checkout (it needs to fetch dependencies once).
- **Changes not showing in the app** → you forgot `npx cap sync android`.
- **`SDK location not found`** → create `android/local.properties` (step 1).
