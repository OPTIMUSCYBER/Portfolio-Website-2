import * as THREE from 'three';

/**
 * DESIGN 01 FINAL — Multi-Layer Space Environment
 *
 * Layer 1: Background dust (tiny, distant, slow)
 * Layer 2: Midground dust (slightly larger, random drift)
 * Layer 3: Foreground dust (occasional brighter particles, parallax)
 * Layer 4: Nebula haze (dark navy/blue-black soft clouds)
 */

function createNebulaTexture(color1, color2) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Soft radial cloud
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.4, color2);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Add subtle noise for organic feel
  const imageData = ctx.getImageData(0, 0, 256, 256);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    imageData.data[i]     = Math.max(0, Math.min(255, imageData.data[i] + noise));
    imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + noise));
    imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  return new THREE.CanvasTexture(canvas);
}

export function initParticles() {
  const isMobile = window.innerWidth < 768;

  // ─── LAYER 1: BACKGROUND STARS (distant, tiny, slow) ───────
  const bgGroup = new THREE.Group();
  const bgCount = isMobile ? 1000 : 3000;
  const bgGeo = new THREE.BufferGeometry();
  const bgPos = new Float32Array(bgCount * 3);

  for (let i = 0; i < bgCount; i++) {
    bgPos[i * 3]     = (Math.random() - 0.5) * 150;
    bgPos[i * 3 + 1] = (Math.random() - 0.5) * 150;
    bgPos[i * 3 + 2] = (Math.random() - 0.5) * 150;
  }
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  const bgMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.04,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
  });
  bgGroup.add(new THREE.Points(bgGeo, bgMat));

  // ─── LAYER 2: MIDGROUND DUST (ice-blue, random drift) ──────
  const midGroup = new THREE.Group();
  const midCount = isMobile ? 200 : 800;
  const midGeo = new THREE.BufferGeometry();
  const midPos = new Float32Array(midCount * 3);

  for (let i = 0; i < midCount; i++) {
    midPos[i * 3]     = (Math.random() - 0.5) * 100;
    midPos[i * 3 + 1] = (Math.random() - 0.5) * 100;
    midPos[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }
  midGeo.setAttribute('position', new THREE.BufferAttribute(midPos, 3));
  const midMat = new THREE.PointsMaterial({
    color: 0x7fdbff,
    size: 0.12,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  midGroup.add(new THREE.Points(midGeo, midMat));

  // ─── LAYER 3: SUBTLE DATA POINTS (tiny, faint, parallax) ────
  const fgGroup = new THREE.Group();
  const fgCount = isMobile ? 40 : 100;
  const fgGeo = new THREE.BufferGeometry();
  const fgPos = new Float32Array(fgCount * 3);

  for (let i = 0; i < fgCount; i++) {
    fgPos[i * 3]     = (Math.random() - 0.5) * 80;
    fgPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
    fgPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
  }
  fgGeo.setAttribute('position', new THREE.BufferAttribute(fgPos, 3));
  const fgMat = new THREE.PointsMaterial({
    color: 0xb8f2ff,
    size: 0.04,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  fgGroup.add(new THREE.Points(fgGeo, fgMat));

  // ─── LAYER 4: NEBULA HAZE (dark navy/blue-black clouds) ────
  const nebulaGroup = new THREE.Group();
  if (!isMobile) {
    const nebulaConfigs = [
      { x:  8,  y:  2,  z: -15, scale: 28, color1: 'rgba(6,11,20,0.12)',  color2: 'rgba(3,8,16,0.04)' },
      { x: -6,  y: -4,  z: -20, scale: 35, color1: 'rgba(10,22,40,0.10)', color2: 'rgba(4,10,20,0.03)' },
      { x:  3,  y:  6,  z: -18, scale: 22, color1: 'rgba(6,11,20,0.08)',  color2: 'rgba(2,5,12,0.02)' },
      { x: -10, y:  0,  z: -25, scale: 40, color1: 'rgba(8,16,30,0.09)',  color2: 'rgba(3,8,16,0.03)' },
      { x:  12, y: -5,  z: -22, scale: 30, color1: 'rgba(5,10,18,0.10)',  color2: 'rgba(2,6,14,0.03)' },
    ];

    nebulaConfigs.forEach(cfg => {
      const tex = createNebulaTexture(cfg.color1, cfg.color2);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(cfg.x, cfg.y, cfg.z);
      sprite.scale.set(cfg.scale, cfg.scale, 1);
      nebulaGroup.add(sprite);
    });
  }

  return { bgGroup, midGroup, fgGroup, nebulaGroup };
}
