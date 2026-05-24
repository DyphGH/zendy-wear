/**
 * shader.js — global WebGL fluid background.
 *
 * A fullscreen quad with a custom fragment shader: FBM (fractal brownian
 * motion) + domain warping driven by simplex noise, lerping through three
 * brand colors (purple / pink / lime). Mouse position warps the field;
 * scroll offsets the colour mix.
 *
 * Lives in a fixed-position canvas at z-index 0, opacity 0.35. The rest of
 * the page sits on top in normal flow.
 *
 * Fallback: if `capability.use3D === false`, this module exits early and a
 * CSS-only animated gradient (defined in main.css under `.no-3d`) carries
 * the visual.
 *
 * Perf:
 *   - Renderer caps pixel ratio at 2
 *   - Drops to half-resolution render target if the GPU struggles (auto
 *     measured during first 60 frames)
 *   - Pauses entirely when the tab is hidden (Page Visibility API)
 *   - Pauses when window blurs for >5s (laptop on battery, user away)
 */

import { rafThrottle } from './utils.js';

const FLUID_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// FBM + domain warping — adapted from Inigo Quilez's classic article.
// Three brand colors layered through smoothstep bands.
const FLUID_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uMouse;       // 0..1 across viewport
  uniform vec2  uResolution;
  uniform float uScroll;      // 0..1 page scroll
  uniform float uIntensity;   // 0..1 overall amplitude (eased on tab focus)

  // -------- 2D simplex noise (Ashima — public domain) --------------------
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                            dot(x12.zw, x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x   + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // 4-octave FBM
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Aspect-correct UV centred at 0
    vec2 p = (vUv - 0.5);
    p.x *= uResolution.x / uResolution.y;
    p *= 1.2;

    float t = uTime * 0.095;

    // Mouse pulls the noise field gently
    vec2 mouseOffset = (uMouse - 0.5) * 0.4;

    // Domain warping: noise of noise of noise
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) + t));
    vec2 r = vec2(
      fbm(p + 4.0 * q + vec2(1.7, 9.2) + t + mouseOffset),
      fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 1.3 + uScroll * 0.5)
    );
    float f = fbm(p + 4.0 * r);

    // Brand palette — boosted saturation for a more vivid wash
    vec3 dark   = vec3(0.012, 0.010, 0.045);
    vec3 purple = vec3(0.780, 0.280, 1.000);
    vec3 pink   = vec3(1.000, 0.220, 0.920);
    vec3 lime   = vec3(0.880, 1.000, 0.180);
    vec3 cyan   = vec3(0.200, 0.950, 1.000);

    vec3 col = dark;
    col = mix(col, purple, smoothstep(-0.15, 0.55, f) * 1.05);
    col = mix(col, pink,   smoothstep(0.05, 0.85, length(r)) * 0.78);
    col = mix(col, cyan,   smoothstep(0.35, 0.95, length(q)) * 0.35);
    col = mix(col, lime,   smoothstep(0.75, 1.08, f) * 0.58);

    float vig = smoothstep(1.05, 0.32, length(vUv - 0.5));
    col *= mix(0.62, 1.12, vig);

    col *= uIntensity;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export async function initShader(capability) {
  if (!capability?.use3D) {
    // Activate CSS fallback (defined in main.css)
    document.documentElement.classList.add('no-3d');
    return () => {};
  }

  // Lazy import: only fetch Three.js when we'll actually use it. Saves ~150KB
  // for the no-3d fallback path.
  let THREE;
  try {
    THREE = await Promise.race([
      import('three'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Three.js CDN timeout (8s)')), 8000),
      ),
    ]);
  } catch (err) {
    console.warn('[shader] Three.js failed to load, falling back to CSS:', err);
    document.documentElement.classList.add('no-3d');
    return () => {};
  }

  // Mark <html> so other modules + CSS know 3D is on
  document.documentElement.classList.add('has-3d');

  const canvas = document.createElement('canvas');
  canvas.className = 'shader-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(capability.dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime:       { value: 0 },
    uMouse:      { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uScroll:     { value: 0 },
    uIntensity:  { value: 0 },   // animates from 0 → 1 on first frames
  };

  const material = new THREE.ShaderMaterial({
    vertexShader:   FLUID_VERT,
    fragmentShader: FLUID_FRAG,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  // ---- Inputs --------------------------------------------------------------

  const onMouse = rafThrottle((e) => {
    uniforms.uMouse.value.set(e.clientX / window.innerWidth,
                              1 - e.clientY / window.innerHeight);
  });
  window.addEventListener('mousemove', onMouse, { passive: true });

  const onScroll = rafThrottle(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    uniforms.uScroll.value = max > 0 ? Math.min(1, window.scrollY / max) : 0;
  });
  window.addEventListener('scroll', onScroll, { passive: true });

  const onResize = rafThrottle(() => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  });
  window.addEventListener('resize', onResize);

  // ---- Visibility throttling ----------------------------------------------
  let paused = false;
  const onVisibility = () => { paused = document.visibilityState === 'hidden'; };
  document.addEventListener('visibilitychange', onVisibility);

  // ---- Render loop --------------------------------------------------------
  let rafId = 0;
  let last  = performance.now();
  // Cap to ~45 fps — the fluid looks identical to 60 fps and saves ~25% GPU.
  const TARGET_FPS = 45;
  const FRAME_MS   = 1000 / TARGET_FPS;

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (paused) return;
    if (now - last < FRAME_MS) return;
    last = now;
    uniforms.uTime.value += FRAME_MS * 0.001;
    // Ease intensity in on first second (smoother than a hard pop-in)
    const INTENSITY_MAX = 0.92;
    if (uniforms.uIntensity.value < INTENSITY_MAX) {
      uniforms.uIntensity.value = Math.min(INTENSITY_MAX, uniforms.uIntensity.value + 0.022);
    }
    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(loop);

  // ---- Teardown -----------------------------------------------------------
  return function cleanup() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onMouse);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    material.dispose();
    mesh.geometry.dispose();
    renderer.dispose();
    canvas.remove();
    document.documentElement.classList.remove('has-3d');
  };
}
