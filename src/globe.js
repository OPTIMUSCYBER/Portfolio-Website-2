import * as THREE from 'three';

/**
 * DESIGN 01 FINAL — Digital Earth Globe
 *
 * Features:
 *  1. Dark sphere with Earth-at-night texture (ice-blue city lights)
 *  2. Network grid overlay (wireframe)
 *  3. 600 active network nodes (Fibonacci distribution)
 *  4. Moving data packets between random node pairs
 *  5. 3 orbital rings at different tilts and speeds
 *  6. Atmospheric glow sphere
 *  7. Cinematic backlight sprite
 *  8. Periodic pulse wave scanning across globe
 */

const ACCENT   = 0x7fdbff;
const ICE      = 0xb8f2ff;
const GLOBE_R  = 6;

export function initGlobe() {
  const globeGroup = new THREE.Group();
  const isMobile = window.innerWidth < 768;

  // ─── 1. EARTH SPHERE WITH NIGHT TEXTURE ───────────────────────
  const sphereGeo = new THREE.SphereGeometry(GLOBE_R, isMobile ? 32 : 64, isMobile ? 32 : 64);

  // Load NASA-style night earth texture — shows continents via city lights
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = '';

  const earthMat = new THREE.MeshStandardMaterial({
    color: 0x060b14,               // Very dark navy base
    roughness: 1,
    metalness: 0,
    emissive: new THREE.Color(ACCENT),
    emissiveIntensity: 0,          // Start at 0, will increase when texture loads
  });

  const earthMesh = new THREE.Mesh(sphereGeo, earthMat);
  globeGroup.add(earthMesh);

  // Attempt to load earth-night texture for realistic continents
  loader.load(
    'https://unpkg.com/three-globe@2.24.7/example/img/earth-night.jpg',
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      earthMat.emissiveMap = texture;
      earthMat.emissiveIntensity = 1.8;
      earthMat.needsUpdate = true;
    },
    undefined,
    () => {
      // If texture fails, fall back to a subtle glow
      earthMat.emissiveIntensity = 0.15;
    }
  );

  // ─── 2. NETWORK GRID OVERLAY ──────────────────────────────────
  const wireGeo = new THREE.SphereGeometry(GLOBE_R + 0.04, isMobile ? 24 : 36, isMobile ? 24 : 36);
  const wireMat = new THREE.MeshBasicMaterial({
    color: ACCENT,
    wireframe: true,
    transparent: true,
    opacity: 0.07,
  });
  const wireframe = new THREE.Mesh(wireGeo, wireMat);
  globeGroup.add(wireframe);

  // ─── 3. NETWORK NODES (Fibonacci sphere) ──────────────────────
  const NODE_COUNT = isMobile ? 300 : 600;
  const nodePositions = new Float32Array(NODE_COUNT * 3);
  const nodeVectors = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    const phi   = Math.acos(-1 + (2 * i) / NODE_COUNT);
    const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;
    const r     = GLOBE_R + 0.08;

    const x = r * Math.cos(theta) * Math.sin(phi);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(theta) * Math.sin(phi);

    nodePositions[i * 3]     = x;
    nodePositions[i * 3 + 1] = y;
    nodePositions[i * 3 + 2] = z;
    nodeVectors.push(new THREE.Vector3(x, y, z));
  }

  const nodesGeo = new THREE.BufferGeometry();
  nodesGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
  const nodesMat = new THREE.PointsMaterial({
    color: ICE,
    size: 0.08,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const nodesMesh = new THREE.Points(nodesGeo, nodesMat);
  globeGroup.add(nodesMesh);

  // ─── 4. MOVING DATA PACKETS ───────────────────────────────────
  const PACKET_COUNT = isMobile ? 30 : 80;
  const packetGeo = new THREE.BufferGeometry();
  const packetPos = new Float32Array(PACKET_COUNT * 3);
  const packetProgress = new Float32Array(PACKET_COUNT);
  const packetPaths = [];

  for (let i = 0; i < PACKET_COUNT; i++) {
    const a = nodeVectors[Math.floor(Math.random() * NODE_COUNT)];
    const b = nodeVectors[Math.floor(Math.random() * NODE_COUNT)];
    packetPaths.push({ start: a.clone(), end: b.clone(), speed: 0.003 + Math.random() * 0.008 });
    packetProgress[i] = Math.random();
    packetPos[i * 3]     = a.x;
    packetPos[i * 3 + 1] = a.y;
    packetPos[i * 3 + 2] = a.z;
  }

  packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPos, 3));
  const packetMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.14,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const packetMesh = new THREE.Points(packetGeo, packetMat);
  globeGroup.add(packetMesh);

  // ─── 5. ORBITAL RINGS + TRAIL GHOSTS ───────────────────────────
  const ringConfigs = [
    { radius: GLOBE_R + 1.2, tiltX: 0.6, tiltZ: 0.2,  speed: 0.15 },
    { radius: GLOBE_R + 1.8, tiltX: -0.4, tiltZ: 0.8, speed: -0.1 },
    { radius: GLOBE_R + 2.4, tiltX: 0.2, tiltZ: -0.5, speed: 0.08 },
  ];

  const orbitalRings = ringConfigs.map(cfg => {
    const ringGeo = new THREE.TorusGeometry(cfg.radius, 0.012, 8, 180);
    const ringMat = new THREE.MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = cfg.tiltX;
    ring.rotation.z = cfg.tiltZ;
    ring.userData = { speed: cfg.speed };
    globeGroup.add(ring);

    if (!isMobile) {
      // Trail ghost 1 (motion blur)
      const trailGeo1 = new THREE.TorusGeometry(cfg.radius, 0.008, 8, 180);
      const trailMat1 = new THREE.MeshBasicMaterial({
        color: ACCENT, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending,
      });
      const trail1 = new THREE.Mesh(trailGeo1, trailMat1);
      trail1.rotation.x = cfg.tiltX;
      trail1.rotation.z = cfg.tiltZ;
      trail1.userData = { speed: cfg.speed * 0.98 }; // Slightly lagging
      globeGroup.add(trail1);

      // Trail ghost 2 (deeper blur)
      const trailGeo2 = new THREE.TorusGeometry(cfg.radius, 0.006, 8, 180);
      const trailMat2 = new THREE.MeshBasicMaterial({
        color: ACCENT, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending,
      });
      const trail2 = new THREE.Mesh(trailGeo2, trailMat2);
      trail2.rotation.x = cfg.tiltX;
      trail2.rotation.z = cfg.tiltZ;
      trail2.userData = { speed: cfg.speed * 0.95 }; // More lag
      globeGroup.add(trail2);

      return [ring, trail1, trail2];
    }

    return [ring];
  });

  // ─── 6. ATMOSPHERIC GLOW (multi-layer) ────────────────────────
  // Inner atmosphere (tight hug)
  const atmosSegs = isMobile ? 32 : 64;
  const atmosGeo1 = new THREE.SphereGeometry(GLOBE_R + 0.3, atmosSegs, atmosSegs);
  const atmosMat1 = new THREE.MeshBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0.12,
    blending: THREE.AdditiveBlending, side: THREE.BackSide,
  });
  globeGroup.add(new THREE.Mesh(atmosGeo1, atmosMat1));

  // Mid atmosphere (reflection glow)
  const atmosGeo2 = new THREE.SphereGeometry(GLOBE_R + 1.2, atmosSegs, atmosSegs);
  const atmosMat2 = new THREE.MeshBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0.04,
    blending: THREE.AdditiveBlending, side: THREE.BackSide,
  });
  globeGroup.add(new THREE.Mesh(atmosGeo2, atmosMat2));

  // Outer atmosphere (soft fade into space)
  const atmosGeo3 = new THREE.SphereGeometry(GLOBE_R + 2.5, atmosSegs, atmosSegs);
  const atmosMat3 = new THREE.MeshBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0.015,
    blending: THREE.AdditiveBlending, side: THREE.BackSide,
  });
  globeGroup.add(new THREE.Mesh(atmosGeo3, atmosMat3));

  // ─── 7. CINEMATIC BACKLIGHT (300% larger, multi-layer) ────────
  // Primary massive backlight
  const canvas1 = document.createElement('canvas');
  canvas1.width = 512;
  canvas1.height = 512;
  const ctx1 = canvas1.getContext('2d');
  const grad1 = ctx1.createRadialGradient(256, 256, 0, 256, 256, 256);
  grad1.addColorStop(0, 'rgba(127, 219, 255, 0.04)');
  grad1.addColorStop(0.2, 'rgba(127, 219, 255, 0.02)');
  grad1.addColorStop(0.5, 'rgba(127, 219, 255, 0.0075)');
  grad1.addColorStop(0.8, 'rgba(127, 219, 255, 0.002)');
  grad1.addColorStop(1, 'rgba(127, 219, 255, 0)');
  ctx1.fillStyle = grad1;
  ctx1.fillRect(0, 0, 512, 512);

  const spriteTex1 = new THREE.CanvasTexture(canvas1);
  const spriteMat1 = new THREE.SpriteMaterial({
    map: spriteTex1, color: ACCENT, transparent: true, blending: THREE.AdditiveBlending,
  });
  const glowSprite1 = new THREE.Sprite(spriteMat1);
  glowSprite1.scale.set(20, 20, 1);
  glowSprite1.position.set(0, 0, -5);
  globeGroup.add(glowSprite1);

  // Secondary ultra-wide ambient glow (skip on mobile)
  if (!isMobile) {
    const canvas2 = document.createElement('canvas');
    canvas2.width = 256;
    canvas2.height = 256;
    const ctx2 = canvas2.getContext('2d');
    const grad2 = ctx2.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad2.addColorStop(0, 'rgba(127, 219, 255, 0.015)');
    grad2.addColorStop(0.5, 'rgba(127, 219, 255, 0.0035)');
    grad2.addColorStop(1, 'rgba(127, 219, 255, 0)');
    ctx2.fillStyle = grad2;
    ctx2.fillRect(0, 0, 256, 256);

    const spriteTex2 = new THREE.CanvasTexture(canvas2);
    const spriteMat2 = new THREE.SpriteMaterial({
      map: spriteTex2, color: ACCENT, transparent: true, blending: THREE.AdditiveBlending,
    });
    const glowSprite2 = new THREE.Sprite(spriteMat2);
    glowSprite2.scale.set(30, 30, 1);
    glowSprite2.position.set(0, 0, -8);
    globeGroup.add(glowSprite2);

    // ─── GLOBE REFLECTION GLOW (illuminates nearby space below) ──
    const canvas3 = document.createElement('canvas');
    canvas3.width = 256;
    canvas3.height = 256;
    const ctx3 = canvas3.getContext('2d');
    const grad3 = ctx3.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad3.addColorStop(0, 'rgba(127, 219, 255, 0.035)');
    grad3.addColorStop(0.6, 'rgba(127, 219, 255, 0.007)');
    grad3.addColorStop(1, 'rgba(127, 219, 255, 0)');
    ctx3.fillStyle = grad3;
    ctx3.fillRect(0, 0, 256, 256);

    const reflectTex = new THREE.CanvasTexture(canvas3);
    const reflectMat = new THREE.SpriteMaterial({
      map: reflectTex, color: ACCENT, transparent: true, blending: THREE.AdditiveBlending,
    });
    const reflectSprite = new THREE.Sprite(reflectMat);
    reflectSprite.scale.set(14, 7, 1);
    reflectSprite.position.set(0, -6, 0);
    globeGroup.add(reflectSprite);
  }

  // ─── 8. PULSE WAVE (Scan Ring) ────────────────────────────────
  const pulseGeo = new THREE.RingGeometry(GLOBE_R + 0.1, GLOBE_R + 0.2, 64);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: ICE,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
  pulseRing.rotation.x = Math.PI / 2;
  globeGroup.add(pulseRing);

  // ─── LIGHTING ─────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xffffff, 0.15);
  globeGroup.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 3, 5);
  globeGroup.add(dirLight);

  const backLight = new THREE.DirectionalLight(ACCENT, 0.6);
  backLight.position.set(-5, -2, -5);
  globeGroup.add(backLight);

  // ─── UPDATE FUNCTION (called every frame) ─────────────────────
  let pulseTimer = 0;
  const _tempVec = new THREE.Vector3();

  globeGroup.userData.update = (time) => {
    // Pulsing nodes (3-5 second cycle)
    nodesMat.opacity = 0.5 + Math.sin(time * 1.5) * 0.4;
    nodesMat.size    = 0.06 + Math.sin(time * 1.2) * 0.03;

    // Wireframe subtle breathing
    wireMat.opacity = 0.05 + Math.sin(time * 0.8) * 0.03;

    // Rotate wireframe slightly offset from globe
    wireframe.rotation.y = time * 0.03;

    // Orbital rings + trail ghosts
    orbitalRings.forEach(group => {
      group.forEach(ring => {
        ring.rotation.y = time * ring.userData.speed;
      });
    });

    // Moving data packets
    const pAttr = packetMesh.geometry.attributes.position;
    for (let i = 0; i < PACKET_COUNT; i++) {
      packetProgress[i] += packetPaths[i].speed;
      if (packetProgress[i] >= 1) {
        packetProgress[i] = 0;
        packetPaths[i].start = nodeVectors[Math.floor(Math.random() * NODE_COUNT)].clone();
        packetPaths[i].end   = nodeVectors[Math.floor(Math.random() * NODE_COUNT)].clone();
      }

      // Spherical lerp — normalize to sphere surface
      const p = packetProgress[i];
      const pos = _tempVec
        .copy(packetPaths[i].start)
        .lerp(packetPaths[i].end, p)
        .normalize()
        .multiplyScalar(GLOBE_R + 0.12);

      pAttr.array[i * 3]     = pos.x;
      pAttr.array[i * 3 + 1] = pos.y;
      pAttr.array[i * 3 + 2] = pos.z;
    }
    pAttr.needsUpdate = true;

    // Pulse wave — fires every ~8 seconds
    pulseTimer += 0.016; // ~60fps
    if (pulseTimer > 8) {
      pulseRing.position.y -= 0.12;
      pulseMat.opacity = Math.max(0, 0.5 * (1 - Math.abs(pulseRing.position.y) / GLOBE_R));
      if (pulseRing.position.y < -GLOBE_R - 1) {
        pulseTimer = 0;
        pulseRing.position.y = GLOBE_R + 1;
      }
    } else {
      pulseMat.opacity = 0;
      pulseRing.position.y = GLOBE_R + 1;
    }
  };

  return globeGroup;
}
