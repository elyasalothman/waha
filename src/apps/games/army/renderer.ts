/**
 * جيش الواحة — three.js renderer + game loop.
 * Reads the pure engine state, drains its events, and turns them into juice.
 */
import * as THREE from "three";
import {
  BOSS_GAP,
  LANE,
  VISIBLE_CAP,
  autopilot,
  createGame,
  fireBand,
  formationRadius,
  progress,
  slot,
  squeeze,
  step,
  steer,
  type GameEvent,
  type GameState,
  type Upgrades,
} from "@/lib/army/engine";
import { LEVELS, isGood, opLabel, type GateOp, type LevelSpec } from "@/lib/army/levels";
import type { ArmyAudio } from "./audio";
import { buzz } from "./haptics";
import {
  PALETTE,
  archerBody,
  arrowGeo,
  bowGeo,
  chiefGeo,
  drawGate,
  floorTexture,
  fortGeo,
  islandGeo,
  legGeo,
  palmGeo,
  parapetGeo,
  radialTexture,
  raiderBody,
  skyTexture,
} from "./models";

const ENEMY_CAP = 520;
const GROUP_VIS = 170;
const ARROWS = 260;
const SEG = 30;
const SEGS = 9;
const fmt = (n: number) => Math.max(0, Math.round(n)).toString();

type Particle = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; size: number; r: number; g: number; b: number; grav: number };

class Particles {
  readonly points: THREE.Points;
  private ps: Particle[] = [];
  private pos: Float32Array;
  private col: Float32Array;
  private size: Float32Array;
  private geo: THREE.BufferGeometry;
  constructor(
    private max: number,
    additive: boolean,
    scale: { value: number },
  ) {
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("rgba", new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("size", new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uScale: scale },
      vertexShader: `attribute float size; attribute vec4 rgba; varying vec4 vC; uniform float uScale;
        void main(){ vC = rgba; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec4 vC; void main(){ float d = length(gl_PointCoord - 0.5); float a = (1.0 - smoothstep(0.15, 0.5, d)) * vC.a; if (a < 0.01) discard; gl_FragColor = vec4(vC.rgb, a); }`,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
  }
  emit(p: Omit<Particle, "max">) {
    if (this.ps.length >= this.max) this.ps.shift();
    this.ps.push({ ...p, max: p.life });
  }
  burst(x: number, y: number, z: number, n: number, color: number, speed: number, size: number, life: number, up = 2, grav = 6) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.emit({ x, y, z, vx: Math.cos(a) * s, vy: up * (0.5 + Math.random()), vz: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.6), size: size * (0.7 + Math.random() * 0.6), r: c.r, g: c.g, b: c.b, grav });
    }
  }
  update(dt: number) {
    let w = 0;
    for (let i = 0; i < this.ps.length; i++) {
      const p = this.ps[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vy -= p.grav * dt;
      p.x += p.vx * dt;
      p.y = Math.max(0.05, p.y + p.vy * dt);
      p.z += p.vz * dt;
      p.vx *= 0.97;
      p.vz *= 0.97;
      this.ps[w++] = p;
      const k = w - 1;
      const t = p.life / p.max;
      this.pos[k * 3] = p.x;
      this.pos[k * 3 + 1] = p.y;
      this.pos[k * 3 + 2] = p.z;
      this.col[k * 4] = p.r;
      this.col[k * 4 + 1] = p.g;
      this.col[k * 4 + 2] = p.b;
      this.col[k * 4 + 3] = Math.min(1, t * 1.6);
      this.size[k] = p.size * (0.6 + 0.4 * t);
    }
    this.ps.length = w;
    this.geo.setDrawRange(0, w);
    (this.geo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute("rgba") as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute("size") as THREE.BufferAttribute).needsUpdate = true;
  }
  clear() {
    this.ps.length = 0;
  }
}

type GateVis = {
  id: number;
  group: THREE.Group;
  panels: { side: -1 | 1; mesh: THREE.Mesh; glow: THREE.Mesh; op?: GateOp; canvas: HTMLCanvasElement; tex: THREE.CanvasTexture }[];
  fx: number;
  picked?: -1 | 1;
  grow?: { value: number; pulse: number };
};
type BowVis = { id: number; group: THREE.Group; taken: number };
type FireVis = { id: number; group: THREE.Group; flames: THREE.Mesh[] };
type Popup = { el: HTMLDivElement; x: number; y: number; z: number; t: number };

export type EndInfo = { state: GameState; won: boolean };

export type RendererOptions = {
  onEnd?: (info: EndInfo) => void;
  onProgress?: (p: number, n: number) => void;
  onContextLost?: () => void;
};

export class ArmyRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = 0;
  private raf = 0;
  private lastT = 0;
  private acc = 0;
  private pr: number;
  private frameAvg = 1 / 60;
  private frames = 0;
  private ro: ResizeObserver;
  private disposed = false;

  state: GameState | null = null;
  paused = false;
  demo = true;
  /** test hook: speeds the simulation up (QA screenshots). */
  timeScale = 1;
  private upgrades: Upgrades = { start: 0, rate: 0, income: 0 };
  private endTimer = -1;
  private ended = false;

  // static world
  private floor!: THREE.Mesh;
  private floorTex!: THREE.Texture;
  private water!: THREE.Mesh;
  private waterMat!: THREE.ShaderMaterial;
  private parapets: THREE.Mesh[] = [];
  private palms!: THREE.InstancedMesh;
  private islands!: THREE.InstancedMesh;
  private dunes!: THREE.InstancedMesh;
  private decoKey = "";

  // units
  private armyBody!: THREE.InstancedMesh;
  private armyBow!: THREE.InstancedMesh;
  private armyLegs!: THREE.InstancedMesh;
  private bowMat!: THREE.MeshLambertMaterial;
  private enemyBody!: THREE.InstancedMesh;
  private enemyLegs!: THREE.InstancedMesh;
  private shadows!: THREE.InstancedMesh;
  private ux = new Float32Array(VISIBLE_CAP);
  private uz = new Float32Array(VISIBLE_CAP);
  private us = new Float32Array(VISIBLE_CAP);
  private vis = 0;
  private enemyPrev = new Map<number, number>();
  private cheer = 0;

  // arrows
  private arrows!: THREE.InstancedMesh;
  private ar = {
    on: new Uint8Array(ARROWS),
    t: new Float32Array(ARROWS),
    d: new Float32Array(ARROWS),
    s: new Float32Array(ARROWS * 3),
    e: new Float32Array(ARROWS * 3),
    h: new Float32Array(ARROWS),
  };
  private arrowGold = new THREE.Color(PALETTE.gold);
  private arrowWood = new THREE.Color(0xffffff);
  private arrowRed = new THREE.Color(0xff4a3a);

  // fx
  private pScale = { value: 400 };
  private dust: Particles;
  private glow: Particles;
  private shake = 0;
  private level = new THREE.Group();
  private gates: GateVis[] = [];
  private bows: BowVis[] = [];
  private fires: FireVis[] = [];
  private boss: { group: THREE.Group; body: THREE.Object3D; blade: THREE.Object3D | null; door: THREE.Object3D | null; anim: number; hit: number; dead: number; kind: "chief" | "fort" } | null = null;
  private ring!: THREE.Mesh;
  private ringT = 0;

  // labels
  private armyLabel: HTMLDivElement;
  private enemyLabels: HTMLDivElement[] = [];
  private popups: Popup[] = [];
  private bossBar: HTMLDivElement;
  private bossFill: HTMLDivElement;
  private tmp = new THREE.Vector3();
  private dummy = new THREE.Object3D();
  private m4 = new THREE.Matrix4();
  private m5 = new THREE.Matrix4();
  private lookV = new THREE.Vector3();
  private hostW = 390;
  private hostH = 844;
  private camPos = new THREE.Vector3(0, 12, 12);
  private camLook = new THREE.Vector3(0, 0, -12);

  // input
  private dragging = false;
  private dragStartX = 0;
  private dragStartTarget = 0;
  private keys = { l: false, r: false };

  constructor(
    private host: HTMLDivElement,
    private labels: HTMLDivElement,
    private audio: ArmyAudio,
    private opts: RendererOptions = {},
  ) {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    this.pr = Math.min(dpr, 2);
    this.renderer = new THREE.WebGLRenderer({ antialias: dpr < 2, powerPreference: "high-performance", alpha: false });
    this.renderer.setPixelRatio(this.pr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener("webglcontextlost", this.onLost, false);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.5, 280);
    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(0xf6ddb2, 70, 190);
    this.scene.add(new THREE.HemisphereLight(0xfff3dc, 0xc79a62, 1.25));
    const sun = new THREE.DirectionalLight(0xffe3b8, 1.9);
    sun.position.set(-8, 14, 6);
    this.scene.add(sun);
    this.scene.add(this.level);

    this.dust = new Particles(900, false, this.pScale);
    this.glow = new Particles(900, true, this.pScale);
    this.scene.add(this.dust.points, this.glow.points);

    this.buildWorld();
    this.buildUnits();

    this.armyLabel = this.mkLabel("army-count army-count--ours");
    this.bossBar = document.createElement("div");
    this.bossBar.className = "army-boss";
    this.bossFill = document.createElement("div");
    this.bossFill.className = "army-boss__fill";
    this.bossBar.appendChild(this.bossFill);
    this.labels.appendChild(this.bossBar);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.bindInput();
    this.lastT = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ───────────────────────────── world
  private buildWorld() {
    this.floorTex = floorTexture();
    this.floorTex.repeat.set(1.4, 270 / 7);
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10.5, 270).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ map: this.floorTex }),
    );
    this.scene.add(this.floor);

    this.waterMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uFog: { value: new THREE.Color(0xf6ddb2) } },
      vertexShader: `varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uT; uniform vec3 uFog; varying vec3 vW; varying float vD;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
        void main(){
          vec2 p = vW.xz * 0.22;
          float w = n(p + vec2(uT*0.25, uT*0.4)) * 0.6 + n(p*2.3 - vec2(uT*0.5, uT*0.2)) * 0.4;
          float edge = 1.0 - smoothstep(6.0, 14.0, abs(vW.x));
          vec3 deep = vec3(0.05, 0.47, 0.62); vec3 shallow = vec3(0.24, 0.80, 0.80);
          vec3 c = mix(deep, shallow, w * 0.6 + edge * 0.35);
          float sp = smoothstep(0.78, 0.86, n(p*4.0 + vec2(uT*0.9, -uT*0.6)));
          c += vec3(1.0, 0.95, 0.8) * sp * 0.35;
          float f = smoothstep(70.0, 190.0, vD);
          gl_FragColor = vec4(mix(c, uFog, f), 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(420, 420).rotateX(-Math.PI / 2), this.waterMat);
    this.water.position.y = -1.3;
    this.scene.add(this.water);

    const parGeo = parapetGeo(SEG);
    const stoneMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    for (let i = 0; i < SEGS; i++) {
      const m = new THREE.Mesh(parGeo, stoneMat);
      this.parapets.push(m);
      this.scene.add(m);
    }
    const flatMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    this.palms = new THREE.InstancedMesh(palmGeo(), flatMat, 64);
    this.islands = new THREE.InstancedMesh(islandGeo(), flatMat, 40);
    const duneGeo = new THREE.IcosahedronGeometry(1, 1);
    duneGeo.scale(1, 0.32, 0.7);
    this.dunes = new THREE.InstancedMesh(duneGeo, new THREE.MeshLambertMaterial({ color: 0xe8b77a, flatShading: true }), 24);
    for (const m of [this.palms, this.islands, this.dunes]) {
      m.frustumCulled = false;
      this.scene.add(m);
    }

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1, 40).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffd38a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.ring.position.y = 0.08;
    this.scene.add(this.ring);
  }

  private hash(k: number) {
    const s = Math.sin(k * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  private updateDeco(camZ: number) {
    const base = Math.floor(-camZ / 24);
    const key = String(base);
    if (key === this.decoKey) return;
    this.decoKey = key;
    let pi = 0;
    let ii = 0;
    let di = 0;
    for (let k = base - 2; k < base + 9; k++) {
      for (const side of [-1, 1]) {
        const h = this.hash(k * 2 + (side > 0 ? 1 : 0));
        const z = -(k * 24 + h * 14);
        const x = side * (12 + h * 16);
        if (ii < 40) {
          const s = 3 + h * 4;
          this.dummy.position.set(x, -1.1, z);
          this.dummy.rotation.set(0, h * 6, 0);
          this.dummy.scale.set(s, 1, s);
          this.dummy.updateMatrix();
          this.islands.setMatrixAt(ii++, this.dummy.matrix);
        }
        const count = 1 + Math.floor(h * 2.5);
        for (let p = 0; p < count && pi < 64; p++) {
          const hh = this.hash(k * 13 + p * 7 + side);
          this.dummy.position.set(x + (hh - 0.5) * 4, -0.85, z + (this.hash(hh * 91) - 0.5) * 4);
          this.dummy.rotation.set(0, hh * 6.28, (hh - 0.5) * 0.15);
          const s = 0.85 + hh * 0.45;
          this.dummy.scale.set(s, s, s);
          this.dummy.updateMatrix();
          this.palms.setMatrixAt(pi++, this.dummy.matrix);
        }
        if (di < 24 && k % 2 === 0) {
          const s = 22 + h * 30;
          this.dummy.position.set(side * (70 + h * 40), -1.5, z - 40);
          this.dummy.rotation.set(0, h * 3, 0);
          this.dummy.scale.set(s, s * (0.6 + h * 0.5), s);
          this.dummy.updateMatrix();
          this.dunes.setMatrixAt(di++, this.dummy.matrix);
        }
      }
    }
    this.palms.count = pi;
    this.islands.count = ii;
    this.dunes.count = di;
    this.palms.instanceMatrix.needsUpdate = true;
    this.islands.instanceMatrix.needsUpdate = true;
    this.dunes.instanceMatrix.needsUpdate = true;
  }

  // ───────────────────────────── units
  private buildUnits() {
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    this.armyBody = new THREE.InstancedMesh(archerBody(), mat, VISIBLE_CAP);
    this.bowMat = new THREE.MeshLambertMaterial({ color: PALETTE.wood, flatShading: true });
    this.armyBow = new THREE.InstancedMesh(bowGeo(), this.bowMat, VISIBLE_CAP);
    this.armyLegs = new THREE.InstancedMesh(legGeo(0x5b4a3a), mat, VISIBLE_CAP * 2);
    this.enemyBody = new THREE.InstancedMesh(raiderBody(), mat, ENEMY_CAP);
    this.enemyLegs = new THREE.InstancedMesh(legGeo(0x3a2a22), mat, ENEMY_CAP * 2);
    const sh = new THREE.MeshBasicMaterial({ map: radialTexture("rgba(60,35,10,0.45)", "rgba(60,35,10,0)"), transparent: true, depthWrite: false });
    this.shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.9, 0.9).rotateX(-Math.PI / 2), sh, VISIBLE_CAP + ENEMY_CAP);
    this.arrows = new THREE.InstancedMesh(arrowGeo(), new THREE.MeshLambertMaterial({ vertexColors: true }), ARROWS);
    for (let i = 0; i < ARROWS; i++) this.arrows.setColorAt(i, this.arrowWood);
    for (const m of [this.shadows, this.armyBody, this.armyBow, this.armyLegs, this.enemyBody, this.enemyLegs, this.arrows]) {
      m.frustumCulled = false;
      m.count = 0;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.scene.add(m);
    }
  }

  // ───────────────────────────── level
  load(level: LevelSpec, upgrades: Upgrades, opts: { demo?: boolean; carry?: { n: number; stacks: number } } = {}) {
    this.demo = !!opts.demo;
    this.upgrades = upgrades;
    this.state = createGame(level, upgrades, opts.carry);
    this.ended = false;
    this.endTimer = -1;
    this.cheer = 0;
    this.paused = false;
    this.clearLevel();
    this.buildLevel(level);
    this.vis = 0;
    this.syncArmy(true);
    this.camPos.set(0, 12.5, 12);
    this.camLook.set(0, 0, -13);
    this.armyLabel.style.display = "";
  }

  private clearLevel() {
    const geos = new Set<THREE.BufferGeometry>();
    for (const c of [...this.level.children]) {
      this.level.remove(c);
      c.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          const mat = m.material as THREE.Material & { map?: THREE.Texture };
          if (mat.map) mat.map.dispose();
          mat.dispose();
          if (m.geometry !== this.pillarGeo) geos.add(m.geometry);
        }
      });
    }
    geos.forEach((g) => g.dispose());
    this.gates = [];
    this.bows = [];
    this.fires = [];
    this.boss = null;
    this.enemyPrev.clear();
    this.dust.clear();
    this.glow.clear();
    this.ar.on.fill(0);
    for (const p of this.popups) p.el.remove();
    this.popups = [];
  }

  private pillarGeo?: THREE.BufferGeometry;
  private pillar(): THREE.BufferGeometry {
    if (this.pillarGeo) return this.pillarGeo;
    const g = new THREE.CylinderGeometry(0.3, 0.38, 2.6, 6);
    g.translate(0, 1.3, 0);
    this.pillarGeo = g;
    return g;
  }

  private gatePanel(op: GateOp | null, label: string, kind: "good" | "bad" | "grow", side: -1 | 1, group: THREE.Group) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 220;
    drawGate(canvas, label, kind);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.3, 1.85),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false }),
    );
    mesh.position.set(side * 2.45, 1.75, 0);
    mesh.rotation.x = -0.32;
    const glowCol = kind === "good" ? "rgba(80,255,230,0.75)" : kind === "bad" ? "rgba(255,80,70,0.7)" : "rgba(255,200,80,0.75)";
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 1.6).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: radialTexture(glowCol, "rgba(0,0,0,0)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    glow.position.set(side * 2.45, 0.06, 0);
    group.add(mesh, glow);
    return { side, mesh, glow, op: op ?? undefined, canvas, tex };
  }

  private buildLevel(level: LevelSpec) {
    const s = this.state!;
    const stone = new THREE.MeshLambertMaterial({ color: PALETTE.stoneDark, flatShading: true });
    const cap = new THREE.MeshLambertMaterial({ color: PALETTE.gold, flatShading: true });
    const addPillars = (g: THREE.Group, xs: number[]) => {
      for (const x of xs) {
        const p = new THREE.Mesh(this.pillar(), stone);
        p.position.x = x;
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.5, 6), cap);
        c.position.set(x, 2.85, 0);
        g.add(p, c);
      }
    };
    for (const gt of s.gates) {
      const g = new THREE.Group();
      g.position.z = -gt.at;
      const panels: GateVis["panels"] = [];
      const xs: number[] = [];
      if (gt.left) {
        panels.push(this.gatePanel(gt.left, opLabel(gt.left), isGood(gt.left) ? "good" : "bad", -1, g));
        xs.push(-4.75, -0.15);
      }
      if (gt.right) {
        panels.push(this.gatePanel(gt.right, opLabel(gt.right), isGood(gt.right) ? "good" : "bad", 1, g));
        xs.push(0.15, 4.75);
      }
      addPillars(g, gt.left && gt.right ? [-4.75, 0, 4.75] : xs);
      this.level.add(g);
      this.gates.push({ id: gt.id, group: g, panels, fx: 0 });
    }
    for (const w of s.grows) {
      const g = new THREE.Group();
      g.position.z = -w.at;
      const p = this.gatePanel(null, `+${w.value}`, "grow", w.side, g);
      addPillars(g, w.side < 0 ? [-4.75, -0.15] : [0.15, 4.75]);
      this.level.add(g);
      this.gates.push({ id: w.id, group: g, panels: [p], fx: 0, grow: { value: w.value, pulse: 0 } });
    }
    for (const b of s.bows) {
      const g = new THREE.Group();
      g.position.set(b.side * 2.6, 0, -b.at);
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.5, 8), new THREE.MeshLambertMaterial({ color: PALETTE.stone, flatShading: true }));
      ped.position.y = 0.25;
      const bowM = new THREE.Mesh(bowGeo(), new THREE.MeshLambertMaterial({ color: PALETTE.gold, emissive: 0x7a4a00, flatShading: true }));
      bowM.scale.setScalar(2.6);
      bowM.position.set(0.9, -0.9, 0.4);
      const pivot = new THREE.Group();
      pivot.position.y = 1.6;
      pivot.add(bowM);
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 3.2),
        new THREE.MeshBasicMaterial({ map: radialTexture("rgba(255,214,90,0.9)", "rgba(255,180,40,0)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      halo.position.y = 1.6;
      g.add(ped, pivot, halo);
      g.userData = { pivot, halo };
      this.level.add(g);
      this.bows.push({ id: b.id, group: g, taken: 0 });
    }
    for (const f of s.fires) {
      const g = new THREE.Group();
      const [lo, hi] = fireBand(f.side);
      const w = hi - lo;
      g.position.set((lo + hi) / 2, 0, -f.at);
      const pit = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, f.len), new THREE.MeshLambertMaterial({ color: 0x2a120a, emissive: 0x3a0c00 }));
      pit.position.y = 0.03;
      const rim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.16, f.len + 0.3), new THREE.MeshLambertMaterial({ color: PALETTE.stoneDark }));
      rim.position.y = 0.0;
      const glowM = new THREE.Mesh(
        new THREE.PlaneGeometry(w + 2, f.len + 2).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ map: radialTexture("rgba(255,120,30,0.55)", "rgba(255,60,0,0)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      glowM.position.y = 0.12;
      g.add(rim, pit, glowM);
      const flames: THREE.Mesh[] = [];
      const fm = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
      const fm2 = new THREE.MeshBasicMaterial({ color: 0xffd25a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
      const n = Math.round((w * f.len) / 2.2);
      const flameGeo = new THREE.ConeGeometry(0.26, 1.05, 5);
      for (let i = 0; i < n; i++) {
        const fl = new THREE.Mesh(flameGeo, i % 3 ? fm : fm2);
        fl.position.set((Math.random() - 0.5) * (w - 0.6), 0.6, (Math.random() - 0.5) * (f.len - 0.6));
        fl.userData.ph = Math.random() * 10;
        fl.rotation.y = Math.random() * 3;
        flames.push(fl);
        g.add(fl);
      }
      g.userData = { lo: lo + 0.2, hi: hi - 0.2, len: f.len };
      this.level.add(g);
      this.fires.push({ id: f.id, group: g, flames });
    }
    // boss
    const bz = -(level.length + BOSS_GAP);
    const group = new THREE.Group();
    group.position.z = bz;
    const kind = level.boss.kind;
    let body: THREE.Object3D;
    let blade: THREE.Object3D | null = null;
    let door: THREE.Object3D | null = null;
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    if (kind === "fort") {
      const f = fortGeo();
      const walls = new THREE.Mesh(f.walls, mat);
      const d = new THREE.Mesh(f.door, mat.clone());
      walls.position.z = -2;
      d.position.z = -2;
      group.add(walls, d);
      body = walls;
      door = d;
    } else {
      const c = chiefGeo();
      const b = new THREE.Mesh(c.body, mat);
      const bl = new THREE.Mesh(c.blade, mat);
      const arm = new THREE.Group();
      arm.position.set(0.36, 1.0, 0);
      arm.add(bl);
      bl.rotation.x = -0.6;
      const holder = new THREE.Group();
      holder.add(b, arm);
      holder.scale.setScalar(3.4);
      holder.rotation.y = Math.PI;
      group.add(holder);
      body = holder;
      blade = arm;
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(4, 4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: radialTexture("rgba(60,35,10,0.5)", "rgba(60,35,10,0)"), transparent: true, depthWrite: false }));
      sh.position.y = 0.05;
      group.add(sh);
      // banners on the plaza
      for (const x of [-4.2, 4.2]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 5), new THREE.MeshLambertMaterial({ color: PALETTE.wood }));
        pole.position.set(x, 2, 2);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshLambertMaterial({ color: PALETTE.crimson, side: THREE.DoubleSide }));
        flag.position.set(x + 0.6, 3.6, 2);
        group.add(pole, flag);
      }
    }
    this.level.add(group);
    this.boss = { group, body, blade, door, anim: 0, hit: 0, dead: 0, kind };
  }

  // ───────────────────────────── input
  private bindInput() {
    const el = this.host;
    const width = () => Math.max(320, el.clientWidth);
    el.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onUp);
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKey);
    document.addEventListener("visibilitychange", this.onVis);
    void width;
  }
  private onDown = (e: PointerEvent) => {
    if (!this.state || this.demo) return;
    this.dragging = true;
    this.dragStartX = e.clientX;
    this.dragStartTarget = this.state.army.targetX;
  };
  private onMove = (e: PointerEvent) => {
    if (!this.dragging || !this.state || this.demo || this.paused) return;
    const w = Math.max(320, this.host.clientWidth);
    steer(this.state, this.dragStartTarget + ((e.clientX - this.dragStartX) / w) * LANE * 2.6);
  };
  private onUp = () => {
    this.dragging = false;
  };
  private onKey = (e: KeyboardEvent) => {
    const down = e.type === "keydown";
    if (e.key === "ArrowLeft" || e.key === "a") this.keys.l = down;
    if (e.key === "ArrowRight" || e.key === "d") this.keys.r = down;
  };
  private onLost = (e: Event) => {
    e.preventDefault();
    if (!this.demo) {
      this.setPaused(true);
      this.opts.onContextLost?.();
    }
  };
  private onVis = () => {
    if (document.hidden) this.lastT = performance.now();
  };

  // ───────────────────────────── loop
  private loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, Math.max(0, (now - this.lastT) / 1000));
    this.lastT = now;
    if (!this.paused) this.clock += dt;
    this.adapt(dt);
    const s = this.state;
    if (s && !this.paused) {
      if (this.keys.l || this.keys.r) steer(s, s.army.targetX + (this.keys.r ? 1 : -1) * dt * 9);
      if (this.demo) steer(s, autopilot(s, 1));
      this.acc += dt * this.timeScale;
      let steps = 0;
      const maxSteps = 4 * Math.ceil(this.timeScale);
      while (this.acc >= 1 / 60 && steps < maxSteps) {
        step(s, 1 / 60);
        this.handleEvents(s.events);
        s.events.length = 0;
        this.acc -= 1 / 60;
        steps++;
      }
      if (steps === maxSteps) this.acc = 0;
      if ((s.phase === "won" || s.phase === "lost") && !this.ended) {
        this.ended = true;
        this.endTimer = s.phase === "won" ? 1.6 : 1.1;
      }
      if (this.endTimer > 0) {
        this.endTimer -= dt;
        if (this.endTimer <= 0) {
          if (this.demo) this.load(LEVELS[Math.floor(Math.random() * 3)], { start: 4, rate: 4, income: 0 }, { demo: true });
          else this.opts.onEnd?.({ state: s, won: s.phase === "won" });
        }
      }
      this.opts.onProgress?.(progress(s), s.army.n);
    }
    if (this.paused && this.pausedRendered) return;
    if (s) this.updateVisuals(this.paused ? 0 : dt);
    this.renderer.render(this.scene, this.camera);
    this.pausedRendered = this.paused;
  };

  private adapt(dt: number) {
    this.frameAvg = this.frameAvg * 0.95 + dt * 0.05;
    if (++this.frames % 120 === 0 && this.frameAvg > 1 / 42 && this.pr > 1) {
      this.pr = Math.max(1, this.pr - 0.25);
      this.renderer.setPixelRatio(this.pr);
      this.resize();
    }
  }

  // ───────────────────────────── events → juice
  private handleEvents(evts: GameEvent[]) {
    const s = this.state!;
    const quiet = this.demo;
    const az = -s.army.dist;
    for (const e of evts) {
      switch (e.t) {
        case "gate": {
          const gv = this.gates.find((g) => g.id === e.id);
          if (gv) {
            gv.fx = 0.001;
            gv.picked = e.side;
          }
          const col = e.good ? 0x5ef2dc : 0xff5a4a;
          this.glow.burst(e.side * 2.45, 1.6, az - 0.5, 36, col, 6, 0.9, 0.8, 4, 4);
          this.glow.burst(s.army.x, 1, az, 24, e.good ? PALETTE.gold : 0xff3b2f, 4, 0.7, 0.7, 3, 4);
          const d = e.after - e.before;
          this.popup(`${d >= 0 ? "+" : "−"}${fmt(Math.abs(d))}`, s.army.x, 3.2, az, e.good ? "good" : "bad");
          if (!quiet) {
            this.audio.gate(e.good);
            buzz(e.good ? "light" : "medium");
          }
          if (!e.good) this.shake = Math.max(this.shake, 0.35);
          break;
        }
        case "grow": {
          const gv = this.gates.find((g) => g.id === e.id);
          if (gv?.grow) {
            gv.grow.value = e.value;
            gv.grow.pulse = 1;
            const p = gv.panels[0];
            drawGate(p.canvas, `+${e.value}`, "grow");
            p.tex.needsUpdate = true;
            this.glow.burst(p.side * 2.45, 1.8, gv.group.position.z, 8, PALETTE.gold, 3, 0.6, 0.5, 2, 3);
          }
          if (!quiet) this.audio.grow();
          break;
        }
        case "growHit": {
          const gv = this.gates.find((g) => g.id === e.id);
          if (gv?.grow) gv.grow.pulse = Math.max(gv.grow.pulse, 0.35);
          break;
        }
        case "enemyKilled": {
          if (!quiet && s.phase === "clash") this.audio.clash();
          break;
        }
        case "clashStart": {
          if (!quiet) buzz("medium");
          this.shake = Math.max(this.shake, 0.25);
          break;
        }
        case "clashEnd": {
          if (e.won && !quiet) buzz("light");
          break;
        }
        case "armyKilled": {
          // dust handled by syncArmy as units disappear
          if (e.reason === "clash") this.shake = Math.max(this.shake, 0.12);
          break;
        }
        case "bow": {
          const bv = this.bows.find((b) => b.id === e.id);
          if (bv) bv.taken = 0.001;
          this.glow.burst(bv ? bv.group.position.x : s.army.x, 2, az, 60, PALETTE.gold, 6, 1, 1.1, 5, 3);
          this.popup(e.stacks > 1 ? `قوس ذهبي ×${e.stacks}` : "قوس ذهبي!", s.army.x, 3.6, az, "gold");
          this.bowMat.color.set(PALETTE.gold);
          this.bowMat.emissive.set(0x6a3c00);
          if (!quiet) {
            this.audio.bow();
            buzz("medium");
          }
          break;
        }
        case "fire": {
          if (e.killed > 0) {
            this.popup(`−${fmt(e.killed)}`, s.army.x, 3.2, az, "bad");
            this.shake = Math.max(this.shake, 0.3);
            if (!quiet) {
              this.audio.fire();
              buzz("heavy");
            }
          }
          break;
        }
        case "shoot": {
          const n = Math.min(e.n, 5);
          for (let i = 0; i < n; i++) this.spawnArrow(e.tx, e.tdist, e.kind);
          if (!quiet) this.audio.twang();
          break;
        }
        case "bossArrive": {
          if (!quiet) buzz("medium");
          break;
        }
        case "bossHit": {
          if (this.boss) this.boss.hit = 1;
          if (!quiet) this.audio.bossHit();
          break;
        }
        case "slam": {
          if (this.boss) {
            this.boss.anim = 1;
            if (this.boss.kind === "fort") {
              for (let i = 0; i < 16; i++) this.spawnEnemyArrow();
              if (!quiet) this.audio.volley();
            } else {
              this.ringT = 0.001;
              this.ring.position.set(0, 0.08, -(s.level.length + BOSS_GAP) + 3);
              this.shake = Math.max(this.shake, 0.7);
              this.dust.burst(0, 0.5, -(s.level.length + BOSS_GAP) + 3, 40, 0xe2c08a, 9, 1.6, 0.9, 2, 4);
              if (!quiet) this.audio.slam();
            }
          }
          if (!quiet) buzz("heavy", 120);
          if (e.killed > 0) this.popup(`−${fmt(e.killed)}`, s.army.x, 3.4, az, "bad");
          break;
        }
        case "won": {
          this.cheer = 0.001;
          if (this.boss) this.boss.dead = 0.001;
          const bz = -(s.level.length + BOSS_GAP);
          this.glow.burst(0, 3, bz, 120, PALETTE.gold, 9, 1.2, 1.6, 8, 5);
          this.dust.burst(0, 1, bz, 60, 0xe2c08a, 7, 1.8, 1.2, 3, 3);
          this.shake = 0.6;
          if (!quiet) {
            this.audio.win();
            buzz("heavy");
          }
          break;
        }
        case "lost": {
          if (!quiet) {
            this.audio.lose();
            buzz("heavy");
          }
          break;
        }
      }
    }
  }

  private spawnArrow(tx: number, tdist: number, kind: "enemy" | "grow" | "boss") {
    if (this.vis === 0) return;
    const i = this.ar.on.indexOf(0);
    if (i < 0) return;
    const u = Math.floor(Math.random() * this.vis);
    const tz = -tdist + (Math.random() - 0.5) * (kind === "enemy" ? 3 : 1);
    const ty = kind === "boss" ? 2 + Math.random() * 3 : kind === "grow" ? 1.6 : 0.6;
    const spread = kind === "enemy" ? 2.2 : kind === "boss" ? 2.5 : 1.6;
    this.ar.on[i] = 1;
    this.ar.t[i] = 0;
    this.ar.s.set([this.ux[u], 1.0, this.uz[u]], i * 3);
    this.ar.e.set([tx + (Math.random() - 0.5) * spread, ty, tz], i * 3);
    const dist = Math.abs(tz - this.uz[u]);
    this.ar.d[i] = 0.25 + dist / 60;
    this.ar.h[i] = 1 + dist * 0.06;
    this.arrows.setColorAt(i, this.state && this.state.army.stacks > 0 ? this.arrowGold : this.arrowWood);
    if (this.arrows.instanceColor) this.arrows.instanceColor.needsUpdate = true;
  }

  private spawnEnemyArrow() {
    const s = this.state!;
    const i = this.ar.on.indexOf(0);
    if (i < 0 || this.vis === 0) return;
    const u = Math.floor(Math.random() * this.vis);
    const bz = -(s.level.length + BOSS_GAP) - 2;
    this.ar.on[i] = 1;
    this.ar.t[i] = -Math.random() * 0.25;
    this.ar.s.set([(Math.random() - 0.5) * 14, 7, bz], i * 3);
    this.ar.e.set([this.ux[u], 0.4, this.uz[u]], i * 3);
    this.ar.d[i] = 0.55;
    this.ar.h[i] = 3;
    this.arrows.setColorAt(i, this.arrowRed);
    if (this.arrows.instanceColor) this.arrows.instanceColor.needsUpdate = true;
  }

  // ───────────────────────────── per-frame visuals
  private syncArmy(reset = false) {
    const s = this.state!;
    const want = Math.min(VISIBLE_CAP, s.army.n);
    const ax = s.army.x;
    const az = -s.army.dist;
    if (reset) {
      for (let i = 0; i < want; i++) {
        const p = slot(i);
        const sq = squeeze(s.army.n, ax);
        this.ux[i] = ax + p.x * sq;
        this.uz[i] = az + p.z + formationRadius(s.army.n) * 0.2;
        this.us[i] = 1;
      }
      this.vis = want;
      return;
    }
    if (want > this.vis) {
      for (let i = this.vis; i < want; i++) {
        this.ux[i] = ax + (Math.random() - 0.5) * 0.6;
        this.uz[i] = az + (Math.random() - 0.5) * 0.6;
        this.us[i] = 0.05;
      }
    } else if (want < this.vis) {
      const lost = this.vis - want;
      const every = Math.max(1, Math.floor(lost / 14));
      for (let i = want; i < this.vis; i += every) {
        this.dust.burst(this.ux[i], 0.6, this.uz[i], 3, 0xf3e5c8, 2.2, 1.0, 0.55, 2.5, 4);
        this.glow.burst(this.ux[i], 0.8, this.uz[i], 2, PALETTE.teal, 2.5, 0.5, 0.4, 3, 6);
      }
    }
    this.vis = want;
  }

  private updateVisuals(dt: number) {
    const s = this.state!;
    const t = this.clock;
    this.syncArmy();
    const ax = s.army.x;
    const az = -s.army.dist;
    const n = s.army.n;
    const sq = squeeze(n, ax);
    const running = s.phase === "run";
    const stretch = 1 + Math.max(0, formationRadius(n) - (LANE - 0.4)) * 0.25;

    // camera
    const boss = s.phase === "boss" || (s.phase === "won" && s.boss.arrived);
    const fr = Math.min(6, formationRadius(n));
    const tgtPos = boss ? this.tmp.set(ax * 0.2, 15 + fr * 0.4, az + 14 + fr * 0.5) : this.tmp.set(ax * 0.35, 10.5 + fr * 0.55, az + 8.5 + fr * 0.6);
    this.camPos.lerp(tgtPos, Math.min(1, dt * 4));
    const lookZ = boss ? az - 9 : az - 10.5;
    this.camLook.lerp(this.lookV.set(ax * 0.4, boss ? 1.5 : 0, lookZ), Math.min(1, dt * 5));
    this.shake = Math.max(0, this.shake - dt * 1.8);
    const sh = this.shake * this.shake * 0.6;
    this.camera.position.set(this.camPos.x + (Math.random() - 0.5) * sh, this.camPos.y + (Math.random() - 0.5) * sh, this.camPos.z);
    this.camera.lookAt(this.camLook);

    // world follow
    const cz = this.camera.position.z;
    this.floor.position.z = cz - 110;
    this.floorTex.offset.y = -this.floor.position.z / 7;
    this.water.position.set(0, -1.3, cz - 120);
    this.waterMat.uniforms.uT.value = t;
    const first = Math.floor((cz + 20) / SEG);
    for (let i = 0; i < SEGS; i++) this.parapets[i].position.z = (first - i) * SEG - SEG / 2;
    this.updateDeco(cz);

    // army units
    const legPhase = t * 11;
    let si = 0;
    for (let i = 0; i < this.vis; i++) {
      const p = slot(i);
      const tx = ax + p.x * sq;
      const tz = az + p.z * stretch + formationRadius(n) * 0.25;
      const k = Math.min(1, dt * (running ? 9 : 6));
      this.ux[i] += (tx - this.ux[i]) * k;
      this.uz[i] += (tz - this.uz[i]) * k;
      this.us[i] = Math.min(1, this.us[i] + dt * 5);
      const ph = legPhase + i * 1.7;
      const moving = running || s.phase === "clash";
      const bob = moving ? Math.abs(Math.sin(ph)) * 0.09 : 0;
      const jump = this.cheer > 0 ? Math.max(0, Math.sin(t * 9 + i)) * 0.5 : 0;
      const sc = this.us[i];
      this.dummy.position.set(this.ux[i], bob + jump, this.uz[i]);
      this.dummy.rotation.set(0, (tx - this.ux[i]) * -0.4, moving ? Math.sin(ph) * 0.06 : 0);
      this.dummy.scale.setScalar(sc * 1.15);
      this.dummy.updateMatrix();
      this.armyBody.setMatrixAt(i, this.dummy.matrix);
      this.armyBow.setMatrixAt(i, this.dummy.matrix);
      // legs
      const swing = moving ? Math.sin(ph) * 0.7 : 0;
      for (let l = 0; l < 2; l++) {
        this.m4.makeRotationX(l ? swing : -swing);
        this.m4.setPosition(l ? 0.09 : -0.09, 0.42, 0);
        this.m5.multiplyMatrices(this.dummy.matrix, this.m4);
        this.armyLegs.setMatrixAt(i * 2 + l, this.m5);
      }
      this.dummy.position.set(this.ux[i], 0.04, this.uz[i]);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.setScalar(sc);
      this.dummy.updateMatrix();
      this.shadows.setMatrixAt(si++, this.dummy.matrix);
    }
    this.armyBody.count = this.vis;
    this.armyBow.count = this.vis;
    this.armyLegs.count = this.vis * 2;
    this.armyBody.instanceMatrix.needsUpdate = true;
    this.armyBow.instanceMatrix.needsUpdate = true;
    this.armyLegs.instanceMatrix.needsUpdate = true;
    if (s.army.stacks === 0 && this.bowMat.color.getHex() !== PALETTE.wood) {
      this.bowMat.color.set(PALETTE.wood);
      this.bowMat.emissive.set(0x000000);
    }

    // enemies
    let ei = 0;
    let li = 0;
    for (const e of s.enemies) {
      const prev = this.enemyPrev.get(e.id) ?? Math.min(GROUP_VIS, e.start);
      const show = e.dead ? 0 : Math.min(GROUP_VIS, e.count);
      const ez = -e.at;
      const ahead = az - ez;
      if (show < prev) {
        const lost = prev - show;
        const every = Math.max(1, Math.floor(lost / 10));
        const esq = squeeze(Math.max(1, e.count), e.x);
        for (let i = show; i < prev; i += every) {
          const p = slot(i);
          const x = e.x + p.x * esq;
          const z = ez - p.z;
          this.dust.burst(x, 0.6, z, 3, 0xf3e5c8, 2.2, 1.0, 0.5, 2.5, 4);
          this.glow.burst(x, 0.8, z, 2, 0xff4a3a, 2.5, 0.5, 0.4, 3, 6);
        }
      }
      this.enemyPrev.set(e.id, show);
      if (show === 0 || ahead > 130 || ahead < -20) continue;
      const esq = squeeze(e.count, e.x);
      const marching = e.awake && s.clashWith !== e.id;
      for (let i = 0; i < show && ei < ENEMY_CAP; i++) {
        const p = slot(i);
        const ph = t * 9 + i * 2.1;
        const x = e.x + p.x * esq;
        const z = ez - p.z * (1 + Math.max(0, formationRadius(e.count) - (LANE - 0.4)) * 0.25);
        const fight = s.clashWith === e.id ? Math.sin(t * 20 + i) * 0.12 : 0;
        this.dummy.position.set(x, (marching ? Math.abs(Math.sin(ph)) * 0.07 : 0) + Math.abs(fight), z);
        this.dummy.rotation.set(fight, Math.PI, 0);
        this.dummy.scale.setScalar(1.15);
        this.dummy.updateMatrix();
        this.enemyBody.setMatrixAt(ei, this.dummy.matrix);
        const swing = marching ? Math.sin(ph) * 0.6 : 0;
        for (let l = 0; l < 2; l++) {
          this.m4.makeRotationX(l ? swing : -swing);
          this.m4.setPosition(l ? 0.09 : -0.09, 0.42, 0);
          this.m5.multiplyMatrices(this.dummy.matrix, this.m4);
          this.enemyLegs.setMatrixAt(ei * 2 + l, this.m5);
        }
        this.dummy.position.set(x, 0.04, z);
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.updateMatrix();
        if (si < VISIBLE_CAP + ENEMY_CAP) this.shadows.setMatrixAt(si++, this.dummy.matrix);
        ei++;
      }
      // label
      const lab = this.enemyLabel(li++);
      this.place(lab, e.x, 2.2 + formationRadius(e.count) * 0.15, ez - formationRadius(e.count) * 0.3);
      const et = fmt(e.count);
      if (lab.textContent !== et) lab.textContent = et;
    }
    for (let i = li; i < this.enemyLabels.length; i++) this.enemyLabels[i].style.display = "none";
    this.enemyBody.count = ei;
    this.enemyLegs.count = ei * 2;
    this.enemyBody.instanceMatrix.needsUpdate = true;
    this.enemyLegs.instanceMatrix.needsUpdate = true;
    this.shadows.count = si;
    this.shadows.instanceMatrix.needsUpdate = true;

    // clash sparks along the contact line
    if (s.phase === "clash" && dt > 0) {
      const e = s.enemies.find((x) => x.id === s.clashWith);
      if (e) {
        const zc = -e.at + formationRadius(e.count) * 0.9;
        for (let k = 0; k < 2; k++) {
          const x = (Math.random() - 0.5) * Math.min(9, formationRadius(Math.min(n, e.count)) * 2.2);
          this.glow.burst(x, 0.9, zc, 1, Math.random() < 0.5 ? 0xffd27a : 0xffffff, 4, 0.5, 0.25, 3, 8);
          this.dust.burst(x, 0.4, zc, 1, 0xe8d3a8, 2, 1.2, 0.5, 1.5, 3);
        }
      }
    }

    // arrows
    let shown = 0;
    for (let i = 0; i < ARROWS; i++) {
      if (!this.ar.on[i]) continue;
      this.ar.t[i] += dt;
      const k = this.ar.t[i] / this.ar.d[i];
      if (k >= 1) {
        this.ar.on[i] = 0;
        const ex = this.ar.e[i * 3];
        const ez2 = this.ar.e[i * 3 + 2];
        if (Math.random() < 0.3) this.glow.burst(ex, this.ar.e[i * 3 + 1], ez2, 2, 0xffe2a0, 2, 0.35, 0.25, 2, 6);
        continue;
      }
      if (k < 0) continue;
      const pos = (q: number, o: THREE.Vector3) => {
        const sx = this.ar.s[i * 3], sy = this.ar.s[i * 3 + 1], sz = this.ar.s[i * 3 + 2];
        const ex = this.ar.e[i * 3], ey = this.ar.e[i * 3 + 1], ez2 = this.ar.e[i * 3 + 2];
        return o.set(sx + (ex - sx) * q, sy + (ey - sy) * q + this.ar.h[i] * 4 * q * (1 - q), sz + (ez2 - sz) * q);
      };
      pos(k, this.dummy.position);
      const ahead = pos(Math.min(1, k + 0.04), this.tmp);
      this.dummy.lookAt(ahead);
      this.dummy.rotateY(Math.PI);
      this.dummy.scale.setScalar(1);
      this.dummy.updateMatrix();
      this.arrows.setMatrixAt(i, this.dummy.matrix);
      shown = i + 1;
    }
    // hide inactive in range
    for (let i = 0; i < shown; i++) {
      if (!this.ar.on[i] || this.ar.t[i] < 0) {
        this.m4.makeScale(0, 0, 0);
        this.arrows.setMatrixAt(i, this.m4);
      }
    }
    this.arrows.count = shown;
    this.arrows.instanceMatrix.needsUpdate = true;

    // gates
    for (const g of this.gates) {
      const dz = g.group.position.z - this.camera.position.z;
      g.group.visible = dz < 10 && dz > -200;
      for (const p of g.panels) {
        const pulse = 1 + Math.sin(t * 4 + g.id) * 0.03 + (g.grow ? g.grow.pulse * 0.12 : 0);
        p.mesh.scale.set(pulse, pulse, 1);
        (p.glow.material as THREE.MeshBasicMaterial).opacity = 0.65 + Math.sin(t * 5 + g.id) * 0.25;
      }
      if (g.grow) g.grow.pulse = Math.max(0, g.grow.pulse - dt * 4);
      if (g.fx > 0) {
        g.fx += dt;
        for (const p of g.panels) {
          const m = p.mesh.material as THREE.MeshBasicMaterial;
          const chosen = p.side === g.picked;
          if (chosen) {
            const s2 = 1 + g.fx * 2.2;
            p.mesh.scale.set(s2, s2, 1);
            m.opacity = Math.max(0, 1 - g.fx * 2.4);
          } else m.opacity = Math.max(0, 1 - g.fx * 3);
          (p.glow.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - g.fx * 2.5);
        }
        if (g.fx > 0.6) g.group.visible = false;
      }
    }
    // bows
    for (const b of this.bows) {
      const { pivot, halo } = b.group.userData as { pivot: THREE.Group; halo: THREE.Mesh };
      pivot.rotation.y = t * 2.2;
      pivot.position.y = 1.6 + Math.sin(t * 3) * 0.15;
      halo.lookAt(this.camera.position);
      halo.scale.setScalar(1 + Math.sin(t * 5) * 0.12);
      if (b.taken > 0) {
        b.taken += dt;
        pivot.position.y += b.taken * 8;
        pivot.scale.setScalar(Math.max(0, 1 - b.taken * 2));
        (halo.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - b.taken * 3);
        if (b.taken > 0.6) b.group.visible = false;
      }
    }
    // fires
    for (const f of this.fires) {
      const near = Math.abs(f.group.position.z - this.camera.position.z) < 110;
      f.group.visible = near;
      if (!near) continue;
      for (const fl of f.flames) {
        const ph = fl.userData.ph as number;
        const k = 0.75 + Math.sin(t * 13 + ph) * 0.2 + Math.sin(t * 7.3 + ph * 2) * 0.15;
        fl.scale.set(1, k, 1);
        fl.position.y = 0.55 * k;
      }
      const fz = f.group.position.z;
      if (dt > 0 && Math.abs(fz - this.camera.position.z) < 90) {
        const { lo, hi, len } = f.group.userData as { lo: number; hi: number; len: number };
        for (let k = 0; k < 2; k++)
          this.glow.emit({ x: lo + Math.random() * (hi - lo), y: 0.3, z: fz + (Math.random() - 0.5) * len, vx: (Math.random() - 0.5) * 0.6, vy: 1.8 + Math.random() * 2.2, vz: 0, life: 0.6 + Math.random() * 0.4, size: 0.45 + Math.random() * 0.4, r: 1, g: 0.45 + Math.random() * 0.3, b: 0.1, grav: -1.5 });
      }
    }
    // boss
    if (this.boss) {
      const b = this.boss;
      b.hit = Math.max(0, b.hit - dt * 6);
      if (b.kind === "chief") {
        const holder = b.body;
        holder.position.y = Math.sin(t * 2) * 0.05;
        holder.rotation.z = Math.sin(t * 1.3) * 0.04 + b.hit * 0.03 * Math.sin(t * 60);
        if (b.blade) {
          if (b.anim > 0) {
            b.anim = Math.max(0, b.anim - dt * 2.2);
            const a = b.anim;
            b.blade.rotation.x = a > 0.6 ? -2.6 * ((1 - a) / 0.4) : -2.6 * (a / 0.6) - 0.1;
          } else b.blade.rotation.x = -0.5 + Math.sin(t * 2) * 0.12;
        }
        if (b.dead > 0) {
          b.dead += dt;
          holder.rotation.x = -Math.min(Math.PI / 2, b.dead * 2.5);
          holder.position.y = 0.3;
          if (b.dead > 1.4) holder.scale.setScalar(Math.max(0.001, 3.4 * (1 - (b.dead - 1.4) * 2)));
        }
      } else if (b.door) {
        b.door.position.x = b.hit * 0.08 * Math.sin(t * 70);
        const ratio = s.boss.hp / s.boss.max;
        const dm = (b.door as THREE.Mesh).material as THREE.MeshLambertMaterial;
        dm.color.setScalar(0.55 + 0.45 * ratio);
        if (b.dead > 0) {
          b.dead += dt;
          b.door.rotation.x = -Math.min(Math.PI / 2, b.dead * 2);
          b.door.position.y = -Math.min(0.3, b.dead);
        }
      }
    }
    // shockwave ring
    if (this.ringT > 0) {
      this.ringT += dt;
      const r = 1 + this.ringT * 22;
      this.ring.scale.set(r, 1, r);
      (this.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - this.ringT * 1.8);
      if (this.ringT > 0.6) this.ringT = 0;
    }
    if (this.cheer > 0) {
      this.cheer += dt;
      if (Math.random() < 0.4 && dt > 0) this.glow.burst(ax + (Math.random() - 0.5) * 6, 4, az - 4, 4, [PALETTE.gold, 0x5ef2dc, 0xff7a6a][Math.floor(Math.random() * 3)], 3, 0.6, 1.2, 4, 3);
    }

    this.dust.update(dt);
    this.glow.update(dt);

    // labels
    const label = this.armyLabel;
    if (n > 0 && s.phase !== "lost") {
      label.style.display = "";
      this.place(label, ax, 2.1 + Math.min(2.5, formationRadius(n) * 0.3), az + formationRadius(n) * 0.25);
      const txt = fmt(n);
      if (label.textContent !== txt) {
        label.textContent = txt;
        label.animate?.([{ scale: "1.35" }, { scale: "1" }], { duration: 220, easing: "ease-out" });
      }
    } else label.style.display = "none";
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.t += dt;
      p.y += dt * 1.6;
      this.place(p.el, p.x, p.y, p.z);
      p.el.style.opacity = String(Math.max(0, 1 - p.t / 1.1));
      if (p.t > 1.1) {
        p.el.remove();
        this.popups.splice(i, 1);
      }
    }
    if (s.boss.arrived && s.boss.hp > 0 && !this.demo) {
      this.bossBar.style.display = "block";
      this.bossFill.style.width = `${(s.boss.hp / s.boss.max) * 100}%`;
      this.bossBar.dataset.hp = fmt(s.boss.hp);
    } else this.bossBar.style.display = "none";
    if (this.demo) label.style.display = this.demo && n > 0 ? "" : "none";
  }

  // ───────────────────────────── labels
  private mkLabel(cls: string) {
    const d = document.createElement("div");
    d.className = cls;
    d.setAttribute("dir", "ltr");
    this.labels.appendChild(d);
    return d;
  }
  private enemyLabel(i: number) {
    while (this.enemyLabels.length <= i) this.enemyLabels.push(this.mkLabel("army-count army-count--foe"));
    const l = this.enemyLabels[i];
    l.style.display = "";
    return l;
  }
  private place(el: HTMLElement, x: number, y: number, z: number) {
    const v = this.tmp.set(x, y, z).project(this.camera);
    if (v.z > 1 || v.z < -1) {
      el.style.visibility = "hidden";
      return;
    }
    el.style.visibility = "";
    const w = this.hostW;
    const h = this.hostH;
    el.style.transform = `translate3d(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px, 0) translate(-50%, -50%)`;
  }
  private popup(text: string, x: number, y: number, z: number, kind: "good" | "bad" | "gold") {
    if (this.popups.length > 8) {
      const old = this.popups.shift()!;
      old.el.remove();
    }
    const el = document.createElement("div");
    el.className = `army-pop army-pop--${kind}`;
    el.dir = /[\u0600-\u06FF]/.test(text) ? "rtl" : "ltr";
    el.textContent = text;
    this.labels.appendChild(el);
    this.popups.push({ el, x, y, z, t: 0 });
  }

  // ───────────────────────────── misc
  private resize() {
    const w = this.host.clientWidth || 390;
    const h = this.host.clientHeight || 844;
    this.hostW = w;
    this.hostH = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the bridge filling a portrait phone; widen FOV on narrow screens
    this.camera.fov = w / h < 0.6 ? 54 : 46;
    this.camera.updateProjectionMatrix();
    this.pScale.value = (h * this.pr) / (2 * Math.tan((this.camera.fov * Math.PI) / 360));
  }

  private pausedRendered = false;
  setPaused(p: boolean) {
    this.paused = p;
    this.pausedRendered = false;
    this.lastT = performance.now();
  }

  stats() {
    return { fps: Math.round(1 / this.frameAvg), pr: this.pr, units: this.vis, enemies: this.enemyBody.count, draws: this.renderer.info.render.calls, tris: this.renderer.info.render.triangles };
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.host.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onUp);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKey);
    document.removeEventListener("visibilitychange", this.onVis);
    this.clearLevel();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.floorTex.dispose();
    (this.scene.background as THREE.Texture | null)?.dispose();
    ((this.shadows.material as THREE.MeshBasicMaterial).map as THREE.Texture | null)?.dispose();
    this.pillarGeo?.dispose();
    this.renderer.domElement.removeEventListener("webglcontextlost", this.onLost);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labels.replaceChildren();
  }
}
