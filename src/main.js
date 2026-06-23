import * as THREE from 'three';
import { gsap } from 'gsap';
import { initGlobe } from './globe.js';
import { initParticles } from './particles.js';

/* ============================================
   DESIGN 01 FINAL — Main Application
   ============================================ */

// ─── SCENE SETUP ────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const scene     = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// ─── INIT 3D ELEMENTS ──────────────────────────────────────────
const globeGroup = initGlobe();
const { bgGroup, midGroup, fgGroup, nebulaGroup } = initParticles();

// Position globe to the right half
globeGroup.position.x = 4.5;
globeGroup.position.y = 0;

scene.add(globeGroup);

// Add particle layers in depth order (back to front)
scene.add(bgGroup);      // Layer 1: distant stars
scene.add(nebulaGroup);  // Layer 4: nebula haze (behind midground)
scene.add(midGroup);     // Layer 2: midground dust
scene.add(fgGroup);      // Layer 3: foreground particles

// ─── MOUSE PARALLAX ────────────────────────────────────────────
let mouseX = 0;
let mouseY = 0;
const halfW = window.innerWidth / 2;
const halfH = window.innerHeight / 2;

document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX - halfW) / halfW;   // -1 to 1
  mouseY = (e.clientY - halfH) / halfH;   // -1 to 1
}, { passive: true });

// Smoothed values per layer
let smoothGlobeX = 0, smoothGlobeY = 0;
let smoothBgX = 0,    smoothBgY = 0;
let smoothMidX = 0,   smoothMidY = 0;
let smoothFgX = 0,    smoothFgY = 0;

// ─── RESIZE ─────────────────────────────────────────────────────
let resizeRAF;
window.addEventListener('resize', () => {
  if (resizeRAF) cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (window.innerWidth < 768) {
      globeGroup.position.x = 0;
      globeGroup.position.y = 0;
      globeGroup.scale.setScalar(0.55);
    } else {
      globeGroup.position.x = 4.5;
      globeGroup.position.y = 0;
      globeGroup.scale.setScalar(1);
    }
  });
});

if (window.innerWidth < 768) {
  globeGroup.position.x = 0;
  globeGroup.position.y = 0;
  globeGroup.scale.setScalar(0.55);
}

// ─── ANIMATION LOOP ────────────────────────────────────────────
const clock = new THREE.Clock();
let animationId;

function animate() {
  animationId = requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  // ── Parallax: each layer has independent smoothing + multiplier ──
  const globeMultiplier = 0.4;
  const bgMultiplier    = 0.06;  // Very slow — deepest layer
  const midMultiplier   = 0.12;  // Moderate
  const fgMultiplier    = 0.25;  // Closest — most movement
  const smoothFactor    = 0.025; // Smooth interpolation speed

  smoothGlobeX += (mouseX * globeMultiplier - smoothGlobeX) * smoothFactor;
  smoothGlobeY += (mouseY * globeMultiplier - smoothGlobeY) * smoothFactor;
  smoothBgX    += (mouseX * bgMultiplier    - smoothBgX)    * smoothFactor;
  smoothBgY    += (mouseY * bgMultiplier    - smoothBgY)    * smoothFactor;
  smoothMidX   += (mouseX * midMultiplier   - smoothMidX)   * smoothFactor;
  smoothMidY   += (mouseY * midMultiplier   - smoothMidY)   * smoothFactor;
  smoothFgX    += (mouseX * fgMultiplier    - smoothFgX)    * smoothFactor;
  smoothFgY    += (mouseY * fgMultiplier    - smoothFgY)    * smoothFactor;

  // Globe: 75-second rotation cycle + parallax
  globeGroup.rotation.y = elapsed * 0.084 + smoothGlobeX * 0.3;
  globeGroup.rotation.x = smoothGlobeY * 0.15;

  // Background stars: ultra-slow drift
  bgGroup.rotation.y = elapsed * 0.002 + smoothBgX;
  bgGroup.rotation.x = smoothBgY * 0.5;

  // Nebula: tied to background but with very subtle sway
  nebulaGroup.rotation.y = elapsed * 0.001 + smoothBgX * 0.5;
  nebulaGroup.rotation.x = smoothBgY * 0.3;

  // Midground dust: moderate drift
  midGroup.rotation.y = elapsed * 0.004 + smoothMidX;
  midGroup.rotation.x = smoothMidY * 0.6;

  // Foreground particles: most responsive
  fgGroup.rotation.y = elapsed * 0.006 + smoothFgX;
  fgGroup.rotation.x = smoothFgY * 0.8;

  // Update dynamic globe elements
  if (globeGroup.userData.update) {
    globeGroup.userData.update(elapsed);
  }

  renderer.render(scene, camera);
}

animate();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
  } else {
    clock.start();
    animate();
  }
});

// ─── GSAP ENTRANCE ANIMATIONS ──────────────────────────────────
const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

tl.from('.sidebar', {
  x: -240,
  opacity: 0,
  duration: 1.2,
}, 0);

tl.from('.hero-title', {
  opacity: 0,
  y: 40,
  duration: 1.4,
}, 0.2);

tl.from('.hero-subtitle .line', {
  opacity: 0,
  y: 20,
  duration: 1.2,
  stagger: 0.15,
}, 0.5);

tl.from('.hero-description', {
  opacity: 0,
  x: -20,
  duration: 1.2,
}, 0.8);

tl.from('.hero-buttons .btn', {
  opacity: 0,
  y: 15,
  duration: 1,
  stagger: 0.15,
}, 1.0);



tl.from('.glass-card', {
  opacity: 0,
  scale: 0.85,
  y: 25,
  duration: 1.3,
  stagger: 0.18,
}, 1.5);

gsap.to('.card-1', { y: '-=12', duration: 3.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
gsap.to('.card-2', { y: '+=14', duration: 4.0, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5 });
gsap.to('.card-3', { y: '-=16', duration: 3.8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.0 });
gsap.to('.card-4', { y: '+=10', duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.3 });

// ─── SCROLL REVEAL (Skills Cards) ──────────────────────────────
const revealCards = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Stagger based on card index
      const cards = [...revealCards];
      const index = cards.indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('revealed');
      }, index * 150); // 150ms stagger
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealCards.forEach(card => revealObserver.observe(card));

// ─── CYBER INTELLIGENCE CORE SIMULATOR ─────────────────────────
const satNodes = [
  document.querySelector('.js-node-cyber'),
  document.querySelector('.js-node-python'),
  document.querySelector('.js-node-ai'),
  document.querySelector('.js-node-ops')
].filter(Boolean);

if (satNodes.length > 0) {
  // Stagger node highlights randomly every 4 seconds
  setInterval(() => {
    satNodes.forEach(n => n.classList.remove('node-highlight'));
    const randomIdx = Math.floor(Math.random() * satNodes.length);
    satNodes[randomIdx].classList.add('node-highlight');
  }, 4000);
}

// ─── LIVE PROJECTS SIMULATORS ANIMATIONS ───────────────────────

// 1. Vulnerability Scanner (CVE Counter)
const cveEl = document.querySelector('.js-cve-count');
if (cveEl) {
  let count = 0;
  setInterval(() => {
    count += Math.floor(Math.random() * 3) + 1;
    if (count > 185) {
      count = 0;
    }
    cveEl.textContent = count;
  }, 1000);
}

// 2. Port Scanner Terminal Scrolling Logs
const terminalBody = document.querySelector('.js-terminal-body');
if (terminalBody) {
  const ports = [
    { port: '21/tcp', status: 'CLOSED', desc: 'FTP' },
    { port: '22/tcp', status: 'OPEN', desc: 'SSH_v2.0' },
    { port: '25/tcp', status: 'CLOSED', desc: 'SMTP' },
    { port: '80/tcp', status: 'OPEN', desc: 'Nginx v1.18.0' },
    { port: '110/tcp', status: 'CLOSED', desc: 'POP3' },
    { port: '143/tcp', status: 'CLOSED', desc: 'IMAP' },
    { port: '443/tcp', status: 'OPEN', desc: 'TLSv1.3' },
    { port: '3306/tcp', status: 'OPEN', desc: 'MySQL v8.0.25' },
    { port: '8080/tcp', status: 'CLOSED', desc: 'HTTP_Alt' }
  ];
  
  let lineIdx = 0;
  setInterval(() => {
    const item = ports[lineIdx % ports.length];
    const statusClass = item.status === 'OPEN' ? 'color-green' : 'color-red';
    const p = document.createElement('p');
    p.className = 'term-line';
    p.innerHTML = `PORT ${item.port} <span class="${statusClass}">${item.status}</span> [${item.desc}]`;
    
    terminalBody.appendChild(p);
    lineIdx++;
    
    while (terminalBody.children.length > 5) {
      terminalBody.removeChild(terminalBody.firstChild);
    }
  }, 1800);
}

// 3. HealthX Telemetry Fluctuations
const hrEl = document.querySelector('.js-heart-rate');
const spo2El = document.querySelector('.js-spo2');
if (hrEl && spo2El) {
  setInterval(() => {
    const currentHR = Math.floor(Math.random() * 7) + 69;
    hrEl.textContent = currentHR;
    
    const currentSpO2 = Math.floor(Math.random() * 2) + 98;
    spo2El.textContent = currentSpO2;
  }, 2200);
}

// 4. AI Automation Nodes Cycle
const nodes = document.querySelectorAll('.sim-aiautomation .node');
const agentLogEl = document.querySelector('.js-agent-log');
if (nodes.length > 0) {
  let activeNodeIdx = 1;
  const logs = [
    "Sys: Pipeline trigger detected [WebHook].",
    "Agent: Evaluating prompts & routing models.",
    "Action: Pipeline output dispatched successfully."
  ];
  
  setInterval(() => {
    nodes.forEach(n => n.classList.remove('active'));
    activeNodeIdx = (activeNodeIdx + 1) % nodes.length;
    nodes[activeNodeIdx].classList.add('active');
    
    if (agentLogEl) {
      agentLogEl.textContent = logs[activeNodeIdx];
    }
  }, 3000);
}

// ─── MOBILE MENU TOGGLE ──────────────────────────────────────────
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');
const navLinksAnchors = document.querySelectorAll('.nav-links a');

if (mobileMenuToggle && sidebar) {
  mobileMenuToggle.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    sidebar.classList.toggle('active');
  });

  navLinksAnchors.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuToggle.classList.remove('active');
      sidebar.classList.remove('active');
    });
  });
}

// ─── PROJECT MODAL ────────────────────────────────────────────────
const projectData = [
  {
    category: 'Cybersecurity',
    title: 'Advanced Website Vulnerability Scanner',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    desc: 'Advanced vulnerability scanner capable of identifying technologies, security weaknesses, CVE references, and generating comprehensive assessment reports. Built with a dark GUI interface for professional security assessments.',
    features: ['CVE Integration', 'Technology Detection', 'Security Assessment', 'Risk Analysis', 'Report Exporting', 'Dark GUI Interface'],
    timeline: [
      { label: 'Research', state: 'done' },
      { label: 'Development', state: 'done' },
      { label: 'Testing', state: 'done' },
      { label: 'Deployment', state: 'active' },
    ],
    tags: ['Python', 'Tkinter', 'CVE APIs', 'Security Analysis'],
  },
  {
    category: 'Network Security',
    title: 'Advanced Port Scanner',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    desc: 'Multi-threaded network reconnaissance tool designed for service discovery, port enumeration, and infrastructure visibility. Features real-time terminal output and a clean GUI for professional network analysis.',
    features: ['Port Enumeration', 'Service Detection', 'Network Analysis', 'Multi-threading', 'GUI Interface'],
    timeline: [
      { label: 'Research', state: 'done' },
      { label: 'Development', state: 'done' },
      { label: 'Testing', state: 'done' },
      { label: 'Deployment', state: 'active' },
    ],
    tags: ['Python', 'Sockets', 'Tkinter', 'Networking'],
  },
  {
    category: 'AI Platform',
    title: 'HealthX',
    status: 'IN DEVELOPMENT',
    statusClass: 'status-indevelopment',
    desc: 'AI-powered healthcare ecosystem integrating wearable monitoring, symptom analysis, telemedicine, health analytics, and secure medical records. Designed to bridge the gap between technology and patient care.',
    features: ['AI Symptom Checker', 'Telemedicine', 'Smart Device Integration', 'Medical Records Vault', 'Health Analytics'],
    timeline: [
      { label: 'Research', state: 'done' },
      { label: 'Development', state: 'active' },
      { label: 'Testing', state: '' },
      { label: 'Deployment', state: '' },
    ],
    tags: ['AI', 'Python', 'Healthcare', 'Web Technologies'],
  },
  {
    category: 'Automation',
    title: 'AI Automation Systems',
    status: 'ACTIVE',
    statusClass: 'status-active',
    desc: 'Collection of intelligent workflow automation systems, AI agents, productivity solutions, and operational optimization tools. Built to eliminate repetitive manual processes and scale operations intelligently.',
    features: ['Workflow Automation', 'Agent Systems', 'Prompt Engineering', 'AI Integrations', 'Productivity Automation'],
    timeline: [
      { label: 'Research', state: 'done' },
      { label: 'Development', state: 'done' },
      { label: 'Testing', state: 'done' },
      { label: 'Deployment', state: 'active' },
    ],
    tags: ['Python', 'AI APIs', 'Automation', 'LLMs'],
  },
  {
    category: 'Cybersecurity / AI',
    title: 'Neural Sentinel',
    status: 'IN DEVELOPMENT',
    statusClass: 'status-indevelopment',
    desc: 'AI-based Intrusion Detection & Prevention System (IDPS) using Autoencoder, 1D-CNN, and GAN models to detect and classify cyber threats in real-time. Features live packet capture and analysis for automated response and alert mitigation.',
    features: ['Autoencoder Threat Detection', '1D-CNN Threat Classification', 'GAN Traffic Simulation', 'Live Packet Capture', 'Packet Blocking', 'Real-Time Alerting'],
    timeline: [
      { label: 'Research', state: 'done' },
      { label: 'Development', state: 'active' },
      { label: 'Testing', state: '' },
      { label: 'Deployment', state: '' },
    ],
    tags: ['Python', 'Scapy', 'TensorFlow', 'PyTorch', 'FastAPI', 'Docker'],
  },
  {
    category: 'AI / NLP',
    title: 'AI Chatbot',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    desc: 'Speech-enabled conversational assistant utilizing state-of-the-art NLP models. Integrates real-time speech recognition and text-to-speech for interactive, voice-based dialog flow.',
    features: ['Speech Recognition', 'Real-Time NLP', 'Context-Aware Flow', 'Voice Response'],
    timeline: [
      { label: 'Research', state: 'done' },
      { label: 'Development', state: 'done' },
      { label: 'Testing', state: 'done' },
      { label: 'Deployment', state: 'active' },
    ],
    tags: ['Python', 'NLP', 'Speech Recognition'],
  },
  {
    category: 'Data Analysis',
    title: 'Diversity Gap Analysis',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    desc: 'Analytical review of corporate hiring datasets to uncover diversity gaps across roles, departments, and seniority levels. Translates statistics into actionable visual dashboards.',
    features: ['Hiring Trend Analysis', 'Representation Metrics', 'Data Visualization', 'Statistical Analysis'],
    timeline: [
      { label: 'Research', state: 'done' },
      { label: 'Development', state: 'done' },
      { label: 'Testing', state: 'done' },
      { label: 'Deployment', state: 'active' },
    ],
    tags: ['Python', 'Pandas', 'Data Visualization', 'Stats'],
  },
  {
    category: 'Machine Learning',
    title: 'Product Recall Prediction',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    desc: 'Predictive classification model designed to identify high-risk products using historical e-commerce logs and product quality assurance datasets.',
    features: ['Risk Recall Prediction', 'Feature Engineering', 'Classification Modeling', 'Quality Metric Tracking'],
    timeline: [
      { label: 'Research', state: 'done' },
      { label: 'Development', state: 'done' },
      { label: 'Testing', state: 'done' },
      { label: 'Deployment', state: 'active' },
    ],
    tags: ['Python', 'Scikit-Learn', 'Pandas', 'ML Models'],
  },
  {
    category: 'Data Analytics',
    title: 'DestinationInsight',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    desc: 'Data-driven travel analytics project designed to surface trends, seasonal shifts, and visitor preferences. Uses advanced processing to guide destination recommendations.',
    features: ['Travel Trend Analytics', 'Preference Modeling', 'Data Visualization', 'Analytics Reports'],
    timeline: [
      { label: 'Research', state: 'done' },
      { label: 'Development', state: 'done' },
      { label: 'Testing', state: 'done' },
      { label: 'Deployment', state: 'active' },
    ],
    tags: ['Python', 'Data Analysis', 'Data Visualization'],
  },
  {
    category: 'Data Analysis',
    title: 'Real Estate Pricing Shifts',
    status: 'OPERATIONAL',
    statusClass: 'status-operational',
    desc: 'Market trend study evaluating real estate valuation shifts pre- and post-pandemic. Integrates regional data aggregation and visualizations to highlight macroeconomic movement.',
    features: ['Pricing Pattern Identification', 'Pre/Post Pandemic Compare', 'Regional Trend Analysis', 'Visual Data Maps'],
    timeline: [
      { label: 'Research', state: 'done' },
      { label: 'Development', state: 'done' },
      { label: 'Testing', state: 'done' },
      { label: 'Deployment', state: 'active' },
    ],
    tags: ['Python', 'Pandas', 'Data Visualization', 'Statistical Analysis'],
  },
];

const overlay = document.getElementById('projModalOverlay');
const modalContent = document.getElementById('projModalContent');
const closeBtn = document.getElementById('projModalClose');

function openModal(idx) {
  const p = projectData[idx];
  modalContent.innerHTML = `
    <span class="modal-label">${p.category}</span>
    <h2 class="modal-title">${p.title}</h2>
    <div class="modal-status-row">
      <span class="proj-status ${p.statusClass}"><span class="status-indicator"></span>${p.status}</span>
    </div>
    <p class="modal-desc">${p.desc}</p>
    <span class="modal-section-title">Feature Highlights</span>
    <div class="modal-features">
      ${p.features.map(f => `<span class="modal-feature-chip">${f}</span>`).join('')}
    </div>
    <span class="modal-section-title">Development Timeline</span>
    <div class="modal-timeline">
      ${p.timeline.map(t => `<div class="modal-step ${t.state === 'done' ? 'done' : t.state === 'active' ? 'active' : ''}">${t.label}</div>`).join('')}
    </div>
    <span class="modal-section-title">Tech Stack</span>
    <div class="modal-tags">
      ${p.tags.map(t => `<span class="tech-tag">${t}</span>`).join('')}
    </div>
  `;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.proj-details-btn').forEach(btn => {
  btn.addEventListener('click', () => openModal(+btn.dataset.project));
});

if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ─── ASYNC CONTACT FORM TRANSMISSION ─────────────────────────────
function sanitizeInput(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let lastSubmitTime = 0;
const SUBMIT_COOLDOWN = 10000; // 10 second cooldown

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const now = Date.now();
    const statusEl = document.getElementById('formStatus');
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#febc2e';
        statusEl.textContent = '>> COOLDOWN ACTIVE. PLEASE WAIT BEFORE RETRANSMITTING.';
      }
      return;
    }

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    const submitBtn = contactForm.querySelector('.console-submit-btn');

    if (!email) {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#ff5f57';
        statusEl.textContent = '>> ERROR: EMAIL ADDRESS IS COMPULSORY FOR TRANSMISSION.';
      }
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#ff5f57';
        statusEl.textContent = '>> ERROR: INVALID EMAIL FORMAT DETECTED.';
      }
      return;
    }

    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--accent-blue)';
      statusEl.textContent = '>> TRANSMITTING ENCRYPTED PAYLOAD...';
    }
    if (submitBtn) submitBtn.disabled = true;

    lastSubmitTime = Date.now();

    fetch('https://formsubmit.co/ajax/822005harsh@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: sanitizeInput(name),
        email: email,
        message: sanitizeInput(message)
      })
    })
    .then(res => res.json())
    .then(data => {
      if (statusEl) {
        statusEl.style.color = '#28c840';
        statusEl.textContent = '>> TRANSMISSION DELIVERED SUCCESSFULLY. SECURE CONNECT ESTABLISHED.';
      }
      contactForm.reset();
      if (submitBtn) submitBtn.disabled = false;
    })
    .catch(err => {
      console.error(err);
      if (statusEl) {
        statusEl.style.color = '#ff5f57';
        statusEl.textContent = '>> TRANSMISSION FAILURE. ROUTING FAULT DETECTED. TRY AGAIN OR USE SECURE EMAIL LINK.';
      }
      if (submitBtn) submitBtn.disabled = false;
    });
  });
}

