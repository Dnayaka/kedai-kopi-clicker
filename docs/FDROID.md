# Publishing to F-Droid

F-Droid only distributes free/open-source software, and it **builds the APK
itself from source** (it does not accept your pre-built APK). Good news:
this project already qualifies — no proprietary dependencies, no Google Play
Services, no analytics/ads/trackers, GPL-3.0 licensed, and the source is
public.

## 0. Prerequisites (should already be done)

- [x] Public source repo — <https://github.com/Dnayaka/kedai-kopi-clicker>
- [x] `LICENSE` file at repo root (GPL-3.0)
- [x] All dependencies are FOSS (Capacitor = MIT, three.js = MIT — no
      `google-services.json`, no Play Services/Firebase/AdMob anywhere)
- [x] Gradle wrapper points at the real `services.gradle.org` distribution
      (not a local machine path — F-Droid's build server needs this to
      resolve)
- [x] Reproducible build: `npx cap sync android && cd android &&
      JAVA_HOME=<jdk21> ./gradlew assembleRelease` works from a clean clone
      with no manual steps beyond `npm install`

## 1. Two ways in

### Option A — IzzyOnDroid (faster, recommended first)

A large community-run F-Droid-compatible repo. Review is much faster than
official F-Droid (days, not months) and its client works directly in the
F-Droid app (add IzzyOnDroid as a repo source) or standalone.

1. Read <https://gitlab.com/IzzyOnDroid/repo/-/wikis/Contact-us-to-submit-your-App>
2. Open an issue in <https://gitlab.com/IzzyOnDroid/repo/-/issues> with the
   repo URL and app ID (`id.dnayaka.kedaikopi`).
3. They build automatically once configured — no manual build recipe needed
   from you.

### Option B — Official F-Droid (`fdroiddata`)

Slower (the review queue can take weeks to months) but reaches the default
F-Droid client directly.

1. Fork <https://gitlab.com/fdroid/fdroiddata>
2. Add a metadata file at `metadata/id.dnayaka.kedaikopi.yml` — draft below.
3. Open a merge request. A maintainer will do a manual review (checks for
   non-free code, reproducibility, etc.) and may ask for changes.
4. This step needs *your* GitLab account, since it's an external review
   process tied to your identity as the submitter — I can prepare
   everything up to this point, but the merge request itself has to come
   from you.

## 2. Draft `metadata/id.dnayaka.kedaikopi.yml`

```yaml
Categories:
  - Games
License: GPL-3.0-only
AuthorName: dnayaka
SourceCode: https://github.com/Dnayaka/kedai-kopi-clicker
IssueTracker: https://github.com/Dnayaka/kedai-kopi-clicker/issues

AutoName: Kedai Kopi Clicker
Summary: Idle café-management game — grow a coffee shop in a low-poly city
Description: |
    An idle/management clicker set in a low-poly 3D city. Customers roll in
    and buy coffee on their own, coins pile up, and you spend them on
    upgrades that physically appear in the world — buy a table and a
    parasol, chairs, and a seated customer pop up on the back patio.
    Includes a light story (paying off a startup loan), a guided mission
    chain, a daily login streak, and local "come back" reminders — no ads,
    no tracking, 100% offline.

RepoType: git
Repo: https://github.com/Dnayaka/kedai-kopi-clicker.git

Builds:
  - versionName: '1.14.0'
    versionCode: 39
    commit: <git tag or commit hash for this release — see step 3>
    subdir: android
    sudo:
      - apt-get update
      - apt-get install -y nodejs npm
    init:
      - cd .. && npm install && npx cap sync android
    gradle:
      - yes

AutoUpdateMode: Version
UpdateCheckMode: Tags
CurrentVersion: '1.14.0'
CurrentVersionCode: 39
```

Notes on the draft above:
- `commit:` must point at an actual **tagged commit**, not a branch — F-Droid
  builds a specific pinned revision for reproducibility. Tag releases, e.g.
  `git tag v1.14.0 && git push origin v1.14.0`.
- The `sudo`/`init` block runs `npm install` before Gradle, since the web
  assets (`www/`) need to be synced into `android/app/src/main/assets` before
  the APK can be assembled — same as the local `docs/BUILD.md` flow.
- F-Droid will **sign the APK with its own key**, not `kedaikopi-release.keystore`
  — that keystore is only used for *your own* direct/Play Store distribution
  and should stay private either way.
- Double-check exact syntax against F-Droid's current docs before submitting
  — their build metadata format evolves:
  <https://f-droid.org/docs/Build_Metadata_Reference/>

## 3. Tag the release commit

```bash
git tag v1.14.0
git push origin v1.14.0
```

Use this tag's commit hash as `commit:` in the metadata file above.

## 4. After acceptance

Every future update needs a new git tag matching a bumped `versionCode` in
`android/app/build.gradle` (same rule as Play Store releases — see
[BUILD.md](BUILD.md) § 6) and, for the official F-Droid repo, an update to
the metadata file's `CurrentVersion`/`CurrentVersionCode` (or rely on
`AutoUpdateMode: Version` + `UpdateCheckMode: Tags` to pick it up
automatically once you push a new tag).
