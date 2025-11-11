import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ExtrudeGlitchCanvas(props) {
  const {
    bg = "#0b0f14",
    columns = 280,
    worldWidth = 12,
    worldDepth = 4,
    minHeight = 0.2,
    maxHeight = 6.0,
    speed = 0.6,
    glitchIntensity = 0.18,
    quantizeLevels = 24,
    colorHueStart = 0.58,   // 하늘 느낌
    colorHueEnd = 0.08,     // 따뜻한 지면
    ambient = 0.6,
    dirLight = 0.9,
  } = props || {};

  const containerRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 4.5, 10);
    camera.lookAt(0, 2.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, ambient);
    scene.add(ambientLight);
    const d = new THREE.DirectionalLight(0xffffff, dirLight);
    d.position.set(2, 5, 4);
    scene.add(d);

    // 바닥
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(worldWidth, worldDepth),
      new THREE.MeshStandardMaterial({ color: new THREE.Color("#0c1218"), roughness: 0.9, metalness: 0.0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // 인스턴스 박스들: X축으로 슬라이스
    const geom = new THREE.BoxGeometry(1, 1, 0.08);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, metalness: 0.05, envMapIntensity: 0.2 });
    const mesh = new THREE.InstancedMesh(geom, mat, columns);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    const xStart = -worldWidth / 2;
    const dx = worldWidth / columns;

    // 초기 배치
    for (let i = 0; i < columns; i++) {
      const x = xStart + dx * (i + 0.5);
      dummy.position.set(x, minHeight / 2, 0);
      dummy.scale.set(dx * 0.8, minHeight, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.setHSL(0.5, 0.5, 0.6));
    }

    const clock = new THREE.Clock();
    function hNoise(i, t) {
      // 1D layered noise + 글리치 스텝
      const n1 = Math.sin(i * 0.065 + t * speed) * 0.5 + 0.5;
      const n2 = Math.sin(i * 0.021 - t * speed * 0.6) * 0.5 + 0.5;
      const base = 0.55 * n1 + 0.45 * n2;
      // 글리치: 불규칙한 세그먼트 퀀타이즈 + 스파이크
      const levels = Math.max(2, quantizeLevels);
      const quant = Math.floor(base * levels) / (levels - 1);
      const spike = (Math.sin((i * 0.13 + t * 4.0)) > 0.985 ? glitchIntensity * (0.5 + 0.5 * Math.sin(t * 20.0)) : 0.0);
      return THREE.MathUtils.clamp(quant + spike, 0, 1);
    }

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);

    const animate = () => {
      const t = clock.getElapsedTime();
      for (let i = 0; i < columns; i++) {
        const n = hNoise(i, t);
        const h = minHeight + (maxHeight - minHeight) * n;
        dummy.position.set(xStart + dx * (i + 0.5), h / 2, 0);
        // 폭 스퀴시(높아질수록 살짝 얇아짐)
        const squeeze = 1.0 - 0.25 * Math.sin(t * 0.8 + i * 0.07);
        dummy.scale.set(dx * 0.75 * squeeze, h, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        const hue = THREE.MathUtils.lerp(colorHueStart, colorHueEnd, n);
        color.setHSL(hue, 0.55, 0.62);
        mesh.setColorAt(i, color);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      geom.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [bg, columns, worldWidth, worldDepth, minHeight, maxHeight, speed, glitchIntensity, quantizeLevels, colorHueStart, colorHueEnd, ambient, dirLight]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh", overflow: "hidden", background: bg }}
    />
  );
}


