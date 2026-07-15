import * as THREE from "./vendor/three.bundle.min.js";

// ---------- palette (matches style.css warm coffee theme) ----------
var COLOR_WALL_LIGHT = 0x8d6e63;
var COLOR_WALL_MID = 0x6d4c41;
var COLOR_WALL_DARK = 0x4e342e;
var COLOR_CREAM = 0xfdf6ec;
var COLOR_GOLD = 0xffd54f;

// ---------- city palette (lightened so first-person street level isn't a
// near-black void; the warm cafe still pops via its cream+gold materials) ----------
var COLOR_GROUND = 0x8f8478;   // was 0x2a2521 (near-black) -> warm paved taupe
var COLOR_ROAD = 0x565660;     // was 0x2b2b30 -> lighter asphalt
var COLOR_ROAD_PATCH = 0x626270;
var COLOR_SIDEWALK = 0xc4b6a4;
var COLOR_GRASS = 0x5c7248;
var COLOR_MARKING = 0xeae4d6;

var FLOOR_HEIGHT = 1.0;
var FLOOR_WIDTH = 2.4;
var FLOOR_DEPTH = 2.0;

var GROUND_SIZE = 60;
var CAR_WRAP = GROUND_SIZE / 2 + 0.6; // cars wrap just past the ground edge
var ROAD_Z = 4.65;                    // main road strip center, in front of the cafe door (+Z)
var ROAD_WIDTH = 3.5;
var AVENUE_Z = -9;                    // parallel avenue behind the cafe
var CROSS_X_WEST = -9;                // perpendicular cross-street centers
var CROSS_X_EAST = 9;

// ---------- day-night cycle ----------
// full cycle in real seconds; phase01 0.0-0.40 day, 0.40-0.50 dusk,
// 0.50-0.90 night, 0.90-1.00 dawn (smoothstep lerps between the endpoints)
var DAY_CYCLE_SECONDS = 300; // full day = 5 minutes (was 180 = too fast)

// NEAR-ring buildings, GRID-ALIGNED into even rows lining the four blocks
// around the central cafe block. Format: [x, z, w, h, d, matIndex, yaw]
// yaw is 0 or PI/2 (axis-aligned, no jitter). Procedurally generated + verified
// (0 overlaps, 0 road/sidewalk/cafe/supplier clipping). Short + uniform per row.
var CITY_BUILDING_DEFS = [
  // north row (across the main road)
  [-4.95, 9.2, 2.6, 3.2, 2.6, 0, 0],
  [-1.55, 9.2, 2.6, 3.2, 2.6, 1, 0],
  [1.85, 9.2, 2.6, 3.2, 2.6, 2, 0],
  [5.25, 9.2, 2.6, 3.2, 2.6, 3, 0],
  [-15.2, 9.2, 2.6, 3, 2.6, 2, 0],
  [13.05, 9.2, 2.6, 3, 2.6, 3, 0],
  // south row (across the avenue)
  [-4.95, -13.45, 2.6, 3.4, 2.6, 1, 0],
  [-1.55, -13.45, 2.6, 3.4, 2.6, 2, 0],
  [1.85, -13.45, 2.6, 3.4, 2.6, 3, 0],
  [5.25, -13.45, 2.6, 3.4, 2.6, 4, 0],
  [-15.2, -13.45, 2.6, 3.6, 2.6, 4, 0],
  [13.05, -13.45, 2.6, 3.6, 2.6, 0, 0],
  // east + west columns (across the cross-streets)
  [13.05, -4.55, 2.6, 3, 2.6, 2, 0],
  [13.05, -1.15, 2.6, 3, 2.6, 3, 0],
  [-13.05, -4.55, 2.6, 3, 2.6, 3, 0],
  [-13.05, -1.15, 2.6, 3, 2.6, 4, 0]
];

// FAR-ring skyline buildings (beyond ~14, LOD: no window meshes, darker
// materials, taller 4-9 units). The orbit camera never reaches this ring, so
// height is unconstrained. [x, z, w, h, d, farMatIndex, yaw]
// matIndex now indexes the same 5-entry buildingFacadeMats pool as the near
// ring (visual-polish pass: was a 3-shade cycle that read as repetitive)
// FAR-ring skyline: grid-aligned, taller (5-9), stepping up toward the map
// edges. Corner clusters + center accents + mid-edge fillers (east/west/south)
// so the horizon wraps without gaps. [x, z, w, h, d, matIndex, yaw] yaw 0/PI/2.
var HALF_PI = 1.5707963267948966;
var FAR_BUILDING_DEFS = [
  // NE cluster
  [14, 13, 3, 5.5, 3, 0, 0], [17.8, 13, 3, 5.5, 3, 1, 0], [21.6, 13, 3, 5.5, 3, 2, 0],
  [14, 17, 3, 7.5, 3, 2, HALF_PI], [17.8, 17, 3, 7.5, 3, 3, HALF_PI], [21.6, 17, 3, 7.5, 3, 4, HALF_PI],
  // NW cluster
  [-24.5, 13, 3, 6, 3, 3, HALF_PI], [-20.7, 13, 3, 6, 3, 4, HALF_PI], [-16.9, 13, 3, 6, 3, 0, HALF_PI],
  [-24.5, 17, 3, 8, 3, 1, 0], [-20.7, 17, 3, 8, 3, 2, 0], [-16.9, 17, 3, 8, 3, 3, 0],
  // SE cluster
  [16.5, -15, 3, 6.5, 3, 4, 0], [20.3, -15, 3, 6.5, 3, 0, 0], [24.1, -15, 3, 6.5, 3, 1, 0],
  [14, -19, 3, 8.5, 3, 0, HALF_PI], [17.8, -19, 3, 8.5, 3, 1, HALF_PI], [21.6, -19, 3, 8.5, 3, 2, HALF_PI],
  // SW cluster
  [-24.5, -15, 3, 7, 3, 2, HALF_PI], [-20.7, -15, 3, 7, 3, 3, HALF_PI],
  [-24.5, -19, 3, 9, 3, 3, 0], [-20.7, -19, 3, 9, 3, 4, 0], [-16.9, -19, 3, 9, 3, 0, 0],
  // center-north accents
  [-5, 17, 3, 7, 3, 1, 0], [-1.2, 17, 3, 7, 3, 2, 0], [2.6, 17, 3, 7, 3, 3, 0],
  // --- mid-edge fillers to close the skyline (added; verified clear) ---
  // due-east (central block, clear of supplier x[16.5,21.5] z[-1.6,2.6])
  [24, -4.5, 3, 6, 3, 1, 0], [26.5, -0.5, 3, 6.5, 3, 3, 0],
  // due-west (mirror; no supplier)
  [-22.5, -3, 3, 6, 3, 2, 0], [-26.5, -0.5, 3, 6.5, 3, 4, 0],
  // mid-south (between the SE/SW clusters)
  [-3, -19, 3, 7.5, 3, 4, 0], [1.5, -19, 3, 7.5, 3, 1, 0],
  [-3, -24.5, 3, 9, 3, 2, 0], [1.5, -24.5, 3, 9, 3, 0, 0],
  // mid-north far accent row (behind the center-north accents)
  [-5, 24, 3, 8.5, 3, 3, 0], [-1.2, 24, 3, 8.5, 3, 4, 0], [2.6, 24, 3, 8.5, 3, 0, 0]
];

// cars: variant 0 = sedan, 1 = hatchback, 2 = pickup.
// axis "x" = drives along the main road / avenue, "z" = cross-street.
// Left-hand traffic (Indonesia). Same-lane main-road cars share one speed so
// their gap never closes (the current fix, kept).
// order matters: later entries hidden first at lower graphics tiers.
// same-lane main-road cars share one speed so their gap never closes.
var CAR_DEFS = [
  { variant: 0, color: 0x6a7a86, axis: "x", lane: 3.75, dir: 1, speed: 2.4, start: -22, mainRoad: true },
  { variant: 1, color: 0x8a7a5a, axis: "x", lane: 3.75, dir: 1, speed: 2.4, start: -2, mainRoad: true },
  { variant: 0, color: 0x5a6e5a, axis: "x", lane: -8.1, dir: -1, speed: 2.6, start: 12, avenue: true },
  { variant: 2, color: 0x7d5a52, axis: "z", lane: -8.1, dir: 1, speed: 2.2, start: -15 },
  { variant: 1, color: 0x54617a, axis: "z", lane: 8.1, dir: -1, speed: 2.3, start: 20 },
  // --- extra traffic (liveliness) ---
  { variant: 1, color: 0xa8998a, axis: "x", lane: 3.75, dir: 1, speed: 2.4, start: -42, mainRoad: true },
  { variant: 2, color: 0x8a9a6a, axis: "x", lane: 5.55, dir: -1, speed: 2.5, start: 6, mainRoad: true },
  { variant: 0, color: 0x7a6a86, axis: "x", lane: -8.1, dir: -1, speed: 2.6, start: -14, avenue: true },
  { variant: 1, color: 0x6a5a52, axis: "z", lane: 8.1, dir: -1, speed: 2.15, start: -4 }
];

// pedestrian waypoint paths along the sidewalks; two peds turn off the
// sidewalk toward the cafe door and enter (shrink, wait inside, respawn) —
// their paths are EXACTLY the pre-expansion ones. Through-walkers now span
// x = +-20; two extra peds walk the avenue sidewalks.
// lane z-gaps kept >= 0.3 so opposing pedestrians pass without clipping shoulders
// order matters: the LAST entries are the first hidden at lower graphics tiers
// (setQuality shows peds[0..maxPeds-1]); keep the two cafe-enterers early so
// the order mini-event always has a walker even on "low".
var PED_DEFS = [
  { pts: [[-20, 1.75], [20, 1.75]], enters: false, speed: 0.85, startFrac: 0.15 },
  { pts: [[20, 2.65], [-20, 2.65]], enters: false, speed: 0.75, startFrac: 0.5, bag: true },
  { pts: [[-13, 2.35], [-1.1, 2.35], [0, 1.4]], enters: true, speed: 0.8, startFrac: 0.2, waitDur: 2.6, bag: true },
  { pts: [[13, 2.05], [1.3, 2.05], [0, 1.4]], enters: true, speed: 0.9, startFrac: 0.55, waitDur: 4.2 },
  { pts: [[-20, 6.9], [20, 6.9]], enters: false, speed: 0.95, startFrac: 0.75, umbrella: true },
  { pts: [[-20, -6.6], [20, -6.6]], enters: false, speed: 0.8, startFrac: 0.3 },
  { pts: [[20, -11.2], [-20, -11.2]], enters: false, speed: 0.7, startFrac: 0.6, bag: true },
  // --- extra crowd (liveliness); trimmed first on lower tiers ---
  { pts: [[-20, 2.95], [20, 2.95]], enters: false, speed: 0.82, startFrac: 0.4 },
  { pts: [[20, 6.55], [-20, 6.55]], enters: false, speed: 0.72, startFrac: 0.85, bag: true },
  { pts: [[-20, 7.25], [20, 7.25]], enters: false, speed: 0.9, startFrac: 0.1 },
  { pts: [[20, -6.95], [-20, -6.95]], enters: false, speed: 0.86, startFrac: 0.65, umbrella: true },
  { pts: [[-20, -10.85], [20, -10.85]], enters: false, speed: 0.78, startFrac: 0.2 },
  { pts: [[13, 1.75], [1.3, 1.75], [0, 1.4]], enters: true, speed: 0.83, startFrac: 0.9, waitDur: 3.4, bag: true }
];

var PED_BASE_Y = 0.09;
var PED_ENTER_DURATION = 0.5;
// people/cars were ~1 building-floor tall (floor ~0.6u) -> looked oversized; scale
// them down so a person is clearly shorter than a floor and roughly car-height.
var PED_SCALE = 0.68;
var CAR_SCALE = 0.82;
var PLAYER_EYE_Y = 0.72; // first-person camera height, lowered with PED_SCALE (was 1.05)
var WALK_FOV = 70; // wider than the 45deg orbit shot -- first-person feels cramped/"small" at 45
var LOOK_YAW_SPEED = 2.4;   // rad/s at full right-stick deflection
var LOOK_PITCH_SPEED = 1.6; // rad/s
var LOOK_PITCH_MAX = 1.0;   // ~57deg up/down clamp

// cat fur palette: orange tabby, gray, black
var CAT_COLOR_ORANGE = 0xd9985f;
var CAT_COLOR_GRAY = 0x8a8a92;
var CAT_COLOR_BLACK = 0x3a3a3e;
var CAT_HOP_MS = 250;
// strolling cat lane: z = 1.45 keeps >= 0.3 clearance from the pedestrian
// lanes at z = 1.75 / 2.05 / 2.35 / 2.65
var CAT_STROLL_Z = 1.45;
var CAT_STROLL_LIMIT_X = 13;

// ---------- Stage B2: player / supplier / interaction zones ----------
var SUPPLIER_X = 19;                 // 'Toko Grosir' building center x
var SUPPLIER_Z = 0.6;                // building center z (front face at z = 1.8, by the sidewalk)
var SUPPLIER_DOOR_Z = 2.4;           // door trigger on the sidewalk side
var SUPPLIER_DOOR_R = 1.6;
var SUPPLIER_PARK_Z = 4.4;           // parking trigger on the road in front
var SUPPLIER_PARK_R = 2.5;
var PICKUP_HOME_X = -3.2;            // player's pickup parked beside the cafe
var PICKUP_HOME_Z = 1.6;
var PICKUP_ZONE_R = 1.8;
// heading convention: x += cos(yaw), z -= sin(yaw); -PI/2 faces +z (the road),
// so driving off never starts nose-first into the cafe wall
var PICKUP_HOME_YAW = -Math.PI / 2;
var CAFE_DOOR_X = 0;
var CAFE_DOOR_Z = 1.6;
var CAFE_DOOR_R = 1.6;               // on-foot door trigger
var CAFE_PARK_R = 3.0;               // drive-mode parking trigger around the pickup spot
var WALK_SPEED = 3.2;                // u/s
var DRIVE_MAX_SPEED = 9;             // u/s
var WORLD_BOUND = 28;                // player/pickup stay within +-28

// piecewise day factor: 1 = full day, 0 = full night, smoothstep transitions
function dayFactor01(p) {
  if (p < 0.40) return 1;
  if (p < 0.50) { var t = (p - 0.40) / 0.10; return 1 - t * t * (3 - 2 * t); }
  if (p < 0.90) return 0;
  var t2 = (p - 0.90) / 0.10;
  return t2 * t2 * (3 - 2 * t2);
}

export function initCafeScene(canvasEl, options) {
  options = options || {};
  var onTap = typeof options.onTap === "function" ? options.onTap : function () {};
  var onCatTap = typeof options.onCatTap === "function" ? options.onCatTap : onTap;
  var onDayPhase = typeof options.onDayPhase === "function" ? options.onDayPhase : null;
  // Stage B2 callbacks — every one optional, so initCafeScene(canvas, {onTap})
  // keeps working exactly as before
  var getJoy = typeof options.getJoy === "function" ? options.getJoy : null;
  var onModeChange = typeof options.onModeChange === "function" ? options.onModeChange : function () {};
  var onNearZone = typeof options.onNearZone === "function" ? options.onNearZone : function () {};
  var onNpcTap = typeof options.onNpcTap === "function" ? options.onNpcTap : null;
  var onOrderAnchor = typeof options.onOrderAnchor === "function" ? options.onOrderAnchor : null;
  var getLook = typeof options.getLook === "function" ? options.getLook : null;
  var ZERO_JOY = { x: 0, z: 0 }; // fallback when no joystick provider is wired
  // first-person camera aim, driven by the RIGHT stick (getLook); persists
  // across frames so releasing the stick leaves the view where you aimed it
  var camYaw = 0;   // 0 = facing +z (the street), matches the walk spawn heading
  var camPitch = 0; // clamped; up/down look
  var lookSensitivity = 1; // user setting (setSensitivity), scales look speed
  var walkFov = WALK_FOV;  // user setting (setFov), first-person field of view
  // Fase D: interior + boss room live at a y=-40 offset (out of sight of the
  // street scene); the camera teleports there for those modes. Walls enclose
  // them so the far city/sky fog out naturally.
  var INT_ORIGIN = new THREE.Vector3(0, -40, 0);
  var BOSS_ORIGIN = new THREE.Vector3(24, -40, 0);
  var intAngle = 0;                          // interior gentle auto-orbit
  var bossYaw = 0, bossPitch = 0.45, bossZoom = 1; // boss room USER camera
  var patioSeats = [];  // idle-management: {group, cust, torsoMat, coinT, swapT, swapDir, sc} per patio table
  var patioCoins = [];  // rising "+coin" sprites emitted by paying patio customers
  var PATIO_SHIRTS = [0xc45b4a, 0x4a7ba6, 0x5a8a6a, 0xe0a94e, 0x7a5aa0, 0x3f9a8a];
  var liveCusts = []; // interior "walk in & sit down" customers
  var intSteams = []; // coffee-cup steam wisps inside the cafe (animated while in interior)
  var intBarista = null, intBaristaY = 0, intTime = 0; // barista chibi, gently animated "making coffee"
  var birds = []; // pigeons pecking on the sidewalk (animated in outdoor modes)

  var scene = new THREE.Scene();
  // fog: blends the far-LOD ring/horizon smoothly instead of a hard cutoff;
  // color is re-lerped in applyDayNight (zero extra allocations, reuses the
  // same k/nk already computed there each frame)
  var FOG_DAY_C = new THREE.Color(0xe8d8b8);
  var FOG_NIGHT_C = new THREE.Color(0x3a3550);
  // pushed back (was 18/46): the old range washed the whole skyline into haze
  // by mid-distance; now the near+far buildings read crisply and fog only
  // softens the far map edge / ground horizon
  scene.fog = new THREE.Fog(0xe8d8b8, 32, 80);

  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  var camRadius = 9.8;
  var camHeight = 4.5;
  var camAngle = 0;
  // idle-mode pinch-to-zoom: multiplies camRadius/camHeight, pinch gesture
  // handled in the canvas pointer handlers below (idle mode only)
  var camZoom = 1;
  var CAM_ZOOM_MIN = 0.45, CAM_ZOOM_MAX = 1.8;
  var pinchPointers = {}; // pointerId -> {x, y}, at most 2 while idle
  var pinchStartDist = 0, pinchStartZoom = 1;
  // walk-mode touch/mouse look: drag anywhere on the canvas to aim the camera
  // (replaces the fiddly right joystick). rad per screen pixel, scaled by the
  // sensitivity setting.
  var dragLookId = null, dragLastX = 0, dragLastY = 0;
  var DRAG_LOOK_RAD_PER_PX = 0.006;
  // start on the orbit so the position lerp in the render loop has no
  // first-frame swoop from the origin
  camera.position.set(0, camHeight, camRadius);

  var renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  // tone mapping: punchier contrast without a post-processing pass; modest
  // exposure so the existing day/night light range doesn't wash out or darken
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // ---------- lights (start at full day; the day-night cycle re-lerps every frame) ----------
  var hemi = new THREE.HemisphereLight(0xbfd4e8, 0x2b1a15, 1.05);
  scene.add(hemi);
  var dirLight = new THREE.DirectionalLight(0xfff2dd, 1.0);
  dirLight.position.set(4, 6, 4);
  scene.add(dirLight);

  // cozy glow at the cafe entrance (dimmed ~30% by day, full at night)
  var doorLight = new THREE.PointLight(0xffc178, 3.5, 4.5, 2);
  doorLight.position.set(0, 1.3, 1.8);
  scene.add(doorLight);
  var awningLight = new THREE.PointLight(0xffab5e, 2.0, 3.5, 2);
  awningLight.position.set(0.9, 0.9, 1.5);
  scene.add(awningLight);

  // day-night endpoint colors: THREE.Color instances created ONCE and lerped
  // in place via lerpColors — never allocated per frame
  var HEMI_DAY_C = new THREE.Color(0xbfd4e8);
  var HEMI_NIGHT_C = new THREE.Color(0x2a3050);
  var SUN_DAY_C = new THREE.Color(0xfff2dd);
  var SUN_NIGHT_C = new THREE.Color(0x8fa3c8);

  // ---------- static city environment (built ONCE, disposed in dispose()) ----------
  // Shared geometries/materials are tracked exactly once in these arrays, so
  // disposal never touches the same instance twice via per-mesh iteration.
  var cityGroup = new THREE.Group();
  scene.add(cityGroup);
  // interior + boss-room groups (Fase D), hidden until entered; resources still
  // tracked via trackGeo/trackMat so dispose() cleans them with everything else
  var interiorGroup = new THREE.Group(); interiorGroup.visible = false; scene.add(interiorGroup);
  var bossGroup = new THREE.Group(); bossGroup.visible = false; scene.add(bossGroup);
  var cityGeometries = [];
  var cityMaterials = [];

  function trackGeo(geo) { cityGeometries.push(geo); return geo; }
  function trackMat(mat) { cityMaterials.push(mat); return mat; }

  var cars = [];
  var mainRoadCars = []; // the two main-road cars, watched by cross-street yield checks
  var avenueCars = [];   // avenue cars, watched at the avenue crossings
  var peds = [];
  var cats = [];
  // graphics-quality caps: how many peds/cars are live. Default high; setQuality
  // lowers them (extras hidden + skipped) for weaker phones. Set high so the
  // full crowd shows until a tier is chosen.
  var qMaxPeds = 999;
  var qMaxCars = 999;
  var catMeshes = []; // flat hit-test list for the tap raycast (part of tracked disposal)
  var npcMeshes = []; // ped torso/head hit-test list (idle-mode NPC taps)

  // Stage B2 state — player, pickup, mode, collision boxes, zones
  var buildingAabbs = []; // flat [minX, minZ, maxX, maxZ] per building, built once
  var player = null;
  var playerPickup = null;
  var pickupOwnedFlag = false;
  var mode = "idle"; // "idle" | "walk" | "drive"
  var currentZone = null;

  function addAabb(cx, cz, hx, hz) {
    buildingAabbs.push(cx - hx, cz - hz, cx + hx, cz + hz);
  }

  // circle (x,z,r) vs the flat AABB list — cheap loop, zero allocations
  function hitsAabb(x, z, r) {
    for (var i = 0; i < buildingAabbs.length; i += 4) {
      if (x > buildingAabbs[i] - r && x < buildingAabbs[i + 2] + r &&
          z > buildingAabbs[i + 1] - r && z < buildingAabbs[i + 3] + r) return true;
    }
    return false;
  }

  // shared emissive materials mutated by the day-night cycle (assigned in buildCity)
  var cityWinMatA, cityWinMatB, lampBulbMat, carHeadMat, carTailMat;
  var patioLightMat; // string-light bulbs behind the cafe (glow at night)
  var patioLights = []; // one actual light per umbrella table, so the patio isn't dark at night

  var cityTextures = [];
  function trackTex(tex) { cityTextures.push(tex); return tex; }

  // ---------- sky decoration: sun/moon disc + drifting clouds + stars ----------
  // Unlit (MeshBasicMaterial/PointsMaterial, fog:false) so they read as a flat
  // backdrop regardless of the day-night light range; all geometry/material/
  // texture goes through the same tracked-once helpers as everything else.
  var skyGroup = new THREE.Group();
  scene.add(skyGroup);

  // one shared disc recolored sun<->moon (an actual second mesh swap reads
  // odd for a single light source; the arc + recolor already sells it)
  var celestialGeo = trackGeo(new THREE.CircleGeometry(2.6, 20));
  var celestialMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xfff2c8, fog: false, transparent: true, depthWrite: false, toneMapped: false }));
  var celestialMesh = new THREE.Mesh(celestialGeo, celestialMat);
  skyGroup.add(celestialMesh);
  var CELESTIAL_SUN_C = new THREE.Color(0xfff2c8);
  var CELESTIAL_MOON_C = new THREE.Color(0xe6ecff);

  var cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = 160; cloudCanvas.height = 96;
  (function drawCloud() {
    var cctx = cloudCanvas.getContext("2d");
    // fluffy cloud = several overlapping soft white lobes (reads as a cloud,
    // not a flat gray disc). Each lobe is its own soft radial gradient.
    var lobes = [[54, 60, 34], [86, 52, 40], [116, 62, 30], [70, 46, 30], [100, 66, 26]];
    for (var i = 0; i < lobes.length; i++) {
      var L = lobes[i];
      var g = cctx.createRadialGradient(L[0], L[1], 2, L[0], L[1], L[2]);
      g.addColorStop(0, "rgba(255,255,255,0.92)");
      g.addColorStop(0.55, "rgba(255,255,255,0.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      cctx.fillStyle = g;
      cctx.fillRect(0, 0, 160, 96);
    }
  })();
  var cloudTex = trackTex(new THREE.CanvasTexture(cloudCanvas));
  var cloudGeo = trackGeo(new THREE.PlaneGeometry(10, 6));
  // toneMapped:false so ACES tone mapping doesn't dull the whites to gray
  var cloudMat = trackMat(new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  // Clouds spread around the sky at varied elevations (y 8..24) so both the
  // horizon band AND the overhead view have clouds. They are CAMERA-FACING
  // billboards (quaternion copied from the camera every frame in animate) — the
  // old build-time lookAt(origin) left side clouds edge-on, which "flickered"
  // into thin slivers as the camera orbited / zoomed out (the reported bug).
  var CLOUD_DEFS = [];
  for (var ci = 0; ci < 14; ci++) {
    var cang = (ci / 14) * Math.PI * 2 + 0.3;
    var crad = 30 + (ci % 4) * 5;
    CLOUD_DEFS.push({
      x: Math.cos(cang) * crad,
      y: 8 + (ci * 1.13 % 16),   // 8..24, well spread
      z: Math.sin(cang) * crad,
      s: 1.7 + (ci % 3) * 0.6,
      speed: 0.07 + (ci % 4) * 0.025
    });
  }
  var steamPuffs = []; // coffee-steam puffs above the cafe (built in buildBackyard, animated in the loop)
  var CLOUD_LOOP = 90; // drift this far (world units) before wrapping back around
  var clouds = CLOUD_DEFS.map(function (c) {
    var m = new THREE.Mesh(cloudGeo, cloudMat);
    m.position.set(c.x, c.y, c.z);
    m.scale.setScalar(c.s);
    skyGroup.add(m);
    return { mesh: m, speed: c.speed, startX: c.x };
  });

  // stars: one Points cloud, upper-hemisphere only, opacity-only night fade
  var STAR_COUNT = 120;
  var starPositions = new Float32Array(STAR_COUNT * 3);
  for (var starI = 0; starI < STAR_COUNT; starI++) {
    var starAng = Math.random() * Math.PI * 2;
    // low elevation band (~5-40 deg) so stars land in the thin visible sky strip
    // above the rooftops, not way overhead where the near-level camera never looks
    var starElev = (0.06 + Math.random() * 0.45) * Math.PI / 2;
    var starR = 46;
    starPositions[starI * 3] = Math.cos(starAng) * starR * Math.cos(starElev);
    starPositions[starI * 3 + 1] = 6 + Math.sin(starElev) * starR;
    starPositions[starI * 3 + 2] = Math.sin(starAng) * starR * Math.cos(starElev);
  }
  var starGeo = trackGeo(new THREE.BufferGeometry());
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  var starMat = trackMat(new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false }));
  var stars = new THREE.Points(starGeo, starMat);
  skyGroup.add(stars);

  // ---------- toon/cel shading: cheap 3-step gradient, no extra light passes ----------
  // (visual-polish pass) applied to the most-visible materials only — buildings,
  // cars, peds, cafe; emissive glow accents (windows/lamps/lights/signs) and small
  // trim (glass/wheels/bags) stay MeshStandardMaterial since toon banding buys
  // nothing there and it keeps the day-night emissiveIntensity mutation untouched.
  var toonGradientMap = trackTex(new THREE.DataTexture(
    new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]),
    3, 1, THREE.RGBAFormat
  ));
  toonGradientMap.magFilter = THREE.NearestFilter;
  toonGradientMap.minFilter = THREE.NearestFilter;
  toonGradientMap.needsUpdate = true;

  function toonMat(opts) {
    // MeshToonMaterial has no roughness/metalness (PBR-only props); callers
    // keep passing them (matching the MeshStandardMaterial options they
    // replaced, for a minimal diff) so strip them here once instead of at
    // every call site — avoids a "not a property of" console warning per call
    delete opts.roughness;
    delete opts.metalness;
    opts.gradientMap = opts.gradientMap || toonGradientMap;
    return trackMat(new THREE.MeshToonMaterial(opts));
  }

  // ---------- small procedural CanvasTexture helper (drawn ONCE at build time,
  // never per frame) ----------
  function makeCanvasTex(size, drawFn) {
    var cnv = document.createElement("canvas");
    cnv.width = size;
    cnv.height = size;
    drawFn(cnv.getContext("2d"), size);
    var tex = trackTex(new THREE.CanvasTexture(cnv));
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // ---------- blob shadows: ONE shared radial-gradient texture + ONE shared flat
  // circle geometry, reused (via per-instance scale/position, never per-instance
  // textures) under the player, pickup, every car and every ped ----------
  var blobTex = makeCanvasTex(64, function (ctx, s) {
    var g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(0,0,0,0.45)");
    g.addColorStop(0.7, "rgba(0,0,0,0.2)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
  var blobGeo = trackGeo(new THREE.CircleGeometry(0.5, 12));
  blobGeo.rotateX(-Math.PI / 2); // baked flat, facing up — no per-instance rotation needed
  var blobMatPed = trackMat(new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  var blobMatCar = trackMat(new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.9 }));

  // ---------- shared face bits (eyes / cheeks / nose) so peds, cats, and the
  // interior chibis all get a cute little face instead of a blank head ----------
  var faceEyeGeo = trackGeo(new THREE.SphereGeometry(0.02, 6, 5));
  var faceEyeMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x2a2320 })); // unlit = always a crisp dark dot
  var faceEyeWhiteMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xffffff })); // cartoon eye backing (contrast on dark fur)
  var faceCheekMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xf0a58c, transparent: true, opacity: 0.5 }));
  var faceNoseGeo = trackGeo(new THREE.SphereGeometry(0.014, 6, 5));
  var faceNoseMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xe08a86 }));
  var faceMouthMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x3a2a26 }));
  // add two eyes (+ optional blush cheeks) to a head-ish local frame facing +z
  function addFace(parent, y, z, spread, eyeScale, blush) {
    var s = eyeScale || 1;
    var el = new THREE.Mesh(faceEyeGeo, faceEyeMat); el.scale.setScalar(s); el.position.set(-spread, y, z); parent.add(el);
    var er = new THREE.Mesh(faceEyeGeo, faceEyeMat); er.scale.setScalar(s); er.position.set(spread, y, z); parent.add(er);
    if (blush) {
      var cl = new THREE.Mesh(faceEyeGeo, faceCheekMat); cl.scale.set(s * 1.4, s * 1.0, s * 0.6); cl.position.set(-spread * 1.7, y - 0.02 * s, z * 0.92); parent.add(cl);
      var cr = new THREE.Mesh(faceEyeGeo, faceCheekMat); cr.scale.set(s * 1.4, s * 1.0, s * 0.6); cr.position.set(spread * 1.7, y - 0.02 * s, z * 0.92); parent.add(cr);
    }
  }

  // ---------- procedural facade textures: cafe wood-plank (neutral, tinted per
  // floor by the existing wallColors cycle) + 5 city-building variants (brick/
  // plank/panel patterns with a distinct base tint + awning-color accent band) ----------
  var cafeFacadeTex = makeCanvasTex(128, function (ctx, s) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, s, s);
    for (var by = 0; by < s; by += 16) {
      ctx.strokeStyle = "rgba(0,0,0,0.16)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(s, by); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath(); ctx.moveTo(0, by + 2); ctx.lineTo(s, by + 2); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.05)";
    ctx.lineWidth = 1;
    for (var bx = 5; bx < s; bx += 11) {
      ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, s); ctx.stroke();
    }
  });
  cafeFacadeTex.repeat.set(2, 2);

  // window rectangles — computed once and shared by BOTH the color facade and
  // its emissive night-glow mask so lit windows line up exactly with the glass.
  function facadeWindows(s, cb) {
    var cols = 3, rows = 5;
    var mx = s * 0.13;
    var top = s * 0.09, storefront = s * 0.20;
    var bot = s - storefront;
    var cw = (s - mx * 2) / cols, rh = (bot - top) / rows;
    var ww = cw * 0.58, wh = rh * 0.60;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        cb(mx + c * cw + (cw - ww) / 2, top + r * rh + (rh - wh) / 2, ww, wh, r, c);
      }
    }
  }

  function drawCityFacade(ctx, s, spec) {
    var base = spec[0], line = spec[1], accent = spec[2], style = spec[3], glass = spec[4], store = spec[5];
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    // faint wall texture
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    if (style === "brick") {
      var rows = 12, bh = s / rows;
      for (var r = 0; r < rows; r++) {
        var oy = r * bh;
        ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(s, oy); ctx.stroke();
        var off = (r % 2) * (s / 10);
        for (var cx = -s / 10 + off; cx < s; cx += s / 5) {
          ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx, oy + bh); ctx.stroke();
        }
      }
    } else if (style === "plank") {
      for (var py = 0; py < s; py += s / 12) {
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(s, py); ctx.stroke();
      }
    }
    // cornice band at the very top
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, s, s * 0.045);
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fillRect(0, s * 0.045, s, s * 0.02);
    // window grid (glass + frame + mullions)
    facadeWindows(s, function (wx, wy, ww, wh) {
      ctx.fillStyle = "rgba(0,0,0,0.20)";
      ctx.fillRect(wx - 1.5, wy - 1.5, ww + 3, wh + 3);
      ctx.fillStyle = glass;
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.beginPath();
      ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh);
      ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2);
      ctx.stroke();
    });
    // ground-floor storefront: darker band + two big windows + a door
    var sf = s * 0.20;
    ctx.fillStyle = store;
    ctx.fillRect(0, s - sf, s, sf);
    ctx.fillStyle = glass;
    ctx.fillRect(s * 0.08, s - sf + sf * 0.16, s * 0.30, sf * 0.60);
    ctx.fillRect(s * 0.62, s - sf + sf * 0.16, s * 0.30, sf * 0.60);
    ctx.fillStyle = accent;
    ctx.fillRect(s * 0.45, s - sf + sf * 0.10, s * 0.10, sf * 0.82);
  }

  function drawWindowMask(ctx, s, spec) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, s, s);
    facadeWindows(s, function (wx, wy, ww, wh, r, c) {
      // deterministic lit/unlit pattern (stable across rebuilds, ~75% lit)
      var lit = ((r * 3 + c * 7) % 4) !== 0;
      ctx.fillStyle = lit ? "#ffd98a" : "#241d15";
      ctx.fillRect(wx, wy, ww, wh);
    });
    var sf = s * 0.20;
    ctx.fillStyle = "#ffe6ac"; // storefront glows warmly at night
    ctx.fillRect(s * 0.08, s - sf + sf * 0.16, s * 0.30, sf * 0.60);
    ctx.fillRect(s * 0.62, s - sf + sf * 0.16, s * 0.30, sf * 0.60);
  }

  // [base, wall-line, accent/cornice, wall-style, glass, storefront]
  var CITY_FACADE_SPECS = [
    ["#9a5f4e", "rgba(255,246,236,0.26)", "#4e342e", "brick", "#7c98b0", "#6d4536"],
    ["#a8967c", "rgba(74,58,48,0.20)", "#6d4c41", "plank", "#86a0ae", "#6f5f48"],
    ["#7a828e", "rgba(255,255,255,0.14)", "#40505c", "panel", "#a6c6dc", "#4a525c"],
    ["#5e6470", "rgba(255,255,255,0.12)", "#ffd54f", "panel", "#94b0c6", "#41454f"],
    ["#79885f", "rgba(74,58,48,0.18)", "#4e342e", "brick", "#9ab6a4", "#566047"]
  ];
  // each facade material carries a color map (wall+windows+storefront) AND a
  // matching emissive window-mask map; emissiveIntensity is lerped 0->night in
  // applyDayNight so every building's windows light up after dark for free
  // (no per-building window meshes needed — near AND far ring both glow).
  var WINDOW_EMISSIVE_C = new THREE.Color(0xffcaa0);
  var buildingFacadeMats = [];
  for (var fm = 0; fm < CITY_FACADE_SPECS.length; fm++) {
    (function (spec) {
      var tex = makeCanvasTex(160, function (ctx, s) { drawCityFacade(ctx, s, spec); });
      tex.repeat.set(1, 1);
      var emap = makeCanvasTex(160, function (ctx, s) { drawWindowMask(ctx, s, spec); });
      emap.repeat.set(1, 1);
      var mat = toonMat({ map: tex, color: 0xffffff, roughness: 0.9 });
      mat.emissive = WINDOW_EMISSIVE_C;
      mat.emissiveMap = emap;
      mat.emissiveIntensity = 0;
      buildingFacadeMats.push(mat);
    })(CITY_FACADE_SPECS[fm]);
  }

  // ---------- shop sign: CanvasTexture text board (Fase C hook: setShopSignText) ----------
  var SIGN_TEX_W = 256, SIGN_TEX_H = 64;
  var signCanvas = document.createElement("canvas");
  signCanvas.width = SIGN_TEX_W;
  signCanvas.height = SIGN_TEX_H;
  var signCtx = signCanvas.getContext("2d");
  var signTexture = trackTex(new THREE.CanvasTexture(signCanvas));

  function drawSignText(text) {
    signCtx.clearRect(0, 0, SIGN_TEX_W, SIGN_TEX_H);
    signCtx.fillStyle = "#fdf6ec"; // cream bg, matches the UI palette
    signCtx.fillRect(0, 0, SIGN_TEX_W, SIGN_TEX_H);
    signCtx.strokeStyle = "#6d4c41";
    signCtx.lineWidth = 4;
    signCtx.strokeRect(2, 2, SIGN_TEX_W - 4, SIGN_TEX_H - 4);
    signCtx.fillStyle = "#4e342e"; // brown text
    signCtx.textAlign = "center";
    signCtx.textBaseline = "middle";
    var fs = 26;
    signCtx.font = "bold " + fs + "px sans-serif";
    while (signCtx.measureText(text).width > SIGN_TEX_W - 20 && fs > 10) {
      fs -= 2;
      signCtx.font = "bold " + fs + "px sans-serif";
    }
    signCtx.fillText(text, SIGN_TEX_W / 2, SIGN_TEX_H / 2 + 1);
    signTexture.needsUpdate = true;
  }
  drawSignText("Kedai Kopi Bahagia");

  // Fase D chibi shared geos/materials — MUST be defined before the build()
  // calls below (buildInterior/buildBossRoom use addChibi which references these)
  var figTorsoGeo = trackGeo(new THREE.CapsuleGeometry(0.13, 0.22, 2, 6));
  var figHeadGeo = trackGeo(new THREE.SphereGeometry(0.13, 10, 8));
  var figLegGeo = trackGeo(new THREE.BoxGeometry(0.1, 0.34, 0.12));
  var figSkinMat = trackMat(new THREE.MeshToonMaterial({ color: 0xf0c9a8, gradientMap: toonGradientMap }));
  var figPantsMat = toonMat({ color: 0x3a3a40, roughness: 0.9 });
  var CUST_SHIRTS = [0x4a7ba6, 0xc45b4a, 0x5a8a6a, 0xe0a94e, 0x7a5aa0, 0x3f9a8a, 0xd07a3c]; // walk-in shirt palette (used at buildInterior time too -> defined here, not hoisted-undefined)

  buildCity();
  buildCats();
  buildBirds();
  buildBackyard();
  buildInterior();
  buildBossRoom();

  function buildCity() {
    // ground: large dark asphalt/earth square
    var groundGeo = trackGeo(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE));
    var groundMat = trackMat(new THREE.MeshStandardMaterial({ color: COLOR_GROUND, roughness: 0.95 }));
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    cityGroup.add(ground);

    // street grid: main road (in front of the cafe) + parallel avenue behind,
    // plus two perpendicular cross-streets
    var roadMat = trackMat(new THREE.MeshStandardMaterial({ color: COLOR_ROAD, roughness: 0.95 }));
    var roadGeoX = trackGeo(new THREE.BoxGeometry(GROUND_SIZE, 0.08, ROAD_WIDTH));
    var roadGeoZ = trackGeo(new THREE.BoxGeometry(ROAD_WIDTH, 0.08, GROUND_SIZE));
    var mainRoad = new THREE.Mesh(roadGeoX, roadMat);
    mainRoad.position.set(0, 0, ROAD_Z);
    cityGroup.add(mainRoad);
    var avenue = new THREE.Mesh(roadGeoX, roadMat);
    avenue.position.set(0, 0, AVENUE_Z);
    cityGroup.add(avenue);
    var crossWest = new THREE.Mesh(roadGeoZ, roadMat);
    crossWest.position.set(CROSS_X_WEST, 0, 0);
    cityGroup.add(crossWest);
    var crossEast = new THREE.Mesh(roadGeoZ, roadMat);
    crossEast.position.set(CROSS_X_EAST, 0, 0);
    cityGroup.add(crossEast);

    // intersection patches: slightly taller + slightly lighter boxes where the
    // streets meet, so the co-planar road overlaps read as intentional junctions
    var patchGeo = trackGeo(new THREE.BoxGeometry(ROAD_WIDTH + 0.2, 0.1, ROAD_WIDTH + 0.2));
    var patchMat = trackMat(new THREE.MeshStandardMaterial({ color: COLOR_ROAD_PATCH, roughness: 0.95 }));
    var patchSpots = [
      [CROSS_X_WEST, ROAD_Z], [CROSS_X_EAST, ROAD_Z],
      [CROSS_X_WEST, AVENUE_Z], [CROSS_X_EAST, AVENUE_Z]
    ];
    for (var pi = 0; pi < patchSpots.length; pi++) {
      var patch = new THREE.Mesh(patchGeo, patchMat);
      patch.position.set(patchSpots[pi][0], 0, patchSpots[pi][1]);
      cityGroup.add(patch);
    }

    // sidewalks: one shared unit box scaled per segment; segments break at the
    // cross-streets so no sidewalk slab lies across a roadway.
    // rows: [z center, width] — main-road near/far + avenue north/south
    var walkGeo = trackGeo(new THREE.BoxGeometry(1, 0.16, 1));
    var sidewalkMat = trackMat(new THREE.MeshStandardMaterial({ color: COLOR_SIDEWALK, roughness: 0.9 }));
    var walkRows = [[2.2, 1.4], [6.9, 1.0], [-6.8, 0.9], [-11.2, 0.9]];
    var walkSegs = [[-20.375, 19.25], [0, 14.5], [20.375, 19.25]]; // [x center, length]
    for (var wr = 0; wr < walkRows.length; wr++) {
      for (var ws = 0; ws < walkSegs.length; ws++) {
        var walk = new THREE.Mesh(walkGeo, sidewalkMat);
        walk.scale.set(walkSegs[ws][1], 1, walkRows[wr][1]);
        walk.position.set(walkSegs[ws][0], 0, walkRows[wr][0]);
        cityGroup.add(walk);
      }
    }
    // vertical sidewalks flanking the cross-streets (were missing -> the paving
    // ran "one direction" only). z-strip through the central block, connecting
    // the main-road sidewalk (z=2.2) to the avenue sidewalk (z=-6.8).
    var walkCols = [[-11.3, 0.9], [-6.75, 0.9], [6.75, 0.9], [11.25, 0.9]]; // [x center, width]
    for (var wc = 0; wc < walkCols.length; wc++) {
      var vwalk = new THREE.Mesh(walkGeo, sidewalkMat);
      vwalk.scale.set(walkCols[wc][1], 1, 9.0);
      vwalk.position.set(walkCols[wc][0], 0, -2.3);
      cityGroup.add(vwalk);
    }

    // dashed lane markings on all roads (skipped inside intersections and
    // under the zebra crossing) + zebra crosswalk in front of the cafe
    var markingMat = trackMat(new THREE.MeshStandardMaterial({ color: COLOR_MARKING, roughness: 0.8 }));
    var dashGeoX = trackGeo(new THREE.BoxGeometry(0.9, 0.02, 0.14));
    var dashGeoZ = trackGeo(new THREE.BoxGeometry(0.14, 0.02, 0.9));
    var dp;
    for (dp = -27; dp <= 27; dp += 4.5) {
      var nearCross = Math.abs(Math.abs(dp) - 9) < 2.6;
      if (!nearCross && Math.abs(dp) >= 2.3) { // main road: skip crossings + zebra zone
        var dashM = new THREE.Mesh(dashGeoX, markingMat);
        dashM.position.set(dp, 0.05, ROAD_Z);
        cityGroup.add(dashM);
      }
      if (!nearCross) { // avenue: skip crossings only
        var dashA = new THREE.Mesh(dashGeoX, markingMat);
        dashA.position.set(dp, 0.05, AVENUE_Z);
        cityGroup.add(dashA);
      }
    }
    for (dp = -27; dp <= 27; dp += 4.5) { // cross-streets: skip both row crossings
      if (Math.abs(dp - ROAD_Z) < 2.6 || Math.abs(dp - AVENUE_Z) < 2.6) continue;
      var dashW = new THREE.Mesh(dashGeoZ, markingMat);
      dashW.position.set(CROSS_X_WEST, 0.05, dp);
      cityGroup.add(dashW);
      var dashE = new THREE.Mesh(dashGeoZ, markingMat);
      dashE.position.set(CROSS_X_EAST, 0.05, dp);
      cityGroup.add(dashE);
    }
    var zebraGeo = trackGeo(new THREE.BoxGeometry(0.42, 0.02, 3.1));
    for (var zi = 0; zi < 5; zi++) {
      var stripe = new THREE.Mesh(zebraGeo, markingMat);
      stripe.position.set(-1.5 + zi * 0.75, 0.05, ROAD_Z);
      cityGroup.add(stripe);
    }

    // grass patches on open corners (clear of every road/sidewalk strip)
    var grassGeo = trackGeo(new THREE.BoxGeometry(2.6, 0.05, 2.2));
    var grassMat = trackMat(new THREE.MeshStandardMaterial({ color: COLOR_GRASS, roughness: 1 }));
    // x nudged inward so the 2.6-wide box clears the cross-streets (x=±9, half-width 1.75):
    // a's left edge was -8.1 (into crossWest), b's right edge 8.5 (into crossEast) — "rumput nyasar"
    var grassSpots = [[-5.6, 9.8, 1.0], [5.4, 9.6, 1.15], [-13.8, 8.4, 1.0], [13.6, 8.4, 0.95]];
    for (var g = 0; g < grassSpots.length; g++) {
      var grass = new THREE.Mesh(grassGeo, grassMat);
      grass.position.set(grassSpots[g][0], 0.03, grassSpots[g][1]);
      grass.scale.set(grassSpots[g][2], 1, grassSpots[g][2]);
      cityGroup.add(grass);
    }

    // background buildings: one shared unit box scaled per building. Windows
    // (day paint + night glow) come entirely from the facade material's map +
    // emissiveMap, so there are NO per-building window meshes any more. Each
    // building gets a flat roof cap (parapet) for a cleaner, less "unfinished
    // box" silhouette.
    var buildingGeo = trackGeo(new THREE.BoxGeometry(1, 1, 1));
    var buildingMats = buildingFacadeMats;
    var roofCapMat = toonMat({ color: 0x3b332b, roughness: 0.9 });
    // cityWinMat/geo kept only for the supplier building's glow windows below
    var cityWinGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.36, 0.06));
    cityWinMatA = trackMat(new THREE.MeshStandardMaterial({
      color: 0xffd54f, emissive: 0xffc95c, emissiveIntensity: 0.05, roughness: 0.5
    }));
    cityWinMatB = trackMat(new THREE.MeshStandardMaterial({
      color: 0xffe6a0, emissive: 0xffdf8a, emissiveIntensity: 0.05, roughness: 0.5
    }));
    for (var b = 0; b < CITY_BUILDING_DEFS.length; b++) {
      var def = CITY_BUILDING_DEFS[b];
      var bGroup = new THREE.Group();
      bGroup.position.set(def[0], 0, def[1]);
      // grid-aligned: absolute yaw from the def (0 or PI/2), no face-center jitter
      bGroup.rotation.y = def[6] || 0;
      var box = new THREE.Mesh(buildingGeo, buildingMats[def[5]]);
      box.scale.set(def[2], def[3], def[4]);
      box.position.y = def[3] / 2;
      bGroup.add(box);
      var cap = new THREE.Mesh(buildingGeo, roofCapMat);
      cap.scale.set(def[2] * 1.06, def[3] * 0.06, def[4] * 1.06);
      cap.position.y = def[3] + def[3] * 0.03;
      bGroup.add(cap);
      cityGroup.add(bGroup);
      // conservative AABB (buildings are yawed, so use the larger footprint side)
      var nearHalf = Math.max(def[2], def[4]) * 0.5 + 0.1;
      addAabb(def[0], def[1], nearHalf, nearHalf);
    }

    // FAR ring: LOD skyline — taller boxes, same facade materials (windows glow
    // at night for free via the shared emissiveMap) + a roof cap each.
    var farMats = buildingFacadeMats;
    for (var fb = 0; fb < FAR_BUILDING_DEFS.length; fb++) {
      var fd = FAR_BUILDING_DEFS[fb];
      var farBox = new THREE.Mesh(buildingGeo, farMats[fd[5]]);
      farBox.scale.set(fd[2], fd[3], fd[4]);
      farBox.position.set(fd[0], fd[3] / 2, fd[1]);
      farBox.rotation.y = fd[6];
      cityGroup.add(farBox);
      var farCap = new THREE.Mesh(buildingGeo, roofCapMat);
      farCap.scale.set(fd[2] * 1.05, fd[3] * 0.04, fd[4] * 1.05);
      farCap.position.set(fd[0], fd[3] + fd[3] * 0.02, fd[1]);
      farCap.rotation.y = fd[6];
      cityGroup.add(farCap);
      var farHalf = Math.max(fd[2], fd[4]) * 0.5 + 0.1;
      addAabb(fd[0], fd[1], farHalf, farHalf);
    }

    // the cafe itself blocks walking/driving (static footprint, floors only stack up)
    addAabb(0, 0, FLOOR_WIDTH / 2 + 0.1, FLOOR_DEPTH / 2 + 0.1);

    // ---------- Stage B2: 'Toko Grosir' supplier building ----------
    // Distinctive cream + gold shop on the main-road block at x = +19 facing
    // the road (+z). No Phase-A building occupies this spot (nearest: near-ring
    // box at x=12.6, far-ring at x=20 but z=-2.5), so nothing was removed; the
    // only relocation is the sidewalk tree that shared the pickup parking spot
    // (see treeSpots below).
    var supWallMat = toonMat({ color: COLOR_CREAM, roughness: 0.85 });
    var supTrimMat = toonMat({ color: COLOR_WALL_MID, roughness: 0.8 });
    var supSignMat = trackMat(new THREE.MeshStandardMaterial({
      color: COLOR_GOLD, emissive: COLOR_GOLD, emissiveIntensity: 0.5, roughness: 0.4
    }));
    var supBodyGeo = trackGeo(new THREE.BoxGeometry(3.2, 2.6, 2.4));
    var supSignGeo = trackGeo(new THREE.BoxGeometry(2.2, 0.5, 0.08));
    var supAwnGeo = trackGeo(new THREE.BoxGeometry(2.6, 0.06, 0.7));
    var supDoorGeo = trackGeo(new THREE.BoxGeometry(0.8, 1.1, 0.06));
    var supBody = new THREE.Mesh(supBodyGeo, supWallMat);
    supBody.position.set(SUPPLIER_X, 1.3, SUPPLIER_Z);
    cityGroup.add(supBody);
    var supSign = new THREE.Mesh(supSignGeo, supSignMat); // gold sign board
    supSign.position.set(SUPPLIER_X, 2.25, SUPPLIER_Z + 1.25);
    cityGroup.add(supSign);
    var supAwn = new THREE.Mesh(supAwnGeo, supTrimMat);   // brown awning over the door
    supAwn.position.set(SUPPLIER_X, 1.7, SUPPLIER_Z + 1.45);
    supAwn.rotation.x = 0.25;
    cityGroup.add(supAwn);
    var supDoor = new THREE.Mesh(supDoorGeo, supTrimMat);
    supDoor.position.set(SUPPLIER_X, 0.55, SUPPLIER_Z + 1.22);
    cityGroup.add(supDoor);
    for (var sw = 0; sw < 2; sw++) { // emissive windows glow at night like the near ring
      var supWin = new THREE.Mesh(cityWinGeo, sw === 0 ? cityWinMatA : cityWinMatB);
      supWin.position.set(SUPPLIER_X + (sw === 0 ? -1.0 : 1.0), 1.5, SUPPLIER_Z + 1.22);
      cityGroup.add(supWin);
    }
    addAabb(SUPPLIER_X, SUPPLIER_Z, 1.7, 1.3);

    // streetlamps along the roads (bulb material dims by day via the cycle)
    var poleGeo = trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 6));
    var poleMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x2f2f35, roughness: 0.8 }));
    var lampGeo = trackGeo(new THREE.SphereGeometry(0.15, 8, 8));
    lampBulbMat = trackMat(new THREE.MeshStandardMaterial({
      color: 0xffe2b0, emissive: 0xffc978, emissiveIntensity: 0.05, roughness: 0.4
    }));
    var lampSpots = [
      [-6.5, 2.75], [6.5, 2.75], [-3.2, 6.55],          // main road (original trio)
      [-15, 2.75], [15, 2.75],                            // main road, wider
      [-15, -7.0], [15, -7.0],                            // avenue north sidewalk
      [-11.4, -4.5], [11.4, -4.5]                         // cross-street edges
    ];
    for (var l = 0; l < lampSpots.length; l++) {
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(lampSpots[l][0], 1.03, lampSpots[l][1]);
      cityGroup.add(pole);
      var lamp = new THREE.Mesh(lampGeo, lampBulbMat);
      lamp.position.set(lampSpots[l][0], 2.02, lampSpots[l][1]);
      cityGroup.add(lamp);
    }

    // simple trees (trunk + 2 stacked cones)
    var trunkGeo = trackGeo(new THREE.CylinderGeometry(0.1, 0.13, 0.9, 6));
    var trunkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x4a3a30, roughness: 0.9 }));
    var leafGeoBig = trackGeo(new THREE.ConeGeometry(0.55, 1.0, 7));
    var leafGeoSmall = trackGeo(new THREE.ConeGeometry(0.38, 0.75, 7));
    var leafMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x4f6446, roughness: 1 }));
    var leafMatDark = trackMat(new THREE.MeshStandardMaterial({ color: 0x445a3e, roughness: 1 }));
    var treeSpots = [
      // first tree moved -3.6 -> -4.9: its old spot is now the player's
      // pickup parking spot at (-3.2, 1.6) (Stage B2)
      [-4.9, 1.65], [3.6, 1.65], [-6.8, 9.6],
      [-6.2, 1.65], [6.2, 1.65],                          // main sidewalk, wider
      [-13, -6.3], [13, -6.3]                             // avenue north edge
    ];
    for (var t = 0; t < treeSpots.length; t++) {
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(treeSpots[t][0], 0.45, treeSpots[t][1]);
      cityGroup.add(trunk);
      var leaf1 = new THREE.Mesh(leafGeoBig, t % 2 === 0 ? leafMat : leafMatDark);
      leaf1.position.set(treeSpots[t][0], 1.25, treeSpots[t][1]);
      cityGroup.add(leaf1);
      var leaf2 = new THREE.Mesh(leafGeoSmall, t % 2 === 0 ? leafMatDark : leafMat);
      leaf2.position.set(treeSpots[t][0], 1.85, treeSpots[t][1]);
      cityGroup.add(leaf2);
    }

    // ---------- low-poly cars: 3 body variants from shared-per-variant geometry ----------
    var wheelGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 10));
    var wheelMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x24242a, roughness: 0.9 }));
    var carGlassMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.35 }));
    carHeadMat = trackMat(new THREE.MeshStandardMaterial({
      color: 0xfff4d6, emissive: 0xffe9b0, emissiveIntensity: 0, roughness: 0.4
    }));
    carTailMat = trackMat(new THREE.MeshStandardMaterial({
      color: 0x7a1f1f, emissive: 0xff3b30, emissiveIntensity: 0, roughness: 0.4
    }));
    var carLightGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.07, 0.12));
    var carBumperGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.09, 0.66));
    // beveled car bodies: this trimmed three.js bundle has no RoundedBoxGeometry
    // (confirmed absent), so the cheapest rounded-hull proxy is ONE shared
    // CapsuleGeometry laid on its side (length axis -> X) and non-uniformly
    // scaled per variant — same "shared unit geometry + per-instance scale"
    // pattern already used for buildingGeo. Natural extents after rotateZ:
    // X (length) = 1.6, Y (height) = 1.0, Z (width) = 1.0.
    var carBodyGeo = trackGeo(new THREE.CapsuleGeometry(0.5, 0.6, 2, 8));
    carBodyGeo.rotateZ(Math.PI / 2);
    var sedanCabinGeo = trackGeo(new THREE.BoxGeometry(0.78, 0.3, 0.62));
    var hatchCabinGeo = trackGeo(new THREE.BoxGeometry(0.6, 0.3, 0.62));
    var pickCabinGeo = trackGeo(new THREE.BoxGeometry(0.52, 0.38, 0.68));
    var pickBedGeo = trackGeo(new THREE.BoxGeometry(0.72, 0.05, 0.56));
    var pickGlassGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.2, 0.6));
    // per-variant layout: sedan = long body + centered glass cabin;
    // hatchback = short body + rear-flush glass cabin; pickup = front cabin +
    // open flat bed (dark inset) + windshield panel. bodyScale maps the old
    // box (length,height,width) onto the shared capsule's 1.6x1.0x1.0 hull.
    // blobLen/blobWidth size that variant's shared blob-shadow ellipse.
    var CAR_VARIANTS = [
      { bodyGeo: carBodyGeo, bodyScale: [0.9375, 0.3, 0.72], bodyY: 0.36, cabinGeo: sedanCabinGeo, cabinX: -0.05, cabinY: 0.66, glassCabin: true, front: 0.75, wheelX: 0.45, blobLen: 1.5, blobWidth: 0.8 },
      { bodyGeo: carBodyGeo, bodyScale: [0.71875, 0.34, 0.7], bodyY: 0.36, cabinGeo: hatchCabinGeo, cabinX: -0.27, cabinY: 0.68, glassCabin: true, front: 0.575, wheelX: 0.38, blobLen: 1.1, blobWidth: 0.78 },
      { bodyGeo: carBodyGeo, bodyScale: [0.90625, 0.24, 0.7], bodyY: 0.33, cabinGeo: pickCabinGeo, cabinX: 0.35, cabinY: 0.64, glassCabin: false, front: 0.725, wheelX: 0.5, blobLen: 1.45, blobWidth: 0.78 }
    ];
    for (var c = 0; c < CAR_DEFS.length; c++) {
      var cd = CAR_DEFS[c];
      var vp = CAR_VARIANTS[cd.variant];
      var carGroup = new THREE.Group();
      carGroup.scale.setScalar(CAR_SCALE);
      var carMat = toonMat({ color: cd.color, roughness: 0.7 });
      var body = new THREE.Mesh(vp.bodyGeo, carMat);
      body.scale.set(vp.bodyScale[0], vp.bodyScale[1], vp.bodyScale[2]);
      body.position.y = vp.bodyY;
      carGroup.add(body);
      var cabin = new THREE.Mesh(vp.cabinGeo, vp.glassCabin ? carGlassMat : carMat);
      cabin.position.set(vp.cabinX, vp.cabinY, 0);
      carGroup.add(cabin);
      if (cd.variant === 2) {
        // open flat bed: dark inset on the rear deck + windshield glass panel
        var bed = new THREE.Mesh(pickBedGeo, wheelMat);
        bed.position.set(-0.33, 0.475, 0);
        carGroup.add(bed);
        var shield = new THREE.Mesh(pickGlassGeo, carGlassMat);
        shield.position.set(0.63, 0.68, 0);
        carGroup.add(shield);
      }
      for (var wq = 0; wq < 4; wq++) {
        var wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wq < 2 ? -vp.wheelX : vp.wheelX, 0.14, wq % 2 === 0 ? -0.34 : 0.34);
        carGroup.add(wheel);
      }
      // headlights (warm white, night-only) front / taillights (red) rear
      for (var lz = 0; lz < 2; lz++) {
        var head = new THREE.Mesh(carLightGeo, carHeadMat);
        head.position.set(vp.front + 0.02, 0.36, lz === 0 ? -0.24 : 0.24);
        carGroup.add(head);
        var tail = new THREE.Mesh(carLightGeo, carTailMat);
        tail.position.set(-(vp.front + 0.02), 0.36, lz === 0 ? -0.24 : 0.24);
        carGroup.add(tail);
      }
      var bumper = new THREE.Mesh(carBumperGeo, wheelMat);
      bumper.position.set(vp.front + 0.04, 0.22, 0);
      carGroup.add(bumper);
      // blob shadow: a child of carGroup, so it moves/turns for free with the
      // car every frame with zero extra per-frame code
      var carBlob = new THREE.Mesh(blobGeo, blobMatCar);
      carBlob.scale.set(vp.blobLen, 1, vp.blobWidth);
      carBlob.position.y = -0.02;
      carGroup.add(carBlob);

      if (cd.axis === "x") {
        carGroup.position.set(cd.start, 0.04, cd.lane);
        carGroup.rotation.y = cd.dir > 0 ? 0 : Math.PI;
      } else {
        carGroup.position.set(cd.lane, 0.04, cd.start);
        carGroup.rotation.y = cd.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      }
      cityGroup.add(carGroup);
      var car = {
        group: carGroup, axis: cd.axis, dir: cd.dir, speed: cd.speed,
        // cross-street cars yield where their street crosses the two avenues;
        // ixX = this street's center x (intersection centers precomputed)
        ixX: cd.axis === "z" ? (cd.lane < 0 ? CROSS_X_WEST : CROSS_X_EAST) : 0
      };
      cars.push(car);
      if (cd.mainRoad) mainRoadCars.push(car);
      if (cd.avenue) avenueCars.push(car);
    }

    // ---------- low-poly pedestrians: shared geometries + small shared material pools ----------
    var pedHeadGeo = trackGeo(new THREE.SphereGeometry(0.09, 8, 8));
    // capsule torso (visual-polish pass, was a flat box): radius+length chosen
    // to match the old box's ~0.34 height; this ONE shared geometry upgrades
    // every ped + the player at once
    var pedTorsoGeo = trackGeo(new THREE.CapsuleGeometry(0.1, 0.16, 2, 6));
    var pedLegGeo = trackGeo(new THREE.BoxGeometry(0.07, 0.3, 0.09));
    pedLegGeo.translate(0, -0.15, 0); // pivot legs at the hip
    // shared arm capsule, pivoted at the shoulder (top) so rotation.x swings
    // it forward/back like the legs; reused for both arms on every ped
    var pedArmGeo = trackGeo(new THREE.CapsuleGeometry(0.026, 0.14, 2, 5));
    pedArmGeo.translate(0, -0.096, 0);
    var pedHairGeo = trackGeo(new THREE.SphereGeometry(0.095, 8, 6));
    var pedBagGeo = trackGeo(new THREE.BoxGeometry(0.09, 0.16, 0.07));
    var umbPoleGeo = trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 5));
    var umbTopGeo = trackGeo(new THREE.ConeGeometry(0.24, 0.14, 8));
    // material pools created ONCE each; every ped picks from the pools.
    // toon (visual-polish pass): skin/shirt/pants/hair are the most-visible
    // ped surfaces; bag/umbrella stay standard (small accessories, low value)
    var pedSkinMats = [
      toonMat({ color: 0xd9a878, roughness: 0.9 }),
      toonMat({ color: 0xc68d5e, roughness: 0.9 }),
      toonMat({ color: 0x9c6b48, roughness: 0.9 }),
      toonMat({ color: 0xe8c39a, roughness: 0.9 })
    ];
    var pedShirtMats = [
      toonMat({ color: 0x5f6b7a, roughness: 0.9 }),
      toonMat({ color: 0x7a6455, roughness: 0.9 }),
      toonMat({ color: 0x6b7a5f, roughness: 0.9 }),
      toonMat({ color: 0x846f7c, roughness: 0.9 }),
      toonMat({ color: 0x556b6e, roughness: 0.9 }),
      toonMat({ color: 0x8a5f5f, roughness: 0.9 })
    ];
    var pedPantsMats = [
      toonMat({ color: 0x3a3a40, roughness: 0.9 }),
      toonMat({ color: 0x4a4038, roughness: 0.9 }),
      toonMat({ color: 0x35424e, roughness: 0.9 }),
      toonMat({ color: 0x5a5248, roughness: 0.9 })
    ];
    var pedHairMats = [
      toonMat({ color: 0x2c2622, roughness: 0.95 }),
      toonMat({ color: 0x4a3826, roughness: 0.95 }),
      toonMat({ color: 0x6e5a3a, roughness: 0.95 }),
      toonMat({ color: 0x8a8a8a, roughness: 0.95 })
    ];
    var pedBagMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9 }));
    var umbMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x9c4f4f, roughness: 0.8 }));
    for (var p = 0; p < PED_DEFS.length; p++) {
      var pd = PED_DEFS[p];
      var pedGroup = new THREE.Group();
      pedGroup.scale.setScalar(PED_SCALE);
      var torso = new THREE.Mesh(pedTorsoGeo, pedShirtMats[p % pedShirtMats.length]);
      torso.position.y = 0.47;
      torso.userData.pedIndex = p; // idle-mode NPC tap hit-test (Stage B2)
      npcMeshes.push(torso);
      pedGroup.add(torso);
      var head = new THREE.Mesh(pedHeadGeo, pedSkinMats[p % pedSkinMats.length]);
      head.position.y = 0.73;
      head.userData.pedIndex = p;
      npcMeshes.push(head);
      pedGroup.add(head);
      addFace(pedGroup, 0.735, 0.083, 0.033, 1, true); // little eyes + blush
      var hair = new THREE.Mesh(pedHairGeo, pedHairMats[(p * 3 + 1) % pedHairMats.length]);
      hair.scale.set(1, 0.6, 1);
      hair.position.set(0, 0.775, -0.01);
      pedGroup.add(hair);
      var pantsMat = pedPantsMats[(p + 1) % pedPantsMats.length];
      var legL = new THREE.Mesh(pedLegGeo, pantsMat);
      legL.position.set(-0.06, 0.3, 0);
      pedGroup.add(legL);
      var legR = new THREE.Mesh(pedLegGeo, pantsMat);
      legR.position.set(0.06, 0.3, 0);
      pedGroup.add(legR);
      var armMat = pedSkinMats[p % pedSkinMats.length]; // bare arms, reuse skin color
      var armL = new THREE.Mesh(pedArmGeo, armMat);
      armL.position.set(-0.14, 0.6, 0);
      pedGroup.add(armL);
      var armR = new THREE.Mesh(pedArmGeo, armMat);
      armR.position.set(0.14, 0.6, 0);
      pedGroup.add(armR);
      if (pd.bag) {
        var bag = new THREE.Mesh(pedBagGeo, pedBagMat);
        bag.position.set(0.17, 0.36, 0.02);
        pedGroup.add(bag);
      }
      if (pd.umbrella) {
        var umbPole = new THREE.Mesh(umbPoleGeo, poleMat);
        umbPole.position.set(0.14, 0.78, 0.03);
        pedGroup.add(umbPole);
        var umbTop = new THREE.Mesh(umbTopGeo, umbMat);
        umbTop.position.set(0.14, 1.06, 0.03);
        pedGroup.add(umbTop);
      }
      // blob shadow: a child of pedGroup so it auto-follows position/scale
      // (including the enter-the-cafe shrink animation) with zero extra code
      var pedBlob = new THREE.Mesh(blobGeo, blobMatPed);
      pedBlob.scale.set(0.55, 1, 0.42);
      pedBlob.position.y = -0.02;
      pedGroup.add(pedBlob);
      cityGroup.add(pedGroup);

      // precompute path segments (lengths, cumulative starts, yaw) — the
      // per-frame update lerps along these with zero allocations
      var segs = [];
      var total = 0;
      for (var s2 = 0; s2 < pd.pts.length - 1; s2++) {
        var ax = pd.pts[s2][0];
        var az = pd.pts[s2][1];
        var dx = pd.pts[s2 + 1][0] - ax;
        var dz = pd.pts[s2 + 1][1] - az;
        var len = Math.sqrt(dx * dx + dz * dz);
        segs.push({ ax: ax, az: az, dx: dx, dz: dz, len: len, start: total, yaw: Math.atan2(dx, dz) });
        total += len;
      }
      peds.push({
        group: pedGroup, legL: legL, legR: legR, armL: armL, armR: armR, segs: segs, total: total,
        speed: pd.speed, dist: pd.startFrac * total, enters: pd.enters,
        mode: "walk", timer: 0, waitDur: pd.waitDur || 3, pauseT: 0,
        bobAmp: 0.03 + (p % 3) * 0.007 // per-ped constant bob amplitude
      });
    }

    // ---------- Stage B2: player character (chibi, hidden until walk mode) ----------
    // Reuses the shared ped geometries; unique tracked materials give it a
    // cream shirt + brown apron + distinct near-black hair; ~1.15x ped scale.
    var playerShirtMat = toonMat({ color: COLOR_CREAM, roughness: 0.9 });
    var playerApronMat = toonMat({ color: 0x6d4c41, roughness: 0.9 });
    var playerHairMat = toonMat({ color: 0x241c14, roughness: 0.95 });
    var playerApronGeo = trackGeo(new THREE.BoxGeometry(0.2, 0.26, 0.04));
    var plGroup = new THREE.Group();
    var plTorso = new THREE.Mesh(pedTorsoGeo, playerShirtMat);
    plTorso.position.y = 0.47;
    plGroup.add(plTorso);
    var plApron = new THREE.Mesh(playerApronGeo, playerApronMat);
    plApron.position.set(0, 0.43, 0.08);
    plGroup.add(plApron);
    var plHead = new THREE.Mesh(pedHeadGeo, pedSkinMats[0]);
    plHead.position.y = 0.73;
    plGroup.add(plHead);
    var plHair = new THREE.Mesh(pedHairGeo, playerHairMat);
    plHair.scale.set(1.05, 0.7, 1.05);
    plHair.position.set(0, 0.78, -0.01);
    plGroup.add(plHair);
    var plLegL = new THREE.Mesh(pedLegGeo, pedPantsMats[0]);
    plLegL.position.set(-0.06, 0.3, 0);
    plGroup.add(plLegL);
    var plLegR = new THREE.Mesh(pedLegGeo, pedPantsMats[0]);
    plLegR.position.set(0.06, 0.3, 0);
    plGroup.add(plLegR);
    var plArmL = new THREE.Mesh(pedArmGeo, pedSkinMats[0]);
    plArmL.position.set(-0.14, 0.6, 0);
    plGroup.add(plArmL);
    var plArmR = new THREE.Mesh(pedArmGeo, pedSkinMats[0]);
    plArmR.position.set(0.14, 0.6, 0);
    plGroup.add(plArmR);
    plGroup.scale.set(1.15, 1.15, 1.15);
    plGroup.visible = false;
    cityGroup.add(plGroup);
    // player blob shadow: NOT a child of plGroup — plGroup.visible stays false
    // for the whole walk mode (first-person hides the player's own body), but
    // the ground shadow should stay visible for a depth cue, so it's an
    // independent sibling toggled by mode instead of by plGroup.visible
    var playerBlob = new THREE.Mesh(blobGeo, blobMatPed);
    playerBlob.scale.set(0.6, 1, 0.46);
    playerBlob.position.set(CAFE_DOOR_X, 0.015, CAFE_DOOR_Z);
    playerBlob.visible = false;
    cityGroup.add(playerBlob);
    player = {
      group: plGroup, legL: plLegL, legR: plLegR, armL: plArmL, armR: plArmR,
      blob: playerBlob, x: CAFE_DOOR_X, z: CAFE_DOOR_Z, yaw: 0, dist: 0
    };

    // ---------- Stage B2: player's own pickup (cream body + gold stripe + brown bed) ----------
    // Same Phase-A pickup variant geometry set with unique tracked materials;
    // only visible when owned (setPickupOwned), parked beside the cafe.
    var pkBodyMat = toonMat({ color: COLOR_CREAM, roughness: 0.55 });
    var pkStripeMat = toonMat({ color: COLOR_GOLD, roughness: 0.5 });
    var pkBedMat = toonMat({ color: 0x6d4c41, roughness: 0.85 });
    var pkStripeGeo = trackGeo(new THREE.BoxGeometry(1.47, 0.07, 0.73)); // slightly wider than the body -> side stripe
    var pkVar = CAR_VARIANTS[2];
    var pkGroup = new THREE.Group();
    var pkBody = new THREE.Mesh(pkVar.bodyGeo, pkBodyMat);
    pkBody.scale.set(pkVar.bodyScale[0], pkVar.bodyScale[1], pkVar.bodyScale[2]);
    pkBody.position.y = pkVar.bodyY;
    pkGroup.add(pkBody);
    var pkStripe = new THREE.Mesh(pkStripeGeo, pkStripeMat);
    pkStripe.position.y = pkVar.bodyY + 0.09;
    pkGroup.add(pkStripe);
    var pkCabin = new THREE.Mesh(pkVar.cabinGeo, pkBodyMat);
    pkCabin.position.set(pkVar.cabinX, pkVar.cabinY, 0);
    pkGroup.add(pkCabin);
    var pkBed = new THREE.Mesh(pickBedGeo, pkBedMat);
    pkBed.position.set(-0.33, 0.475, 0);
    pkGroup.add(pkBed);
    var pkShield = new THREE.Mesh(pickGlassGeo, carGlassMat);
    pkShield.position.set(0.63, 0.68, 0);
    pkGroup.add(pkShield);
    var pkWheels = [];
    for (var pw = 0; pw < 4; pw++) {
      var pkWheel = new THREE.Mesh(wheelGeo, wheelMat);
      pkWheel.rotation.x = Math.PI / 2;
      pkWheel.position.set(pw < 2 ? -pkVar.wheelX : pkVar.wheelX, 0.14, pw % 2 === 0 ? -0.34 : 0.34);
      pkGroup.add(pkWheel);
      pkWheels.push(pkWheel);
    }
    for (var pk2 = 0; pk2 < 2; pk2++) { // shared night-light materials like Phase-A cars
      var pkHead = new THREE.Mesh(carLightGeo, carHeadMat);
      pkHead.position.set(pkVar.front + 0.02, 0.36, pk2 === 0 ? -0.24 : 0.24);
      pkGroup.add(pkHead);
      var pkTail = new THREE.Mesh(carLightGeo, carTailMat);
      pkTail.position.set(-(pkVar.front + 0.02), 0.36, pk2 === 0 ? -0.24 : 0.24);
      pkGroup.add(pkTail);
    }
    var pkBlob = new THREE.Mesh(blobGeo, blobMatCar); // child: follows the pickup for free
    pkBlob.scale.set(pkVar.blobLen, 1, pkVar.blobWidth);
    pkBlob.position.y = -0.02;
    pkGroup.add(pkBlob);
    pkGroup.scale.setScalar(CAR_SCALE);
    pkGroup.position.set(PICKUP_HOME_X, 0.04, PICKUP_HOME_Z);
    pkGroup.rotation.y = PICKUP_HOME_YAW; // parked facing the road, not the cafe wall
    pkGroup.visible = false;
    cityGroup.add(pkGroup);
    playerPickup = { group: pkGroup, wheels: pkWheels, x: PICKUP_HOME_X, z: PICKUP_HOME_Z, yaw: PICKUP_HOME_YAW, speed: 0 };
  }

  // intersection rows watched by the cross-street yield rule (constants, no
  // per-frame allocation): main road first, then the avenue
  var yieldRowZs = [ROAD_Z, AVENUE_Z];
  var yieldRowCars = [mainRoadCars, avenueCars];

  function updateCars(dt) {
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (i >= qMaxCars) { if (c.group.visible) c.group.visible = false; continue; }
      else if (!c.group.visible) c.group.visible = true;
      if (c.axis === "z") {
        // cross-street car: yield if within 2.5 of a row crossing while any
        // car on that row is within 3.5 of the intersection center
        var pz = c.group.position.z;
        var blocked = false;
        for (var r = 0; r < 2 && !blocked; r++) {
          var dz = (yieldRowZs[r] - pz) * c.dir; // > 0 while approaching
          if (dz > 0 && dz <= 2.5) {
            var watch = yieldRowCars[r];
            for (var m = 0; m < watch.length; m++) {
              if (Math.abs(watch[m].group.position.x - c.ixX) < 3.5) { blocked = true; break; }
            }
          }
        }
        if (blocked) continue; // paused (speed 0) until the row is clear
        c.group.position.z += c.speed * c.dir * dt;
        if (c.dir > 0 && c.group.position.z > CAR_WRAP) c.group.position.z = -CAR_WRAP;
        else if (c.dir < 0 && c.group.position.z < -CAR_WRAP) c.group.position.z = CAR_WRAP;
      } else {
        c.group.position.x += c.speed * c.dir * dt;
        if (c.dir > 0 && c.group.position.x > CAR_WRAP) c.group.position.x = -CAR_WRAP;
        else if (c.dir < 0 && c.group.position.x < -CAR_WRAP) c.group.position.x = CAR_WRAP;
      }
    }
  }

  function updatePeds(dt) {
    for (var i = 0; i < peds.length; i++) {
      var p = peds[i];
      if (i >= qMaxPeds) { if (p.group.visible) p.group.visible = false; continue; }
      if (p.mode === "wait") {
        p.timer -= dt;
        if (p.timer > 0) continue;
        p.mode = "walk";
        p.dist = 0;
        p.group.visible = true;
        p.group.scale.set(1, 1, 1);
        // fall through to the walk update so the position resets to the path
        // start this same frame (no one-frame full-size flash at the door)
      }
      if (p.mode === "enter") {
        p.timer += dt;
        var k = 1 - p.timer / PED_ENTER_DURATION;
        if (k <= 0.05) {
          p.mode = "wait";
          p.timer = p.waitDur;
          p.group.visible = false;
        } else {
          p.group.scale.set(k, k, k);
        }
        continue;
      }
      if (p.pauseT > 0) { // tapped NPC stands still briefly (Stage B2)
        p.pauseT -= dt;
        p.legL.rotation.x = 0;
        p.legR.rotation.x = 0;
        p.armL.rotation.x = 0;
        p.armR.rotation.x = 0;
        continue;
      }
      p.dist += p.speed * dt;
      if (p.dist >= p.total) {
        if (p.enters) {
          p.mode = "enter";
          p.timer = 0;
          continue;
        }
        p.dist -= p.total;
      }
      var seg = p.segs[0];
      for (var j = p.segs.length - 1; j >= 0; j--) {
        if (p.dist >= p.segs[j].start) { seg = p.segs[j]; break; }
      }
      var t = seg.len > 0 ? (p.dist - seg.start) / seg.len : 0;
      var bob = Math.abs(Math.sin(p.dist * 7)) * p.bobAmp;
      p.group.position.set(seg.ax + seg.dx * t, PED_BASE_Y + bob, seg.az + seg.dz * t);
      p.group.rotation.y = seg.yaw;
      var swing = Math.sin(p.dist * 7) * 0.55;
      p.legL.rotation.x = swing;
      p.legR.rotation.x = -swing;
      // arms mirror the OPPOSITE-side leg (natural gait), phase-shared with
      // the leg swing already computed above — zero extra allocations
      p.armL.rotation.x = -swing;
      p.armR.rotation.x = swing;
    }
  }

  // ---------- cozy back garden/patio behind the cafe (the "belakang cafe ada
  // apa" content): parasol tables + chairs + planters + a string of warm
  // fairy lights that glow at night. Static city-level content under cityGroup. ----------
  function buildBackyard() {
    // shared geometries
    var tableTopGeo = trackGeo(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 12));
    var tableLegGeo = trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6));
    var poleGeo = trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6));
    var parasolGeo = trackGeo(new THREE.ConeGeometry(0.62, 0.34, 10));
    var chairSeatGeo = trackGeo(new THREE.BoxGeometry(0.26, 0.05, 0.26));
    var chairBackGeo = trackGeo(new THREE.BoxGeometry(0.26, 0.28, 0.05));
    var chairLegGeo = trackGeo(new THREE.BoxGeometry(0.04, 0.28, 0.04));
    var planterGeo = trackGeo(new THREE.BoxGeometry(0.5, 0.34, 0.5));
    var bushGeo = trackGeo(new THREE.SphereGeometry(0.3, 8, 7));
    var bulbGeo = trackGeo(new THREE.SphereGeometry(0.06, 6, 5));
    var wireGeo = trackGeo(new THREE.BoxGeometry(0.02, 0.02, 1));
    // materials
    var woodMat = toonMat({ color: 0x8a5a3c, roughness: 0.9 });
    var tableMat = toonMat({ color: COLOR_CREAM, roughness: 0.8 });
    var parasolMats = [toonMat({ color: 0xc45b4a, roughness: 0.85 }), toonMat({ color: 0x5a8a6a, roughness: 0.85 }), toonMat({ color: 0xe0a94e, roughness: 0.85 })];
    var planterMat = toonMat({ color: 0x6d4c41, roughness: 0.9 });
    var bushMat = toonMat({ color: 0x4f6446, roughness: 1 });
    var wireMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x3a2f26, roughness: 0.9 }));
    patioLightMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffcf7a, emissiveIntensity: 0.1, roughness: 0.4 }));

    // idle-management stage: each patio table is a GROUP (parasol + table + 2
    // chairs + one seated customer) kept hidden until the player buys enough
    // "Meja". setPatioTables(n) reveals the first n -> the patio visibly fills up.
    // Each seat is stored so the loop can emit "+coin" sprites and swap customers.
    var PATIO_SPOTS = [[-3.4, -3.3], [0, -3.3], [3.4, -3.3], [-3.4, -4.9], [0, -4.9], [3.4, -4.9]];
    var PATIO_SC = 0.62;
    for (var pt = 0; pt < PATIO_SPOTS.length; pt++) {
      var g = new THREE.Group();
      var px = PATIO_SPOTS[pt][0], pz = PATIO_SPOTS[pt][1];
      var top = new THREE.Mesh(tableTopGeo, tableMat); top.position.set(px, 0.52, pz); g.add(top);
      var leg = new THREE.Mesh(tableLegGeo, woodMat); leg.position.set(px, 0.25, pz); g.add(leg);
      var pole = new THREE.Mesh(poleGeo, woodMat); pole.position.set(px, 1.05, pz); g.add(pole);
      var para = new THREE.Mesh(parasolGeo, parasolMats[pt % parasolMats.length]); para.position.set(px, 1.62, pz); g.add(para);
      // a light under each umbrella, child of the table group so it only turns
      // on once that table is revealed (g.visible is toggled by setPatioTables)
      var pLight = new THREE.PointLight(0xffd9a0, 2.2, 5, 2);
      pLight.position.set(px, 1.4, pz);
      g.add(pLight);
      patioLights.push(pLight);
      for (var c = 0; c < 2; c++) {
        var sgn = c === 0 ? 1 : -1;
        var cx = px, cz = pz + sgn * 0.5;
        var seat = new THREE.Mesh(chairSeatGeo, woodMat); seat.position.set(cx, 0.3, cz); g.add(seat);
        var back = new THREE.Mesh(chairBackGeo, woodMat); back.position.set(cx, 0.44, cz + sgn * 0.11); g.add(back);
        var cleg = new THREE.Mesh(chairLegGeo, woodMat); cleg.position.set(cx, 0.15, cz); g.add(cleg);
      }
      // a seated customer on the near-side chair (facing the table, toward the cafe);
      // seat is on the +z side of the table (cz = pz+0.5) so facing the table means
      // facing -z (yaw=PI) — yaw=0 had them facing their own chair back instead
      // group y = the chair seat height (0.3), not the ground -- otherwise the
      // (scaled-down) customer sits buried at the base of the chair instead of on it
      var cust = addChibi(g, px, 0.3, pz + 0.5, Math.PI, PATIO_SHIRTS[pt % PATIO_SHIRTS.length], 0x2c2218, true);
      cust.scale.setScalar(PATIO_SC);
      g.visible = false;
      cityGroup.add(g);
      patioSeats.push({
        group: g, cust: cust, torsoMat: cust.children[0].material, sc: PATIO_SC,
        coinT: 1.5 + pt * 0.6, swapT: 14 + pt * 4, swapDir: 0
      });
    }
    // pool of rising "+coin" sprites (each its own material so it can fade solo)
    var coinGeo = trackGeo(new THREE.CircleGeometry(0.13, 14));
    for (var cn = 0; cn < 10; cn++) {
      var cmat = new THREE.MeshBasicMaterial({ color: COLOR_GOLD, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      trackMat(cmat);
      var coin = new THREE.Mesh(coinGeo, cmat); coin.visible = false; cityGroup.add(coin);
      patioCoins.push({ mesh: coin, mat: cmat, life: 0 });
    }

    // planter + bush row along the back (north of the avenue keep-out)
    var planterX = [-4.5, -1.5, 1.5, 4.5];
    for (var p = 0; p < planterX.length; p++) {
      var pl = new THREE.Mesh(planterGeo, planterMat); pl.position.set(planterX[p], 0.17, -6.0); cityGroup.add(pl);
      var bush = new THREE.Mesh(bushMat ? bushGeo : bushGeo, bushMat); bush.position.set(planterX[p], 0.5, -6.0); bush.scale.set(1, 0.85, 1); cityGroup.add(bush);
    }

    // string of fairy lights: 2 posts behind the cafe with a drooping wire +
    // warm bulbs (glow at night via patioLightMat in applyDayNight)
    var postGeo = trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6));
    var postL = new THREE.Mesh(postGeo, woodMat); postL.position.set(-5.2, 1.1, -3.5); cityGroup.add(postL);
    var postR = new THREE.Mesh(postGeo, woodMat); postR.position.set(5.2, 1.1, -3.5); cityGroup.add(postR);
    // horizontal wire spanning the two posts along X (rotate.y maps the geo's
    // z-length onto x; the old rotate.x tipped it up into a 10-unit tall pole)
    var wire = new THREE.Mesh(wireGeo, wireMat); wire.position.set(0, 2.0, -3.5); wire.rotation.y = Math.PI / 2; wire.scale.set(1, 1, 10.4); cityGroup.add(wire);
    for (var b = 0; b < 11; b++) {
      var bx = -5.0 + b * 1.0;
      var droop = Math.cos((bx / 5.2) * Math.PI / 2) * 0.18; // gentle catenary sag
      var bulb = new THREE.Mesh(bulbGeo, patioLightMat);
      bulb.position.set(bx, 2.0 - 0.22 + droop, -3.5);
      cityGroup.add(bulb);
    }
    // coffee steam: soft billboard puffs rising from the cafe entrance, looping.
    // reuse the cloud texture; each puff owns a material so it can fade solo.
    var steamGeo = trackGeo(new THREE.PlaneGeometry(0.5, 0.6));
    var STEAM_BASE = { x: 0.55, y: 1.25, z: 1.15 };
    for (var sp = 0; sp < 5; sp++) {
      var sm = trackMat(new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
      var puff = new THREE.Mesh(steamGeo, sm);
      puff.position.set(STEAM_BASE.x, STEAM_BASE.y, STEAM_BASE.z);
      cityGroup.add(puff);
      steamPuffs.push({ mesh: puff, mat: sm, phase: sp / 5, base: STEAM_BASE });
    }
  }

  // ---------- Fase D: simple chibi figures (barista / seated customers / boss) ----------
  // (fig* geos/materials are defined ABOVE the build() calls — see near buildCity —
  // because buildInterior/buildBossRoom run before this line; defining them here
  // left them `undefined` at build time, so chibis got Three's default white
  // material + empty geometry = only the (separately-materialed) face showed.)
  function addChibi(group, x, y, z, yaw, shirtColor, hairColor, seated) {
    var g = new THREE.Group();
    var torso = new THREE.Mesh(figTorsoGeo, toonMat({ color: shirtColor, roughness: 0.9 }));
    torso.position.y = seated ? 0.46 : 0.6; g.add(torso);
    var head = new THREE.Mesh(figHeadGeo, figSkinMat); head.position.y = seated ? 0.72 : 0.86; g.add(head);
    addFace(g, (seated ? 0.725 : 0.865), 0.118, 0.045, 1.5, true); // face on the chibi head
    var hair = new THREE.Mesh(figHeadGeo, toonMat({ color: hairColor, roughness: 0.95 }));
    hair.scale.set(1.04, 0.55, 1.04); hair.position.set(0, (seated ? 0.79 : 0.93), -0.01); g.add(hair);
    if (!seated) {
      var ll = new THREE.Mesh(figLegGeo, figPantsMat); ll.position.set(-0.07, 0.17, 0); g.add(ll);
      var lr = new THREE.Mesh(figLegGeo, figPantsMat); lr.position.set(0.07, 0.17, 0); g.add(lr);
    }
    g.position.set(x, y, z); g.rotation.y = yaw || 0;
    group.add(g);
    return g;
  }

  // ---------- Fase D: animated customers who walk in the door and sit down ----------
  // Body meshes live under an inner `body` group so sitting = drop body 0.14 + hide
  // legs + raise base to the chair seat (0.28), landing EXACTLY on the static
  // seated pose. Standing = body at 0, legs visible + swinging. Each customer has
  // one clean straight lane (its own x column) so no path ever crosses a table.
  function makeLiveCustomer(shirt, hairC) {
    var g = new THREE.Group();
    var body = new THREE.Group(); g.add(body);
    var torso = new THREE.Mesh(figTorsoGeo, toonMat({ color: shirt, roughness: 0.9 })); torso.position.y = 0.6; body.add(torso);
    var head = new THREE.Mesh(figHeadGeo, figSkinMat); head.position.y = 0.86; body.add(head);
    addFace(body, 0.865, 0.118, 0.045, 1.5, true);
    var hair = new THREE.Mesh(figHeadGeo, toonMat({ color: hairC, roughness: 0.95 })); hair.scale.set(1.04, 0.55, 1.04); hair.position.set(0, 0.93, -0.01); body.add(hair);
    var legL = new THREE.Mesh(figLegGeo, figPantsMat); legL.position.set(-0.07, 0.17, 0); g.add(legL);
    var legR = new THREE.Mesh(figLegGeo, figPantsMat); legR.position.set(0.07, 0.17, 0); g.add(legR);
    g.userData = { body: body, legL: legL, legR: legR, torso: torso };
    g.visible = false; interiorGroup.add(g);
    return g;
  }
  // cfg: { col, chairZ, sitYaw, delay } in INT_ORIGIN space
  function spawnLiveCustomer(cfg) {
    var O = INT_ORIGIN, g = makeLiveCustomer(CUST_SHIRTS[0], 0x2c2218);
    liveCusts.push({
      g: g, u: g.userData, state: "wait", timer: cfg.delay, phase: 0, baseY: O.y, sitYaw: cfg.sitYaw,
      door: [O.x + cfg.col, O.z + 3.0], approach: [O.x + cfg.col, O.z + cfg.chairZ + 0.47],
      chair: [O.x + cfg.col, O.z + cfg.chairZ], exit: [O.x + cfg.col, O.z + 3.7]
    });
  }
  function custStand(c) { c.u.body.position.y = 0; c.u.legL.visible = c.u.legR.visible = true; c.g.position.y = c.baseY; }
  function custSit(c) { c.u.body.position.y = -0.14; c.u.legL.visible = c.u.legR.visible = false; c.g.position.y = c.baseY + 0.28; }
  function custSwing(c, dt) { c.phase += dt * 8; var s = Math.sin(c.phase) * 0.5; c.u.legL.rotation.x = s; c.u.legR.rotation.x = -s; }
  function custLegsRest(c) { c.u.legL.rotation.x = c.u.legR.rotation.x = 0; }
  function custMoveTo(c, tx, tz, dt) {
    var dx = tx - c.g.position.x, dz = tz - c.g.position.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return true;
    var st = Math.min(d, 1.3 * dt);
    c.g.position.x += dx / d * st; c.g.position.z += dz / d * st;
    return false;
  }
  function updateLiveInterior(dt) {
    for (var i = 0; i < liveCusts.length; i++) {
      var c = liveCusts[i];
      c.timer -= dt;
      if (c.state === "wait") {
        c.g.visible = false;
        if (c.timer <= 0) {
          c.g.visible = true; c.state = "walkIn";
          c.u.torso.material.color.setHex(CUST_SHIRTS[Math.floor(Math.random() * CUST_SHIRTS.length)]); // a fresh face each time
          c.g.position.set(c.door[0], c.baseY, c.door[1]); c.g.rotation.y = Math.PI; custStand(c);
        }
      } else if (c.state === "walkIn") {
        custSwing(c, dt);
        if (custMoveTo(c, c.approach[0], c.approach[1], dt)) {
          custLegsRest(c); custSit(c);
          c.g.position.x = c.chair[0]; c.g.position.z = c.chair[1]; c.g.rotation.y = c.sitYaw;
          c.state = "sitting"; c.timer = 6 + Math.random() * 6;
        }
      } else if (c.state === "sitting") {
        if (c.timer <= 0) { custStand(c); c.g.position.set(c.approach[0], c.baseY, c.approach[1]); c.g.rotation.y = 0; c.state = "walkOut"; }
      } else if (c.state === "walkOut") {
        custSwing(c, dt);
        if (custMoveTo(c, c.exit[0], c.exit[1], dt)) { custLegsRest(c); c.state = "wait"; c.timer = 3 + Math.random() * 5; }
      }
    }
    for (var si = 0; si < intSteams.length; si++) {
      var st = intSteams[si]; st.phase += dt;
      var t = st.phase % 2; // 2s rise-and-fade cycle
      st.mesh.position.y = st.base + t * 0.18;
      st.mat.opacity = 0.32 * (1 - t / 2);
      st.mesh.quaternion.copy(camera.quaternion); // billboard toward camera
    }
    if (intBarista) {
      intTime += dt;
      intBarista.position.y = intBaristaY + Math.abs(Math.sin(intTime * 2.6)) * 0.03; // busy little bob
      intBarista.rotation.y = Math.sin(intTime * 1.2) * 0.38; // turn to/from the espresso machine
    }
  }

  // ---------- Fase D: cafe interior (wooden floor, counter, espresso machine,
  // tables + seated customers, barista, a door to the boss room) ----------
  function buildInterior() {
    var O = INT_ORIGIN;
    var counterMat = toonMat({ color: COLOR_WALL_MID, roughness: 0.85 });
    var floor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.4, 0.2, 7)), toonMat({ color: 0x8a5a3c, roughness: 0.9 }));
    floor.position.set(O.x, O.y - 0.1, O.z); interiorGroup.add(floor);
    var wallMat = toonMat({ color: 0xe8d8c0, roughness: 0.95 });
    // tall walls (4) + a front wall + a ceiling so the enclosed room never
    // shows the CSS sky behind it (the camera now orbits INSIDE — see animate)
    var back = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.4, 4, 0.2)), wallMat); back.position.set(O.x, O.y + 2.0, O.z - 3.4); interiorGroup.add(back);
    var front = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.4, 4, 0.2)), wallMat); front.position.set(O.x, O.y + 2.0, O.z + 3.4); interiorGroup.add(front);
    var sideGeo = trackGeo(new THREE.BoxGeometry(0.2, 4, 7));
    var left = new THREE.Mesh(sideGeo, wallMat); left.position.set(O.x - 4.1, O.y + 2.0, O.z); interiorGroup.add(left);
    var right = new THREE.Mesh(sideGeo, wallMat); right.position.set(O.x + 4.1, O.y + 2.0, O.z); interiorGroup.add(right);
    var ceil = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.4, 0.2, 7)), toonMat({ color: 0xd8c8b0, roughness: 0.95 })); ceil.position.set(O.x, O.y + 4.0, O.z); interiorGroup.add(ceil);
    // counter + top
    var counter = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5, 1, 0.9)), counterMat); counter.position.set(O.x - 0.6, O.y + 0.5, O.z - 2.5); interiorGroup.add(counter);
    var cTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.1, 0.12, 1.02)), toonMat({ color: COLOR_CREAM })); cTop.position.set(O.x - 0.6, O.y + 1.06, O.z - 2.5); interiorGroup.add(cTop);
    // espresso machine
    var mach = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.0, 0.55, 0.6)), toonMat({ color: 0xb8b8be, roughness: 0.5 })); mach.position.set(O.x - 1.8, O.y + 1.35, O.z - 2.6); interiorGroup.add(mach);
    var machGold = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.2, 0.2, 0.26)), toonMat({ color: COLOR_GOLD })); machGold.position.set(O.x - 1.8, O.y + 1.14, O.z - 2.24); interiorGroup.add(machGold);
    // menu board on the back wall
    var board = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.6, 0.9, 0.06)), toonMat({ color: COLOR_WALL_DARK })); board.position.set(O.x + 1.7, O.y + 1.95, O.z - 3.28); interiorGroup.add(board);
    // barista behind the counter, raised so head+shoulders clear the 1.06-tall
    // counter (standing on the floor its 0.86 head was fully hidden); the floating
    // lower body sits behind the counter front and is occluded anyway
    intBarista = addChibi(interiorGroup, O.x + 0.3, O.y + 0.42, O.z - 3.0, 0, COLOR_CREAM, 0x3a2a1e, false);
    intBaristaY = intBarista.position.y;
    // tables + chairs + a few seated customers
    var tableGeo = trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 12));
    var tableLegGeo = trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6));
    var chairGeo = trackGeo(new THREE.BoxGeometry(0.34, 0.06, 0.34));
    var chairBackGeo = trackGeo(new THREE.BoxGeometry(0.34, 0.34, 0.06));
    var custColors = [0xc45b4a, 0x5a8a6a, 0x54617a, 0xe0a94e];
    var tspots = [[-2.2, 0.8], [1.7, 0.6], [-0.3, 2.4]];
    for (var t = 0; t < tspots.length; t++) {
      var tx = O.x + tspots[t][0], tz = O.z + tspots[t][1];
      var top = new THREE.Mesh(tableGeo, toonMat({ color: 0xa8967c })); top.position.set(tx, O.y + 0.6, tz); interiorGroup.add(top);
      var leg = new THREE.Mesh(tableLegGeo, counterMat); leg.position.set(tx, O.y + 0.3, tz); interiorGroup.add(leg);
      for (var sidx = 0; sidx < 2; sidx++) {
        var sgn = sidx === 0 ? 1 : -1;
        var cz = tz + sgn * 0.55;
        var seat = new THREE.Mesh(chairGeo, counterMat); seat.position.set(tx, O.y + 0.32, cz); interiorGroup.add(seat);
        var cbk = new THREE.Mesh(chairBackGeo, counterMat); cbk.position.set(tx, O.y + 0.5, cz + sgn * 0.15); interiorGroup.add(cbk);
        // statics sit on the FAR side (sidx 1 -> yaw 0, facing the camera so their
        // faces show); the near side is left open for the walk-in customers below
        if (sidx === 1) addChibi(interiorGroup, tx, O.y + 0.28, cz, 0, custColors[t % custColors.length], 0x2c2622, true);
      }
    }
    // door to the boss room (right wall) + gold knob
    var bd = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 1.7, 0.95)), toonMat({ color: COLOR_WALL_DARK })); bd.position.set(O.x + 4.0, O.y + 0.85, O.z + 2.2); interiorGroup.add(bd);
    var knob = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.06, 6, 5)), toonMat({ color: COLOR_GOLD })); knob.position.set(O.x + 3.95, O.y + 0.85, O.z + 1.85); interiorGroup.add(knob);
    var light = new THREE.PointLight(0xffd9a0, 1.4, 14, 2); light.position.set(O.x, O.y + 2.6, O.z + 0.5); interiorGroup.add(light);
    // a coffee cup + rising steam on each table, in front of its (static) sitter
    var mugGeo = trackGeo(new THREE.CylinderGeometry(0.05, 0.044, 0.08, 8));
    var coffeeGeo = trackGeo(new THREE.CircleGeometry(0.044, 8));
    var mugMat = toonMat({ color: COLOR_CREAM }), coffeeMat = toonMat({ color: 0x3a241a });
    var steamGeo = trackGeo(new THREE.PlaneGeometry(0.07, 0.16));
    for (var ct = 0; ct < tspots.length; ct++) {
      var cx = O.x + tspots[ct][0], cz = O.z + tspots[ct][1] - 0.26; // near the far-side sitter
      var mug = new THREE.Mesh(mugGeo, mugMat); mug.position.set(cx, O.y + 0.64, cz); interiorGroup.add(mug);
      var coffee = new THREE.Mesh(coffeeGeo, coffeeMat); coffee.rotation.x = -Math.PI / 2; coffee.position.set(cx, O.y + 0.681, cz); interiorGroup.add(coffee);
      var sMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false }); trackMat(sMat);
      var steam = new THREE.Mesh(steamGeo, sMat); steam.position.set(cx, O.y + 0.78, cz); interiorGroup.add(steam);
      intSteams.push({ mesh: steam, mat: sMat, base: O.y + 0.78, phase: ct * 1.3 });
    }
    // steam rising from the espresso machine (mach at x-1.8, top ~y+1.62)
    var eMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false }); trackMat(eMat);
    var eSteam = new THREE.Mesh(steamGeo, eMat); eSteam.position.set(O.x - 1.8, O.y + 1.72, O.z - 2.6); interiorGroup.add(eSteam);
    intSteams.push({ mesh: eSteam, mat: eMat, base: O.y + 1.72, phase: 0.7 });
    // shop cat sitting on the counter (kawaii face, reuses the shared face mats)
    buildInteriorCat(O.x + 1.35, O.y + 1.06, O.z - 2.4, 0.15).scale.set(1.4, 1.4, 1.4);
    // walk-in customers on the near side of tables 0 & 1 (clean straight lanes),
    // staggered so the door isn't a crowd. chairZ = table z-offset + 0.55.
    spawnLiveCustomer({ col: -2.2, chairZ: 1.35, sitYaw: Math.PI, delay: 1.5 });
    spawnLiveCustomer({ col: 1.7, chairZ: 1.15, sitYaw: Math.PI, delay: 5.0 });
  }

  // one static sitting cat (orange) with the kawaii cartoon face, for the interior
  function buildInteriorCat(x, y, z, yaw) {
    var g = new THREE.Group();
    var fur = toonMat({ color: CAT_COLOR_ORANGE });
    var bodyGeo = trackGeo(new THREE.SphereGeometry(0.13, 10, 8));
    var headGeo = trackGeo(new THREE.SphereGeometry(0.095, 10, 8));
    var earGeo = trackGeo(new THREE.ConeGeometry(0.045, 0.09, 4));
    var tailGeo = trackGeo(new THREE.BoxGeometry(0.04, 0.04, 0.26)); tailGeo.translate(0, 0, 0.13);
    var pawGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.06, 0.05));
    var body = new THREE.Mesh(bodyGeo, fur); body.scale.set(1.0, 1.15, 0.9); body.position.y = 0.11; g.add(body);
    var head = new THREE.Mesh(headGeo, fur); head.position.set(0, 0.27, 0.03); g.add(head);
    var earL = new THREE.Mesh(earGeo, fur); earL.position.set(-0.05, 0.075, 0); earL.rotation.z = 0.28; head.add(earL);
    var earR = new THREE.Mesh(earGeo, fur); earR.position.set(0.05, 0.075, 0); earR.rotation.z = -0.28; head.add(earR);
    for (var ei = 0; ei < 2; ei++) {
      var ex = ei === 0 ? -0.037 : 0.037;
      var ew = new THREE.Mesh(faceEyeGeo, faceEyeWhiteMat); ew.scale.set(1.3, 1.8, 1.0); ew.position.set(ex, 0.02, 0.082); head.add(ew);
      var ep = new THREE.Mesh(faceEyeGeo, faceEyeMat); ep.scale.set(0.85, 1.15, 1.0); ep.position.set(ex, 0.016, 0.092); head.add(ep);
      var gl = new THREE.Mesh(faceEyeGeo, faceEyeWhiteMat); gl.scale.set(0.3, 0.3, 1.0); gl.position.set(ex - 0.007, 0.03, 0.099); head.add(gl);
      var ch = new THREE.Mesh(faceEyeGeo, faceCheekMat); ch.scale.set(1.5, 0.95, 0.6); ch.position.set(ex * 1.6, -0.018, 0.079); head.add(ch);
    }
    var nose = new THREE.Mesh(faceNoseGeo, faceNoseMat); nose.scale.set(1.2, 0.9, 1.0); nose.position.set(0, -0.012, 0.097); head.add(nose);
    var innerL = new THREE.Mesh(earGeo, faceNoseMat); innerL.scale.set(0.55, 0.6, 0.55); innerL.position.set(-0.05, 0.07, 0.012); innerL.rotation.z = 0.28; head.add(innerL);
    var innerR = new THREE.Mesh(earGeo, faceNoseMat); innerR.scale.set(0.55, 0.6, 0.55); innerR.position.set(0.05, 0.07, 0.012); innerR.rotation.z = -0.28; head.add(innerR);
    var pawL = new THREE.Mesh(pawGeo, fur); pawL.position.set(-0.05, 0.03, 0.1); g.add(pawL);
    var pawR = new THREE.Mesh(pawGeo, fur); pawR.position.set(0.05, 0.03, 0.1); g.add(pawR);
    var tail = new THREE.Mesh(tailGeo, fur); tail.position.set(0.1, 0.09, -0.05); tail.rotation.y = -0.7; g.add(tail);
    g.position.set(x, y, z); g.rotation.y = yaw || 0;
    interiorGroup.add(g);
    return g;
  }

  // ---------- pigeons pecking on the plaza in front of the cafe ----------
  function buildBirds() {
    var bodyGeo = trackGeo(new THREE.SphereGeometry(0.06, 8, 6));
    var headGeo = trackGeo(new THREE.SphereGeometry(0.038, 8, 6));
    var beakGeo = trackGeo(new THREE.ConeGeometry(0.013, 0.04, 4)); beakGeo.rotateX(Math.PI / 2);
    var tailGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.018, 0.08));
    var furMats = [
      trackMat(new THREE.MeshStandardMaterial({ color: 0x9a9aa2, roughness: 0.9 })),
      trackMat(new THREE.MeshStandardMaterial({ color: 0xccccd4, roughness: 0.9 })),
      trackMat(new THREE.MeshStandardMaterial({ color: 0x70707a, roughness: 0.9 }))
    ];
    var beakMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xe0a03a, roughness: 0.7 }));
    var spots = [[-2.3, 3.0], [-1.4, 3.5], [1.9, 3.2], [2.6, 2.4]]; // sidewalk/plaza in front (+z)
    for (var b = 0; b < spots.length; b++) {
      var mat = furMats[b % furMats.length];
      var g = new THREE.Group();
      var body = new THREE.Mesh(bodyGeo, mat); body.scale.set(1, 0.85, 1.35); body.position.y = 0.06; g.add(body);
      var neck = new THREE.Group(); neck.position.set(0, 0.09, 0.07); g.add(neck); // pivot so pecking rotates the head down
      var head = new THREE.Mesh(headGeo, mat); head.position.set(0, 0, 0); neck.add(head);
      var beak = new THREE.Mesh(beakGeo, beakMat); beak.position.set(0, -0.005, 0.045); neck.add(beak);
      var tail = new THREE.Mesh(tailGeo, mat); tail.position.set(0, 0.06, -0.11); tail.rotation.x = 0.3; g.add(tail);
      g.position.set(spots[b][0], PED_BASE_Y, spots[b][1]);
      g.rotation.y = b * 1.7;
      cityGroup.add(g);
      birds.push({ g: g, neck: neck, hx: spots[b][0], hz: spots[b][1], peckT: 0.6 + b * 0.5, hopT: 3 + b * 1.3, hop: null });
    }
  }
  function updateBirds(dt) {
    for (var i = 0; i < birds.length; i++) {
      var bd = birds[i];
      // startled flight: rise in an arc + flutter, then settle back on the home spot
      if (bd.fly) {
        bd.fly.t += dt;
        var pr = bd.fly.t / bd.fly.dur;
        if (pr >= 1) {
          bd.fly = null;
          bd.g.position.set(bd.hx, PED_BASE_Y, bd.hz);
          bd.g.rotation.x = 0; bd.neck.rotation.x = 0;
        } else {
          var arc = Math.sin(pr * Math.PI);
          bd.g.position.x = bd.fly.x0 + (bd.hx - bd.fly.x0) * pr;
          bd.g.position.z = bd.fly.z0 + (bd.hz - bd.fly.z0) * pr - arc * 1.1; // veer toward the cafe (away from road) at apex
          bd.g.position.y = PED_BASE_Y + arc * 1.5;
          bd.g.rotation.x = -0.5 * arc; // tilt forward while airborne
          bd.g.rotation.y += dt * 3.5;  // veer
          bd.neck.rotation.x = Math.sin(bd.fly.t * 34) * 0.18; // flutter
        }
        continue;
      }
      // spooked by a car passing close on the main road? take off
      var spook = false;
      for (var k = 0; k < mainRoadCars.length; k++) {
        if (Math.abs(mainRoadCars[k].group.position.x - bd.g.position.x) < 2.3) { spook = true; break; }
      }
      if (spook) {
        bd.fly = { t: 0, dur: 2.0 + Math.random() * 1.0, x0: bd.g.position.x, z0: bd.g.position.z };
        continue;
      }
      // pecking: a quick head dip every peckT seconds
      bd.peckT -= dt;
      var dip = bd.peckT < 0.28 ? Math.sin((0.28 - bd.peckT) / 0.28 * Math.PI) : 0;
      bd.neck.rotation.x = dip * 1.15 + Math.sin(bd.peckT * 3) * 0.04;
      if (bd.peckT <= 0) bd.peckT = 1.4 + Math.random() * 2.6;
      // occasional little hop to a nearby spot (short arc), turning to face it
      if (bd.hop) {
        bd.hop.t += dt / 0.36;
        var t = Math.min(bd.hop.t, 1);
        bd.g.position.x = bd.hop.x0 + (bd.hop.x1 - bd.hop.x0) * t;
        bd.g.position.z = bd.hop.z0 + (bd.hop.z1 - bd.hop.z0) * t;
        bd.g.position.y = PED_BASE_Y + Math.sin(t * Math.PI) * 0.06;
        if (t >= 1) { bd.hop = null; bd.g.position.y = PED_BASE_Y; }
      } else {
        bd.hopT -= dt;
        if (bd.hopT <= 0) {
          bd.hopT = 3 + Math.random() * 5;
          var nx = bd.hx + (Math.random() - 0.5) * 0.7, nz = bd.hz + (Math.random() - 0.5) * 0.7;
          bd.g.rotation.y = Math.atan2(nx - bd.g.position.x, nz - bd.g.position.z);
          bd.hop = { t: 0, x0: bd.g.position.x, z0: bd.g.position.z, x1: nx, z1: nz };
        }
      }
    }
  }

  // ---------- idle-management: paying customers (coins) + turnover on the patio ----------
  var patioTmp = new THREE.Vector3();
  function emitPatioCoin(cust, sc) {
    var coin = null;
    for (var i = 0; i < patioCoins.length; i++) { if (patioCoins[i].life <= 0) { coin = patioCoins[i]; break; } }
    if (!coin) return;
    cust.getWorldPosition(patioTmp);
    coin.mesh.position.set(patioTmp.x, patioTmp.y + 0.5 * sc + 0.18, patioTmp.z);
    coin.mesh.visible = true; coin.mat.opacity = 0.95; coin.life = 1.0;
  }
  function updatePatio(dt) {
    for (var i = 0; i < patioSeats.length; i++) {
      var s = patioSeats[i];
      if (!s.group.visible) continue;
      if (s.swapDir === 0) {
        s.coinT -= dt;
        if (s.coinT <= 0) { emitPatioCoin(s.cust, s.sc); s.coinT = 1.6 + Math.random() * 2.6; } // a customer "pays"
        s.swapT -= dt;
        if (s.swapT <= 0) s.swapDir = -1; // this customer is leaving
      } else if (s.swapDir === -1) {      // shrink out (leaves)
        var a = Math.max(0, s.cust.scale.x - dt * 1.6);
        s.cust.scale.setScalar(a);
        if (a <= 0.01) { s.torsoMat.color.setHex(PATIO_SHIRTS[Math.floor(Math.random() * PATIO_SHIRTS.length)]); s.swapDir = 1; }
      } else {                            // grow in (a new customer arrives)
        var b = Math.min(s.sc, s.cust.scale.x + dt * 1.6);
        s.cust.scale.setScalar(b);
        if (b >= s.sc) { s.swapDir = 0; s.swapT = 12 + Math.random() * 20; s.coinT = 0.8 + Math.random() * 1.5; }
      }
    }
    for (var k = 0; k < patioCoins.length; k++) {
      var pc = patioCoins[k];
      if (pc.life <= 0) continue;
      pc.life -= dt;
      pc.mesh.position.y += dt * 0.7;
      pc.mat.opacity = Math.max(0, pc.life) * 0.95;
      pc.mesh.quaternion.copy(camera.quaternion);
      if (pc.life <= 0) pc.mesh.visible = false;
    }
  }

  // ---------- Fase D: boss room (office: desk, chair, safe, plant, the boss) ----------
  function buildBossRoom() {
    var O = BOSS_ORIGIN;
    // 8x8 fully-enclosed office (4 walls + ceiling) so the USER-orbited camera
    // never sees the CSS sky when rotating all the way around
    var floor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8, 0.2, 8)), toonMat({ color: 0x7e6047, roughness: 0.9 })); floor.position.set(O.x, O.y - 0.1, O.z); bossGroup.add(floor);
    var rug = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3, 0.04, 2.4)), toonMat({ color: 0x8a4444 })); rug.position.set(O.x, O.y + 0.02, O.z + 0.3); bossGroup.add(rug);
    var wallMat = toonMat({ color: 0x74594a, roughness: 0.95 }); // lightened (was too dark -> room read as a black void)
    var back = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8, 4, 0.2)), wallMat); back.position.set(O.x, O.y + 2.0, O.z - 3.9); bossGroup.add(back);
    var bfront = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8, 4, 0.2)), wallMat); bfront.position.set(O.x, O.y + 2.0, O.z + 3.9); bossGroup.add(bfront);
    var sideGeo = trackGeo(new THREE.BoxGeometry(0.2, 4, 8));
    var lw = new THREE.Mesh(sideGeo, wallMat); lw.position.set(O.x - 3.9, O.y + 2.0, O.z); bossGroup.add(lw);
    var rw = new THREE.Mesh(sideGeo, wallMat); rw.position.set(O.x + 3.9, O.y + 2.0, O.z); bossGroup.add(rw);
    var bceil = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8, 0.2, 8)), toonMat({ color: 0x54423a, roughness: 0.95 })); bceil.position.set(O.x, O.y + 4.0, O.z); bossGroup.add(bceil);
    var desk = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.4, 0.68, 1.0)), toonMat({ color: 0x6d4c41 })); desk.position.set(O.x, O.y + 0.34, O.z - 1.35); bossGroup.add(desk);
    var deskTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.5, 0.1, 1.1)), toonMat({ color: 0x8a5a3c })); deskTop.position.set(O.x, O.y + 0.7, O.z - 1.35); bossGroup.add(deskTop);
    var safe = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.9, 1.0, 0.7)), toonMat({ color: 0x3a3a40 })); safe.position.set(O.x + 2.0, O.y + 0.5, O.z - 2.2); bossGroup.add(safe);
    var dial = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.12, 8, 6)), toonMat({ color: COLOR_GOLD })); dial.position.set(O.x + 2.0, O.y + 0.5, O.z - 1.83); bossGroup.add(dial);
    var pot = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.16, 0.4, 8)), toonMat({ color: 0x6d4c41 })); pot.position.set(O.x - 2.2, O.y + 0.2, O.z - 2.0); bossGroup.add(pot);
    var plant = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.45, 8, 7)), toonMat({ color: 0x4f6446 })); plant.scale.set(1, 1.3, 1); plant.position.set(O.x - 2.2, O.y + 0.75, O.z - 2.0); bossGroup.add(plant);
    var chair = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.8, 1.0, 0.55)), toonMat({ color: 0x4a3a42 })); chair.position.set(O.x, O.y + 0.5, O.z - 2.55); bossGroup.add(chair);
    // boss = same 1.0x height as every other person (was 1.7x -> looked oversized).
    // Stands in the open in FRONT of the desk so the full figure reads at normal size.
    addChibi(bossGroup, O.x - 0.9, O.y + 0.02, O.z - 0.2, 0.15, 0x3f6fae, 0x2c2218, false);
    var light = new THREE.PointLight(0xffe0b0, 3.2, 18, 2); light.position.set(O.x, O.y + 3.4, O.z + 0.2); bossGroup.add(light);
    var fill = new THREE.PointLight(0xd8c0e0, 1.0, 16, 2); fill.position.set(O.x, O.y + 2.2, O.z + 3.0); bossGroup.add(fill);
  }

  // ---------- 3 low-poly cats (static city-level content; NOT rebuilt by setFloors) ----------
  // Shared geometries + one material per fur color, all tracked exactly once in
  // cityGeometries/cityMaterials; the cat groups live under cityGroup so
  // dispose() removes them together with the rest of the city.
  // Mesh budget: 5 (sleep) + 5 (stroll) + 7 (sit, with 2 paws) = 17 meshes.
  function buildCats() {
    var catBodyGeo = trackGeo(new THREE.SphereGeometry(0.16, 10, 8));
    var catHeadGeo = trackGeo(new THREE.SphereGeometry(0.105, 10, 8));
    var catEarGeo = trackGeo(new THREE.ConeGeometry(0.05, 0.1, 4));
    var catTailGeo = trackGeo(new THREE.BoxGeometry(0.045, 0.045, 0.32));
    catTailGeo.translate(0, 0, 0.16); // pivot at the tail base so rotation moves the tip
    var catPawGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.07, 0.06));
    var catMats = [
      trackMat(new THREE.MeshStandardMaterial({ color: CAT_COLOR_ORANGE, roughness: 0.95 })),
      trackMat(new THREE.MeshStandardMaterial({ color: CAT_COLOR_GRAY, roughness: 0.95 })),
      trackMat(new THREE.MeshStandardMaterial({ color: CAT_COLOR_BLACK, roughness: 0.95 }))
    ];

    function registerCatMesh(mesh, catIndex) {
      mesh.userData.catIndex = catIndex;
      catMeshes.push(mesh);
      return mesh;
    }

    function makeCatParts(mat, catIndex) {
      var group = new THREE.Group();
      var body = registerCatMesh(new THREE.Mesh(catBodyGeo, mat), catIndex);
      group.add(body);
      var head = registerCatMesh(new THREE.Mesh(catHeadGeo, mat), catIndex);
      group.add(head);
      var earL = registerCatMesh(new THREE.Mesh(catEarGeo, mat), catIndex);
      earL.position.set(-0.055, 0.08, 0);
      earL.rotation.z = 0.28;
      head.add(earL);
      var earR = registerCatMesh(new THREE.Mesh(catEarGeo, mat), catIndex);
      earR.position.set(0.055, 0.08, 0);
      earR.rotation.z = -0.28;
      head.add(earR);
      // cute cartoon face (children of the head -> follows every pose): each eye
      // is a WHITE oval + a dark pupil so it stays clearly visible even on the
      // black cat; + a pink nose, a tiny mouth, and blush cheeks.
      for (var ei = 0; ei < 2; ei++) {
        var ex = ei === 0 ? -0.04 : 0.04;
        var ew = new THREE.Mesh(faceEyeGeo, faceEyeWhiteMat); ew.scale.set(1.35, 1.85, 1.0); ew.position.set(ex, 0.03, 0.089); head.add(ew);
        var ep = new THREE.Mesh(faceEyeGeo, faceEyeMat); ep.scale.set(0.85, 1.15, 1.0); ep.position.set(ex, 0.026, 0.10); head.add(ep);
        var glint = new THREE.Mesh(faceEyeGeo, faceEyeWhiteMat); glint.scale.set(0.32, 0.32, 1.0); glint.position.set(ex - 0.008, 0.04, 0.108); head.add(glint); // kawaii sparkle
        var cheek = new THREE.Mesh(faceEyeGeo, faceCheekMat); cheek.scale.set(1.6, 1.0, 0.6); cheek.position.set(ex * 1.65, -0.012, 0.086); head.add(cheek);
      }
      var nose = new THREE.Mesh(faceNoseGeo, faceNoseMat); nose.scale.set(1.25, 0.9, 1.0); nose.position.set(0, -0.008, 0.106); head.add(nose);
      var mouth = new THREE.Mesh(faceEyeGeo, faceMouthMat); mouth.scale.set(1.1, 0.4, 0.6); mouth.position.set(0, -0.035, 0.10); head.add(mouth);
      // pink inner ears
      var innerL = new THREE.Mesh(catEarGeo, faceNoseMat); innerL.scale.set(0.55, 0.6, 0.55); innerL.position.set(-0.055, 0.075, 0.012); innerL.rotation.z = 0.28; head.add(innerL);
      var innerR = new THREE.Mesh(catEarGeo, faceNoseMat); innerR.scale.set(0.55, 0.6, 0.55); innerR.position.set(0.055, 0.075, 0.012); innerR.rotation.z = -0.28; head.add(innerR);
      var tail = registerCatMesh(new THREE.Mesh(catTailGeo, mat), catIndex);
      group.add(tail);
      cityGroup.add(group);
      return { group: group, body: body, head: head, tail: tail };
    }

    // CAT 1 — sleeping, curled up on top of the door awning.
    // The awning (see buildFloors) is a 1.0 x 0.07 x 0.5 box at
    // (0, 0.78, FLOOR_DEPTH/2 + 0.22 = 1.22) tilted rotation.x = 0.28 — a fixed
    // ground-floor position for every floor count, so a static cat can rest on
    // it. Resting spot on the upper surface, slightly toward the wall.
    var c1 = makeCatParts(catMats[0], 0);
    c1.body.scale.set(1.05, 0.5, 1.05);
    c1.body.position.y = 0.075;
    c1.head.position.set(0.1, 0.09, 0.11);
    c1.head.rotation.z = 0.5; // tucked into the curl
    c1.tail.position.set(-0.12, 0.03, 0.03);
    c1.tail.rotation.y = 2.5; // wrapped around the body
    c1.group.position.set(0.12, 0.845, 1.08);
    c1.group.rotation.y = 0.45;
    c1.group.rotation.x = 0.28; // match the awning slope
    cats.push({
      type: "sleep", group: c1.group, body: c1.body, head: c1.head, tail: c1.tail,
      baseY: 0.845, phase: 0.7, hopStart: -1e9
    });

    // CAT 2 — strolling along the near sidewalk on its own lane (z = 1.45),
    // turning around at the ends instead of teleport-wrapping.
    var c2 = makeCatParts(catMats[1], 1);
    c2.body.scale.set(0.72, 0.62, 1.2);
    c2.body.position.y = 0.13;
    c2.head.position.set(0, 0.23, 0.17);
    c2.tail.position.set(0, 0.17, -0.15);
    c2.tail.rotation.x = -2.3; // tail carried up and back
    c2.group.position.set(-4, 0.07, CAT_STROLL_Z);
    c2.group.rotation.y = Math.PI / 2;
    cats.push({
      type: "stroll", group: c2.group, body: c2.body, head: c2.head, tail: c2.tail,
      baseY: 0.07, x: -4, dir: 1, speed: 0.55, dist: 0, pause: 0, hopStart: -1e9
    });

    // CAT 3 — sitting beside the door/sign at (1.6, 1.3): clear of the doorway
    // path used by entering pedestrians (their last leg ends at x=0, z=1.4;
    // nearest approach ~0.8) and of the zebra crosswalk (z ~ 4.65).
    var c3 = makeCatParts(catMats[2], 2);
    c3.body.scale.set(0.78, 1.0, 0.82);
    c3.body.position.y = 0.16;
    c3.head.position.set(0, 0.37, 0.04);
    c3.tail.position.set(0, 0.035, -0.1);
    c3.tail.rotation.y = -2.0; // curled around the side on the ground
    var pawL = registerCatMesh(new THREE.Mesh(catPawGeo, catMats[2]), 2);
    pawL.position.set(-0.055, 0.035, 0.1);
    c3.group.add(pawL);
    var pawR = registerCatMesh(new THREE.Mesh(catPawGeo, catMats[2]), 2);
    pawR.position.set(0.055, 0.035, 0.1);
    c3.group.add(pawR);
    c3.group.position.set(1.6, 0.005, 1.3);
    c3.group.rotation.y = -0.35;
    cats.push({
      type: "sit", group: c3.group, body: c3.body, head: c3.head, tail: c3.tail,
      baseY: 0.005, phase: 2.1, hopStart: -1e9,
      idleSeq: 0, idleState: 0, idleDur: 6.5, idleTimer: 6.5, stillLong: true
    });
  }

  // sitting-cat idle states
  var SIT_STILL = 0;
  var SIT_TILT = 1;
  var SIT_STRETCH = 2;

  function updateCats(now, dt) {
    var ts = now / 1000;
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i];
      // quick ~250ms hop when tapped (shared by all cats)
      var hf = (now - c.hopStart) / CAT_HOP_MS;
      var hopY = (hf >= 0 && hf <= 1) ? Math.sin(hf * Math.PI) * 0.12 : 0;

      if (c.type === "sleep") {
        // gentle breathing: slow scale-y pulse, amplitude ~0.04
        c.body.scale.y = 0.5 + Math.sin(ts * 1.7 + c.phase) * 0.04;
        // subtle intermittent tail-tip twitch
        var gateSleep = Math.max(0, Math.sin(ts * 0.55 + c.phase));
        c.tail.rotation.z = Math.sin(ts * 9) * 0.09 * gateSleep * gateSleep;
        c.group.position.y = c.baseY + hopY;
      } else if (c.type === "stroll") {
        // tail swish: +-0.3 rad around the base, ~1.2s period
        c.tail.rotation.y = Math.sin(ts * (Math.PI * 2 / 1.2)) * 0.3;
        if (c.pause > 0) {
          c.pause -= dt; // brief pause after being tapped
        } else {
          c.x += c.speed * c.dir * dt;
          c.dist += c.speed * dt;
          if (c.x > CAT_STROLL_LIMIT_X) { c.x = CAT_STROLL_LIMIT_X; c.dir = -1; }
          else if (c.x < -CAT_STROLL_LIMIT_X) { c.x = -CAT_STROLL_LIMIT_X; c.dir = 1; }
        }
        c.group.position.x = c.x;
        c.group.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        var bob = Math.abs(Math.sin(c.dist * 6)) * 0.03;
        c.group.position.y = c.baseY + bob + hopY;
      } else {
        // sitting cat: idle cycle still -> head tilt -> still -> stretch,
        // with still phases of 6.5s/8.5s so a behavior change lands every 6-10s
        c.idleTimer -= dt;
        if (c.idleTimer <= 0) {
          c.head.rotation.z = 0;
          c.body.scale.x = 0.78;
          c.idleSeq = (c.idleSeq + 1) % 4;
          if (c.idleSeq === 1) { c.idleState = SIT_TILT; c.idleDur = 2.4; }
          else if (c.idleSeq === 3) { c.idleState = SIT_STRETCH; c.idleDur = 0.9; }
          else {
            c.idleState = SIT_STILL;
            c.stillLong = !c.stillLong;
            c.idleDur = c.stillLong ? 8.5 : 6.5;
          }
          c.idleTimer = c.idleDur;
        }
        var p = 1 - c.idleTimer / c.idleDur;
        if (c.idleState === SIT_TILT) {
          c.head.rotation.z = Math.sin(p * Math.PI) * 0.15; // slow head tilt
        } else if (c.idleState === SIT_STRETCH) {
          c.body.scale.x = 0.78 + Math.sin(p * Math.PI) * 0.12; // brief stretch
        }
        var gateSit = Math.max(0, Math.sin(ts * 0.5 + c.phase));
        c.tail.rotation.z = Math.sin(ts * 8.5) * 0.08 * gateSit * gateSit;
        c.group.position.y = c.baseY + hopY;
      }
    }
  }

  // ==================================================================
  // Stage B2 — walk / drive modes, follow-cam, zones, order anchor.
  // All vectors preallocated ONCE; nothing below allocates per frame.
  // ==================================================================
  var camDesired = new THREE.Vector3();
  var camLookCur = new THREE.Vector3(0, 1.2, 0);
  var camLookTarget = new THREE.Vector3();
  var projV = new THREE.Vector3();
  var canvasCssW = 1, canvasCssH = 1; // cached in resizeToParent

  function dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return dx * dx + dz * dz;
  }

  function updatePlayerWalk(dt) {
    // RIGHT stick aims the camera (FPS style): x = turn, y = pitch. Persist in
    // camYaw/camPitch so the view stays where you left it after releasing.
    if (getLook) {
      var lk = getLook();
      camYaw -= (lk.x || 0) * LOOK_YAW_SPEED * lookSensitivity * dt;
      camPitch -= (lk.z || 0) * LOOK_PITCH_SPEED * lookSensitivity * dt; // stick up = look up
      if (camPitch > LOOK_PITCH_MAX) camPitch = LOOK_PITCH_MAX;
      else if (camPitch < -LOOK_PITCH_MAX) camPitch = -LOOK_PITCH_MAX;
    }
    // LEFT stick moves camera-relative: up = walk where you're looking, x =
    // strafe. forwardDir/rightDir derived from camYaw.
    var joy = getJoy ? getJoy() : ZERO_JOY;
    var sx = joy.x || 0, fwd = -(joy.z || 0); // stick up (-z screen) = forward
    var fdx = Math.sin(camYaw), fdz = Math.cos(camYaw); // forward on the ground
    // camera screen-right = world (-cos, sin) when facing (sin, cos): pushing
    // the stick right must strafe toward what's on the right of the view.
    var rdx = -Math.cos(camYaw), rdz = Math.sin(camYaw);
    var mvx = fdx * fwd + rdx * sx;
    var mvz = fdz * fwd + rdz * sx;
    var mag = Math.sqrt(mvx * mvx + mvz * mvz);
    var bob = 0;
    if (mag > 0.05) {
      if (mag > 1) { mvx /= mag; mvz /= mag; mag = 1; }
      var nx = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, player.x + mvx * WALK_SPEED * dt));
      var nz = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, player.z + mvz * WALK_SPEED * dt));
      // per-axis clamp against the building AABBs -> the player slides along walls
      if (!hitsAabb(nx, player.z, 0.22)) player.x = nx;
      if (!hitsAabb(player.x, nz, 0.22)) player.z = nz;
      player.yaw = camYaw; // body faces the look direction (hidden in FP anyway)
      player.dist += WALK_SPEED * mag * dt;
      var swing = Math.sin(player.dist * 7) * 0.55; // same leg cadence as peds
      player.legL.rotation.x = swing;
      player.legR.rotation.x = -swing;
      player.armL.rotation.x = -swing;
      player.armR.rotation.x = swing;
      bob = Math.abs(Math.sin(player.dist * 7)) * 0.03;
    } else {
      player.legL.rotation.x = 0;
      player.legR.rotation.x = 0;
      player.armL.rotation.x = 0;
      player.armR.rotation.x = 0;
    }
    player.group.position.set(player.x, PED_BASE_Y + bob, player.z);
    player.group.rotation.y = player.yaw;
    // blob shadow: independent sibling (plGroup itself stays invisible in
    // first-person), synced here every frame — no allocation, property writes only
    player.blob.position.x = player.x;
    player.blob.position.z = player.z;
  }

  function updatePickupDrive(dt) {
    var v = playerPickup;
    var joy = getJoy ? getJoy() : ZERO_JOY;
    var fwd = -(joy.z || 0); // stick up = throttle
    var target;
    if (fwd >= 0) target = fwd * DRIVE_MAX_SPEED;
    else target = v.speed < 1.0 ? fwd * 3.0 : 0; // pull back = brake; reverse only near standstill
    var accel = 10 * dt;
    if (target > v.speed) v.speed = Math.min(target, v.speed + accel);
    else v.speed = Math.max(target, v.speed - accel);
    if (fwd === 0) v.speed *= Math.max(0, 1 - 2.5 * dt); // coast drag
    // simple kinematic heading; steering authority scales with speed
    var steerK = Math.max(-1, Math.min(1, v.speed / 4));
    v.yaw -= (joy.x || 0) * 2.1 * steerK * dt;
    var nx = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, v.x + Math.cos(v.yaw) * v.speed * dt));
    var nz = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, v.z - Math.sin(v.yaw) * v.speed * dt));
    if (hitsAabb(nx, nz, 0.75)) {
      v.speed = -v.speed * 0.3; // light collision: stop + tiny bounce-back
    } else {
      v.x = nx;
      v.z = nz;
    }
    var spin = (v.speed * dt) / 0.14; // wheel radius 0.14
    for (var i = 0; i < v.wheels.length; i++) v.wheels[i].rotation.y += spin;
    v.group.position.set(v.x, 0.04, v.z);
    v.group.rotation.y = v.yaw;
  }

  // proximity triggers; onNearZone fires only when the state CHANGES
  function updateZones() {
    var zone = null;
    if (mode === "walk" && player) {
      if (pickupOwnedFlag && dist2(player.x, player.z, PICKUP_HOME_X, PICKUP_HOME_Z) < PICKUP_ZONE_R * PICKUP_ZONE_R) zone = "pickup";
      else if (dist2(player.x, player.z, SUPPLIER_X, SUPPLIER_DOOR_Z) < SUPPLIER_DOOR_R * SUPPLIER_DOOR_R) zone = "supplierDoor";
      else if (dist2(player.x, player.z, CAFE_DOOR_X, CAFE_DOOR_Z) < CAFE_DOOR_R * CAFE_DOOR_R) zone = "cafeDoor";
    } else if (mode === "drive" && playerPickup) {
      if (dist2(playerPickup.x, playerPickup.z, SUPPLIER_X, SUPPLIER_PARK_Z) < SUPPLIER_PARK_R * SUPPLIER_PARK_R) zone = "supplierParking";
      else if (dist2(playerPickup.x, playerPickup.z, PICKUP_HOME_X, PICKUP_HOME_Z) < CAFE_PARK_R * CAFE_PARK_R) zone = "cafeDoor";
    }
    if (zone !== currentZone) {
      currentZone = zone;
      onNearZone(zone);
    }
  }

  // ---------- order mini-event anchor (screen-projected entering ped) ----------
  var orderPedIndex = -1;
  var orderAnchor = { x: 0, y: 0, visible: false }; // preallocated, returned by getOrderAnchor
  var orderAnchorAccum = 0;

  function startOrder() {
    for (var i = 0; i < peds.length; i++) {
      if (peds[i].enters && peds[i].mode === "walk") {
        orderPedIndex = i;
        orderAnchorAccum = 1; // push an anchor update on the very next frame
        return true;
      }
    }
    return false; // both entering peds are inside/entering right now
  }

  function stopOrder() {
    orderPedIndex = -1;
    orderAnchor.visible = false;
  }

  function updateOrderAnchorFrame(dt) {
    if (orderPedIndex < 0) return;
    orderAnchorAccum += dt;
    if (orderAnchorAccum < 0.1) return; // throttled ~10x/s
    orderAnchorAccum = 0;
    var op = peds[orderPedIndex];
    projV.copy(op.group.position);
    projV.y += 0.68; // above the ped's head (lowered with PED_SCALE)
    projV.project(camera);
    orderAnchor.x = (projV.x + 1) * 0.5 * canvasCssW; // NDC -> canvas css px
    orderAnchor.y = (1 - projV.y) * 0.5 * canvasCssH;
    orderAnchor.visible = op.mode === "walk" && projV.z < 1 &&
      projV.x > -1.15 && projV.x < 1.15 && projV.y > -1.15 && projV.y < 1.15;
    if (onOrderAnchor) onOrderAnchor(orderAnchor.x, orderAnchor.y, orderAnchor.visible);
  }

  // ---------- mode transitions ----------
  function resetPickupHome() {
    var v = playerPickup;
    v.x = PICKUP_HOME_X;
    v.z = PICKUP_HOME_Z;
    v.yaw = PICKUP_HOME_YAW;
    v.speed = 0;
    v.group.position.set(v.x, 0.04, v.z);
    v.group.rotation.y = PICKUP_HOME_YAW;
    v.group.visible = pickupOwnedFlag;
  }

  function clearZone() {
    if (currentZone !== null) {
      currentZone = null;
      onNearZone(null);
    }
  }

  function enterWalk() {
    if (mode === "walk" || !player) return;
    if (mode === "drive") resetPickupHome();
    mode = "walk";
    player.x = CAFE_DOOR_X;
    // spawn with real breathing room in front of the wall, not right on top
    // of it: the cafe's own AABB face sits at z=FLOOR_DEPTH/2+0.1=1.1, so the
    // old CAFE_DOOR_Z=1.6 spawn left only ~0.28 units before collision --
    // any first-touch backward drift on the joystick hit the wall in 2-3
    // frames and looked exactly like the "frozen camera" bug all over again.
    // Still well inside CAFE_DOOR_R(1.6) so the "Masuk Kedai" zone still
    // triggers immediately.
    player.z = CAFE_DOOR_Z + 0.9;
    player.yaw = 0;
    player.dist = 0;
    camYaw = 0; camPitch = 0; // start each walk facing the street, level
    player.group.position.set(player.x, PED_BASE_Y, player.z);
    player.group.rotation.y = 0;
    player.group.visible = false; // first-person: camera sits at the head, body stays hidden
    player.blob.visible = false; // its own blob sits directly under the FP camera -> just a dark smudge on the ground; hide it
    camera.fov = walkFov; // first-person FOV (user-adjustable via setFov)
    camera.updateProjectionMatrix();
    clearZone();
    onModeChange("walk");
  }

  function enterDrive() {
    if (mode !== "walk" || !playerPickup || !pickupOwnedFlag) return;
    mode = "drive";
    player.group.visible = false;
    player.blob.visible = false;
    playerPickup.speed = 0;
    clearZone();
    onModeChange("drive");
  }

  function exitToIdle() {
    if (mode === "idle") return;
    mode = "idle";
    if (player) { player.group.visible = false; player.blob.visible = false; }
    if (playerPickup) resetPickupHome();
    interiorGroup.visible = false;
    bossGroup.visible = false;
    clearZone();
    camera.fov = 45;
    camera.updateProjectionMatrix();
    // resume the auto-orbit from the camera's current azimuth so the idle
    // camera lerps back smoothly instead of jumping
    camAngle = Math.atan2(camera.position.x, camera.position.z);
    onModeChange("idle");
  }

  // ---------- Fase D transitions ----------
  function enterInterior() {
    if (mode === "interior") return;
    if (mode === "drive") resetPickupHome();
    if (player) { player.group.visible = false; player.blob.visible = false; }
    bossGroup.visible = false;
    interiorGroup.visible = true;
    mode = "interior";
    intAngle = 0;
    camera.fov = 55;
    camera.updateProjectionMatrix();
    clearZone();
    onModeChange("interior");
  }
  function enterBoss() {
    if (mode !== "interior") return;
    bossGroup.visible = true;
    mode = "boss";
    bossYaw = 0; bossPitch = 0.45; bossZoom = 1;
    onModeChange("boss");
  }
  function backToInterior() {
    if (mode !== "boss") return;
    bossGroup.visible = false;
    mode = "interior";
    onModeChange("interior");
  }
  // top-of-screen strip drag rotates the boss camera; vertical tilts it
  function orbitBoss(dxPx, dyPx) {
    bossYaw -= dxPx * 0.008;
    bossPitch = Math.max(0.05, Math.min(1.15, bossPitch - dyPx * 0.004));
  }

  // ---------- day-night application (mutates shared lights/materials, zero allocations) ----------
  function applyDayNight(phase) {
    // interior/boss are enclosed rooms with their own fixed lamps -- they shouldn't
    // go dark just because it's night outside, so pin them to full-day ambient
    var k = (mode === "interior" || mode === "boss") ? 1 : dayFactor01(phase);
    var nk = 1 - k;
    hemi.color.lerpColors(HEMI_NIGHT_C, HEMI_DAY_C, k);
    hemi.intensity = 0.45 + 0.60 * k;
    scene.fog.color.lerpColors(FOG_NIGHT_C, FOG_DAY_C, k);
    dirLight.color.lerpColors(SUN_NIGHT_C, SUN_DAY_C, k);
    dirLight.intensity = 0.25 + 0.75 * k;
    doorLight.intensity = 3.5 * (0.3 + 0.7 * nk);
    awningLight.intensity = 2.0 * (0.3 + 0.7 * nk);
    // shared emissive materials: one property write lights every window/bulb
    var glow = 0.05 + 0.85 * nk;
    cityWinMatA.emissiveIntensity = glow;
    cityWinMatB.emissiveIntensity = glow;
    lampBulbMat.emissiveIntensity = glow;
    if (patioLightMat) patioLightMat.emissiveIntensity = 0.1 + 1.2 * nk; // fairy lights
    for (var pli = 0; pli < patioLights.length; pli++) patioLights[pli].intensity = 2.2 * (0.3 + 0.7 * nk); // one lamp per umbrella table

    carHeadMat.emissiveIntensity = 0.9 * nk;
    carTailMat.emissiveIntensity = 0.9 * nk;
    // every building facade's window-mask lights up after dark
    var winGlow = 0.9 * nk;
    for (var bfi = 0; bfi < buildingFacadeMats.length; bfi++) {
      buildingFacadeMats[bfi].emissiveIntensity = winGlow;
    }
    // sun/moon: one disc arcing low across the sky (elevation kept in the
    // ~5-22 deg band the near-level camera actually frames); recolored/dimmed
    // sun<->moon by k. Stars fade in only at night.
    var ang = phase * Math.PI * 2;
    celestialMesh.position.set(Math.cos(ang) * 42, 7 + Math.max(0, Math.sin(ang)) * 9, Math.sin(ang) * 20 - 30);
    celestialMesh.lookAt(camera.position);
    celestialMat.color.lerpColors(CELESTIAL_MOON_C, CELESTIAL_SUN_C, k);
    celestialMat.opacity = 0.9;
    starMat.opacity = 0.9 * nk;
  }

  // ---------- cafe building group (rebuilt on setFloors) ----------
  var buildingGroup = new THREE.Group();
  scene.add(buildingGroup);

  // parts tracked for disposal
  var builtParts = [];

  function disposeBuiltParts() {
    builtParts.forEach(function (mesh) {
      buildingGroup.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function (m) { m.dispose(); });
        } else {
          mesh.material.dispose();
        }
      }
    });
    builtParts = [];
  }

  function addPart(mesh) {
    buildingGroup.add(mesh);
    builtParts.push(mesh);
    return mesh;
  }

  function buildFloors(n) {
    disposeBuiltParts();
    n = Math.max(1, Math.min(10, n || 1));

    var wallColors = [COLOR_WALL_LIGHT, COLOR_WALL_MID, COLOR_WALL_DARK];

    for (var i = 0; i < n; i++) {
      var y = i * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
      var wallColor = wallColors[i % wallColors.length];

      var wallGeo = new THREE.BoxGeometry(FLOOR_WIDTH, FLOOR_HEIGHT * 0.92, FLOOR_DEPTH);
      // toon + wood-plank CanvasTexture facade (visual-polish pass); the shared
      // texture/gradient are built once outside buildFloors and just referenced
      // here — only the mesh/material INSTANCE is per-rebuild (disposed via the
      // existing disposeBuiltParts path, same as every other floor part)
      var wallMat = new THREE.MeshToonMaterial({
        color: wallColor, map: cafeFacadeTex, gradientMap: toonGradientMap
      });
      var wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(0, y, 0);
      addPart(wallMesh);

      // a thin cream trim band at the base of each floor
      var trimGeo = new THREE.BoxGeometry(FLOOR_WIDTH + 0.04, 0.06, FLOOR_DEPTH + 0.04);
      var trimMat = new THREE.MeshToonMaterial({ color: COLOR_CREAM, gradientMap: toonGradientMap });
      var trimMesh = new THREE.Mesh(trimGeo, trimMat);
      trimMesh.position.set(0, i * FLOOR_HEIGHT, 0);
      addPart(trimMesh);

      // windows: 2 small emissive gold rectangles on the front face
      var winGeo = new THREE.BoxGeometry(0.32, 0.34, 0.05);
      var winMat = new THREE.MeshStandardMaterial({
        color: COLOR_GOLD,
        emissive: COLOR_GOLD,
        emissiveIntensity: 0.85,
        roughness: 0.4
      });
      var winLeft = new THREE.Mesh(winGeo, winMat);
      winLeft.position.set(-0.55, y, FLOOR_DEPTH / 2 + 0.03);
      addPart(winLeft);

      var winRight = new THREE.Mesh(winGeo.clone(), winMat.clone());
      winRight.position.set(0.55, y, FLOOR_DEPTH / 2 + 0.03);
      addPart(winRight);
    }

    // ground-floor door
    var doorGeo = new THREE.BoxGeometry(0.5, 0.6, 0.06);
    var doorMat = new THREE.MeshToonMaterial({ color: COLOR_WALL_DARK, gradientMap: toonGradientMap });
    var door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.3, FLOOR_DEPTH / 2 + 0.03);
    addPart(door);

    // small cream awning above the door
    var awnGeo = new THREE.BoxGeometry(1.0, 0.07, 0.5);
    var awnMat = new THREE.MeshToonMaterial({ color: COLOR_CREAM, gradientMap: toonGradientMap });
    var awning = new THREE.Mesh(awnGeo, awnMat);
    awning.position.set(0, 0.78, FLOOR_DEPTH / 2 + 0.22);
    awning.rotation.x = 0.28;
    addPart(awning);
    // (the text sign board is built ONCE outside buildFloors — see buildSign() —
    // since its position doesn't depend on floor count n)

    // pitched roof (cone-ish via a squashed cone)
    var roofY = n * FLOOR_HEIGHT;
    var roofGeo = new THREE.ConeGeometry(1.9, 1.0, 4);
    var roofMat = new THREE.MeshToonMaterial({ color: COLOR_WALL_DARK, gradientMap: toonGradientMap });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, roofY + 0.5, 0);
    addPart(roof);

    // rooftop cone decoration (little spire on top of roof)
    var spireGeo = new THREE.ConeGeometry(0.12, 0.5, 8);
    var spireMat = new THREE.MeshStandardMaterial({
      color: COLOR_GOLD,
      emissive: COLOR_GOLD,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });
    var spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.set(0, roofY + 1.25, 0);
    addPart(spire);

    // camera retuned for the street scene (portrait phone canvas),
    // still scaling a bit with floor count
    camHeight = Math.min(4.2 + n * 0.3, 7.4);
    camRadius = Math.min(9.5 + n * 0.3, 12.5);
  }

  // ---------- steam particles ----------
  var steamCount = 3;
  var steamMeshes = [];
  var steamGeo = new THREE.SphereGeometry(0.12, 10, 10);
  for (var s = 0; s < steamCount; s++) {
    var steamMat = new THREE.MeshStandardMaterial({
      color: COLOR_CREAM,
      transparent: true,
      opacity: 0.55,
      roughness: 1
    });
    var steamMesh = new THREE.Mesh(steamGeo, steamMat);
    steamMesh.userData.phase = (s / steamCount) * Math.PI * 2;
    steamMesh.userData.offsetX = (s - (steamCount - 1) / 2) * 0.35;
    scene.add(steamMesh);
    steamMeshes.push(steamMesh);
  }

  function updateSteam(t) {
    for (var i = 0; i < steamMeshes.length; i++) {
      var m = steamMeshes[i];
      var cycle = 3.2;
      var localT = ((t / 1000) + m.userData.phase) % cycle;
      var frac = localT / cycle;
      var baseY = (buildingGroup.children.length ? currentFloors() : 1) * FLOOR_HEIGHT + 1.4;
      m.position.set(m.userData.offsetX, baseY + frac * 1.6, 0.6);
      m.material.opacity = 0.6 * (1 - frac);
      var scale = 0.6 + frac * 0.8;
      m.scale.set(scale, scale, scale);
    }
  }

  var floorsOwned = 1;
  function currentFloors() { return floorsOwned; }

  buildFloors(1);

  // ---------- shop text sign board (built ONCE — position doesn't depend on
  // floor count n, so unlike wall/door/roof it isn't rebuilt by buildFloors) ----------
  // gold emissive trim frame (kept MeshStandardMaterial: an emissive accent,
  // same day-night exception as windows/lamps) + an UNLIT text board so the
  // CanvasTexture lettering stays crisp regardless of toon banding/lighting angle
  var signTrimGeo = trackGeo(new THREE.BoxGeometry(1.3, 0.36, 0.04));
  var signTrimMat = trackMat(new THREE.MeshStandardMaterial({
    color: COLOR_GOLD, emissive: COLOR_GOLD, emissiveIntensity: 0.55, roughness: 0.4
  }));
  // sign sits IN FRONT of the roof overhang (z = front+0.5): at 1 floor the
  // roof base is at y=1.0 and its front edge reaches z~1.34, which used to
  // cover the sign at z~1.07 so the name was hidden. Forward placement keeps it
  // readable at every floor count.
  var signTrim = new THREE.Mesh(signTrimGeo, signTrimMat);
  signTrim.position.set(0, 1.0, FLOOR_DEPTH / 2 + 0.5);
  buildingGroup.add(signTrim);

  var signGeo = trackGeo(new THREE.BoxGeometry(1.15, 0.28, 0.05));
  var signMat = trackMat(new THREE.MeshBasicMaterial({ map: signTexture }));
  var signBoard = new THREE.Mesh(signGeo, signMat);
  signBoard.position.set(0, 1.0, FLOOR_DEPTH / 2 + 0.53);
  buildingGroup.add(signBoard);

  // ---------- tap bounce animation ----------
  var bounceStart = 0;
  var BOUNCE_MS = 150;

  function triggerBounce() {
    bounceStart = performance.now();
  }

  function applyBounce(now) {
    var elapsed = now - bounceStart;
    if (elapsed < 0 || elapsed > BOUNCE_MS) {
      buildingGroup.scale.set(1, 1, 1);
      return;
    }
    var frac = elapsed / BOUNCE_MS;
    // quick punch out then back: sin curve peaking mid-way
    var amt = Math.sin(frac * Math.PI) * 0.12;
    var sc = 1 + amt;
    buildingGroup.scale.set(sc, sc, sc);
  }

  // ---------- resize handling ----------
  function resizeToParent() {
    // measure the canvas's own laid-out box, not the parent: #tap-area also
    // holds #tap-value, so the flexed canvas is shorter than the parent and
    // sizing to the parent would vertically squash the render
    var w = canvasEl.clientWidth || (canvasEl.parentElement && canvasEl.parentElement.clientWidth) || 1;
    var h = canvasEl.clientHeight || (canvasEl.parentElement && canvasEl.parentElement.clientHeight) || 1;
    canvasCssW = w; // cached for the order-anchor NDC -> pixel conversion
    canvasCssH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  var resizeObserver = null;
  if (typeof ResizeObserver !== "undefined" && canvasEl.parentElement) {
    resizeObserver = new ResizeObserver(function () { resizeToParent(); });
    resizeObserver.observe(canvasEl.parentElement);
  }
  window.addEventListener("resize", resizeToParent);
  resizeToParent();

  // ---------- pointer / tap ----------
  // one Raycaster + one NDC Vector2, created ONCE at init and reused in the
  // handler — never allocated per event or per frame
  var raycaster = new THREE.Raycaster();
  var pointerNdc = new THREE.Vector2();

  function pinchDist() {
    var ids = Object.keys(pinchPointers);
    var a = pinchPointers[ids[0]], b = pinchPointers[ids[1]];
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) || 1;
  }

  function onPointerMove(e) {
    if (dragLookId === e.pointerId) { // walk-mode drag-look
      var dx = e.clientX - dragLastX, dy = e.clientY - dragLastY;
      dragLastX = e.clientX; dragLastY = e.clientY;
      camYaw -= dx * DRAG_LOOK_RAD_PER_PX * lookSensitivity;
      camPitch -= dy * DRAG_LOOK_RAD_PER_PX * lookSensitivity;
      if (camPitch > LOOK_PITCH_MAX) camPitch = LOOK_PITCH_MAX;
      else if (camPitch < -LOOK_PITCH_MAX) camPitch = -LOOK_PITCH_MAX;
      return;
    }
    if (!pinchPointers.hasOwnProperty(e.pointerId)) return;
    pinchPointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(pinchPointers).length !== 2) return;
    // fingers spreading apart (pinchDist growing) should zoom the VIEW in,
    // i.e. shrink zoom (camera moves closer) -- inverse ratio
    var k = pinchStartDist / pinchDist();
    if (mode === "boss") bossZoom = Math.max(0.6, Math.min(1.15, pinchStartZoom * k)); // clamp so the camera stays inside the room
    else camZoom = Math.max(CAM_ZOOM_MIN, Math.min(CAM_ZOOM_MAX, pinchStartZoom * k));
  }

  function onPointerUpOrCancel(e) {
    if (dragLookId === e.pointerId) dragLookId = null;
    delete pinchPointers[e.pointerId];
  }

  function onPointerDown(e) {
    // walk mode: drag anywhere to aim the first-person camera (touch/mouse look)
    if (mode === "walk") {
      dragLookId = e.pointerId;
      dragLastX = e.clientX; dragLastY = e.clientY;
      return;
    }
    // boss room: allow 2-finger pinch to zoom the user camera
    if (mode === "boss") {
      pinchPointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (Object.keys(pinchPointers).length === 2) { pinchStartDist = pinchDist(); pinchStartZoom = bossZoom; }
      return;
    }
    // mode guard: interior/drive canvas taps do nothing
    if (mode !== "idle") return;
    pinchPointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (Object.keys(pinchPointers).length === 2) {
      pinchStartDist = pinchDist();
      pinchStartZoom = camZoom;
      return; // starting a pinch, not a tap -- the first finger already tapped on its own pointerdown
    }
    if (Object.keys(pinchPointers).length > 2) return; // ignore a 3rd+ finger entirely
    var rect = canvasEl.getBoundingClientRect();
    var rw = rect.width || 1;
    var rh = rect.height || 1;
    pointerNdc.x = ((e.clientX - rect.left) / rw) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rh) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    var hits = raycaster.intersectObjects(catMeshes, true);
    if (hits.length > 0) {
      var cat = cats[hits[0].object.userData.catIndex];
      if (cat) {
        cat.hopStart = performance.now();
        if (cat.type === "stroll") cat.pause = 0.9; // strolling cat stops briefly
      }
      onCatTap(e.clientX, e.clientY);
      return; // cat taps hop the cat — no building bounce (and take precedence over NPCs)
    }
    if (onNpcTap) {
      var npcHits = raycaster.intersectObjects(npcMeshes, false);
      if (npcHits.length > 0) {
        var pedIdx = npcHits[0].object.userData.pedIndex;
        var tappedPed = peds[pedIdx];
        // guard: raycast ignores group visibility, so skip peds inside the cafe
        if (tappedPed && tappedPed.mode === "walk") {
          tappedPed.pauseT = 1.2; // ped pauses briefly
          onNpcTap(e.clientX, e.clientY, pedIdx === orderPedIndex);
          return;
        }
      }
    }
    onTap(e.clientX, e.clientY);
    triggerBounce();
  }
  canvasEl.addEventListener("pointerdown", onPointerDown);
  canvasEl.addEventListener("pointermove", onPointerMove);
  canvasEl.addEventListener("pointerup", onPointerUpOrCancel);
  canvasEl.addEventListener("pointercancel", onPointerUpOrCancel);
  canvasEl.addEventListener("pointerleave", onPointerUpOrCancel);

  // ---------- render loop ----------
  var rafHandle = null;
  var prevFrameTime = 0;
  var lastFrameMs = 0;      // frame-rate limiter clock (thermal)
  var cycleTime = 0;        // day-night clock, driven by the render loop dt
  var dayPhaseAccum = 1;    // starts >= throttle so the callback fires on frame 1

  function animate(now) {
    rafHandle = requestAnimationFrame(animate);
    // thermal cap: the idle/interior/boss scenes are slow — capping them at 45fps
    // trims sustained GPU load (esp. on the 90Hz panel, where it's every 2nd frame)
    // so the phone stays cool at max graphics when left running. walk/drive keep
    // full rate for responsive first-person control (short, hands-on bursts).
    var fpsCap = (mode === "walk" || mode === "drive") ? 0 : 45;
    if (fpsCap && now - lastFrameMs < (1000 / fpsCap) - 1.5) return;
    lastFrameMs = now;
    var dt = prevFrameTime > 0 ? Math.min((now - prevFrameTime) / 1000, 0.05) : 0.016;
    prevFrameTime = now;

    // camera: auto-orbit in idle, smooth follow-cam in walk/drive
    var focusY = Math.min(0.9 + floorsOwned * 0.22, 3.2);
    var camK;
    if (mode === "walk" && player) {
      updatePlayerWalk(dt);
      // first-person: camera at the player's eye, aimed by camYaw/camPitch (the
      // RIGHT look-stick). Look direction is fully decoupled from movement.
      var cp = Math.cos(camPitch);
      var lookX = Math.sin(camYaw) * cp;
      var lookZ = Math.cos(camYaw) * cp;
      var lookY = Math.sin(camPitch);
      camDesired.set(player.x + lookX * 0.1, PLAYER_EYE_Y, player.z + lookZ * 0.1);
      camLookTarget.set(player.x + lookX * 5, PLAYER_EYE_Y + lookY * 5, player.z + lookZ * 5);
      // moderate smoothing (tau ~29ms): fast enough to feel responsive, smooth
      // enough to bridge the gaps between sparse pointermove events (instant
      // camK=1 looked "patah-patah" because look only updates on drag events,
      // not every frame; the old ~14 rate felt laggy/floaty)
      camK = 1 - Math.exp(-35 * dt);
    } else if (mode === "drive" && playerPickup) {
      updatePickupDrive(dt);
      camDesired.set(
        playerPickup.x - Math.cos(playerPickup.yaw) * 6.0, 3.6,
        playerPickup.z + Math.sin(playerPickup.yaw) * 6.0
      );
      camLookTarget.set(playerPickup.x, 0.6, playerPickup.z);
    } else if (mode === "interior") {
      // high front-corner 3/4 "diorama" view looking down-across the room, so the
      // whole cafe is framed (counter + tables + customers seen fully) instead of
      // the camera sitting among the front tables where only heads/faces peeked
      intAngle += 0.0016;
      camDesired.set(INT_ORIGIN.x + Math.sin(intAngle) * 2.4, INT_ORIGIN.y + 3.9, INT_ORIGIN.z + 3.05);
      camLookTarget.set(INT_ORIGIN.x - 0.3, INT_ORIGIN.y + 0.45, INT_ORIGIN.z - 1.0);
      updateLiveInterior(dt);
    } else if (mode === "boss") {
      // USER-controlled orbit INSIDE the enclosed office (top-strip drag = yaw,
      // vertical = pitch, pinch = zoom). Radius kept < half-room so it never
      // clips through / sees past a wall.
      // lower + more level than before so we look AT the boss (head+torso above
      // the desk front) instead of down onto the desk top (which hid the body)
      var br = 2.9 * bossZoom, bh = 0.85 + bossPitch * 1.5;
      camDesired.set(BOSS_ORIGIN.x + Math.sin(bossYaw) * br, BOSS_ORIGIN.y + bh, BOSS_ORIGIN.z + Math.cos(bossYaw) * br);
      camLookTarget.set(BOSS_ORIGIN.x, BOSS_ORIGIN.y + 1.25, BOSS_ORIGIN.z - 1.4);
    } else {
      camAngle += 0.0035; // auto-rotate only while idle (original orbit)
      camDesired.set(Math.sin(camAngle) * camRadius * camZoom, camHeight * (0.4 + 0.6 * camZoom), Math.cos(camAngle) * camRadius * camZoom);
      camLookTarget.set(0, focusY, 0);
    }
    if (camK === undefined) camK = 1 - Math.exp(-6 * dt); // frame-rate independent smoothing
    camera.position.lerp(camDesired, camK);
    camLookCur.lerp(camLookTarget, camK);
    camera.lookAt(camLookCur);
    if (mode === "walk" || mode === "drive") updateZones();

    // clouds: slow drift + wrap + camera-facing billboard (fixes edge-on
    // slivers when orbiting/zooming). quaternion copy = no per-frame alloc.
    for (var cI = 0; cI < clouds.length; cI++) {
      var cl = clouds[cI];
      cl.mesh.position.x += cl.speed * dt;
      if (cl.mesh.position.x > cl.startX + CLOUD_LOOP) cl.mesh.position.x -= CLOUD_LOOP * 2;
      cl.mesh.quaternion.copy(camera.quaternion);
    }

    // coffee steam: each puff rises + grows + fades on a ~2.6s loop, offset by phase
    for (var sI = 0; sI < steamPuffs.length; sI++) {
      var pf = steamPuffs[sI];
      pf.phase += dt / 2.6;
      if (pf.phase >= 1) pf.phase -= 1;
      var ph = pf.phase;
      pf.mesh.position.set(pf.base.x + Math.sin(ph * 6.2) * 0.12, pf.base.y + ph * 0.9, pf.base.z);
      var sc = 0.5 + ph * 0.9;
      pf.mesh.scale.set(sc, sc, sc);
      pf.mat.opacity = Math.sin(ph * Math.PI) * 0.5; // fade in then out
      pf.mesh.quaternion.copy(camera.quaternion);
    }

    // day-night: phase01 in [0,1) over the 180s cycle
    cycleTime += dt;
    var phase01 = (cycleTime % DAY_CYCLE_SECONDS) / DAY_CYCLE_SECONDS;
    applyDayNight(phase01);
    if (onDayPhase) {
      dayPhaseAccum += dt;
      if (dayPhaseAccum >= 0.25) { // throttled to ~4x/second
        dayPhaseAccum = 0;
        onDayPhase(phase01);
      }
    }

    applyBounce(now);
    updateSteam(now);
    updateCars(dt);
    updatePeds(dt);
    updateCats(now, dt);
    if (mode !== "interior" && mode !== "boss") { updateBirds(dt); updatePatio(dt); }
    updateOrderAnchorFrame(dt);

    renderer.render(scene, camera);
  }
  rafHandle = requestAnimationFrame(animate);

  // ---------- WebGL context loss recovery ----------
  // Android WebViews can force-lose the GL context under memory pressure
  // (e.g. after being backgrounded); without this the canvas goes black forever.
  function onContextLost(e) {
    e.preventDefault();
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
  }
  function onContextRestored() {
    prevFrameTime = 0;
    resizeToParent();
    rafHandle = requestAnimationFrame(animate);
  }
  canvasEl.addEventListener("webglcontextlost", onContextLost);
  canvasEl.addEventListener("webglcontextrestored", onContextRestored);

  // ---------- graphics quality tiers ----------
  // pr = render-scale cap (biggest mobile perf lever); peds/cars = live crowd
  // size; clouds/stars = sky-decor density. antialias can't change after context
  // creation so it's left on; everything else here is a live property write.
  var QUALITY = {
    low:     { pr: 0.6,  peds: 5,  cars: 3, clouds: false, stars: false },
    medium:  { pr: 0.85, peds: 8,  cars: 5, clouds: true,  stars: false },
    standar: { pr: 1.0,  peds: 10, cars: 7, clouds: true,  stars: true },
    hd:      { pr: 1.5,  peds: 13, cars: 9, clouds: true,  stars: true },
    ultra:   { pr: 2.0,  peds: 13, cars: 9, clouds: true,  stars: true }
  };
  function setQuality(level) {
    var q = QUALITY[level] || QUALITY.standar;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pr));
    qMaxPeds = q.peds;
    qMaxCars = q.cars;
    for (var i = 0; i < clouds.length; i++) clouds[i].mesh.visible = q.clouds;
    stars.visible = q.stars; // opacity still fades it in only at night
  }

  return {
    setFloors: function (n) {
      floorsOwned = Math.max(1, Math.min(10, n || 1));
      buildFloors(floorsOwned);
    },
    // idle-management: reveal the first n patio tables (parasol + seated customer)
    setPatioTables: function (n) {
      n = Math.max(0, Math.min(patioSeats.length, n || 0));
      for (var i = 0; i < patioSeats.length; i++) patioSeats[i].group.visible = i < n;
    },
    patioCapacity: function () { return patioSeats.length; },
    setQuality: setQuality,
    setSensitivity: function (s) { lookSensitivity = Math.max(0.3, Math.min(2.5, s || 1)); },
    // for the minimap: where the "you" marker is and which way it faces
    getActorPos: function () {
      if (mode === "walk" && player) return { mode: "walk", x: player.x, z: player.z, yaw: camYaw };
      if (mode === "drive" && playerPickup) return { mode: "drive", x: playerPickup.x, z: playerPickup.z, yaw: playerPickup.yaw };
      return { mode: "idle", x: 0, z: 0, yaw: 0 };
    },
    setFov: function (deg) {
      walkFov = Math.max(50, Math.min(100, deg || 70));
      if (mode === "walk") { camera.fov = walkFov; camera.updateProjectionMatrix(); }
    },
    // ---------- Stage B2 API (all additive) ----------
    enterWalk: enterWalk,
    enterDrive: enterDrive,
    exitToIdle: exitToIdle,
    enterInterior: enterInterior,
    enterBoss: enterBoss,
    backToInterior: backToInterior,
    orbitBoss: orbitBoss,
    getMode: function () { return mode; },
    setPickupOwned: function (owned) {
      pickupOwnedFlag = !!owned;
      if (playerPickup && mode !== "drive") playerPickup.group.visible = pickupOwnedFlag;
    },
    startOrder: startOrder,
    stopOrder: stopOrder,
    getOrderAnchor: function () { return orderAnchor; },
    // Fase C hook: redraws the CanvasTexture sign board with new shop-name text
    // (no cafe3d.js rewrite needed — just call this whenever the name changes)
    setShopSignText: drawSignText,
    dispose: function () {
      if (rafHandle !== null) cancelAnimationFrame(rafHandle);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", resizeToParent);
      canvasEl.removeEventListener("pointerdown", onPointerDown);
      canvasEl.removeEventListener("pointermove", onPointerMove);
      canvasEl.removeEventListener("pointerup", onPointerUpOrCancel);
      canvasEl.removeEventListener("pointercancel", onPointerUpOrCancel);
      canvasEl.removeEventListener("pointerleave", onPointerUpOrCancel);
      canvasEl.removeEventListener("webglcontextlost", onContextLost);
      canvasEl.removeEventListener("webglcontextrestored", onContextRestored);
      disposeBuiltParts();
      // static city: unique geometry/material/texture instances tracked once
      // each (the sign board/trim also live here — see buildSign-site comment
      // above — since their geometries/materials are trackGeo/trackMat'd too)
      scene.remove(cityGroup);
      scene.remove(buildingGroup);
      scene.remove(skyGroup);
      scene.remove(interiorGroup);
      scene.remove(bossGroup);
      for (var i = 0; i < cityGeometries.length; i++) cityGeometries[i].dispose();
      for (var j = 0; j < cityMaterials.length; j++) cityMaterials[j].dispose();
      for (var tx = 0; tx < cityTextures.length; tx++) cityTextures[tx].dispose();
      cityGeometries = [];
      cityMaterials = [];
      cityTextures = [];
      cars = [];
      mainRoadCars = [];
      avenueCars = [];
      peds = [];
      // cat groups are children of cityGroup and their geometries/materials
      // are tracked in the city arrays above, so they are already disposed
      cats = [];
      catMeshes = [];
      // player + pickup + supplier live under cityGroup with tracked-once
      // geometries/materials, so they are already disposed above
      npcMeshes = [];
      buildingAabbs = [];
      player = null;
      playerPickup = null;
      scene.remove(doorLight);
      doorLight.dispose();
      scene.remove(awningLight);
      awningLight.dispose();
      steamGeo.dispose();
      steamMeshes.forEach(function (m) { m.material.dispose(); });
      renderer.dispose();
    }
  };
}
