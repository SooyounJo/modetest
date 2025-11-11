import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function CityBarsCanvas(props) {
  const {
    fg = "#d8dee3",
    bg = "#0b0f12",
    colsNear = 60,
    colsMid = 42,
    colsFar = 28,
    speedNear = 0.5,   // 높이 변화 속도(근)
    speedMid = 0.35,
    speedFar = 0.25,
    rows = 64,         // 수직 박스 기본 분해능
    gapX = 0.04,       // 열 사이 여백(0~0.5)
    gapY = 0.08,       // 행/그룹 사이 여백(0~0.5)
    segMin = 6,        // 한 박스가 차지하는 최소 행 수
    segMax = 14,       // 한 박스가 차지하는 최대 행 수
    grain = 0.05,
    contrast = 1.15,
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
      u_fg: { value: new THREE.Color(fg) },
      u_bg: { value: new THREE.Color(bg) },
      u_colsNear: { value: colsNear },
      u_colsMid: { value: colsMid },
      u_colsFar: { value: colsFar },
      u_speedNear: { value: speedNear },
      u_speedMid: { value: speedMid },
      u_speedFar: { value: speedFar },
      u_rows: { value: rows },
      u_gapX: { value: gapX },
      u_gapY: { value: gapY },
      u_segMin: { value: segMin },
      u_segMax: { value: segMax },
      u_grain: { value: grain },
      u_contrast: { value: contrast },
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec3 u_fg;
      uniform vec3 u_bg;
      uniform float u_colsNear;
      uniform float u_colsMid;
      uniform float u_colsFar;
      uniform float u_speedNear;
      uniform float u_speedMid;
      uniform float u_speedFar;
      uniform float u_rows;
      uniform float u_gapX;
      uniform float u_gapY;
      uniform float u_segMin;
      uniform float u_segMax;
      uniform float u_grain;
      uniform float u_contrast;

      float hash(float n){ return fract(sin(n)*43758.5453123); }
      float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }

      // one parallax layer: contiguous box stacks per column with vertical breathing
      float layer(vec2 uv, float cols, float rows, float speed, float t, float seed){
        float x = uv.x * cols;
        float colIdx = floor(x);
        float xf = fract(x);

        // horizontal box body with small gap to avoid pure lines
        float bodyX = step(u_gapX, xf) * step(u_gapX, 1.0 - xf);
        bodyX = smoothstep(0.0, 0.02, bodyX);

        // per-column timing and height
        float phase = hash(colIdx * 17.7 + seed * 9.1) * 6.2831;
        float sp = speed * mix(0.7, 1.3, hash(colIdx * 23.1 + seed * 4.6));
        float base = mix(0.2, 0.95, hash(colIdx * 7.1 + seed * 3.2));  // base height ratio
        float amp = mix(0.08, 0.25, hash(colIdx * 5.3 + seed * 8.9));  // breathing amplitude
        float h = clamp(base + amp * sin(t * sp + phase), 0.05, 0.98);

        // vertical segmentation into LONG boxes: group multiple rows per box
        float yCells = rows;
        float segLen = floor(mix(u_segMin, u_segMax, hash(colIdx * 41.3 + seed * 2.1))); // rows per box
        segLen = max(segLen, 1.0);
        float yIdx = floor(uv.y * yCells);
        float yTop = floor(h * yCells);
        float yBelow = step(yIdx + 0.5, yTop + 0.5);
        float yInSeg = fract((uv.y * yCells) / segLen);
        float bodyY = step(u_gapY, yInSeg) * step(u_gapY, 1.0 - yInSeg);
        bodyY = smoothstep(0.0, 0.02, bodyY);

        // some long boxes toggle on/off (per segment) to mimic lights
        float segId = floor(yIdx / segLen);
        float tick = floor(t * mix(0.8, 2.0, hash(colIdx * 2.7 + seed*1.9)));
        float flick = step(0.45, hash(segId + colIdx * 31.7 + seed*11.0 + tick * 13.7));

        return bodyX * bodyY * yBelow * flick;
      }

      void main(){
        vec2 uv = vUv;

        float t = u_time;

        float lFar = layer(uv, u_colsFar, u_rows*0.8, u_speedFar, t, 1.0);
        float lMid = layer(uv, u_colsMid, u_rows, u_speedMid, t, 2.0);
        float lNear = layer(uv, u_colsNear, u_rows*1.2, u_speedNear, t, 3.0);

        float lights = lFar * 0.6 + lMid * 0.9 + lNear * 1.2;
        lights = clamp(lights, 0.0, 1.0);

        // contrast and subtle fog vignette
        float vign = smoothstep(1.15, 0.35, distance(uv, vec2(0.5)));
        lights = pow(lights * vign, u_contrast);

        // film grain
        float g = (hash2(uv * (u_resolution.xy + t)) - 0.5) * u_grain;

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
  }, [fg, bg, colsNear, colsMid, colsFar, speedNear, speedMid, speedFar, rows, gapX, gapY, grain, contrast]);

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


