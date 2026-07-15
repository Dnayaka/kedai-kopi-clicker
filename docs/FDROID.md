# Publikasi ke F-Droid (resmi)

F-Droid cuma mendistribusikan software bebas/open-source, dan **build APK-nya
sendiri dari source code** (nggak nerima APK jadi kirimanmu). Kabar baiknya:
project ini udah memenuhi syarat — nggak ada dependency proprietary, nggak
pakai Google Play Services, nggak ada analytics/iklan/tracker, berlisensi
GPL-3.0, dan source code-nya sudah publik.

## 0. Prasyarat (sudah beres semua)

- [x] Repo source publik — <https://github.com/Dnayaka/kedai-kopi-clicker>
- [x] File `LICENSE` di root repo (GPL-3.0)
- [x] Semua dependency FOSS (Capacitor = MIT, three.js = MIT — nggak ada
      `google-services.json`, nggak ada Play Services/Firebase/AdMob sama
      sekali)
- [x] Gradle wrapper udah nunjuk ke distribusi resmi `services.gradle.org`
      (bukan path lokal `/tmp` lagi — server build F-Droid butuh ini biar
      bisa resolve)
- [x] Build reproducible: `npx cap sync android && cd android &&
      JAVA_HOME=<jdk21> ./gradlew assembleRelease` jalan dari clone bersih,
      cuma butuh `npm install` sebelumnya, nggak ada langkah manual lain
- [x] Rilis sudah di-tag: `v1.14.0` (commit `1092e589`)

## 1. Langkah submit ke F-Droid resmi (`fdroiddata`)

Prosesnya lewat GitLab, dan review-nya manual oleh maintainer F-Droid
(bisa makan waktu beberapa minggu sampai beberapa bulan, sabar aja). Karena
ini terikat akun GitLab pribadimu sebagai pengirim, langkah ini **harus kamu
sendiri yang jalanin** — saya udah siapin semua materinya di bawah, tinggal
copy-paste.

1. Bikin akun GitLab kalau belum punya, lalu fork
   <https://gitlab.com/fdroid/fdroiddata>
2. Di fork-mu, bikin file baru di path:
   `metadata/id.dnayaka.kedaikopi.yml`
   Isi persis kayak draft di bagian 2 di bawah.
3. Commit, push ke fork-mu, lalu buka **Merge Request** ke
   `fdroiddata` (branch `master`).
4. Maintainer bakal cek otomatis dulu (lint format YAML) terus review manual
   (pastiin nggak ada kode non-free, build-nya reproducible, dst). Kalau ada
   yang perlu diperbaiki, mereka bakal komen di MR — tinggal update file di
   fork-mu, MR-nya otomatis ke-update.
5. Kalau diterima, app-mu bakal masuk build queue F-Droid dan muncul di
   client F-Droid resmi setelah build pertama sukses (biasanya beberapa hari
   setelah merge).

> Kalau kelamaan nunggu review atau mau opsi lebih cepat sebagai tambahan
> (bukan pengganti), ada **IzzyOnDroid** — repo komunitas yang kompatibel F-Droid,
> review jauh lebih cepat (hitungan hari). Caranya: buka issue di
> <https://gitlab.com/IzzyOnDroid/repo/-/issues> dengan link repo + app ID
> (`id.dnayaka.kedaikopi`). Ini opsional, F-Droid resmi tetap jalan normal.

## 2. Draft `metadata/id.dnayaka.kedaikopi.yml` (siap pakai)

```yaml
Categories:
  - Games
License: GPL-3.0-only
AuthorName: dnayaka
SourceCode: https://github.com/Dnayaka/kedai-kopi-clicker
IssueTracker: https://github.com/Dnayaka/kedai-kopi-clicker/issues

AutoName: Kedai Kopi Clicker
Summary: Game idle kelola kedai kopi — bangun kedai di kota low-poly
Description: |
    Kedai Kopi Clicker adalah game idle/management santai: kembangkan kedai
    kopi dari satu meja jadi bisnis rame di sudut kota low-poly. Pelanggan
    datang dan beli kopi sendiri, koin ngumpul otomatis, dan kamu belanjakan
    buat upgrade yang benar-benar muncul di dunia game — beli meja baru,
    langsung muncul payung, kursi, dan pelanggan yang duduk di teras
    belakang kedai.

    Ada cerita ringan (melunasi utang modal ke Bos), rangkaian misi
    berpandu, streak login harian, dan pengingat lokal "kopimu numpuk nih"
    (opsional). Semua serba offline 100%, tanpa iklan, tanpa tracking, tanpa
    akun.

RepoType: git
Repo: https://github.com/Dnayaka/kedai-kopi-clicker.git

Builds:
  - versionName: '1.14.0'
    versionCode: 39
    commit: 1092e589b063ebf8c0318b10e03c3de8177efaf6
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

Catatan soal draft di atas:
- `commit:` udah diisi hash commit yang persis sama dengan tag `v1.14.0`
  (`1092e589b063ebf8c0318b10e03c3de8177efaf6`) — F-Droid mem-build revisi
  yang di-pin persis ini, bukan branch yang bisa berubah-ubah.
- Blok `sudo`/`init` menjalankan `npm install` sebelum Gradle, karena aset
  web (`www/`) harus disinkron dulu ke `android/app/src/main/assets` sebelum
  APK bisa di-assemble — sama persis alurnya dengan `docs/BUILD.md`.
- F-Droid **menandatangani APK dengan kunci mereka sendiri**, bukan pakai
  `kedaikopi-release.keystore` milikmu — keystore itu cuma buat distribusi
  langsung/Play Store, tetap simpan rahasia seperti biasa.
- Cek lagi sintaksnya sebelum submit terhadap dokumentasi F-Droid saat ini
  (format metadata mereka kadang berubah):
  <https://f-droid.org/docs/Build_Metadata_Reference/>

## 3. Setelah diterima

Tiap update rilis berikutnya butuh: tag git baru + `versionCode` yang naik
di `android/app/build.gradle` (aturan sama kayak rilis Play Store, lihat
[BUILD.md](BUILD.md) § 6). Karena metadata di atas pakai
`AutoUpdateMode: Version` + `UpdateCheckMode: Tags`, F-Droid bakal otomatis
mendeteksi tag baru dan build ulang sendiri — nggak perlu kirim MR baru tiap
update, kecuali ada perubahan struktural (misal path build pindah).
