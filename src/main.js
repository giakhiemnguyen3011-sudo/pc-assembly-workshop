import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============ DOM ============
const canvas = document.getElementById('scene');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const crosshair = document.getElementById('crosshair');
const promptEl = document.getElementById('prompt');
const heldLabel = document.getElementById('held-label');
const toastEl = document.getElementById('toast');
const invPanel = document.getElementById('inventory');
const invGrid = document.getElementById('inv-grid');
const invEmpty = document.getElementById('inv-empty');
const invClose = document.getElementById('inv-close');

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2200);
}

// ============ Renderer / Scene ============
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e14);
scene.fog = new THREE.Fog(0x0b0e14, 18, 40);

// Lights
scene.add(new THREE.HemisphereLight(0xdbeafe, 0x1f2937, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(6, 9, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);
const warm = new THREE.PointLight(0xfbbf24, 0.7, 20);
warm.position.set(0, 3.4, 0);
scene.add(warm);

// ============ Workshop room ============
const ROOM = { w: 16, d: 12, h: 4 };
const obstacles = []; // {x,z,r} for collision

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.15, ...opts });
}

function buildRoom() {
  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), mat(0x1f2937, { roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Floor grid lines (workshop tiles)
  const grid = new THREE.GridHelper(Math.max(ROOM.w, ROOM.d), 24, 0x38bdf8, 0x334155);
  grid.position.y = 0.01;
  grid.material.transparent = true;
  grid.material.opacity = 0.25;
  scene.add(grid);

  // Walls
  const wallMat = mat(0x111c2e, { roughness: 0.95 });
  const mkWall = (w, h, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true;
    scene.add(m);
  };
  mkWall(ROOM.w, ROOM.h, 0, ROOM.h / 2, -ROOM.d / 2, 0);
  mkWall(ROOM.w, ROOM.h, 0, ROOM.h / 2, ROOM.d / 2, Math.PI);
  mkWall(ROOM.d, ROOM.h, -ROOM.w / 2, ROOM.h / 2, 0, Math.PI / 2);
  mkWall(ROOM.d, ROOM.h, ROOM.w / 2, ROOM.h / 2, 0, -Math.PI / 2);

  // Ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), mat(0x0a0f1c));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = ROOM.h;
  scene.add(ceil);

  // Neon strips
  for (const z of [-3, 0, 3]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(6, 0.06, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 1.6 }));
    strip.position.set(0, ROOM.h - 0.1, z);
    scene.add(strip);
  }

  // Posters (fake windows / blueprint)
  const posterMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0ea5e9, emissiveIntensity: 0.25 });
  for (let i = -1; i <= 1; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), posterMat);
    p.position.set(i * 4, 2.2, -ROOM.d / 2 + 0.02);
    scene.add(p);
  }
  makeTextSprite('XƯỞNG LẮP RÁP PC — PC BUILDER', 0, 3.1, -ROOM.d / 2 + 0.05, 5.5);
}

// Text sprite helper
function makeTextSprite(text, x, y, z, width = 2.5) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 44px Segoe UI, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64, 480);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(width, width / 4, 1);
  sp.position.set(x, y, z);
  scene.add(sp);
  return sp;
}

// Workbench + empty PC case
function buildWorkbench() {
  const g = new THREE.Group();
  const topMat = mat(0x92400e, { roughness: 0.6 });
  const legMat = mat(0x374151, { metalness: 0.6, roughness: 0.4 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.15, 1.6), topMat);
  top.position.y = 0.95; top.castShadow = top.receiveShadow = true;
  g.add(top);
  for (const [x, z] of [[-2, -0.6], [2, -0.6], [-2, 0.6], [2, 0.6]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.12), legMat);
    leg.position.set(x, 0.47, z); leg.castShadow = true;
    g.add(leg);
  }
  g.position.set(0, 0, -3.4);
  scene.add(g);
  obstacles.push({ x: 0, z: -3.4, r: 2.4 });

  // Empty PC case (open frame) on the bench
  const caseG = new THREE.Group();
  const frameMat = mat(0x0f172a, { metalness: 0.7, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.12, roughness: 0.1 });
  const W = 1.5, H = 1.0, D = 0.7;
  const wall = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
    m.position.set(x, y, z); m.castShadow = true; caseG.add(m);
  };
  wall(W, 0.06, D, 0, 0.03, 0);       // bottom
  wall(W, 0.06, D, 0, H, 0);          // top
  wall(0.06, H, D, -W / 2, H / 2, 0); // left
  wall(W, H, 0.06, 0, H / 2, -D / 2); // back
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), glassMat);
  glass.position.set(0, H / 2, D / 2); caseG.add(glass);
  caseG.position.set(-0.6, 1.02, -3.4);
  scene.add(caseG);
  makeTextSprite('THÙNG MÁY TRỐNG (chờ lắp)', -0.6, 2.5, -3.4, 3.2);
}

// Pedestal builder
const pickables = [];
let uid = 0;

function buildPedestal(x, z, part) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 24), mat(0x334155, { metalness: 0.5, roughness: 0.4 }));
  base.position.y = 0.45; base.castShadow = base.receiveShadow = true;
  g.add(base);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 12, 32),
    new THREE.MeshStandardMaterial({ color: part.color, emissive: part.color, emissiveIntensity: 1.2 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.92;
  g.add(ring);

  const holder = new THREE.Group();
  holder.position.y = 1.35;
  const mesh = part.build();
  mesh.traverse?.((o) => { if (o.isMesh) { o.castShadow = true; } });
  holder.add(mesh);
  g.add(holder);

  const label = makeTextSprite(part.name.toUpperCase(), x, 2.05, z, 2.2);
  g.userData.label = label;

  scene.add(g);
  obstacles.push({ x, z, r: 0.7 });

  const rec = { id: ++uid, ...part, group: g, holder, mesh, baseY: 1.35, phase: Math.random() * Math.PI * 2, taken: false };
  g.traverse((o) => { o.userData.pickId = rec.id; });
  // label sprite should not be raycastable
  label.userData.pickId = -1;
  pickables.push(rec);

  // Try to overlay real GLB model if provided
  if (part.glb) tryLoadGLB(part, holder, mesh);

  return rec;
}

const loader = new GLTFLoader();
function tryLoadGLB(part, holder, fallback) {
  loader.load(
    part.glb,
    (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(part.glbScale || 1);
      // center model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.userData.pickId = part.id; } });
      fallback.visible = false;
      holder.add(model);
      part._model = model;
    },
    undefined,
    () => { /* keep procedural fallback if file missing */ }
  );
}

// Procedural part meshes
function box(w, h, d, color, emissive = 0x000000, ei = 0) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: ei, roughness: 0.5, metalness: 0.3 }));
}

const PARTS = [
  {
    kind: 'cpu', name: 'CPU AMD Ryzen', color: 0xf97316,
    glb: (import.meta.env.BASE_URL || './') + 'models/cpu.glb', glbScale: 0.6,
    build() {
      const g = new THREE.Group();
      g.add(box(0.34, 0.06, 0.34, 0xf97316, 0x7c2d12, 0.4));
      const lid = box(0.26, 0.04, 0.26, 0xfde68a, 0xf59e0b, 0.5);
      lid.position.y = 0.05; g.add(lid);
      return g;
    }
  },
  {
    kind: 'mainboard', name: 'Mainboard', color: 0x22c55e,
    glb: (import.meta.env.BASE_URL || './') + 'models/motherboard.glb', glbScale: 0.35,
    build() {
      const g = new THREE.Group();
      g.add(box(0.7, 0.05, 0.55, 0x15803d, 0x052e16, 0.5));
      const chip = box(0.2, 0.06, 0.2, 0x0f172a); chip.position.set(-0.1, 0.05, 0); g.add(chip);
      const slot = box(0.5, 0.05, 0.08, 0xe2e8f0); slot.position.set(0, 0.05, 0.18); g.add(slot);
      return g;
    }
  },
  {
    kind: 'ram', name: 'RAM Corsair RGB', color: 0x38bdf8,
    build() {
      const g = new THREE.Group();
      g.add(box(0.55, 0.22, 0.05, 0x0f172a));
      const rgb = box(0.55, 0.05, 0.055, 0x38bdf8, 0x38bdf8, 2.0);
      rgb.position.y = 0.13; g.add(rgb);
      return g;
    }
  },
  {
    kind: 'ssd', name: 'SSD Samsung', color: 0xe2e8f0,
    build() {
      const g = new THREE.Group();
      const b = box(0.4, 0.08, 0.3, 0x1e293b); g.add(b);
      const sticker = box(0.3, 0.085, 0.2, 0xdc2626, 0x7f1d1d, 0.4); g.add(sticker);
      return g;
    }
  },
  {
    kind: 'psu', name: 'Nguồn PSU', color: 0xfacc15,
    build() {
      const g = new THREE.Group();
      g.add(box(0.5, 0.35, 0.4, 0x111827, 0x000000, 0));
      const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 24),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.6 }));
      fan.rotation.x = Math.PI / 2; fan.position.z = 0.21; g.add(fan);
      return g;
    }
  },
  {
    kind: 'cooler', name: 'Tản nhiệt CPU', color: 0xa78bfa,
    build() {
      const g = new THREE.Group();
      const tower = box(0.35, 0.4, 0.25, 0x6d28d9, 0x4c1d95, 0.5); g.add(tower);
      const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24),
        new THREE.MeshStandardMaterial({ color: 0xede9fe }));
      fan.rotation.x = Math.PI / 2; fan.position.z = 0.16; g.add(fan);
      return g;
    }
  }
];

buildRoom();
buildWorkbench();
const spots = [[-5.5, 1.5], [-3.3, 1.5], [-1.1, 1.5], [1.1, 1.5], [3.3, 1.5], [5.5, 1.5]];
PARTS.forEach((p, i) => buildPedestal(spots[i][0], spots[i][1], p));

// ============ Player (vật thể đại diện + gắn góc quay) ============
const player = new THREE.Group();       // vị trí người chơi
const pitchHolder = new THREE.Group();  // gật lên/xuống
pitchHolder.position.y = 1.6;
player.add(pitchHolder);
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 100);
pitchHolder.add(camera);
player.position.set(0, 0, 4.2);
scene.add(player);

// Body đại diện (nhìn xuống sẽ thấy, xoay theo yaw vì là con của player)
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.6 });
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.9, 6, 14), bodyMat);
body.position.y = 0.85;
player.add(body);
// "Mũi" chỉ hướng nhìn
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 12),
  new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 }));
nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.45, -0.45);
player.add(nose);

let yaw = 0, pitch = 0;
function applyLook() {
  player.rotation.y = yaw;
  pitchHolder.rotation.x = pitch;
}
applyLook();

// Hand (vật đang cầm, gắn vào camera)
const hand = new THREE.Group();
hand.position.set(0.38, -0.32, -0.65);
camera.add(hand);
let handMesh = null;

// ============ Controls: WASD + mouse look + click ============
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyE') toggleInventory();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

let locked = false;
function requestLock() { canvas.requestPointerLock?.(); }
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  overlay.style.display = locked ? 'none' : 'flex';
  if (!locked && !invPanel.classList.contains('hidden')) {
    // đang mở túi thì giữ panel, không hiện overlay đè
    overlay.style.display = 'none';
  }
});
startBtn.addEventListener('click', requestLock);
canvas.addEventListener('click', () => { if (!locked) requestLock(); });

document.addEventListener('mousemove', (e) => {
  if (!locked) return;
  if (!invPanel.classList.contains('hidden')) return; // mở túi thì chuột dùng để bấm nút
  yaw -= e.movementX * 0.0022;
  pitch -= e.movementY * 0.0022;
  pitch = Math.max(-1.45, Math.min(1.45, pitch));
  applyLook();
});

// ============ Inventory state ============
const inventory = []; // {kind,name,color}
let held = null;      // {kind,name,color}

function setHeld(item) {
  held = item;
  if (handMesh) { hand.remove(handMesh); handMesh = null; }
  if (item) {
    const m = box(0.28, 0.18, 0.12, item.color, item.color, 0.35);
    m.rotation.set(0.2, -0.4, 0.1);
    hand.add(m);
    handMesh = m;
    heldLabel.textContent = '✋ Đang cầm: ' + item.name;
  } else {
    heldLabel.textContent = 'Tay trống';
  }
}

function renderInventory() {
  invGrid.innerHTML = '';
  invEmpty.style.display = inventory.length ? 'none' : 'block';
  inventory.forEach((it, idx) => {
    const div = document.createElement('div');
    div.className = 'inv-item';
    div.innerHTML = `<div class="dot" style="background:#${it.color.toString(16).padStart(6, '0')}"></div>
      <div class="name">${it.name}</div>`;
    const btn = document.createElement('button');
    btn.textContent = 'Cầm lên';
    btn.onclick = () => {
      if (held) { toast('Tay đang bận — cất đồ đang cầm trước (chuột phải).'); return; }
      inventory.splice(idx, 1);
      setHeld(it);
      renderInventory();
      toast('Đã lấy ' + it.name + ' ra tay.');
    };
    div.appendChild(btn);
    invGrid.appendChild(div);
  });
}

function toggleInventory(force) {
  const willOpen = force !== undefined ? force : invPanel.classList.contains('hidden');
  if (willOpen) {
    renderInventory();
    invPanel.classList.remove('hidden');
    document.exitPointerLock?.();
  } else {
    invPanel.classList.add('hidden');
  }
}
invClose.addEventListener('click', () => toggleInventory(false));

// Chuột trái: nhặt — Chuột phải: cất vào túi
const raycaster = new THREE.Raycaster();
raycaster.far = 3.4;
let focused = null;

document.addEventListener('mousedown', (e) => {
  if (!locked) return;
  if (!invPanel.classList.contains('hidden')) return;
  if (e.button === 0) {
    if (focused && !focused.taken) {
      if (held) { toast('Tay đang bận — chuột phải để cất đồ đang cầm vào túi.'); return; }
      pickup(focused);
    }
  } else if (e.button === 2) {
    if (held) {
      inventory.push(held);
      toast('Đã cất ' + held.name + ' vào túi (E để xem).');
      setHeld(null);
      renderInventory();
    } else {
      toast('Tay đang trống.');
    }
  }
});
document.addEventListener('contextmenu', (e) => e.preventDefault());

function pickup(rec) {
  rec.taken = true;
  rec.group.visible = false;
  setHeld({ kind: rec.kind, name: rec.name, color: rec.color });
  focused = null;
  promptEl.classList.add('hidden');
  toast('Đã nhặt: ' + rec.name + ' — chuột phải để cất vào túi.');
}

// ============ Loop: move + raycast crosshair ============
const clock = new THREE.Clock();
const fwd = new THREE.Vector3();

function updatePlayer(dt) {
  const sprint = (keys['ShiftLeft'] || keys['ShiftRight']) ? 2 : 1;
  const speed = 4 * sprint;
  fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const move = new THREE.Vector3();
  if (keys['KeyW'] || keys['ArrowUp']) move.add(fwd);
  if (keys['KeyS'] || keys['ArrowDown']) move.sub(fwd);
  if (keys['KeyD'] || keys['ArrowRight']) move.add(right);
  if (keys['KeyA'] || keys['ArrowLeft']) move.sub(right);
  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(speed * dt);
    player.position.add(move);
  }
  // Giữ trong phòng
  player.position.x = Math.max(-ROOM.w / 2 + 0.6, Math.min(ROOM.w / 2 - 0.6, player.position.x));
  player.position.z = Math.max(-ROOM.d / 2 + 0.6, Math.min(ROOM.d / 2 - 0.6, player.position.z));
  // Va chạm tròn với bàn + bục
  for (const o of obstacles) {
    const dx = player.position.x - o.x, dz = player.position.z - o.z;
    const d = Math.hypot(dx, dz), min = o.r + 0.35;
    if (d < min && d > 0.0001) {
      player.position.x = o.x + (dx / d) * min;
      player.position.z = o.z + (dz / d) * min;
    }
  }
  // Body nảy nhẹ khi di chuyển
  body.position.y = 0.85 + (move.lengthSq() > 0 ? Math.abs(Math.sin(performance.now() * 0.012)) * 0.04 : 0);
}

const center = new THREE.Vector2(0, 0);
function updateFocus(time) {
  // animation float
  for (const p of pickables) {
    if (p.taken) continue;
    p.holder.position.y = p.baseY + Math.sin(time * 2 + p.phase) * 0.08;
    p.holder.rotation.y += 0.012;
  }
  raycaster.setFromCamera(center, camera);
  const targets = pickables.filter((p) => !p.taken).map((p) => p.group);
  const hits = raycaster.intersectObjects(targets, true);
  let rec = null;
  if (hits.length) {
    let o = hits[0].object;
    while (o && o.userData.pickId === undefined) o = o.parent;
    const id = o?.userData.pickId;
    if (id > 0) rec = pickables.find((p) => p.id === id);
  }
  focused = rec;
  if (rec) {
    crosshair.classList.add('active');
    promptEl.classList.remove('hidden');
    promptEl.textContent = held
      ? `${rec.name} — tay đang bận (chuột phải để cất)`
      : `Click trái để nhặt: ${rec.name}`;
  } else {
    crosshair.classList.remove('active');
    promptEl.classList.add('hidden');
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (locked && invPanel.classList.contains('hidden')) updatePlayer(dt);
  updateFocus(clock.elapsedTime);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderInventory();
setHeld(null);
