import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function FallingParticlesCityCanvas(props) {
  const {
    bg = "#030507",
    fg = "#e8f0ff",
    cols = 110,
    rows = 80,
    heightSmooth = 0.28,
    heightJitter = 0.12,
    baseMin = 0.25,
    baseMax = 0.92,
    margin = 0.18,
    windowFill = 0.6,
    growSpeed = 0.9,   // 바닥 기준 성장 속도
    contrast = 1.18,
    grain = 0.0,
  } = props || {};

  const containerRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_bg: { value: new THREE.Color(bg) },
      u_fg: { value: new THREE.Color(fg) },
      u_cols: { value: cols },
      u_rows: { value: rows },
      u_heightSmooth: { value: heightSmooth },
      u_heightJitter: { value: heightJitter },
      u_baseMin: { value: baseMin },
      u_baseMax: { value: baseMax },
      u_margin: { value: margin },
      u_windowFill: { value: windowFill },
      u_growSpeed: { value: growSpeed },
      u_contrast: { value: contrast },
      u_grain: { value: grain },
    };

    const vertexShader = `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec3 u_bg, u_fg;
      uniform float u_cols, u_rows;
      uniform float u_heightSmooth, u_heightJitter;
      uniform float u_baseMin, u_baseMax;
      uniform float u_margin;
      uniform float u_windowFill;
      uniform float u_growSpeed;
      uniform float u_contrast, u_grain;

      float hash(float n){ return fract(sin(n)*43758.5453123); }
      float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }

      float snoise1(float x){
        float i = floor(x);
        float f = fract(x);
        float a = hash(i);
        float b = hash(i + 1.0);
        float u = f*f*(3.0-2.0*f);
        return mix(a, b, u);
      }

      float skylineMask(vec2 uv){
        float x = uv.x * u_cols;
        float col = floor(x);
        float hBase = mix(u_baseMin, u_baseMax, pow(snoise1(col * u_heightSmooth + 8.3), 1.2));
        float h = clamp(hBase + (snoise1(col * 0.71) - 0.5) * u_heightJitter, 0.05, 0.99);
        return step(uv.y, h);
      }

      float windows(vec2 uv){
        vec2 grid = vec2(u_cols, u_rows);
        vec2 cell = floor(uv * grid);
        vec2 f = fract(uv * grid);
        float rim = step(u_margin, f.x) * step(u_margin, f.y) *
                    step(u_margin, 1.0 - f.x) * step(u_margin, 1.0 - f.y);
        float r = hash(dot(cell, vec2(37.1, 91.7)));
        float on = step(1.0 - u_windowFill, r);
        return rim * on;
      }

      // analytic particle trail
      // particle field 제거(사용 안 함)
      float particleField(vec2 uv){ return 0.0; }

      void main(){
        vec2 uv = vUv;
        float city = skylineMask(uv);

        // 바닥 기준 성장 계수: 열마다 위상이 다른 sin으로 0..1 사이 왕복
        float x = uv.x * u_cols;
        float col = floor(x);
        float phase = hash(col * 13.7 + 5.1) * 6.2831;
        float m = 0.5 + 0.5 * sin(u_time * u_growSpeed + phase);

        // 성장된 높이 마스크
        // skylineMask에서의 높이 h와 동일식을 재사용하기 위해 근사: city==1이면 uv.y<h
        // 여기서는 city보다 더 낮은 영역만 보이도록 스케일
        float growMask = step(uv.y, m); // 바닥 기준 0..1
        float win = windows(uv) * city * growMask;

        float particles = particleField(uv);
        float lights = win + particles * 0.0;
        lights = pow(clamp(lights, 0.0, 1.0), u_contrast);

        float g = (hash2(uv * (u_resolution.xy + u_time)) - 0.5) * u_grain;
        vec3 color = mix(u_bg, u_fg, lights) + g;
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.u_resolution.value.set(w, h);
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    const animate = () => {
      uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [bg, fg, cols, rows, heightSmooth, heightJitter, baseMin, baseMax, margin, windowFill, growSpeed, contrast, grain]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: bg,
      }}
    />
  );
}


