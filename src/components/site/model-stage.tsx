'use client';

import { useEffect, useRef, useState } from 'react';

// Model 3D (glTF) di hero dengan three.js biasa, tanpa React Three Fiber.
// - three.js baru diunduh saat browser senggang (requestIdleCallback), jadi
//   tidak menghambat teks hero yang jadi LCP.
// - Render berhenti saat model di luar layar atau tab disembunyikan.
// - prefers-reduced-motion: tanpa putaran otomatis, render hanya saat digeser.
// - Di layar sentuh, geser vertikal tetap untuk scroll halaman (touch-action: pan-y).
// File model dioptimasi dulu (meshopt + WebP), lihat README bagian "Model 3D".
// `rotationY`: putaran awal (radian) supaya sisi depan model menghadap kamera.
export function ModelStage({ src, label, rotationY = 0 }: { src: string; label: string; rotationY?: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    async function start(el: HTMLDivElement) {
      // Tanpa WebGL: berhenti sebelum mengunduh three.js (dan tanpa error di console).
      const probe = document.createElement('canvas');
      if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('WebGL tidak tersedia');
      const [THREE, { GLTFLoader }, { MeshoptDecoder }, { OrbitControls }] = await Promise.all([
        import('three'),
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/libs/meshopt_decoder.module.js'),
        import('three/examples/jsm/controls/OrbitControls.js'),
      ]);
      if (cancelled) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      const canvas = renderer.domElement;
      canvas.style.opacity = '0';
      canvas.style.transition = 'opacity 0.6s ease';
      el.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e1d8, 2.2));
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(2.5, 4, 3);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.8);
      fill.position.set(-3, 1.5, -2);
      scene.add(fill);

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.loadAsync(src);
      if (cancelled) {
        renderer.dispose();
        canvas.remove();
        return;
      }

      // Pusatkan model dan atur jarak kamera supaya seluruh model terlihat.
      const model = gltf.scene;
      const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
      model.position.sub(sphere.center);
      const pivot = new THREE.Group();
      pivot.rotation.y = rotationY;
      pivot.add(model);
      scene.add(pivot);
      const distance = sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.position.set(0, sphere.radius * 0.3, distance * 0.92);
      camera.lookAt(0, 0, 0);

      const controls = new OrbitControls(camera, canvas);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = !reduceMotion;
      controls.autoRotate = !reduceMotion;
      controls.autoRotateSpeed = 1.4;
      controls.minPolarAngle = Math.PI * 0.32;
      controls.maxPolarAngle = Math.PI * 0.58;
      canvas.style.touchAction = 'pan-y';

      const render = () => renderer.render(scene, camera);
      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        render();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      // Animasi hanya berjalan saat terlihat; tanpa animasi (reduced motion)
      // cukup render ulang ketika model digeser.
      let visible = true;
      const tick = () => {
        controls.update();
        render();
      };
      const sync = () => renderer.setAnimationLoop(!reduceMotion && visible && !document.hidden ? tick : null);
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        sync();
      });
      io.observe(el);
      document.addEventListener('visibilitychange', sync);
      if (reduceMotion) controls.addEventListener('change', render);
      sync();
      canvas.style.opacity = '1';
      setState('ready');

      teardown = () => {
        renderer.setAnimationLoop(null);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener('visibilitychange', sync);
        controls.dispose();
        model.traverse((obj) => {
          const mesh = obj as InstanceType<typeof THREE.Mesh>;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
            material.dispose();
          }
        });
        renderer.dispose();
        canvas.remove();
      };
    }

    const run = () => {
      start(host).catch(() => {
        if (!cancelled) setState('error');
      });
    };
    const useIdle = typeof window.requestIdleCallback === 'function';
    const handle = useIdle ? window.requestIdleCallback(run, { timeout: 1500 }) : window.setTimeout(run, 300);

    return () => {
      cancelled = true;
      if (useIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      teardown?.();
    };
  }, [src, rotationY]);

  // WebGL tidak tersedia / gagal dimuat: area dikosongkan, tidak mengganggu halaman.
  if (state === 'error') return null;

  return (
    <div className="relative w-full">
      {/* Bayangan lembut di bawah model (satu-satunya bayangan produk, DESIGN.md). */}
      <div aria-hidden className="absolute inset-x-[30%] bottom-[15%] h-[4%] rounded-[50%] bg-black/15 blur-xl" />
      <div
        ref={hostRef}
        role="img"
        aria-label={label}
        className="relative aspect-square w-full cursor-grab active:cursor-grabbing [&>canvas]:block [&>canvas]:size-full"
      >
        {state === 'loading' && (
          <span aria-hidden className="absolute inset-0 m-auto size-9 animate-spin rounded-full border-2 border-black/10 border-t-accent motion-reduce:animate-none" />
        )}
      </div>
    </div>
  );
}
