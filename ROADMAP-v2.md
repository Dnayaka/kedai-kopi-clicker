# Kedai Kopi Clicker v2.0 — Spec Revisi User (13-Jul-2026 malam)

Sumber: permintaan revisi user setelah main v1.1. Target: dari idle-clicker → mini tycoon-sim.
Status: BELUM DIKERJAKAN — session limit habis saat diminta; eksekusi mulai setelah reset (21:40 WIB) / sesi baru.
Eksekusi disarankan bertahap (workflow per fase), JANGAN sekali jalan.

## Daftar fitur (urutan prioritas eksekusi)

### Fase A — dunia & visual
1. **Kota diperluas**: ground 26→~60 unit, grid 2-3 jalan (persimpangan), blok gedung lebih banyak (LOD: gedung jauh tanpa jendela emissive), tetap budget mesh HP (instanced/shared).
2. **Day-night cycle**: siklus ~3 menit real-time; lerp warna hemi/dir light + langit (CSS var / uniform), jendela kota & lampu jalan nyala hanya malam; jam game ditampilkan kecil di topbar.
3. **Mobil & orang jangan polos**: tetap low-poly TAPI: mobil → variasi bodi (sedan/hatchback/pickup), warna beda, lampu depan/belakang emissive, jendela gelap; orang → warna baju/celana/kulit/rambut bervariasi, ada yang bawa tas/payung, jalan kecepatan beda.

### Fase B — gameplay inti baru
4. **Hapus auto-clicker berlevel → "Otomatisasi Penuh"**: satu upgrade mahal; setelah dibeli, penghasilan tap (clickValue × rate tetap) jalan otomatis penuh. Migrasi save: autoClickerLevel lama di-convert (level>0 → langsung punya full-auto).
5. **Bahan baku (supply loop)**: stok bahan (kg biji kopi); produksi mengkonsumsi stok; stok habis → produksi turun 80%. Beli bahan = errand interaktif (lihat #6/#7). Indikator stok di topbar.
6. **Player bisa digerakkan**: mode "Keluar Kedai" → karakter chibi player di depan kedai, kontrol joystick virtual (kiri bawah); jalan ke toko grosir (gedung supplier baru di ujung jalan) → dialog beli bahan (bawa max X kg jalan kaki).
7. **Mobil pickup bisa disetir**: setelah level tertentu, player bisa naik pickup (parkir samping kedai); kontrol setir sederhana (joystick + tombol gas/rem), nabrak = bounce ringan; kapasitas angkut jauh lebih besar dari jalan kaki. Pickup ada detail: bak terbuka, kargo keliatan pas isi.
8. **NPC interaktif**: pelanggan bisa di-tap → bubble komentar/pesanan; kadang minta menu tertentu (mini-event: layani dalam X detik → bonus + naik rating).

### Fase C — meta progression
9. **Level & difficulty**: XP dari lifetime coins + errand; level unlock fitur (lv2 pickup, lv3 interior, lv4 kompetitor, lv5 ruang bos, dst — tabel di kode). Pilihan difficulty (Santai/Normal/Sulit) saat mulai/di settings → memengaruhi: kecepatan turun rating, agresivitas kompetitor, harga bahan.
10. **Simulasi review Google-Maps-style**: panel "Ulasan" — feed review sintetis (nama+bintang+teks template, dipengaruhi: stok kering?, kecepatan layanan mini-event, upgrade interior); rating agregat 1.0-5.0 memengaruhi jumlah pelanggan NPC yang datang (multiplier income).
11. **Kompetitor**: 1-3 kedai kompetitor muncul di kota (sesuai level+difficulty), punya rating sendiri yang naik-turun; rating kompetitor > rating kita → nyedot sebagian traffic; bisa dilawan dengan naikin rating/upgrade.
12. **Nama kedai bisa diubah**: field di panel settings (persist di save; tampil di topbar + papan nama 3D via CanvasTexture).

### Fase D — interior & kamera
13. **Interior cafe**: masuk lewat pintu (player mode) / tombol; scene interior terpisah (lantai kayu, meja-kursi, counter, mesin espresso, pelanggan duduk); barista NPC kerja.
14. **Ruang bos**: pintu di interior → ruangan bos; view orbit seperti view luar sekarang TAPI kamera DIGERAKKAN USER (bukan auto-rotate): kontrol drag horizontal di STRIP ATAS LAYAR (area khusus di bagian atas canvas) untuk muter view, pinch/slider zoom.
15. **Menu bisa di-hide**: tombol collapse di header shop (panel bawah turun/naik dengan animasi, canvas 3D melebar full).

## Catatan teknis wajib
- Semua tetap: no innerHTML (hook), ES module, three.bundle.min.js vendor, kontrak initCafeScene dipertahankan/di-extend backward-compatible, disposal tracked-once, no per-frame alloc, shadows off, mesh budget naik tapi target <350 total dgn LOD.
- Save schema versioning WAJIB mulai sekarang (`saveVersion`), migrasi otomatis dari v1.1.
- Build: JDK21, gradle file:///tmp/gradle-8.14.3-all.zip, assembleRelease, adb push (lihat memory kedai-kopi-clicker-android-game).
- Eksekusi per fase = 1 workflow ultracode per fase + review + verify + build test di akhir fase.
