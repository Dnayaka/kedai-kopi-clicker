# Play Console "Data Safety" form — answers

How to fill out the Data Safety questionnaire in Play Console → App content
→ Data safety, based on what the code actually does (verified by reading
`www/game.js` and `www/cafe3d.js`: no network calls, one Capacitor plugin
used — `@capacitor/local-notifications` — no other plugin, no analytics/ad
SDK anywhere in the app).

## Data collection and sharing

**"Does your app collect or share any of the required user data types?"**
→ **No.**

That's it — because the App has no `INTERNET` permission and makes no
network requests, there is nothing to declare in the rest of the
questionnaire (no location, personal info, financial info, health, messages,
photos/videos, audio, files, app activity, or device/other IDs collected).

## Security practices section

- **Is all user data encrypted in transit?** → N/A, no data leaves the
  device.
- **Do you provide a way for users to request that their data be deleted?**
  → Not applicable in the Play Console sense (no server-side data), but you
  can honestly answer **Yes** and point to the in-app "Mulai dari Awal Lagi"
  (Settings → Start Over) button, which deletes all locally stored save
  data immediately.
- **Committed to Play Families Policy / target audience** → answer based on
  your actual target age group; the App has no age-gating logic today, so if
  you target children add COPPA-relevant answers accordingly (out of scope
  of this doc — it depends on your business decision, not the code).

## Why this is simple for this app

Unlike most apps, there's no gray area to reason about here — the code has:
- No `fetch`/`XMLHttpRequest`/WebSocket calls.
- No Firebase, Sentry, Crashlytics, or any analytics/ad SDK in
  `package.json` or `android/app/build.gradle`.
- Exactly one `localStorage` key, holding only game-state fields (coins,
  buildings owned, settings, your custom shop name) — never transmitted.

If a future update adds a network call or SDK, **this doc and the actual
Data Safety form both need to be revisited** — don't let them drift from
what the code does.
