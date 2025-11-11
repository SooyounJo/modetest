import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function MonoClusterCityCanvas(props) {
  const {
    bg = "#000000",
    fg = "#ffffff",
    cols = 110,
    rows = 90,
    heightSmooth = 0.28,
    heightJitter = 0.12,
    baseMin = 0.25,
    baseMax = 0.92,
    margin = 0.18,        // 창문 테두리 마진(0~0.45)
    fillTop = 0.35,       // 상단부 점등 확률
    fillBottom = 0.95,    // 하단부 점등 확률
    clusterRadius = 0.48, // 중앙 하단 원형 클러스터 반경
    clusterPower = 2.2,   // 중심 강화 정도
    contrast = 1.22,
    grain = 0.03,
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
      u_fillTop: { value: fillTop },
      u_fillBottom: { value: fillBottom },
      u_clusterRadius: { value: clusterRadius },
      u_clusterPower: { value: clusterPower },
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
      uniform float u_fillTop, u_fillBottom;
      uniform float u_clusterRadius, u_clusterPower;
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

      void main(){
        vec2 uv = vUv;

        // column-based tower heights
        float x = uv.x * u_cols;
        float col = floor(x);
        float hBase = mix(u_baseMin, u_baseMax, pow(snoise1(col * u_heightSmooth + 8.3), 1.2));
        float h = clamp(hBase + (snoise1(col * 0.71) - 0.5) * u_heightJitter, 0.05, 0.99);

        // circular cluster emphasis near bottom center
        vec2 center = vec2(0.5, 0.32);
        float d = distance(uv, center) / u_clusterRadius;
        float cluster = pow(clamp(1.0 - d, 0.0, 1.0), u_clusterPower);

        // grid snap to windows
        vec2 grid = vec2(u_cols, u_rows);
        vec2 cell = floor(uv * grid);
        vec2 f = fract(uv * grid);
        float rim = step(u_margin, f.x) * step(u_margin, f.y) *
                    step(u_margin, 1.0 - f.x) * step(u_margin, 1.0 - f.y);

        // below the tower height?
        float below = step(uv.y, h);

        // occupancy probability blends from top to bottom + cluster boost at bottom center
        float yRatio = clamp(uv.y / max(h, 1e-4), 0.0, 1.0);
        float fill = mix(u_fillBottom, u_fillTop, yRatio);
        fill = clamp(fill + 0.5 * cluster * (1.0 - yRatio), 0.0, 1.0);

        // randomize per-cell
        float r = hash(dot(cell, vec2(37.1, 91.7)));
        float on = step(1.0 - fill, r);

        float lights = rim * below * on;
        lights = pow(lights, u_contrast);

        // slight falloff at far left/right
        float edge = smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x);
        lights *= edge;

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
  }, [bg, fg, cols, rows, heightSmooth, heightJitter, baseMin, baseMax, margin, fillTop, fillBottom, clusterRadius, clusterPower, contrast, grain]);

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


