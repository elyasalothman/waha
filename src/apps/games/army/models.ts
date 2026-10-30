/**
 * جيش الواحة — procedural low-poly models (original, built in code).
 * Every model faces −Z (the direction of travel). Vertex colours, one draw call each.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type Part = { g: THREE.BufferGeometry; c: number | string };

function paint(g: THREE.BufferGeometry, color: number | string): THREE.BufferGeometry {
  const geo = g.index ? g.toNonIndexed() : g;
  const col = new THREE.Color(color);
  const n = geo.getAttribute("position").count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = col.r;
    arr[i * 3 + 1] = col.g;
    arr[i * 3 + 2] = col.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  geo.deleteAttribute("uv");
  return geo;
}

function merge(parts: Part[]): THREE.BufferGeometry {
  const g = mergeGeometries(parts.map((p) => paint(p.g, p.c)));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

const at = (g: THREE.BufferGeometry, x: number, y: number, z: number) => g.translate(x, y, z);

export const PALETTE = {
  teal: 0x1f9e9a,
  tealDark: 0x15706e,
  sand: 0xe9cf9f,
  ghutra: 0xf6f1e4,
  agal: 0x262021,
  skin: 0xd9a77a,
  wood: 0x7a4a24,
  gold: 0xf2b632,
  crimson: 0xb72a2c,
  crimsonDark: 0x7d1a1f,
  wrap: 0x2c201c,
  steel: 0xcfd6dc,
  stone: 0xe2c595,
  stoneDark: 0xc49d68,
  palmLeaf: 0x3f9a4a,
  palmLeafDark: 0x2c7a3b,
  trunk: 0x9b6b3d,
};

/** Player archer body (no legs, no bow). ~1.15 m tall. */
export function archerBody(): THREE.BufferGeometry {
  return merge([
    { g: at(new THREE.CylinderGeometry(0.15, 0.27, 0.58, 7), 0, 0.66, 0), c: PALETTE.teal },
    { g: at(new THREE.CylinderGeometry(0.185, 0.2, 0.07, 7), 0, 0.74, 0), c: PALETTE.gold },
    { g: at(new THREE.CylinderGeometry(0.1, 0.16, 0.12, 6), 0, 0.98, 0), c: PALETTE.tealDark },
    { g: at(new THREE.IcosahedronGeometry(0.16, 0), 0, 1.08, 0), c: PALETTE.skin },
    // ghutra: cap + back drape, agal ring
    { g: at(new THREE.SphereGeometry(0.185, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0, 1.1, 0.01), c: PALETTE.ghutra },
    { g: at(new THREE.ConeGeometry(0.21, 0.36, 6, 1, true), 0, 0.98, 0.07), c: PALETTE.ghutra },
    { g: at(new THREE.TorusGeometry(0.15, 0.028, 4, 10).rotateX(Math.PI / 2), 0, 1.19, 0.01), c: PALETTE.agal },
    // quiver + fletching on the back
    { g: at(new THREE.CylinderGeometry(0.06, 0.055, 0.38, 5).rotateX(-0.35), 0.06, 0.82, 0.2), c: PALETTE.wood },
    { g: at(new THREE.ConeGeometry(0.075, 0.13, 4), 0.06, 1.05, 0.28), c: 0xf4ead2 },
    // arms
    { g: at(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 5).rotateZ(0.9), -0.2, 0.82, -0.08), c: PALETTE.teal },
    { g: at(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 5).rotateX(1.2), 0.13, 0.84, -0.12), c: PALETTE.teal },
  ]);
}

/** Bow held in the left hand; separate so it can turn golden. */
export function bowGeo(): THREE.BufferGeometry {
  const arc = new THREE.TorusGeometry(0.3, 0.028, 4, 12, Math.PI).rotateZ(-Math.PI / 2).rotateY(Math.PI / 2);
  const string = new THREE.BoxGeometry(0.012, 0.6, 0.012);
  string.translate(0, 0, 0);
  const g = mergeGeometries([at(arc, 0, 0, 0), at(string, 0, 0, 0)].map((x) => (x.index ? x.toNonIndexed() : x)));
  g.deleteAttribute("uv");
  g.translate(-0.34, 0.86, -0.16);
  g.computeVertexNormals();
  return g;
}

/** One leg, pivot at the hip (top). */
export function legGeo(color: number): THREE.BufferGeometry {
  return merge([
    { g: at(new THREE.BoxGeometry(0.11, 0.38, 0.12), 0, -0.19, 0), c: color },
    { g: at(new THREE.BoxGeometry(0.12, 0.07, 0.19), 0, -0.38, -0.03), c: 0x4a2f1c },
  ]);
}

/** Bandit raider: crimson robe, dark wrap, curved blade and round shield. Faces −Z (rotate π to face the player). */
export function raiderBody(): THREE.BufferGeometry {
  return merge([
    { g: at(new THREE.CylinderGeometry(0.16, 0.28, 0.58, 7), 0, 0.66, 0), c: PALETTE.crimson },
    { g: at(new THREE.CylinderGeometry(0.19, 0.21, 0.07, 7), 0, 0.74, 0), c: 0x3a2418 },
    { g: at(new THREE.CylinderGeometry(0.1, 0.17, 0.12, 6), 0, 0.98, 0), c: PALETTE.crimsonDark },
    { g: at(new THREE.IcosahedronGeometry(0.16, 0), 0, 1.08, 0), c: PALETTE.skin },
    { g: at(new THREE.SphereGeometry(0.19, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.62), 0, 1.08, 0.015), c: PALETTE.wrap },
    { g: at(new THREE.BoxGeometry(0.3, 0.07, 0.05), 0, 1.04, -0.15), c: PALETTE.wrap }, // face veil
    { g: at(new THREE.BoxGeometry(0.035, 0.5, 0.07).rotateX(-0.5), 0.27, 0.86, -0.18), c: PALETTE.steel },
    { g: at(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8).rotateZ(Math.PI / 2), -0.27, 0.76, -0.05), c: 0x8a5a2b },
    { g: at(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 6).rotateZ(Math.PI / 2), -0.3, 0.76, -0.05), c: PALETTE.gold },
  ]);
}

/** The raider chief (boss). Built around a 1 m frame, scaled up in the scene. */
export function chiefGeo(): { body: THREE.BufferGeometry; blade: THREE.BufferGeometry } {
  const body = merge([
    { g: at(new THREE.CylinderGeometry(0.2, 0.34, 0.62, 8), 0, 0.68, 0), c: PALETTE.crimsonDark },
    { g: at(new THREE.CylinderGeometry(0.26, 0.23, 0.32, 8), 0, 0.98, 0), c: 0x9c7a2a },
    { g: at(new THREE.BoxGeometry(0.62, 0.12, 0.28), 0, 1.12, 0), c: PALETTE.gold },
    { g: at(new THREE.IcosahedronGeometry(0.17, 0), 0, 1.3, 0), c: PALETTE.skin },
    { g: at(new THREE.ConeGeometry(0.2, 0.34, 8), 0, 1.5, 0), c: PALETTE.gold },
    { g: at(new THREE.SphereGeometry(0.04, 5, 4), 0, 1.68, 0), c: 0xe23b3b },
    { g: at(new THREE.BoxGeometry(0.32, 0.07, 0.05), 0, 1.26, -0.16), c: PALETTE.wrap },
    { g: at(new THREE.BoxGeometry(0.13, 0.4, 0.14), -0.1, 0.2, 0), c: 0x3a2418 },
    { g: at(new THREE.BoxGeometry(0.13, 0.4, 0.14), 0.1, 0.2, 0), c: 0x3a2418 },
    { g: at(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 6).rotateZ(0.5), -0.36, 0.95, 0), c: PALETTE.crimsonDark },
    { g: at(new THREE.ConeGeometry(0.42, 0.75, 8, 1, true), 0, 0.8, 0.08), c: 0x5e1216 }, // cape
  ]);
  const blade = merge([
    { g: at(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 6), 0, 0, 0), c: 0x3a2418 },
    { g: at(new THREE.BoxGeometry(0.2, 0.04, 0.06), 0, 0.12, 0), c: PALETTE.gold },
    { g: at(new THREE.BoxGeometry(0.05, 0.8, 0.1).translate(0.03, 0.5, 0), 0, 0, 0), c: PALETTE.steel },
  ]);
  blade.translate(0, -0.05, 0);
  return { body, blade };
}

/** A sandstone desert fortress with towers and a wooden gate (gate is separate). */
export function fortGeo(): { walls: THREE.BufferGeometry; door: THREE.BufferGeometry } {
  const parts: Part[] = [];
  const wall = (x: number, w: number, h: number) => {
    parts.push({ g: at(new THREE.BoxGeometry(w, h, 2.2), x, h / 2, 0), c: PALETTE.stone });
    for (let i = -w / 2 + 0.45; i < w / 2; i += 1.1)
      parts.push({ g: at(new THREE.BoxGeometry(0.6, 0.6, 2.3), x + i, h + 0.3, 0), c: PALETTE.stoneDark });
  };
  wall(-4.6, 5.2, 5);
  wall(4.6, 5.2, 5);
  parts.push({ g: at(new THREE.BoxGeometry(4.4, 2.2, 2.2), 0, 6.1, 0), c: PALETTE.stone });
  for (const x of [-7.6, -2.2, 2.2, 7.6]) {
    parts.push({ g: at(new THREE.CylinderGeometry(1.25, 1.45, 8, 8), x, 4, 0), c: PALETTE.stoneDark });
    parts.push({ g: at(new THREE.CylinderGeometry(1.5, 1.3, 0.6, 8), x, 8.3, 0), c: PALETTE.stone });
    parts.push({ g: at(new THREE.ConeGeometry(1.35, 1.8, 8), x, 9.5, 0), c: 0xc0823f });
    parts.push({ g: at(new THREE.BoxGeometry(0.06, 1.6, 0.06), x, 11, 0), c: PALETTE.wood });
    parts.push({ g: at(new THREE.BoxGeometry(0.9, 0.5, 0.04), x + 0.45, 11.5, 0), c: PALETTE.crimson });
  }
  // dark arch behind the door + windows
  parts.push({ g: at(new THREE.BoxGeometry(3.4, 4.6, 0.2), 0, 2.3, -1.12), c: 0x3a2618 });
  for (const x of [-4.6, 4.6]) parts.push({ g: at(new THREE.BoxGeometry(0.5, 0.9, 0.1), x, 3.4, -1.12), c: 0x3a2618 });
  const walls = merge(parts);
  const door = merge([
    { g: at(new THREE.BoxGeometry(3.6, 4.4, 0.3), 0, 2.2, 0.6), c: 0x8a5a2b },
    ...[-1.1, 0, 1.1].map((x) => ({ g: at(new THREE.BoxGeometry(0.12, 4.3, 0.34), x, 2.2, 0.62), c: 0x5e3a1c })),
    ...[1, 2.2, 3.4].map((y) => ({ g: at(new THREE.BoxGeometry(3.6, 0.16, 0.36), 0, y, 0.64), c: 0x3c2a1c })),
  ]);
  return { walls, door };
}

/** Date palm: curved trunk + drooping fronds + date clusters. */
export function palmGeo(): THREE.BufferGeometry {
  const parts: Part[] = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < 6; i++) {
    const r0 = 0.32 - i * 0.03;
    const seg = new THREE.CylinderGeometry(r0 - 0.03, r0, 0.9, 6);
    seg.rotateZ(-0.06 * i);
    parts.push({ g: at(seg, x, y + 0.45, 0), c: i % 2 ? PALETTE.trunk : 0x8a5d33 });
    x += Math.sin(0.06 * i) * 0.9;
    y += 0.86;
  }
  for (let k = 0; k < 8; k++) {
    const leaf = new THREE.ConeGeometry(0.42, 2.8, 3);
    leaf.scale(1, 1, 0.18);
    leaf.translate(0, 1.4, 0);
    leaf.rotateZ(-1.15 - (k % 2) * 0.25);
    leaf.rotateY((k / 8) * Math.PI * 2);
    parts.push({ g: at(leaf, x, y, 0), c: k % 2 ? PALETTE.palmLeaf : PALETTE.palmLeafDark });
  }
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4;
    parts.push({ g: at(new THREE.IcosahedronGeometry(0.22, 0), x + Math.cos(a) * 0.3, y - 0.25, Math.sin(a) * 0.3), c: 0xb5541e });
  }
  return merge(parts);
}

/** Arrow: shaft + head + fletching. Points along −Z. */
export function arrowGeo(): THREE.BufferGeometry {
  return merge([
    { g: new THREE.CylinderGeometry(0.022, 0.022, 0.8, 4).rotateX(Math.PI / 2), c: 0x8a5a2b },
    { g: at(new THREE.ConeGeometry(0.06, 0.16, 4).rotateX(-Math.PI / 2), 0, 0, -0.46), c: PALETTE.steel },
    { g: at(new THREE.BoxGeometry(0.12, 0.012, 0.16), 0, 0, 0.36), c: 0xf2f2f2 },
  ]);
}

/** Bridge parapet segment (length L) with crenellations and pier caps. */
export function parapetGeo(L: number): THREE.BufferGeometry {
  const parts: Part[] = [];
  for (const side of [-1, 1]) {
    const x = side * 5.45;
    parts.push({ g: at(new THREE.BoxGeometry(0.7, 0.75, L), x, 0.37, 0), c: PALETTE.stone });
    parts.push({ g: at(new THREE.BoxGeometry(0.85, 0.12, L), x, 0.78, 0), c: PALETTE.stoneDark });
    for (let z = -L / 2 + 0.75; z < L / 2; z += 1.5)
      parts.push({ g: at(new THREE.BoxGeometry(0.6, 0.45, 0.75), x, 1.05, z), c: PALETTE.stone });
    // piers dropping into the water
    for (const z of [-L / 2 + 2, L / 2 - 12]) {
      parts.push({ g: at(new THREE.BoxGeometry(1.6, 4, 2.2), side * 5.6, -2.3, z), c: PALETTE.stoneDark });
      // lantern post
      parts.push({ g: at(new THREE.BoxGeometry(0.16, 1.5, 0.16), x, 1.6, z + 5), c: PALETTE.wood });
      parts.push({ g: at(new THREE.BoxGeometry(0.34, 0.38, 0.34), x, 2.5, z + 5), c: 0xffd27a });
      parts.push({ g: at(new THREE.ConeGeometry(0.3, 0.25, 4).rotateY(Math.PI / 4), x, 2.82, z + 5), c: PALETTE.wood });
    }
  }
  // deck side faces (visible over the water)
  for (const side of [-1, 1]) parts.push({ g: at(new THREE.BoxGeometry(0.3, 1.4, L), side * 5.2, -0.7, 0), c: PALETTE.stoneDark });
  return merge(parts);
}

/** Sandy island with a soft edge — a flattened low-poly blob. */
export function islandGeo(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(1, 1.25, 0.6, 9, 1);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    const k = 1 + 0.18 * Math.sin(a * 3) + 0.1 * Math.cos(a * 5);
    pos.setX(i, pos.getX(i) * k);
    pos.setZ(i, pos.getZ(i) * k);
  }
  return merge([
    { g, c: 0xeacb92 },
    { g: at(new THREE.CylinderGeometry(0.75, 0.95, 0.12, 9), 0, 0.33, 0), c: 0x9cb85a },
  ]);
}

/** Canvas texture with soft radial glow (for shadows, glows, sparks). */
export function radialTexture(inner: string, outer: string, size = 128): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Sandstone slab floor texture (tileable). */
export function floorTexture(): THREE.Texture {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d")!;
  x.fillStyle = "#e3c896";
  x.fillRect(0, 0, S, S);
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const rows = 6;
  for (let row = 0; row < rows; row++) {
    const h = S / rows;
    let cx = row % 2 ? -h * 0.5 : 0;
    while (cx < S) {
      const w = h * (0.9 + r() * 0.9);
      const l = 82 + r() * 10;
      x.fillStyle = `hsl(${36 + r() * 6}, ${48 + r() * 10}%, ${l}%)`;
      x.fillRect(cx + 3, row * h + 3, w - 6, h - 6);
      // speckles
      for (let k = 0; k < 18; k++) {
        x.fillStyle = `rgba(150,110,60,${0.05 + r() * 0.08})`;
        x.beginPath();
        x.arc(cx + r() * w, row * h + r() * h, 1 + r() * 3, 0, Math.PI * 2);
        x.fill();
      }
      cx += w;
    }
  }
  x.strokeStyle = "rgba(160,120,70,0.35)";
  x.lineWidth = 2;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Sky gradient used as scene background. */
export function skyTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#5fb4dc");
  g.addColorStop(0.55, "#a9d8e6");
  g.addColorStop(0.85, "#ffe1b0");
  g.addColorStop(1, "#ffd59a");
  x.fillStyle = g;
  x.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const FONT = `"IBM Plex Sans Arabic", "Noto Sans Arabic", "Segoe UI", system-ui, sans-serif`;

/** Draws a gate panel. kind: good (turquoise), bad (crimson), grow (amber). */
export function drawGate(canvas: HTMLCanvasElement, label: string, kind: "good" | "bad" | "grow") {
  const W = canvas.width;
  const H = canvas.height;
  const x = canvas.getContext("2d")!;
  x.clearRect(0, 0, W, H);
  const pal =
    kind === "good"
      ? ["rgba(64,224,208,0.92)", "rgba(16,128,140,0.92)", "#bff7ef"]
      : kind === "bad"
        ? ["rgba(255,96,86,0.92)", "rgba(150,22,34,0.92)", "#ffd0c8"]
        : ["rgba(255,206,84,0.94)", "rgba(196,110,20,0.94)", "#fff0c0"];
  const r = 26;
  const pad = 6;
  x.beginPath();
  x.roundRect(pad, pad, W - pad * 2, H - pad * 2, r);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal[0]);
  g.addColorStop(1, pal[1]);
  x.fillStyle = g;
  x.fill();
  x.lineWidth = 8;
  x.strokeStyle = "#f6c453";
  x.stroke();
  x.lineWidth = 3;
  x.strokeStyle = pal[2];
  x.beginPath();
  x.roundRect(pad + 12, pad + 12, W - pad * 2 - 24, H - pad * 2 - 24, r - 10);
  x.stroke();
  // shine
  x.fillStyle = "rgba(255,255,255,0.18)";
  x.beginPath();
  x.roundRect(pad + 16, pad + 16, W - pad * 2 - 32, (H - pad * 2) * 0.32, 16);
  x.fill();
  x.font = `900 ${Math.round(H * 0.58)}px ${FONT}`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.direction = "ltr";
  x.lineJoin = "round";
  x.lineWidth = 14;
  x.strokeStyle = "rgba(40,20,10,0.55)";
  x.strokeText(label, W / 2, H / 2 + 6);
  x.fillStyle = "#ffffff";
  x.fillText(label, W / 2, H / 2 + 6);
  if (kind === "grow") {
    x.font = `900 ${Math.round(H * 0.24)}px ${FONT}`;
    x.fillStyle = "rgba(255,255,255,0.9)";
    x.fillText("▲", W - 46, 44);
  }
}
