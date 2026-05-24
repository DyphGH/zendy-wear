/**
 * hero-blob.js — interactive 3D blob behind the hero text.
 *
 * IcosahedronGeometry at high subdivision (smooth surface), with a custom
 * vertex shader that displaces each vertex along its normal by simplex 3D
 * noise (time- and mouse-driven). Fragment shader is an emissive gradient
 * through purple → pink → lime. Bloom (UnrealBloomPass) gives the neon halo.
 *
 * Mounts into <div class="hero-canvas"> already present in HTML.
 *
 * Capability gates:
 *   - `capability.use3D === false`  → exits early, CSS orbs stay
 *   - `capability.useBloom === false` → skips the bloom pass (still rotates)
 *   - IntersectionObserver pauses rendering when hero is offscreen
 */

import { rafThrottle, prefersReducedMotion } from './utils.js';

const BLOB_VERT = /* glsl */ `
  uniform float uTime;
  uniform vec2  uMouse;       // -0.5..0.5
  uniform float uMouseStrength;

  varying vec3  vNormal;
  varying float vDisplacement;
  varying vec3  vViewPosition;

  // -------- 3D simplex noise (Stefan Gustavson — public domain) ----------
  vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Multi-octave displacement — two noise scales blended for organic look
    float n1 = snoise(position * 1.8 + uTime * 0.18);
    float n2 = snoise(position * 4.5 + uTime * 0.30) * 0.45;
    float displacement = (n1 + n2) * 0.35;

    // Pull blob slightly toward mouse for interactivity
    vec3 mouseVec = vec3(uMouse * 0.7, 0.0);
    float toMouse = dot(normalize(position), normalize(mouseVec + vec3(0.001)));
    displacement += smoothstep(0.5, 1.0, toMouse) * uMouseStrength * 0.18;

    vec3 displaced = position + normal * displacement;

    vDisplacement = displacement;
    vNormal       = normalize(normalMatrix * normal);
    vec4 mv       = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mv.xyz;
    gl_Position   = projectionMatrix * mv;
  }
`;

const BLOB_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec3  vNormal;
  varying float vDisplacement;
  varying vec3  vViewPosition;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);

    // Fresnel for rim glow
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.0);

    // Brand palette ramp driven by displacement + time
    vec3 c1 = vec3(0.780, 0.280, 1.000); // purple
    vec3 c2 = vec3(1.000, 0.220, 0.920); // pink
    vec3 c3 = vec3(0.880, 1.000, 0.180); // lime

    float t = vDisplacement + 0.5 + sin(uTime * 0.5) * 0.1;
    vec3 col = mix(c1, c2, smoothstep(0.0, 0.7, t));
    col = mix(col, c3, smoothstep(0.6, 1.0, t) * 0.6);

    // Soft rim — kept low so bloom does not wash out the hero
    col += fres * vec3(1.0, 0.35, 0.75) * 0.35;

    col *= 1.05;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export async function initHeroBlob(capability) {
  if (!capability?.use3D) return () => {};

  const mount = document.querySelector('.hero-canvas');
  if (!mount) return () => {};

  let THREE, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
  const cdnTimeout = (p, ms = 8000) =>
    Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Three.js CDN timeout')), ms)),
    ]);

  try {
    THREE = await cdnTimeout(import('three'));
    if (capability.useBloom) {
      ({ EffectComposer }   = await cdnTimeout(import('three/addons/postprocessing/EffectComposer.js')));
      ({ RenderPass }       = await cdnTimeout(import('three/addons/postprocessing/RenderPass.js')));
      ({ UnrealBloomPass }  = await cdnTimeout(import('three/addons/postprocessing/UnrealBloomPass.js')));
      ({ OutputPass }       = await cdnTimeout(import('three/addons/postprocessing/OutputPass.js')));
    }
  } catch (err) {
    console.warn('[hero-blob] Three.js failed to load, keeping CSS orbs:', err);
    return () => {};
  }

  // Hide the CSS orbs now that the real blob is on
  document.documentElement.classList.add('has-hero-blob');

  // ---- Scene / camera / renderer ------------------------------------------
  const w = mount.clientWidth  || window.innerWidth;
  const h = mount.clientHeight || window.innerHeight;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.z = 3.4;  // pull back — smaller blob, less screen fill

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(capability.dpr);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  // ---- Geometry + material ------------------------------------------------
  const geometry = new THREE.IcosahedronGeometry(1, 32); // smooth surface
  const uniforms = {
    uTime:           { value: 0 },
    uMouse:          { value: new THREE.Vector2(0, 0) },
    uMouseStrength:  { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader:   BLOB_VERT,
    fragmentShader: BLOB_FRAG,
    uniforms,
    transparent: false,
  });
  const blob = new THREE.Mesh(geometry, material);
  scene.add(blob);

  // ---- Post-processing (optional) -----------------------------------------
  let composer = null;
  if (capability.useBloom && EffectComposer && UnrealBloomPass) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.42,  // strength — subtle halo only
      0.38,  // radius
      0.72,  // threshold — only bright rim blooms
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // ---- Input ---------------------------------------------------------------
  const mouse = { x: 0, y: 0, target: { x: 0, y: 0 } };
  const onMouse = rafThrottle((e) => {
    const rect = mount.getBoundingClientRect();
    mouse.target.x = ((e.clientX - rect.left) / rect.width  - 0.5);
    mouse.target.y = -((e.clientY - rect.top)  / rect.height - 0.5);
  });
  window.addEventListener('mousemove', onMouse, { passive: true });

  const onResize = rafThrottle(() => {
    const nw = mount.clientWidth, nh = mount.clientHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh, false);
    composer?.setSize(nw, nh);
  });
  window.addEventListener('resize', onResize);

  // ---- Render only when visible -------------------------------------------
  let visible = true;
  const io = new IntersectionObserver(
    (entries) => { visible = entries[0]?.isIntersecting ?? true; },
    { threshold: 0 },
  );
  io.observe(mount);

  let paused = false;
  const onVis = () => { paused = document.visibilityState === 'hidden'; };
  document.addEventListener('visibilitychange', onVis);

  // ---- Loop ----------------------------------------------------------------
  let rafId = 0;
  const reduce = prefersReducedMotion();
  // Slow auto-rotate is the only motion under reduced-motion (still animates
  // displacement field, but at half rate — keeps the brand without strobing).
  const SPEED = reduce ? 0.4 : 1.0;

  function tick() {
    rafId = requestAnimationFrame(tick);
    if (paused || !visible) return;

    // Ease mouse toward target — gives the blob its lag/follow feel
    mouse.x += (mouse.target.x - mouse.x) * 0.06;
    mouse.y += (mouse.target.y - mouse.y) * 0.06;

    uniforms.uTime.value += 0.016 * SPEED;
    uniforms.uMouse.value.set(mouse.x, mouse.y);
    uniforms.uMouseStrength.value = Math.min(
      1,
      Math.hypot(mouse.target.x, mouse.target.y) * 2,
    );

    blob.rotation.y += 0.0040 * SPEED;
    blob.rotation.x += 0.0022 * SPEED;

    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(tick);

  // ---- Teardown ------------------------------------------------------------
  return function cleanup() {
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onMouse);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
    io.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    document.documentElement.classList.remove('has-hero-blob');
  };
}
