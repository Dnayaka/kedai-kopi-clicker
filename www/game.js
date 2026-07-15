import { initCafeScene } from "./cafe3d.js";
import { createIcon } from "./icons.js";

(function () {
  "use strict";

  var SAVE_KEY = "kedaiKopiSave_v1";
  var OFFLINE_EFFICIENCY = 0.1;
  var OFFLINE_CAP_SECONDS = 8 * 3600;
  var TICK_MS = 200;
  var SAVE_EVERY_MS = 5000;

  var BUILDINGS = [
    { id: "meja",     name: "Meja Tambahan",       desc: "Tempat duduk lebih banyak",  icon: "table",    baseCost: 15,        baseCps: 0.1 },
    { id: "barista1", name: "Barista Part-time",    desc: "Bantu seduh kopi",            icon: "barista",  baseCost: 100,       baseCps: 1 },
    { id: "mesin",    name: "Mesin Espresso",       desc: "Seduh otomatis lebih cepat",  icon: "espresso", baseCost: 1100,      baseCps: 8 },
    { id: "barista2", name: "Barista Senior",       desc: "Racikan lebih efisien",       icon: "barista2", baseCost: 12000,     baseCps: 47 },
    { id: "cabang",   name: "Cabang Kedai",         desc: "Buka toko di seberang jalan", icon: "house",    baseCost: 130000,    baseCps: 260 },
    { id: "truk",     name: "Truk Kopi Keliling",   desc: "Jualan sampai ke jalanan",    icon: "truck",    baseCost: 1400000,   baseCps: 1400 },
    { id: "waralaba", name: "Kedai Waralaba",       desc: "Merek kamu tersebar kota",    icon: "office",   baseCost: 20000000,  baseCps: 7800 },
    { id: "pabrik",   name: "Pabrik Roasting",      desc: "Produksi biji kopi massal",   icon: "factory",  baseCost: 330000000, baseCps: 44000 }
  ];

  var COST_GROWTH = 1.15;
  var CLICK_UPGRADE_BASE_COST = 50;
  var CLICK_UPGRADE_GROWTH = 4;

  var FLOORS = [];
  (function buildFloorDefs() {
    for (var n = 2; n <= 10; n++) {
      FLOORS.push({
        n: n,
        name: "Lantai " + n,
        desc: "Tambah lantai kedai · +8% produksi total, permanen",
        cost: Math.round(500 * Math.pow(11, n - 2))
      });
    }
  })();

  var FULL_AUTO_COST = 50000;
  var FULL_AUTO_RATE = 2.0; // automatic tap income = FULL_AUTO_RATE * clickValue() per second
  var PICKUP_COST = 20000; // one-time buy: unlocks drivable pickup + 250kg supplier runs
  var BEAN_RATE = 1 / 120;  // kg of beans consumed per second while buildings produce
  var BEAN_LOW_KG = 20;     // topbar bean indicator turns red below this stock
  var NO_BEANS_MULT = 0.2;  // production multiplier while the bean stock is empty

  var state = null;

  function defaultState() {
    var owned = {};
    BUILDINGS.forEach(function (b) { owned[b.id] = 0; });
    return {
      coins: 0,
      lifetimeCoins: 0,
      owned: owned,
      clickUpgradeLevel: 0,
      prestigePoints: 0,
      floorsOwned: 1,
      fullAuto: false,
      beans: 100,
      pickupOwned: false,
      sound: true,
      music: true,
      sensitivity: 1.0,
      fov: 70,
      quality: "standar",
      shopName: "Kedai Kopi Bahagia",
      difficulty: "normal",
      rating: 4.0,
      debtPaid: 0,      // "Lunasi Utang ke Bos" story: how much of DEBT_TOTAL is repaid
      missionIndex: 0,  // current mission in the guided chain
      introSeen: false, // has the opening boss cutscene played
      lastDailyClaim: null, // ms timestamp of the last daily-reward claim
      dailyStreak: 0,   // consecutive-day login streak
      lastSave: null
    };
  }

  var QUALITY_LEVELS = ["low", "medium", "standar", "hd", "ultra"];
  var DIFFICULTIES = ["santai", "normal", "sulit"];
  // per-difficulty: rating pull speed toward target, and competitor strength
  var DIFF_PARAMS = {
    santai: { pull: 0.6, comp: 0.85, label: "Santai" },
    normal: { pull: 1.0, comp: 1.0, label: "Normal" },
    sulit: { pull: 1.4, comp: 1.2, label: "Sulit" }
  };

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (!raw) return defaultState();
    try {
      var parsed = JSON.parse(raw);
      var s = defaultState();
      s.coins = parsed.coins || 0;
      s.lifetimeCoins = parsed.lifetimeCoins || 0;
      s.clickUpgradeLevel = parsed.clickUpgradeLevel || 0;
      s.prestigePoints = parsed.prestigePoints || 0;
      s.floorsOwned = parsed.floorsOwned || 1;
      s.lastSave = parsed.lastSave || null;
      if (parsed.saveVersion === undefined) {
        // v1 -> v2 migration: a leveled autoclicker (level >= 1) becomes the
        // one-time full-auto upgrade; every migrated save gets starter beans.
        // autoClickerLevel itself is ignored and no longer saved.
        s.fullAuto = (parsed.autoClickerLevel || 0) >= 1;
        s.beans = 100;
        s.pickupOwned = false;
      } else {
        s.fullAuto = !!parsed.fullAuto;
        s.beans = (typeof parsed.beans === "number" && isFinite(parsed.beans)) ? Math.max(0, parsed.beans) : 100;
        s.pickupOwned = !!parsed.pickupOwned;
      }
      s.sound = parsed.sound === undefined ? true : !!parsed.sound;
      s.music = parsed.music === undefined ? true : !!parsed.music;
      s.sensitivity = (typeof parsed.sensitivity === "number" && isFinite(parsed.sensitivity)) ? Math.max(0.3, Math.min(2.5, parsed.sensitivity)) : 1.0;
      s.fov = (typeof parsed.fov === "number" && isFinite(parsed.fov)) ? Math.max(50, Math.min(100, parsed.fov)) : 70;
      s.quality = QUALITY_LEVELS.indexOf(parsed.quality) >= 0 ? parsed.quality : "standar";
      s.shopName = (typeof parsed.shopName === "string" && parsed.shopName.trim()) ? parsed.shopName.slice(0, 24) : "Kedai Kopi Bahagia";
      s.difficulty = DIFFICULTIES.indexOf(parsed.difficulty) >= 0 ? parsed.difficulty : "normal";
      s.rating = (typeof parsed.rating === "number" && isFinite(parsed.rating)) ? Math.max(1, Math.min(5, parsed.rating)) : 4.0;
      s.debtPaid = (typeof parsed.debtPaid === "number" && isFinite(parsed.debtPaid)) ? Math.max(0, parsed.debtPaid) : 0;
      s.missionIndex = (typeof parsed.missionIndex === "number" && parsed.missionIndex >= 0) ? Math.floor(parsed.missionIndex) : 0;
      s.introSeen = !!parsed.introSeen;
      s.lastDailyClaim = (typeof parsed.lastDailyClaim === "number" && isFinite(parsed.lastDailyClaim)) ? parsed.lastDailyClaim : null;
      s.dailyStreak = (typeof parsed.dailyStreak === "number" && parsed.dailyStreak >= 0) ? Math.floor(parsed.dailyStreak) : 0;
      BUILDINGS.forEach(function (b) {
        s.owned[b.id] = (parsed.owned && parsed.owned[b.id]) || 0;
      });
      return s;
    } catch (e) {
      return defaultState();
    }
  }

  function save() {
    var toSave = {
      coins: state.coins,
      lifetimeCoins: state.lifetimeCoins,
      owned: state.owned,
      clickUpgradeLevel: state.clickUpgradeLevel,
      prestigePoints: state.prestigePoints,
      floorsOwned: state.floorsOwned,
      fullAuto: state.fullAuto,
      beans: state.beans,
      pickupOwned: state.pickupOwned,
      sound: state.sound,
      music: state.music,
      sensitivity: state.sensitivity,
      fov: state.fov,
      quality: state.quality,
      shopName: state.shopName,
      difficulty: state.difficulty,
      rating: state.rating,
      debtPaid: state.debtPaid,
      missionIndex: state.missionIndex,
      introSeen: state.introSeen,
      lastDailyClaim: state.lastDailyClaim,
      dailyStreak: state.dailyStreak,
      saveVersion: 2,
      lastSave: Date.now()
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(toSave)); } catch (e) {}
  }

  function formatNumber(n) {
    if (n < 1000) return Math.floor(n).toString();
    var units = [
      { v: 1e12, s: " T" },
      { v: 1e9, s: " M" },
      { v: 1e6, s: " jt" },
      { v: 1e3, s: " rb" }
    ];
    for (var i = 0; i < units.length; i++) {
      if (n >= units[i].v) return (n / units[i].v).toFixed(2) + units[i].s;
    }
    return Math.floor(n).toString();
  }

  function prestigeMultiplier() {
    return 1 + state.prestigePoints * 0.02;
  }

  function floorMultiplier() {
    return 1 + (state.floorsOwned - 1) * 0.08;
  }

  function buildingCost(b) {
    var owned = state.owned[b.id];
    return Math.ceil(b.baseCost * Math.pow(COST_GROWTH, owned));
  }

  function rawBuildingCps() {
    var sum = 0;
    BUILDINGS.forEach(function (b) {
      sum += b.baseCps * state.owned[b.id];
    });
    return sum;
  }

  // supply loop: building production runs at 20% while the bean stock is empty
  function beansMultiplier() {
    return state.beans > 0 ? 1 : NO_BEANS_MULT;
  }

  // idle-management: walk-up customers give a steady base income so the shop earns
  // on its own (no tapping needed to get started); buildings add on top.
  var BASE_CPS = 1.2;
  function totalCps() {
    return (BASE_CPS + rawBuildingCps() * prestigeMultiplier() * floorMultiplier() * beansMultiplier() * customerMultiplier()) * debtIncomeMult();
  }

  // ---------- Fase C: level, rating, reviews, competitors ----------
  // level from lifetime coins (slow curve); shown in topbar, drives competitors
  function shopLevel() {
    return 1 + Math.floor(Math.pow(Math.max(0, state.lifetimeCoins) / 400, 0.38));
  }

  // rating the shop is drifting toward, from current conditions (1.0-5.0)
  function ratingTarget() {
    var t = 3.2;
    t += Math.min(1.2, (state.floorsOwned - 1) * 0.18);      // bigger cafe = nicer
    t += state.fullAuto ? 0.3 : 0;                            // smooth service
    t += Math.min(0.6, state.clickUpgradeLevel * 0.12);      // better gear
    if (state.beans <= 0 && rawBuildingCps() > 0) t -= 1.6;  // ran out of beans = bad reviews
    if (rawBuildingCps() === 0) t -= 0.4;                    // empty/quiet shop
    t += ordersServedRecently * 0.15;                        // fast service bonus
    return Math.max(1, Math.min(5, t));
  }

  var ordersServedRecently = 0; // decays; each completed order bumps it

  function updateRating(dt) {
    var tgt = ratingTarget();
    var pull = DIFF_PARAMS[state.difficulty].pull * 0.06; // per-second lerp rate
    state.rating += (tgt - state.rating) * Math.min(1, pull * dt);
    state.rating = Math.max(1, Math.min(5, state.rating));
    ordersServedRecently = Math.max(0, ordersServedRecently - dt * 0.1);
  }

  // customers scale with rating vs. the competition; folded into totalCps so a
  // well-reviewed shop earns more (and a bean-dry, badly-reviewed one earns less)
  function customerMultiplier() {
    var m = 0.55 + (state.rating - 1) / 4 * 0.85; // rating 1->0.55, 5->1.4
    var comp = competitorPressure();               // 0..~0.35 traffic siphon
    return Math.max(0.35, m * (1 - comp));
  }

  // ---------- competitors ----------
  var competitors = [];
  var COMPETITOR_NAMES = [
    "Kopi Senja", "Warung Kopi Pak Budi", "Espresso Corner", "Kedai Nongkrong",
    "Kopi Kekinian", "Ngopi Yuk", "Coffee Lab", "Teras Kopi"
  ];
  function rebuildCompetitors() {
    var n = Math.max(1, Math.min(3, Math.floor(shopLevel() / 2)));
    competitors = [];
    for (var i = 0; i < n; i++) {
      competitors.push({
        name: COMPETITOR_NAMES[(i * 3 + state.floorsOwned) % COMPETITOR_NAMES.length],
        rating: 3.6 + ((i * 7 + 3) % 10) / 10 * 1.0 // 3.6-4.6 spread
      });
    }
  }
  function updateCompetitors(dt) {
    var strength = DIFF_PARAMS[state.difficulty].comp;
    for (var i = 0; i < competitors.length; i++) {
      var c = competitors[i];
      // drift slowly toward a difficulty-scaled ceiling, gentle wobble by index
      var ceil = Math.min(4.9, 3.8 + strength * 0.6 + (i % 2) * 0.2);
      c.rating += (ceil - c.rating) * Math.min(1, 0.01 * dt);
    }
  }
  // how much traffic competitors siphon: only when their best beats us
  function competitorPressure() {
    if (!competitors.length) return 0;
    var best = 0;
    for (var i = 0; i < competitors.length; i++) best = Math.max(best, competitors[i].rating);
    var gap = best - state.rating;
    if (gap <= 0) return 0;
    return Math.min(0.35, gap * 0.18 * DIFF_PARAMS[state.difficulty].comp);
  }

  // ---------- reviews (synthetic, Google-Maps style) ----------
  var REVIEW_AUTHORS = [
    "Rina", "Budi", "Sari", "Dimas", "Putri", "Andi", "Maya", "Fajar",
    "Lia", "Reza", "Nina", "Yoga", "Dewi", "Bagus", "Tari", "Eko"
  ];
  var REVIEW_POS = [
    "Kopinya enak banget, tempat nyaman!",
    "Baristanya ramah, latte-nya juara.",
    "Cozy buat nugas, wifi kenceng.",
    "Es kopi susunya mantap, balik lagi deh.",
    "Pelayanan cepat, kucingnya lucu!",
    "Suasananya adem, cocok nongkrong."
  ];
  var REVIEW_MID = [
    "Lumayan, tapi rada rame.",
    "Kopinya oke, antriannya agak lama.",
    "Standar sih, harga sesuai."
  ];
  var REVIEW_NEG = [
    "Nunggu lama, stok kopinya habis.",
    "Rada sepi, pelayanan lambat.",
    "Kurang greget, semoga makin baik."
  ];
  function starString(r) {
    var full = Math.round(r);
    var out = "";
    for (var i = 0; i < 5; i++) out += (i < full ? "★" : "☆");
    return out;
  }
  // pick items deterministically-ish from rating so a session's feed is stable
  function pickReview(idx) {
    var r = state.rating;
    var pool, stars;
    var roll = (idx * 37 + Math.floor(r * 10)) % 10;
    if (r >= 4.0) { pool = roll < 8 ? REVIEW_POS : REVIEW_MID; stars = roll < 8 ? 5 : 4; }
    else if (r >= 3.0) { pool = roll < 5 ? REVIEW_POS : (roll < 8 ? REVIEW_MID : REVIEW_NEG); stars = roll < 5 ? 5 : (roll < 8 ? 4 : 3); }
    else { pool = roll < 5 ? REVIEW_NEG : REVIEW_MID; stars = roll < 5 ? 2 : 3; }
    return {
      author: REVIEW_AUTHORS[(idx * 5 + Math.floor(r)) % REVIEW_AUTHORS.length],
      text: pool[(idx * 3) % pool.length],
      stars: stars
    };
  }

  // ---------- "Lunasi Utang ke Bos" — story goal + guided mission chain ----------
  var DEBT_TOTAL = 50000; // startup loan from the Boss; the through-line goal
  var DEBT_CUT = 0.15;    // while you owe, the Boss skims 15% of ALL income (gone)
  var DEBT_FREE_BONUS = 0.20; // once fully repaid: +20% income, forever
  function debtRemaining() { return Math.max(0, DEBT_TOTAL - state.debtPaid); }
  function isDebtFree() { return state.debtPaid >= DEBT_TOTAL; }
  // the ONLY consequence-with-teeth: in debt = income ×0.85 (his cut); paid off =
  // income ×1.20 (you own everything). Principal drops ONLY via manual payment, so
  // ignoring the debt means bleeding 15% forever until you actively clear it.
  function debtIncomeMult() { return isDebtFree() ? (1 + DEBT_FREE_BONUS) : (1 - DEBT_CUT); }
  // each mission: desc, done() -> bool, prog() -> [current, target], reward coins,
  // boss dialogue shown on completion. All conditions are MONOTONIC (coins/owned/
  // floors/debt) so they never un-complete or trigger falsely.
  var MISSIONS = [
    { desc: "Kumpulkan 500 koin pertama", done: function () { return state.lifetimeCoins >= 500; }, prog: function () { return [state.lifetimeCoins, 500]; }, reward: 150, boss: "500 koin? Receh. Tapi awal yang bagus. Terus kumpulin." },
    { desc: "Pekerjakan 1 Barista Part-time", done: function () { return (state.owned.barista1 || 0) >= 1; }, prog: function () { return [state.owned.barista1 || 0, 1]; }, reward: 300, boss: "Punya pegawai, kopi ngalir cepet. Pinter juga kamu." },
    { desc: "Bayar cicilan pertama: 2.000 koin", done: function () { return state.debtPaid >= 2000; }, prog: function () { return [state.debtPaid, 2000]; }, reward: 500, boss: "Nah, gitu dong. Jangan pernah telat bayar ke aku, ya." },
    { desc: "Beli Mesin Espresso", done: function () { return (state.owned.mesin || 0) >= 1; }, prog: function () { return [state.owned.mesin || 0, 1]; }, reward: 1500, boss: "Mesin mahal itu bakal balik modal. Percaya sama aku." },
    { desc: "Kumpulkan total 20.000 koin", done: function () { return state.lifetimeCoins >= 20000; }, prog: function () { return [state.lifetimeCoins, 20000]; }, reward: 2000, boss: "Kedaimu mulai rame. Utangku makin aman, hehe." },
    { desc: "Buka lantai 2 kedaimu", done: function () { return state.floorsOwned >= 2; }, prog: function () { return [state.floorsOwned, 2]; }, reward: 2500, boss: "Makin tinggi kedainya, makin gede juga bisnismu. Mantap." },
    { desc: "Lunasi setengah utang (25.000)", done: function () { return state.debtPaid >= 25000; }, prog: function () { return [state.debtPaid, 25000]; }, reward: 4000, boss: "Setengah jalan. Jujur... aku mulai respek sama kamu." },
    { desc: "Beli Barista Senior", done: function () { return (state.owned.barista2 || 0) >= 1; }, prog: function () { return [state.owned.barista2 || 0, 1]; }, reward: 5000, boss: "Barista jago, pelanggan betah. Kamu serius rupanya." },
    { desc: "LUNASI SELURUH UTANG (50.000)", done: function () { return state.debtPaid >= DEBT_TOTAL; }, prog: function () { return [state.debtPaid, DEBT_TOTAL]; }, reward: 0, ending: true, boss: "...Lunas. Semuanya. Kedai ini murni punyamu sekarang. Jujur? Aku yang harusnya belajar dari kamu. Selamat, Bos." }
  ];

  var $storyModal = document.getElementById("story-modal");
  var $storyTitle = document.getElementById("story-title");
  var $storyText = document.getElementById("story-text");
  function showStory(title, text) {
    if (!$storyModal) return;
    if ($storyTitle) $storyTitle.textContent = title;
    if ($storyText) $storyText.textContent = text;
    $storyModal.classList.remove("hidden");
  }

  var missionsInit = false;
  function updateMissions() {
    if (!missionsInit) {
      // first run: silently fast-forward past goals an existing save already met
      // (they earned that progress before the story existed) — no reward spam
      missionsInit = true;
      while (state.missionIndex < MISSIONS.length && !MISSIONS[state.missionIndex].ending && MISSIONS[state.missionIndex].done()) {
        state.missionIndex++;
      }
      save();
      return;
    }
    if (state.missionIndex >= MISSIONS.length) return;
    var m = MISSIONS[state.missionIndex];
    if (!m.done()) return;
    if (m.reward > 0) { state.coins += m.reward; state.lifetimeCoins += m.reward; }
    state.missionIndex++;
    save();
    if (m.ending) {
      showStory("Bebas Utang!", m.boss + "\n\nMulai sekarang: TANPA potongan + bonus pemasukan +" + Math.round(DEBT_FREE_BONUS * 100) + "% selamanya. Kedai tetap bisa kamu kembangkan sepuasnya!");
    } else {
      showStory("Bos", m.boss + (m.reward > 0 ? "\n\nHadiah misi: +" + formatNumber(m.reward) + " koin." : ""));
    }
    if (missionsTabActive()) renderMissionsPanel();
  }

  function payDebt() {
    var rem = debtRemaining();
    var amt = Math.min(Math.floor(state.coins), rem);
    if (amt <= 0) return;
    state.coins -= amt;
    state.debtPaid += amt;
    save();
    updateStats();
    renderMissionsPanel();
  }

  function missionsTabActive() {
    var t = document.getElementById("tab-missions");
    return !!(t && t.classList.contains("active"));
  }
  function renderMissionsPanel() {
    var amount = document.getElementById("debt-amount");
    var fill = document.getElementById("debt-fill");
    var payBtn = document.getElementById("pay-debt-btn");
    var cur = document.getElementById("mission-current");
    var note = document.getElementById("mission-note");
    if (!cur) return;
    var rem = debtRemaining();
    if (amount) amount.textContent = "sisa " + formatNumber(rem) + " / " + formatNumber(DEBT_TOTAL);
    if (fill) fill.style.width = Math.min(100, (state.debtPaid / DEBT_TOTAL) * 100) + "%";
    var effect = document.getElementById("debt-effect");
    if (effect) {
      if (isDebtFree()) {
        effect.className = "debt-effect free";
        effect.textContent = "Bebas utang! Pemasukan +" + Math.round(DEBT_FREE_BONUS * 100) + "% selamanya.";
      } else {
        effect.className = "debt-effect owe";
        effect.textContent = "Selama berutang, Bos ambil " + Math.round(DEBT_CUT * 100) + "% pemasukanmu. Lunasi buat dapat +" + Math.round(DEBT_FREE_BONUS * 100) + "% permanen.";
      }
    }
    if (payBtn) {
      var canPay = Math.min(Math.floor(state.coins), rem);
      if (rem <= 0) { payBtn.textContent = "Lunas!"; payBtn.disabled = true; }
      else if (canPay <= 0) { payBtn.textContent = "Bayar Utang (koin belum cukup)"; payBtn.disabled = true; }
      else { payBtn.textContent = "Bayar " + formatNumber(canPay) + " koin"; payBtn.disabled = false; }
    }
    clearChildren(cur);
    if (state.missionIndex >= MISSIONS.length) {
      var doneCard = document.createElement("div");
      doneCard.className = "mission-card done";
      doneCard.textContent = "Semua misi selesai — kedai ini sepenuhnya milikmu.";
      cur.appendChild(doneCard);
      if (note) note.textContent = "";
      return;
    }
    var m = MISSIONS[state.missionIndex];
    var pr = m.prog();
    var frac = pr[1] > 0 ? Math.min(1, pr[0] / pr[1]) : 0;
    var card = document.createElement("div");
    card.className = "mission-card";
    var title = document.createElement("div");
    title.className = "mission-title";
    title.textContent = m.desc;
    var bar = document.createElement("div");
    bar.className = "mission-bar";
    var barFill = document.createElement("div");
    barFill.className = "mission-bar-fill";
    barFill.style.width = (frac * 100) + "%";
    bar.appendChild(barFill);
    var prog = document.createElement("div");
    prog.className = "mission-prog";
    prog.textContent = formatNumber(Math.min(pr[0], pr[1])) + " / " + formatNumber(pr[1]) + (m.reward > 0 ? "   ·   hadiah +" + formatNumber(m.reward) : "");
    card.appendChild(title);
    card.appendChild(bar);
    card.appendChild(prog);
    cur.appendChild(card);
    if (note) note.textContent = "Misi " + (state.missionIndex + 1) + " dari " + MISSIONS.length + ". Cicil utang ke Bos di atas kapan pun kamu siap.";
  }

  function updateRatingUI() {
    if (!$shopRating) return;
    clearChildren($shopRating);
    $shopRating.appendChild(document.createTextNode(
      "★ " + state.rating.toFixed(1) + " · Lv" + shopLevel()
    ));
  }

  function renderReviewsPanel() {
    if (!$reviewsSummary) return;
    // summary
    clearChildren($reviewsSummary);
    var big = document.createElement("div");
    big.className = "rating-big";
    big.textContent = state.rating.toFixed(1);
    var stars = document.createElement("div");
    stars.className = "rating-stars";
    stars.textContent = starString(state.rating);
    var meta = document.createElement("div");
    meta.className = "rating-meta";
    meta.textContent = "Level " + shopLevel() + " · Kesulitan " + DIFF_PARAMS[state.difficulty].label;
    $reviewsSummary.appendChild(big);
    $reviewsSummary.appendChild(stars);
    $reviewsSummary.appendChild(meta);

    // competitors
    clearChildren($competitorsList);
    competitors.forEach(function (c) {
      var row = document.createElement("div");
      row.className = "competitor-row";
      var nm = document.createElement("span");
      nm.textContent = c.name;
      var rt = document.createElement("span");
      var beating = c.rating > state.rating;
      rt.className = "competitor-rating" + (beating ? " ahead" : "");
      rt.textContent = "★ " + c.rating.toFixed(1) + (beating ? " ▲" : "");
      row.appendChild(nm);
      row.appendChild(rt);
      $competitorsList.appendChild(row);
    });

    // reviews list
    clearChildren($reviewsList);
    for (var i = 0; i < 6; i++) {
      var rv = pickReview(i);
      var card = document.createElement("div");
      card.className = "review-card";
      var head = document.createElement("div");
      head.className = "review-head";
      var au = document.createElement("span");
      au.className = "review-author";
      au.textContent = rv.author;
      var st = document.createElement("span");
      st.className = "review-stars";
      st.textContent = starString(rv.stars);
      head.appendChild(au);
      head.appendChild(st);
      var tx = document.createElement("div");
      tx.className = "review-text";
      tx.textContent = rv.text;
      card.appendChild(head);
      card.appendChild(tx);
      $reviewsList.appendChild(card);
    }
  }

  function applyShopName() {
    if ($shopnameText) $shopnameText.textContent = state.shopName;
    if (cafeScene && cafeScene.setShopSignText) cafeScene.setShopSignText(state.shopName);
  }

  function clickUpgradeCost() {
    return Math.ceil(CLICK_UPGRADE_BASE_COST * Math.pow(CLICK_UPGRADE_GROWTH, state.clickUpgradeLevel));
  }

  function clickUpgradeMultiplier() {
    return Math.pow(2, state.clickUpgradeLevel);
  }

  function clickValue() {
    var passiveBonus = Math.floor(rawBuildingCps() * 0.05);
    var base = 1 + passiveBonus;
    return Math.max(1, Math.round(base * clickUpgradeMultiplier() * prestigeMultiplier() * floorMultiplier() * debtIncomeMult()));
  }

  function effectiveCps() {
    return totalCps() + (state.fullAuto ? FULL_AUTO_RATE * clickValue() : 0);
  }

  // wholesale bean price, scales with the player's income
  function pricePerKg() {
    return Math.max(5, Math.ceil(2 * effectiveCps()));
  }

  function nextPrestigeTotal() {
    return Math.floor(Math.sqrt(state.lifetimeCoins / 1e6));
  }

  function prestigeGainAvailable() {
    return Math.max(0, nextPrestigeTotal() - state.prestigePoints);
  }

  // ---------- DOM refs ----------
  var $coinTotal = document.getElementById("coin-total");
  var $coinCps = document.getElementById("coin-cps");
  var $gameClock = document.getElementById("game-clock");
  var $tapArea = document.getElementById("tap-area");
  var $cafeCanvas = document.getElementById("cafe-canvas");
  var $minimap = document.getElementById("minimap");
  var minimapCtx = $minimap ? $minimap.getContext("2d") : null;
  var $tapValue = document.getElementById("tap-value");
  var $floaters = document.getElementById("floaters");
  var $buildingsList = document.getElementById("buildings-list");
  var $floorsList = document.getElementById("floors-list");
  var $buyClickUpgrade = document.getElementById("buy-click-upgrade");
  var $buyFullAuto = document.getElementById("buy-fullauto");
  var $fullAutoCard = document.getElementById("fullauto-card");
  var $fullAutoCount = document.getElementById("fullauto-count");
  var $buyPickup = document.getElementById("buy-pickup");
  var $pickupCard = document.getElementById("pickup-card");
  var $pickupCount = document.getElementById("pickup-count");
  var $beanStock = document.getElementById("bean-stock");
  var $bubbleLayer = document.getElementById("bubble-layer");
  var $carriedChip = document.getElementById("carried-chip");
  var $shop = document.getElementById("shop");
  var $shopToggleBtn = document.getElementById("shop-toggle-btn");
  var $modeHud = document.getElementById("mode-hud");
  var $joyBase = document.getElementById("joystick-base");
  var $joyKnob = document.getElementById("joystick-knob");
  var $lookBase = document.getElementById("look-base");
  var $lookKnob = document.getElementById("look-knob");
  var $actionBtn = document.getElementById("action-btn");
  var $exitModeBtn = document.getElementById("exit-mode-btn");
  var $walkBtn = document.getElementById("walk-btn");
  var $interiorBtn = document.getElementById("interior-btn");
  var $dmodeHud = document.getElementById("dmode-hud");
  var $bossStrip = document.getElementById("boss-strip");
  var $bossBtn = document.getElementById("boss-btn");
  var $dmodeBack = document.getElementById("dmode-back");
  var $dmodeExit = document.getElementById("dmode-exit");
  var $supplierModal = document.getElementById("supplier-modal");
  var $supplierText = document.getElementById("supplier-text");
  var $supplierBuyFull = document.getElementById("supplier-buy-full");
  var $supplierBuyHalf = document.getElementById("supplier-buy-half");
  var $supplierCancel = document.getElementById("supplier-cancel");
  var $prestigeBtn = document.getElementById("prestige-btn");
  var $prestigeBuyBtn = document.getElementById("prestige-buy-btn");
  var $prestigeDesc = document.getElementById("prestige-desc");
  var $offlineModal = document.getElementById("offline-modal");
  var $offlineText = document.getElementById("offline-text");
  var $offlineClose = document.getElementById("offline-close");
  var $prestigeModal = document.getElementById("prestige-modal");
  var $prestigeModalText = document.getElementById("prestige-modal-text");
  var $prestigeCancel = document.getElementById("prestige-cancel");
  var $prestigeConfirm = document.getElementById("prestige-confirm");
  var $settingsBtn = document.getElementById("settings-btn");
  var $settingsModal = document.getElementById("settings-modal");
  var $soundToggle = document.getElementById("sound-toggle");
  var $musicToggle = document.getElementById("music-toggle");
  var $sensitivitySlider = document.getElementById("sensitivity-slider");
  var $sensitivityVal = document.getElementById("sensitivity-val");
  var $fovSlider = document.getElementById("fov-slider");
  var $fovVal = document.getElementById("fov-val");
  var $qualityOptions = document.getElementById("quality-options");
  var $settingsClose = document.getElementById("settings-close");
  var $shopnameInput = document.getElementById("shopname-input");
  var $difficultyOptions = document.getElementById("difficulty-options");
  var $shopnameText = document.getElementById("shopname-text");
  var $shopRating = document.getElementById("shop-rating");
  var $reviewsSummary = document.getElementById("reviews-summary");
  var $competitorsList = document.getElementById("competitors-list");
  var $reviewsList = document.getElementById("reviews-list");

  var buildingRowEls = {};
  var floorRowEls = {};
  var cafeScene = null;

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderBuildingsList() {
    clearChildren($buildingsList);
    buildingRowEls = {};
    BUILDINGS.forEach(function (b) {
      var row = document.createElement("div");
      row.className = "shop-item";

      var icon = document.createElement("div");
      icon.className = "item-icon";
      icon.appendChild(createIcon(b.icon));

      var info = document.createElement("div");
      info.className = "item-info";
      var name = document.createElement("div");
      name.className = "item-name";
      name.textContent = b.name;
      var desc = document.createElement("div");
      desc.className = "item-desc";
      desc.textContent = b.desc + " · +" + (b.baseCps < 1 ? b.baseCps.toFixed(1) : formatNumber(b.baseCps)) + "/detik";
      var count = document.createElement("div");
      count.className = "item-count";
      info.appendChild(name);
      info.appendChild(desc);
      info.appendChild(count);

      var btn = document.createElement("button");
      btn.className = "buy-btn";
      btn.addEventListener("click", function () { buyBuilding(b); });

      row.appendChild(icon);
      row.appendChild(info);
      row.appendChild(btn);
      $buildingsList.appendChild(row);

      buildingRowEls[b.id] = { row: row, count: count, btn: btn };
    });
    updateBuildingsUI();
  }

  function updateBuildingsUI() {
    BUILDINGS.forEach(function (b) {
      var els = buildingRowEls[b.id];
      if (!els) return;
      var cost = buildingCost(b);
      var owned = state.owned[b.id];
      els.count.textContent = "Punya: " + owned + " · Beli: " + formatNumber(cost) + " koin";
      var affordable = state.coins >= cost;
      els.btn.textContent = affordable ? "Beli" : formatNumber(cost);
      els.btn.disabled = !affordable;
      els.row.classList.toggle("affordable", affordable);
    });
  }

  function renderFloorsList() {
    clearChildren($floorsList);
    floorRowEls = {};
    FLOORS.forEach(function (f) {
      var row = document.createElement("div");
      row.className = "shop-item";

      var icon = document.createElement("div");
      icon.className = "item-icon";
      icon.appendChild(createIcon("floor", { number: f.n }));

      var info = document.createElement("div");
      info.className = "item-info";
      var name = document.createElement("div");
      name.className = "item-name";
      name.textContent = f.name;
      var desc = document.createElement("div");
      desc.className = "item-desc";
      desc.textContent = f.desc;
      var count = document.createElement("div");
      count.className = "item-count";
      info.appendChild(name);
      info.appendChild(desc);
      info.appendChild(count);

      var btn = document.createElement("button");
      btn.className = "buy-btn";
      btn.addEventListener("click", function () { buyFloor(f); });

      row.appendChild(icon);
      row.appendChild(info);
      row.appendChild(btn);
      $floorsList.appendChild(row);

      floorRowEls[f.n] = { row: row, count: count, btn: btn };
    });
    updateFloorsUI();
  }

  function updateFloorsUI() {
    FLOORS.forEach(function (f) {
      var els = floorRowEls[f.n];
      if (!els) return;
      var owned = f.n <= state.floorsOwned;
      var isNext = f.n === state.floorsOwned + 1;
      els.row.classList.remove("affordable", "maxed");
      if (owned) {
        els.count.textContent = "Sudah dibangun · +8% produksi total permanen";
        els.btn.textContent = "Dimiliki";
        els.btn.disabled = true;
        els.row.classList.add("maxed");
      } else if (isNext) {
        var affordable = state.coins >= f.cost;
        els.count.textContent = "Beli: " + formatNumber(f.cost) + " koin";
        els.btn.textContent = affordable ? "Beli" : formatNumber(f.cost);
        els.btn.disabled = !affordable;
        els.row.classList.toggle("affordable", affordable);
      } else {
        els.count.textContent = "Perlu Lantai " + (f.n - 1) + " dulu · " + formatNumber(f.cost) + " koin";
        els.btn.textContent = formatNumber(f.cost);
        els.btn.disabled = true;
      }
    });
  }

  function updateClickUpgradeUI() {
    var cost = clickUpgradeCost();
    var affordable = state.coins >= cost;
    $buyClickUpgrade.textContent = affordable ? "Beli (" + formatNumber(cost) + ")" : formatNumber(cost);
    $buyClickUpgrade.disabled = !affordable;
  }

  function updateFullAutoUI() {
    if (state.fullAuto) {
      $buyFullAuto.textContent = "Aktif";
      $buyFullAuto.disabled = true;
      if ($fullAutoCard) $fullAutoCard.classList.add("maxed");
      if ($fullAutoCount) {
        $fullAutoCount.textContent = "Aktif · +" + formatNumber(FULL_AUTO_RATE * clickValue()) + "/detik otomatis";
      }
    } else {
      var affordable = state.coins >= FULL_AUTO_COST;
      $buyFullAuto.textContent = affordable ? "Beli (" + formatNumber(FULL_AUTO_COST) + ")" : formatNumber(FULL_AUTO_COST);
      $buyFullAuto.disabled = !affordable;
      if ($fullAutoCount) {
        $fullAutoCount.textContent = "Sekali beli · nge-tap otomatis 2× nilai tap per detik";
      }
    }
  }

  function updatePickupUI() {
    if (!$buyPickup) return;
    if (state.pickupOwned) {
      $buyPickup.textContent = "Dimiliki";
      $buyPickup.disabled = true;
      if ($pickupCard) $pickupCard.classList.add("maxed");
      if ($pickupCount) $pickupCount.textContent = "Dimiliki · bisa angkut 250kg sekali jalan";
    } else {
      var affordable = state.coins >= PICKUP_COST;
      $buyPickup.textContent = affordable ? "Beli (" + formatNumber(PICKUP_COST) + ")" : formatNumber(PICKUP_COST);
      $buyPickup.disabled = !affordable;
      if ($pickupCount) $pickupCount.textContent = "Sekali beli · buka mode nyetir + belanja 250kg";
    }
  }

  // topbar bean stock indicator: small beans icon + "XX kg", red when low
  var beanStockText = document.createElement("span");
  if ($beanStock) {
    $beanStock.appendChild(createIcon("beans", { size: 12 }));
    $beanStock.appendChild(beanStockText);
  }

  function updateBeanStockUI() {
    beanStockText.textContent = formatNumber(state.beans) + " kg";
    if ($beanStock) $beanStock.classList.toggle("low", state.beans < BEAN_LOW_KG);
  }

  function updatePrestigeUI() {
    var gain = prestigeGainAvailable();
    if (gain > 0) {
      $prestigeDesc.textContent = "Dapat +" + gain + " Biji Kopi Prestise (bonus permanen +" + (gain * 2) + "% produksi)";
      $prestigeBuyBtn.disabled = false;
    } else {
      var need = Math.pow(state.prestigePoints + 1, 2) * 1e6;
      $prestigeDesc.textContent = "Kumpulkan " + formatNumber(need) + " koin total (lifetime) untuk cabang berikutnya";
      $prestigeBuyBtn.disabled = true;
    }
  }

  function updateStats() {
    $coinTotal.textContent = formatNumber(state.coins) + " koin";
    $coinCps.textContent = "+" + formatNumber(effectiveCps()) + "/detik";
    $tapValue.textContent = "+" + formatNumber(clickValue()) + " / tap";
  }

  // ---------- minimap: top-down schematic of the roads + landmarks + "you" ----------
  var MM = 96, MM_C = 48, MM_SCALE = 96 / 62; // world +-31 -> 96px
  function mmX(wx) { return MM_C + wx * MM_SCALE; }
  function mmY(wz) { return MM_C - wz * MM_SCALE; } // +z = up (north)
  function drawMinimap() {
    if (!minimapCtx) return;
    // the city minimap is meaningless inside the interior/boss room -> hide it
    var m = cafeScene && cafeScene.getMode ? cafeScene.getMode() : "idle";
    if ($minimap) $minimap.classList.toggle("hidden", m === "interior" || m === "boss");
    if (m === "interior" || m === "boss") return;
    var c = minimapCtx;
    c.clearRect(0, 0, MM, MM);
    // roads
    c.strokeStyle = "rgba(220,214,198,0.7)";
    c.lineWidth = MM_SCALE * 3.2;
    c.beginPath(); c.moveTo(0, mmY(4.65)); c.lineTo(MM, mmY(4.65)); c.stroke();   // main road
    c.beginPath(); c.moveTo(0, mmY(-9)); c.lineTo(MM, mmY(-9)); c.stroke();       // avenue
    c.beginPath(); c.moveTo(mmX(-9), 0); c.lineTo(mmX(-9), MM); c.stroke();       // cross west
    c.beginPath(); c.moveTo(mmX(9), 0); c.lineTo(mmX(9), MM); c.stroke();         // cross east
    // landmarks
    function dot(wx, wz, color, r) { c.fillStyle = color; c.beginPath(); c.arc(mmX(wx), mmY(wz), r, 0, 6.283); c.fill(); }
    dot(19, 0.6, "#8a9a6a", 3);   // supplier (Toko Grosir)
    dot(0, 0, "#ffd54f", 3.5);    // cafe (you-are-here home)
    // player / pickup marker with heading
    if (cafeScene && cafeScene.getActorPos) {
      var a = cafeScene.getActorPos();
      if (a.mode !== "idle") {
        var px = mmX(a.x), py = mmY(a.z);
        c.fillStyle = a.mode === "drive" ? "#e57373" : "#4fc3f7";
        c.save(); c.translate(px, py); c.rotate(a.yaw); // yaw 0 = +z = up
        c.beginPath(); c.moveTo(0, -5); c.lineTo(3.5, 4); c.lineTo(-3.5, 4); c.closePath(); c.fill();
        c.restore();
      }
    }
  }

  function renderAll() {
    updateStats();
    updateBuildingsUI();
    updateFloorsUI();
    updateClickUpgradeUI();
    updateFullAutoUI();
    updatePickupUI();
    updateBeanStockUI();
    updatePrestigeUI();
  }

  function syncPatio() {
    if (cafeScene && cafeScene.setPatioTables) cafeScene.setPatioTables(state.owned.meja || 0);
  }
  function buyBuilding(b) {
    var cost = buildingCost(b);
    if (state.coins < cost) return;
    state.coins -= cost;
    state.owned[b.id] += 1;
    if (b.id === "meja") syncPatio(); // a new table + customer appears on the patio
    renderAll();
  }

  function buyClickUpgrade() {
    var cost = clickUpgradeCost();
    if (state.coins < cost) return;
    state.coins -= cost;
    state.clickUpgradeLevel += 1;
    renderAll();
  }

  function buyFloor(f) {
    if (f.n !== state.floorsOwned + 1) return;
    if (state.coins < f.cost) return;
    state.coins -= f.cost;
    state.floorsOwned += 1;
    if (cafeScene) cafeScene.setFloors(state.floorsOwned);
    renderAll();
  }

  function buyFullAuto() {
    if (state.fullAuto) return;
    if (state.coins < FULL_AUTO_COST) return;
    state.coins -= FULL_AUTO_COST;
    state.fullAuto = true;
    renderAll();
  }

  function buyPickup() {
    if (state.pickupOwned) return;
    if (state.coins < PICKUP_COST) return;
    state.coins -= PICKUP_COST;
    state.pickupOwned = true;
    if (cafeScene) cafeScene.setPickupOwned(true);
    renderAll();
  }

  // ---------- tap ----------
  var audioCtx = null;
  // create the shared context AND resume it (Android WebView starts it
  // "suspended" until a user gesture; every sound path must resume or it's silent)
  function ensureAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) {}
    return audioCtx;
  }
  function playTapSound() {
    if (!state.sound) return;
    try {
      ensureAudio();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520 + Math.random() * 80, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.13);
    } catch (e) {}
  }

  // cute two-note "nya" chirp for cat taps (shares the lazily-created audioCtx)
  function playCatSound() {
    if (!state.sound) return;
    try {
      ensureAudio();
      var t0 = audioCtx.currentTime;
      var osc1 = audioCtx.createOscillator();
      var gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, t0);
      osc1.frequency.exponentialRampToValueAtTime(1320, t0 + 0.09);
      gain1.gain.setValueAtTime(0.07, t0);
      gain1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(t0);
      osc1.stop(t0 + 0.13);
      var osc2 = audioCtx.createOscillator();
      var gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1180, t0 + 0.11);
      gain2.gain.setValueAtTime(0.0001, t0);
      gain2.gain.setValueAtTime(0.06, t0 + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(t0 + 0.11);
      osc2.stop(t0 + 0.21);
    } catch (e) {}
  }

  // ---------- background music: gentle procedural ambient loop ----------
  // Lofi cafe BGM, 100% procedural (no samples -> zero copyright). Warm 3-sine
  // pad + soft bass + a gentle melody that walks stepwise through the C-major
  // pentatonic (always consonant over the diatonic chords, so it never sounds
  // "aneh"), with 4 chord progressions that rotate for variety. A lookahead
  // scheduler places notes on an 8th grid at ~68 BPM.
  var musicNodes = null;
  // pad voicings (warm, low) + bass root, per chord — all diatonic to C major
  var MUSIC_VOICING = {
    C:  { pad: [130.81, 164.81, 196.00], bass: 65.41 },
    G:  { pad: [146.83, 196.00, 246.94], bass: 98.00 },
    Am: { pad: [130.81, 164.81, 220.00], bass: 55.00 },
    F:  { pad: [130.81, 174.61, 220.00], bass: 87.31 },
    Em: { pad: [123.47, 164.81, 196.00], bass: 82.41 },
    Dm: { pad: [146.83, 174.61, 220.00], bass: 73.42 }
  };
  var MUSIC_PROGS = [
    ["C", "Am", "F", "G"], ["C", "G", "Am", "F"],
    ["Am", "F", "C", "G"], ["F", "G", "Em", "Am"]
  ];
  // C-major pentatonic across ~1.5 octaves — the melody note pool
  var MEL_SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];
  function startMusic() {
    if (musicNodes || !state.music) return;
    try {
      ensureAudio();
      var t0 = audioCtx.currentTime;
      var master = audioCtx.createGain();
      master.gain.setValueAtTime(0.0001, t0);
      master.gain.linearRampToValueAtTime(0.13, t0 + 3); // audible over a phone speaker (was 0.05 = nearly silent)
      master.connect(audioCtx.destination);
      // warm bus (pad + bass) and a brighter bus (melody) so the tune cuts through
      var warm = audioCtx.createBiquadFilter();
      warm.type = "lowpass"; warm.frequency.value = 1300; warm.Q.value = 0.4; warm.connect(master);
      var bright = audioCtx.createBiquadFilter();
      bright.type = "lowpass"; bright.frequency.value = 2600; bright.Q.value = 0.5; bright.connect(master);
      var oscs = [];
      var padGains = [];
      for (var i = 0; i < 3; i++) {
        var o = audioCtx.createOscillator(); o.type = "sine";
        var g = audioCtx.createGain(); g.gain.value = i === 0 ? 0.34 : 0.24;
        o.connect(g); g.connect(warm); o.start(); oscs.push(o); padGains.push(g);
      }
      var bass = audioCtx.createOscillator(); bass.type = "triangle";
      var bassG = audioCtx.createGain(); bassG.gain.value = 0.32;
      bass.connect(bassG); bassG.connect(warm); bass.start(); oscs.push(bass);

      var prog = MUSIC_PROGS[Math.floor(Math.random() * MUSIC_PROGS.length)];
      var chordIdx = 0, eighth = 0, melIdx = 4;
      var sEighth = (60 / 68) / 2; // ~0.441s per 8th
      var nextTime = t0 + 0.15;
      function setChord(name, when) {
        var v = MUSIC_VOICING[name];
        for (var k = 0; k < 3; k++) oscs[k].frequency.setTargetAtTime(v.pad[k], when, 0.09);
        bass.frequency.setTargetAtTime(v.bass, when, 0.09);
      }
      function playMel(freq, when) {
        var o = audioCtx.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
        var g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(0.12, when + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0008, when + 0.5);
        o.connect(g); g.connect(bright); o.start(when); o.stop(when + 0.56);
      }
      setChord(prog[0], nextTime);
      function scheduler() {
        while (nextTime < audioCtx.currentTime + 0.16) {
          var beatInBar = eighth % 8; // 8 eighths per bar, 1 chord per bar
          if (eighth > 0 && beatInBar === 0) {
            chordIdx++;
            if (chordIdx >= prog.length) { chordIdx = 0; prog = MUSIC_PROGS[Math.floor(Math.random() * MUSIC_PROGS.length)]; }
            setChord(prog[chordIdx], nextTime);
          }
          var strong = (beatInBar % 2 === 0);
          if (Math.random() < (strong ? 0.5 : 0.22)) { // rests give it a laid-back feel
            melIdx += Math.floor(Math.random() * 5) - 2; // stepwise walk -2..+2
            if (melIdx < 0) melIdx = 1;
            if (melIdx > MEL_SCALE.length - 1) melIdx = MEL_SCALE.length - 2;
            playMel(MEL_SCALE[melIdx], nextTime);
          }
          nextTime += sEighth; eighth++;
        }
      }
      scheduler();
      var timer = setInterval(scheduler, 30);
      musicNodes = { oscs: oscs, master: master, timer: timer };
    } catch (e) {}
  }
  function stopMusic() {
    if (!musicNodes) return;
    var n = musicNodes;
    musicNodes = null;
    try {
      clearInterval(n.timer);
      var t = audioCtx.currentTime;
      n.master.gain.cancelScheduledValues(t);
      n.master.gain.setTargetAtTime(0.0001, t, 0.4);
      setTimeout(function () {
        try { n.oscs.forEach(function (o) { o.stop(); }); } catch (e) {}
      }, 1400);
    } catch (e) {}
  }

  function spawnFloater(x, y, amount, withPaw) {
    var el = document.createElement("div");
    el.className = "floater";
    if (withPaw) el.appendChild(createIcon("paw", { size: 16 }));
    el.appendChild(document.createTextNode("+" + formatNumber(amount)));
    el.style.left = x + "px";
    el.style.top = y + "px";
    $floaters.appendChild(el);
    setTimeout(function () { el.remove(); }, 950);
  }

  function spawnHeartFloater(x, y) {
    var el = document.createElement("div");
    el.className = "floater heart";
    el.appendChild(createIcon("heart", { size: 18 }));
    el.style.left = x + "px";
    el.style.top = y + "px";
    $floaters.appendChild(el);
    setTimeout(function () { el.remove(); }, 950);
  }

  var tapCount = 0;

  function handleTap(clientX, clientY) {
    var val = clickValue();
    state.coins += val;
    state.lifetimeCoins += val;
    var rect = $floaters.getBoundingClientRect();
    var x = clientX - rect.left - 15 + (Math.random() * 30 - 15);
    var y = clientY - rect.top - 10;
    tapCount += 1;
    spawnFloater(x, y, val, tapCount % 8 === 0);
    playTapSound();
    updateStats();
  }

  // cat tap: EXACTLY the same coin award as a normal tap (same handleTap),
  // plus hearts + a "nya" chirp on top
  function handleCatTap(clientX, clientY) {
    handleTap(clientX, clientY);
    var rect = $floaters.getBoundingClientRect();
    var baseX = clientX - rect.left - 9;
    var baseY = clientY - rect.top - 28;
    for (var i = 0; i < 3; i++) {
      (function (idx) {
        var hx = baseX + (Math.random() * 36 - 18);
        var hy = baseY - idx * 6;
        setTimeout(function () { spawnHeartFloater(hx, hy); }, idx * 80);
      })(i);
    }
    playCatSound();
  }

  $buyClickUpgrade.addEventListener("click", buyClickUpgrade);
  $buyFullAuto.addEventListener("click", buyFullAuto);
  if ($buyPickup) $buyPickup.addEventListener("click", buyPickup);

  // ---------- day-night sky + synthetic game clock ----------
  // Driven by cafe3d's onDayPhase callback (~4x/second, throttled inside the
  // render loop). phase01 0.0 = 06:00, one 180s cycle = 24h of game time.
  var SKY_DAY = [[135, 168, 204], [184, 200, 216], [232, 216, 184]];   // #87a8cc #b8c8d8 #e8d8b8
  var SKY_NIGHT = [[13, 16, 32], [30, 34, 51], [58, 53, 80]];          // #0d1020 #1e2233 #3a3550
  var SKY_VARS = ["--sky-top", "--sky-mid", "--sky-bot"];
  var clockTimeEl = document.createElement("span");
  var clockIconEl = null;
  var lastIsDay = null; // icon node is only rebuilt when day/night actually flips
  if ($gameClock) $gameClock.appendChild(clockTimeEl);

  // same day curve as cafe3d: 1 = day, 0 = night, smoothstep dusk/dawn
  function dayFactor01(p) {
    if (p < 0.40) return 1;
    if (p < 0.50) { var t = (p - 0.40) / 0.10; return 1 - t * t * (3 - 2 * t); }
    if (p < 0.90) return 0;
    var t2 = (p - 0.90) / 0.10;
    return t2 * t2 * (3 - 2 * t2);
  }

  function rgbStr(r, g, b) {
    return "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
  }

  function handleDayPhase(phase01) {
    var k = dayFactor01(phase01);
    for (var i = 0; i < 3; i++) {
      var d = SKY_DAY[i];
      var n = SKY_NIGHT[i];
      $tapArea.style.setProperty(SKY_VARS[i], rgbStr(
        n[0] + (d[0] - n[0]) * k,
        n[1] + (d[1] - n[1]) * k,
        n[2] + (d[2] - n[2]) * k
      ));
    }
    var h = (6 + phase01 * 24) % 24;
    var hh = Math.floor(h);
    var mm = Math.floor((h - hh) * 60);
    clockTimeEl.textContent = (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
    var isDay = k >= 0.5;
    if (isDay !== lastIsDay) {
      lastIsDay = isDay;
      if (clockIconEl && clockIconEl.parentNode) clockIconEl.parentNode.removeChild(clockIconEl);
      clockIconEl = createIcon(isDay ? "sun" : "moon", { size: 11 });
      if ($gameClock) $gameClock.insertBefore(clockIconEl, clockTimeEl);
    }
  }

  // ---------- tabs ----------
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
      if (tab.dataset.tab === "reviews") renderReviewsPanel();
      if (tab.dataset.tab === "missions") renderMissionsPanel();
    });
  });

  var $payDebtBtn = document.getElementById("pay-debt-btn");
  if ($payDebtBtn) $payDebtBtn.addEventListener("click", payDebt);
  var $storyClose = document.getElementById("story-close");
  if ($storyClose) $storyClose.addEventListener("click", function () {
    if ($storyModal) $storyModal.classList.add("hidden");
    tryShowDaily();
  });

  // ---------- prestige ----------
  function openPrestigeModal() {
    var gain = prestigeGainAvailable();
    if (gain <= 0) {
      updatePrestigeUI();
      $prestigeModalText.textContent = "Belum cukup koin lifetime untuk buka cabang baru. Terus kumpulkan koin!";
      $prestigeConfirm.classList.add("hidden");
    } else {
      $prestigeModalText.textContent = "Kamu akan reset koin & bangunan, tapi dapat +" + gain +
        " Biji Kopi Prestise permanen (total jadi " + (state.prestigePoints + gain) +
        ", bonus produksi +" + ((state.prestigePoints + gain) * 2) + "%).";
      $prestigeConfirm.classList.remove("hidden");
    }
    $prestigeModal.classList.remove("hidden");
  }

  function doPrestige() {
    var gain = prestigeGainAvailable();
    if (gain <= 0) return;
    state.prestigePoints += gain;
    state.coins = 0;
    state.clickUpgradeLevel = 0;
    BUILDINGS.forEach(function (b) { state.owned[b.id] = 0; });
    syncPatio(); // patio empties on a fresh branch
    save();
    renderAll();
    $prestigeModal.classList.add("hidden");
  }

  $prestigeBtn.addEventListener("click", openPrestigeModal);
  $prestigeBuyBtn.addEventListener("click", openPrestigeModal);
  $prestigeCancel.addEventListener("click", function () { $prestigeModal.classList.add("hidden"); });
  $prestigeConfirm.addEventListener("click", doPrestige);

  // ---------- settings (sound + graphics quality) ----------
  var QUALITY_LABELS = { low: "Low", medium: "Medium", standar: "Standar", hd: "HD", ultra: "Ultra HD" };
  function updateSoundToggleUI() {
    $soundToggle.textContent = state.sound ? "Nyala" : "Mati";
    $soundToggle.classList.toggle("off", !state.sound);
  }
  function buildQualityOptions() {
    clearChildren($qualityOptions);
    QUALITY_LEVELS.forEach(function (lvl) {
      var b = document.createElement("button");
      b.className = "quality-opt" + (state.quality === lvl ? " active" : "");
      b.textContent = QUALITY_LABELS[lvl];
      b.addEventListener("click", function () {
        state.quality = lvl;
        if (cafeScene) cafeScene.setQuality(lvl);
        save();
        buildQualityOptions();
      });
      $qualityOptions.appendChild(b);
    });
  }
  function buildDifficultyOptions() {
    if (!$difficultyOptions) return;
    clearChildren($difficultyOptions);
    DIFFICULTIES.forEach(function (d) {
      var b = document.createElement("button");
      b.className = "quality-opt" + (state.difficulty === d ? " active" : "");
      b.textContent = DIFF_PARAMS[d].label;
      b.addEventListener("click", function () {
        state.difficulty = d;
        save();
        buildDifficultyOptions();
      });
      $difficultyOptions.appendChild(b);
    });
  }
  if ($shopnameInput) {
    // live rename: updates topbar + 3D sign, clamped + non-empty fallback on blur
    $shopnameInput.addEventListener("input", function () {
      var v = $shopnameInput.value.slice(0, 24);
      state.shopName = v.trim() ? v : "Kedai Kopi";
      applyShopName();
    });
    $shopnameInput.addEventListener("blur", function () {
      if (!$shopnameInput.value.trim()) {
        state.shopName = "Kedai Kopi Bahagia";
        $shopnameInput.value = state.shopName;
        applyShopName();
      }
      save();
    });
  }
  function updateMusicToggleUI() {
    if (!$musicToggle) return;
    $musicToggle.textContent = state.music ? "Nyala" : "Mati";
    $musicToggle.classList.toggle("off", !state.music);
  }
  function updateSensitivityUI() {
    if ($sensitivitySlider) $sensitivitySlider.value = state.sensitivity;
    if ($sensitivityVal) $sensitivityVal.textContent = state.sensitivity.toFixed(1) + "x";
    if ($fovSlider) $fovSlider.value = state.fov;
    if ($fovVal) $fovVal.textContent = Math.round(state.fov) + "°";
  }
  if ($settingsBtn) {
    $settingsBtn.addEventListener("click", function () {
      if ($shopnameInput) $shopnameInput.value = state.shopName;
      updateSoundToggleUI();
      updateMusicToggleUI();
      updateSensitivityUI();
      buildQualityOptions();
      buildDifficultyOptions();
      $settingsModal.classList.remove("hidden");
    });
  }
  if ($soundToggle) {
    $soundToggle.addEventListener("click", function () {
      state.sound = !state.sound;
      updateSoundToggleUI();
      save();
    });
  }
  if ($musicToggle) {
    $musicToggle.addEventListener("click", function () {
      state.music = !state.music;
      updateMusicToggleUI();
      if (state.music) startMusic(); else stopMusic();
      save();
    });
  }
  if ($sensitivitySlider) {
    $sensitivitySlider.addEventListener("input", function () {
      state.sensitivity = Math.max(0.3, Math.min(2.5, parseFloat($sensitivitySlider.value) || 1));
      if ($sensitivityVal) $sensitivityVal.textContent = state.sensitivity.toFixed(1) + "x";
      if (cafeScene && cafeScene.setSensitivity) cafeScene.setSensitivity(state.sensitivity);
    });
    $sensitivitySlider.addEventListener("change", save);
  }
  if ($fovSlider) {
    $fovSlider.addEventListener("input", function () {
      state.fov = Math.max(50, Math.min(100, parseFloat($fovSlider.value) || 70));
      if ($fovVal) $fovVal.textContent = Math.round(state.fov) + "°";
      if (cafeScene && cafeScene.setFov) cafeScene.setFov(state.fov);
    });
    $fovSlider.addEventListener("change", save);
  }
  if ($settingsClose) {
    $settingsClose.addEventListener("click", function () { $settingsModal.classList.add("hidden"); });
  }

  // start the ambient music on the first user gesture (autoplay policy)
  // keep re-trying on every gesture until the context is actually RUNNING
  // (one resume() call can be ignored by the WebView; don't give up after one tap)
  function armMusic() {
    ensureAudio();
    if (state.music) startMusic();
    if (audioCtx && audioCtx.state === "running") {
      document.removeEventListener("pointerdown", armMusic);
      document.removeEventListener("touchend", armMusic);
    }
  }
  document.addEventListener("pointerdown", armMusic);
  document.addEventListener("touchend", armMusic);

  // ---------- offline earnings ----------
  // ---------- daily reward + login streak (retention) ----------
  function localMidnight(ts) { var d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  var pendingDaily = null; // { streak, reward } if a reward is claimable today
  function dailyRewardFor(streak) {
    // ~90s of current production, boosted by the streak (caps at day 7 = ×3.1);
    // floored so a brand-new shop still gets a meaningful kickstart
    var base = Math.max(200, Math.floor(effectiveCps() * 90));
    var mult = 1 + Math.min(streak, 7) * 0.3;
    return Math.floor(base * mult);
  }
  function computeDaily() {
    var todayM = localMidnight(Date.now());
    var lastM = state.lastDailyClaim ? localMidnight(state.lastDailyClaim) : null;
    if (lastM === todayM) return null; // already claimed today
    var days = lastM !== null ? Math.round((todayM - lastM) / 86400000) : null;
    var streak = (days === 1) ? (state.dailyStreak + 1) : 1; // consecutive = +1, else reset
    return { streak: streak, reward: dailyRewardFor(streak) };
  }
  function anyModalOpen() { return !!document.querySelector(".modal:not(.hidden)"); }
  function showDailyModal() {
    var modal = document.getElementById("daily-modal");
    var label = document.getElementById("daily-streak-label");
    var text = document.getElementById("daily-text");
    if (!modal || !pendingDaily) return;
    if (label) label.textContent = "Hari ke-" + pendingDaily.streak + " beruntun";
    if (text) text.textContent = "+" + formatNumber(pendingDaily.reward) + " koin!" +
      (pendingDaily.streak < 7 ? " Balik besok, hadiahnya makin gede." : " Streak maksimal — mantap!");
    modal.classList.remove("hidden");
  }
  function claimDaily() {
    if (!pendingDaily) return;
    state.coins += pendingDaily.reward;
    state.lifetimeCoins += pendingDaily.reward;
    state.dailyStreak = pendingDaily.streak;
    state.lastDailyClaim = Date.now();
    pendingDaily = null;
    save();
    updateStats();
    var modal = document.getElementById("daily-modal");
    if (modal) modal.classList.add("hidden");
  }
  function tryShowDaily() {
    // show only once nothing else is on screen -> chains naturally after intro/offline
    if (pendingDaily && !anyModalOpen()) showDailyModal();
  }

  function applyOfflineEarnings() {
    if (!state.lastSave) return;
    var elapsedMs = Date.now() - state.lastSave;
    if (elapsedMs < 5000) return;
    var elapsedSec = Math.min(elapsedMs / 1000, OFFLINE_CAP_SECONDS);
    // two segments: full production while the bean stock lasts, then the
    // empty-stock multiplier for the remainder. Beans only burn while the
    // buildings actually produce (rawBuildingCps > 0); the full-auto tap
    // income is unaffected by beans in both segments.
    var base = rawBuildingCps() * prestigeMultiplier() * floorMultiplier();
    var autoCps = state.fullAuto ? FULL_AUTO_RATE * clickValue() : 0;
    var earned = 0;
    var beansRanOut = false;
    if (base > 0) {
      var secsWithBeans = Math.min(elapsedSec, state.beans / BEAN_RATE);
      var secsWithout = elapsedSec - secsWithBeans;
      earned = (base + autoCps) * secsWithBeans + (base * NO_BEANS_MULT + autoCps) * secsWithout;
      state.beans = Math.max(0, state.beans - secsWithBeans * BEAN_RATE);
      if (secsWithout > 0) {
        state.beans = 0;
        beansRanOut = true;
      }
    } else {
      earned = autoCps * elapsedSec;
    }
    earned *= OFFLINE_EFFICIENCY;
    if (earned < 1) return;
    state.coins += earned;
    state.lifetimeCoins += earned;
    var capped = elapsedMs / 1000 > OFFLINE_CAP_SECONDS;
    $offlineText.textContent = "Selama kamu pergi, kedai menghasilkan " + formatNumber(earned) + " koin" +
      (capped ? " (dihitung maksimal 8 jam)." : ".") +
      (beansRanOut ? " Stok biji kopi sempat habis, produksi melambat — beli lagi di toko grosir!" : "");
    $offlineModal.classList.remove("hidden");
  }

  $offlineClose.addEventListener("click", function () {
    $offlineModal.classList.add("hidden");
    tryShowDaily();
  });
  var $dailyClaim = document.getElementById("daily-claim");
  if ($dailyClaim) $dailyClaim.addEventListener("click", claimDaily);

  // ==================================================================
  // STAGE B2 HOOKS — primitives the 3D layer wires up later. Everything
  // lives at module scope inside this IIFE so the initCafeScene options
  // callbacks defined in init() can close over all of it directly:
  //   joyVec, getUiMode, setUiMode, setActionLabel, setActionHandler,
  //   setExitModeHandler, openSupplierDialog, depositCarried,
  //   getCarriedBeans, showBubble, randomBubblePhrase, startOrderEvent,
  //   moveOrderBubble / updateOrderAnchor, orderActive, completeOrder,
  //   failOrder
  // ==================================================================

  // ---------- supplier dialog (Toko Grosir Kopi) + carried beans ----------
  // carriedBeans is intentionally NOT persisted: it only lives in this module
  // variable, so on load it is always 0 — beans still "in hand" when the app
  // closes are lost unless deposited into state.beans via depositCarried().
  var carriedBeans = 0;
  var supplierCapacity = 0;
  var supplierPrice = 0;
  var supplierOnDone = null;

  var carriedChipText = document.createElement("span");
  if ($carriedChip) {
    $carriedChip.appendChild(createIcon("beans", { size: 14 }));
    $carriedChip.appendChild(carriedChipText);
  }

  function getCarriedBeans() { return carriedBeans; }

  function updateCarriedChip() {
    if (!$carriedChip) return;
    if (carriedBeans > 0) {
      carriedChipText.textContent = formatNumber(carriedBeans) + " kg";
      $carriedChip.classList.remove("hidden");
    } else {
      $carriedChip.classList.add("hidden");
    }
  }

  // adds the carried beans to the shop stock (no cap) and hides the chip;
  // the 3D layer calls this when the player returns to the cafe door
  function depositCarried() {
    if (carriedBeans > 0) {
      state.beans += carriedBeans;
      carriedBeans = 0;
    }
    updateCarriedChip();
    updateBeanStockUI();
  }

  // reusable buy dialog. Deducts coins here; beans go to carriedBeans.
  // onDone(boughtKg) fires exactly once on any outcome (0 kg on cancel).
  function openSupplierDialog(capacityKg, onDone) {
    supplierCapacity = Math.max(0, Math.floor(capacityKg || 0) - carriedBeans);
    supplierPrice = pricePerKg();
    supplierOnDone = typeof onDone === "function" ? onDone : null;
    $supplierText.textContent =
      "Harga biji kopi: " + formatNumber(supplierPrice) + " koin/kg. " +
      "Uangmu: " + formatNumber(state.coins) + " koin. " +
      "Kapasitas angkut: " + supplierCapacity + " kg.";
    var halfKg = Math.max(1, Math.floor(supplierCapacity / 2));
    $supplierBuyFull.textContent = "Beli Penuh (" + supplierCapacity + " kg)";
    $supplierBuyHalf.textContent = "Beli Setengah (" + halfKg + " kg)";
    var canBuyAny = supplierCapacity >= 1 && state.coins >= supplierPrice;
    $supplierBuyFull.disabled = !canBuyAny;
    $supplierBuyHalf.disabled = !canBuyAny;
    $supplierModal.classList.remove("hidden");
  }

  function closeSupplierDialog(boughtKg) {
    $supplierModal.classList.add("hidden");
    var cb = supplierOnDone;
    supplierOnDone = null;
    if (cb) cb(boughtKg);
  }

  function supplierBuy(desiredKg) {
    var affordableKg = supplierPrice > 0 ? Math.floor(state.coins / supplierPrice) : 0;
    var bought = Math.max(0, Math.min(desiredKg, affordableKg));
    if (bought > 0) {
      state.coins -= bought * supplierPrice;
      carriedBeans += bought;
      updateCarriedChip();
      updateStats();
    }
    closeSupplierDialog(bought);
  }

  $supplierBuyFull.addEventListener("click", function () { supplierBuy(supplierCapacity); });
  $supplierBuyHalf.addEventListener("click", function () { supplierBuy(Math.max(1, Math.floor(supplierCapacity / 2))); });
  $supplierCancel.addEventListener("click", function () { closeSupplierDialog(0); });

  // ---------- NPC speech bubbles ----------
  // coordinates are relative to #tap-area's top-left — the same space the 3D
  // layer gets when projecting a world position onto the canvas (the canvas
  // sits at the top-left of #tap-area)
  var BUBBLE_PHRASES = [
    "Kopinya mantap!",
    "Antri dulu ya",
    "Wangi banget...",
    "Latte satu dong",
    "Tempatnya cozy",
    "Es kopi susu satu!",
    "Aromanya juara",
    "Nongkrong sini yuk",
    "Kucingnya lucu!",
    "Baristanya ramah ya"
  ];

  function randomBubblePhrase() {
    return BUBBLE_PHRASES[Math.floor(Math.random() * BUBBLE_PHRASES.length)];
  }

  function showBubble(screenX, screenY, text, durMs) {
    durMs = durMs || 1600;
    var el = document.createElement("div");
    el.className = "bubble-chip";
    el.textContent = text;
    el.style.left = screenX + "px";
    el.style.top = screenY + "px";
    el.style.animationDuration = durMs + "ms";
    $bubbleLayer.appendChild(el);
    setTimeout(function () { el.remove(); }, durMs);
    return el;
  }

  // ---------- order mini-event primitives ----------
  // B1 provides ONLY the primitives; spawn scheduling (every 60-120s) and the
  // 10s timeout live in the Stage B2 hooks. The order bubble tracks a moving
  // NPC: the 3D layer calls moveOrderBubble(x, y) with the projected anchor.
  var orderBubbleEl = null;

  function orderActive() { return orderBubbleEl !== null; }

  function startOrderEvent(anchorProvider) {
    if (orderBubbleEl) failOrder(); // only one order at a time
    orderBubbleEl = document.createElement("div");
    orderBubbleEl.className = "bubble-chip order";
    orderBubbleEl.textContent = "Pesanan: kopi! (tap!)";
    orderBubbleEl.style.display = "none"; // shown once the first visible anchor lands
    $bubbleLayer.appendChild(orderBubbleEl);
    if (typeof anchorProvider === "function") {
      var a = anchorProvider();
      if (a && a.visible) moveOrderBubble(a.x, a.y);
    }
    return orderBubbleEl;
  }

  function moveOrderBubble(x, y) {
    if (!orderBubbleEl) return;
    orderBubbleEl.style.display = "";
    orderBubbleEl.style.left = x + "px";
    orderBubbleEl.style.top = y + "px";
  }

  function hideOrderBubble() {
    if (!orderBubbleEl) return;
    orderBubbleEl.style.display = "none";
  }

  // alias: Stage B2 calls this name from its per-frame anchor update
  var updateOrderAnchor = moveOrderBubble;

  function removeOrderBubble() {
    if (orderBubbleEl && orderBubbleEl.parentNode) {
      orderBubbleEl.parentNode.removeChild(orderBubbleEl);
    }
    orderBubbleEl = null;
  }

  // order fulfilled: 30x tap value + 3 heart floaters + the cat chirp
  function completeOrder() {
    if (!orderBubbleEl) return;
    var rect = orderBubbleEl.getBoundingClientRect();
    var frect = $floaters.getBoundingClientRect();
    var bx = rect.left - frect.left + rect.width / 2;
    var by = rect.top - frect.top;
    removeOrderBubble();
    var val = 30 * clickValue();
    state.coins += val;
    state.lifetimeCoins += val;
    spawnFloater(bx, by, val, false);
    for (var i = 0; i < 3; i++) {
      (function (idx) {
        var hx = bx + (Math.random() * 36 - 18);
        var hy = by - 18 - idx * 6;
        setTimeout(function () { spawnHeartFloater(hx, hy); }, idx * 80);
      })(i);
    }
    playCatSound();
    ordersServedRecently = Math.min(4, ordersServedRecently + 1); // fast service -> better rating
    updateStats();
  }

  // order expired / aborted: remove silently
  function failOrder() {
    removeOrderBubble();
  }

  // ---------- mode-aware UI (idle | walk | drive) ----------
  // two virtual sticks read by the 3D layer every frame (magnitude <= 1):
  //   joyVec  = LEFT stick, movement (screen up = forward = -z, right = +x)
  //   lookVec = RIGHT stick, first-person camera look (x = turn, z = pitch)
  var joyVec = { x: 0, z: 0 };
  var lookVec = { x: 0, z: 0 };
  var uiMode = "idle";
  var actionHandler = null;
  var exitModeHandler = null;
  var shopCollapsed = false; // manual minimize, idle-mode only; not persisted

  function getUiMode() { return uiMode; }

  // shop is hidden either because we're in walk/drive, or the user minimized
  // it manually; the toggle button itself only makes sense in idle
  function updateShopVisibility() {
    var active = uiMode !== "idle";
    $shop.classList.toggle("shop-hidden", active || shopCollapsed);
    if ($shopToggleBtn) {
      $shopToggleBtn.classList.toggle("hidden", active);
      var landscape = window.matchMedia && window.matchMedia("(orientation: landscape)").matches;
      if (landscape) {
        // sideways arrows + stick the tab to the panel edge (open) or the
        // screen edge (collapsed) so it stays reachable, not floating mid-screen
        $shopToggleBtn.textContent = shopCollapsed ? "◀ Menu" : "Menu ▶";
        $shopToggleBtn.style.right = shopCollapsed ? "0px" : "46%";
      } else {
        $shopToggleBtn.textContent = shopCollapsed ? "▲ Menu" : "▼ Menu";
        $shopToggleBtn.style.right = "";
      }
    }
  }

  function setUiMode(mode) {
    if (["walk", "drive", "interior", "boss"].indexOf(mode) < 0) mode = "idle";
    uiMode = mode;
    var moving = mode === "walk" || mode === "drive";
    var dmode = mode === "interior" || mode === "boss";
    $modeHud.classList.toggle("hidden", !moving);
    if ($dmodeHud) $dmodeHud.classList.toggle("hidden", !dmode);
    if ($bossStrip) $bossStrip.classList.toggle("hidden", mode !== "boss");
    if ($bossBtn) $bossBtn.classList.toggle("hidden", mode !== "interior");
    if ($dmodeExit) $dmodeExit.classList.toggle("hidden", mode !== "interior");
    if ($dmodeBack) $dmodeBack.classList.toggle("hidden", mode !== "boss");
    updateShopVisibility();
    if (!moving) {
      setActionLabel(null);
      resetJoystick();
    }
  }

  if ($shopToggleBtn) {
    $shopToggleBtn.addEventListener("click", function () {
      shopCollapsed = !shopCollapsed;
      updateShopVisibility();
    });
  }

  // text for the context button; null / "" hides it
  function setActionLabel(text) {
    if (text) {
      $actionBtn.textContent = text;
      $actionBtn.classList.remove("hidden");
    } else {
      $actionBtn.classList.add("hidden");
    }
  }

  // the 3D layer registers what the context button currently does
  function setActionHandler(fn) { actionHandler = typeof fn === "function" ? fn : null; }

  // extra teardown for the "Kembali" button (the button itself always
  // returns the UI to idle first, then calls this)
  function setExitModeHandler(fn) { exitModeHandler = typeof fn === "function" ? fn : null; }

  // Wire one virtual stick: writes normalized {x,z} into `vec`, moves the knob.
  // Move/up listeners live on `document` (not the small 96px base) because a
  // thumb routinely drags outside the ring and setPointerCapture to a tiny
  // element is flaky on some Android WebViews; filtering by the captured
  // pointerId keeps the two sticks (and the action button) independent for
  // simultaneous multi-touch.
  function setupStick(base, knob, vec) {
    if (!base) return function () {};
    var pid = null;
    function apply(e) {
      var rect = base.getBoundingClientRect();
      var maxR = rect.width / 2 - 22;
      if (maxR <= 0) maxR = 1;
      var dx = e.clientX - (rect.left + rect.width / 2);
      var dy = e.clientY - (rect.top + rect.height / 2);
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len > maxR) { dx *= maxR / len; dy *= maxR / len; }
      knob.style.transform = "translate(" + dx.toFixed(1) + "px, " + dy.toFixed(1) + "px)";
      vec.x = dx / maxR;
      vec.z = dy / maxR;
    }
    function reset() {
      vec.x = 0; vec.z = 0; pid = null;
      knob.style.transform = "translate(0px, 0px)";
    }
    base.addEventListener("pointerdown", function (e) {
      e.preventDefault(); e.stopPropagation();
      pid = e.pointerId;
      try { base.setPointerCapture(e.pointerId); } catch (err) {}
      apply(e);
    });
    document.addEventListener("pointermove", function (e) {
      if (pid !== e.pointerId) return;
      e.preventDefault();
      apply(e);
    });
    var release = function (e) { if (pid === e.pointerId) reset(); };
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    return reset;
  }

  var resetMoveStick = setupStick($joyBase, $joyKnob, joyVec);
  var resetLookStick = setupStick($lookBase, $lookKnob, lookVec);
  function resetJoystick() { resetMoveStick(); resetLookStick(); }

  if ($actionBtn) {
    $actionBtn.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    $actionBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (actionHandler) actionHandler();
    });
  }

  if ($exitModeBtn) {
    $exitModeBtn.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    $exitModeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setUiMode("idle");
      if (exitModeHandler) exitModeHandler();
      depositCarried();
    });
  }

  // ==================================================================
  // STAGE B2 WIRING — connects the B1 primitives above to the cafe3d
  // walk/drive/zone/order callbacks passed to initCafeScene in init().
  // ==================================================================
  var sceneMode = "idle"; // last mode reported by cafe3d via onModeChange

  function handleModeChange(m) {
    sceneMode = m;
    setUiMode(m);
    // the idle-only entry buttons ("Keluar"/"Masuk") only show while idle
    if ($walkBtn) $walkBtn.classList.toggle("hidden", m !== "idle");
    if ($interiorBtn) $interiorBtn.classList.toggle("hidden", m !== "idle");
    // leaving idle mid-order: the ped can no longer be tapped, so cancel it
    // instead of leaving a frozen bubble until the 10s timeout
    if (m !== "idle" && orderActive()) {
      failOrder();
      if (cafeScene) cafeScene.stopOrder();
      orderCountdown = nextOrderGap();
    }
  }

  // parking at the cafe / entering the cafe door: leave the mode AND bank
  // the carried beans into the shop stock
  function exitAndDeposit() {
    if (cafeScene) cafeScene.exitToIdle();
    depositCarried();
  }

  function supplierDone() {} // bought beans already landed in carriedBeans

  function handleNearZone(zone) {
    if (!zone) {
      setActionLabel(null);
      setActionHandler(null);
      return;
    }
    if (zone === "pickup") {
      setActionLabel("Naik Pickup");
      setActionHandler(function () { if (cafeScene) cafeScene.enterDrive(); });
    } else if (zone === "supplierDoor") {
      setActionLabel("Beli Bahan (25kg)");
      setActionHandler(function () { openSupplierDialog(25, supplierDone); });
    } else if (zone === "supplierParking") {
      setActionLabel("Beli Bahan (250kg)");
      setActionHandler(function () { openSupplierDialog(250, supplierDone); });
    } else if (zone === "cafeDoor") {
      setActionLabel(sceneMode === "drive" ? "Parkir & Turun" : "Masuk Kedai");
      setActionHandler(exitAndDeposit);
    }
  }

  // idle-mode ped tap: order ped -> reward; anyone else -> a chatter bubble
  function handleNpcTap(clientX, clientY, isOrderPed) {
    if (isOrderPed && orderActive()) {
      completeOrder();
      if (cafeScene) cafeScene.stopOrder();
      return;
    }
    var rect = $bubbleLayer.getBoundingClientRect();
    showBubble(clientX - rect.left, clientY - rect.top - 10, randomBubblePhrase());
  }

  // ~10x/s while an order is active: keep the gold bubble glued to the ped
  function handleOrderAnchor(x, y, visible) {
    if (!orderActive()) return;
    if (visible) moveOrderBubble(x, y - 8);
    else hideOrderBubble();
  }

  // order scheduling: every 60-120s pick an entering ped; 10s to tap it.
  // Runs inside the existing tick loop — no new intervals.
  var ORDER_WINDOW_S = 10;
  function nextOrderGap() { return 60 + Math.random() * 60; }
  var orderCountdown = nextOrderGap();
  var orderTimeLeft = 0;

  function updateOrderEvent(dt) {
    if (!cafeScene) return;
    if (orderActive()) {
      orderTimeLeft -= dt;
      if (orderTimeLeft <= 0) {
        failOrder();
        cafeScene.stopOrder();
        orderCountdown = nextOrderGap();
      }
      return;
    }
    orderCountdown -= dt;
    if (orderCountdown <= 0) {
      if (getUiMode() === "idle" && cafeScene.startOrder()) {
        startOrderEvent(cafeScene.getOrderAnchor);
        orderTimeLeft = ORDER_WINDOW_S;
        orderCountdown = nextOrderGap();
      } else {
        orderCountdown = 5; // no entering ped on the street / in a mode: retry soon
      }
    }
  }

  // ---------- tick loop ----------
  var lastTick = Date.now();
  function tick() {
    var now = Date.now();
    var dt = (now - lastTick) / 1000;
    lastTick = now;
    // beans burn only while the buildings produce; stock floors at 0
    if (rawBuildingCps() > 0 && state.beans > 0) {
      state.beans = Math.max(0, state.beans - BEAN_RATE * dt);
    }
    updateOrderEvent(dt);
    updateRating(dt);
    updateCompetitors(dt);
    updateMissions();
    if (missionsTabActive()) renderMissionsPanel();
    // rebuild competitor set when the shop levels up (checked cheaply each tick)
    var lvl = shopLevel();
    if (lvl !== lastShopLevel) { lastShopLevel = lvl; rebuildCompetitors(); }
    var cps = effectiveCps();
    if (cps > 0) {
      var earned = cps * dt;
      state.coins += earned;
      state.lifetimeCoins += earned;
    }
    updateStats();
    updateBuildingsUI();
    updateFloorsUI();
    updateClickUpgradeUI();
    updateFullAutoUI();
    updatePickupUI();
    updateBeanStockUI();
    updatePrestigeUI();
    updateRatingUI();
    drawMinimap();
  }
  var lastShopLevel = -1;

  // ---------- static icons (elements marked with data-icon) ----------
  function applyStaticIcons() {
    document.querySelectorAll("[data-icon]").forEach(function (el) {
      clearChildren(el);
      var size = el.dataset.iconSize ? parseInt(el.dataset.iconSize, 10) : 26;
      el.appendChild(createIcon(el.dataset.icon, { size: size }));
    });
    var shopname = document.getElementById("shopname");
    var shopnameText = document.getElementById("shopname-text");
    if (shopname && shopnameText) {
      shopname.insertBefore(createIcon("cup", { size: 20 }), shopnameText);
    }
  }

  // ---------- local "come back" notifications (retention) ----------
  // accessed via the global Capacitor bridge (no bundler); a no-op on web/CDP
  function localNotifs() {
    return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) || null;
  }
  function requestNotifPerm() {
    var LN = localNotifs(); if (!LN) return;
    try { LN.requestPermissions(); } catch (e) {}
  }
  function scheduleComebackNotifs() {
    var LN = localNotifs(); if (!LN) return;
    try {
      var name = (state && state.shopName) ? state.shopName : "kedaimu";
      var now = Date.now();
      LN.schedule({ notifications: [
        { id: 3001, title: "Kopimu udah numpuk! ☕", body: "Kedai " + name + " nunggu kamu balik seduh kopi.", smallIcon: "ic_stat_kopi", schedule: { at: new Date(now + 3 * 3600 * 1000) } },
        { id: 3002, title: "Jangan putus streak-mu!", body: "Hadiah harian nunggu di " + name + ". Ambil sebelum reset tengah malam.", smallIcon: "ic_stat_kopi", schedule: { at: new Date(now + 24 * 3600 * 1000) } }
      ] });
    } catch (e) {}
  }
  function cancelComebackNotifs() {
    var LN = localNotifs(); if (!LN) return;
    try { LN.cancel({ notifications: [{ id: 3001 }, { id: 3002 }] }); } catch (e) {}
  }

  // ---------- init ----------
  function init() {
    state = load();
    applyStaticIcons();
    renderBuildingsList();
    renderFloorsList();
    cafeScene = initCafeScene($cafeCanvas, {
      onTap: handleTap,
      onCatTap: handleCatTap,
      onDayPhase: handleDayPhase,
      // Stage B2 hooks
      getJoy: function () { return joyVec; },
      getLook: function () { return lookVec; },
      onModeChange: handleModeChange,
      onNearZone: handleNearZone,
      onNpcTap: handleNpcTap,
      onOrderAnchor: handleOrderAnchor
    });
    cafeScene.setFloors(state.floorsOwned);
    syncPatio(); // reveal patio tables for meja already owned
    cafeScene.setPickupOwned(state.pickupOwned);
    if (cafeScene.setQuality) cafeScene.setQuality(state.quality);
    if (cafeScene.setSensitivity) cafeScene.setSensitivity(state.sensitivity);
    if (cafeScene.setFov) cafeScene.setFov(state.fov);
    applyShopName();
    rebuildCompetitors();
    lastShopLevel = shopLevel();
    updateRatingUI();
    setExitModeHandler(function () { if (cafeScene) cafeScene.exitToIdle(); });
    if ($walkBtn) {
      $walkBtn.addEventListener("click", function () {
        if (cafeScene && getUiMode() === "idle") cafeScene.enterWalk();
      });
    }
    // ---------- Fase D: interior + boss-room wiring ----------
    if ($interiorBtn) {
      $interiorBtn.addEventListener("click", function () {
        if (cafeScene && getUiMode() === "idle") cafeScene.enterInterior();
      });
    }
    if ($bossBtn) $bossBtn.addEventListener("click", function () { if (cafeScene) cafeScene.enterBoss(); });
    if ($dmodeBack) $dmodeBack.addEventListener("click", function () { if (cafeScene) cafeScene.backToInterior(); });
    if ($dmodeExit) $dmodeExit.addEventListener("click", function () { if (cafeScene) cafeScene.exitToIdle(); });
    // boss-room camera: drag on the top strip to rotate/tilt the view
    if ($bossStrip) {
      var stripId = null, stripX = 0, stripY = 0;
      $bossStrip.addEventListener("pointerdown", function (e) {
        stripId = e.pointerId; stripX = e.clientX; stripY = e.clientY;
        try { $bossStrip.setPointerCapture(e.pointerId); } catch (err) {}
      });
      $bossStrip.addEventListener("pointermove", function (e) {
        if (stripId !== e.pointerId || !cafeScene) return;
        cafeScene.orbitBoss(e.clientX - stripX, e.clientY - stripY);
        stripX = e.clientX; stripY = e.clientY;
      });
      var stripEnd = function (e) { if (stripId === e.pointerId) stripId = null; };
      $bossStrip.addEventListener("pointerup", stripEnd);
      $bossStrip.addEventListener("pointercancel", stripEnd);
    }
    applyOfflineEarnings();
    pendingDaily = computeDaily(); // is a daily reward claimable today?
    renderAll();
    // opening cutscene: the Boss lends you the startup money (once, first launch)
    if (!state.introSeen) {
      state.introSeen = true;
      save();
      showStory("Bos", "Jadi kamu mau buka kedai kopi? Modal 50.000 koin sudah kupinjamkan lewat brankasku.\n\nAturannya simpel: selama utang belum lunas, aku ambil 15% dari tiap pemasukanmu. Mau berhenti kupotong? Lunasi di tab \"Misi\".\n\nBegitu lunas, kedai ini murni punyamu — malah untungmu naik. Sekarang... kerja.");
    }
    tryShowDaily(); // shows the daily reward once the intro/offline modal is closed
    updateShopVisibility(); // set the menu-toggle arrow/position for the current orientation
    setInterval(tick, TICK_MS);
    setInterval(save, SAVE_EVERY_MS);
    requestNotifPerm();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { save(); scheduleComebackNotifs(); } // leaving -> remind them to come back
      else cancelComebackNotifs();                               // returned -> clear the reminders
    });
    window.addEventListener("pagehide", function () { save(); scheduleComebackNotifs(); });
    window.addEventListener("beforeunload", save);
  }

  init();
})();
