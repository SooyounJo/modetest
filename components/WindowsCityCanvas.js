import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function WindowsCityCanvas(props) {
  const {
    bg = "#05070a",
    palette = ["#d9f0ff", "#a5e5ff", "#ffd27f", "#ffb347", "#ff8fa3", "#b2ff9e"],
    cols = 90,
    rows = 60,
    towerJitter = 0.18,
    towerSmooth = 0.35,
    windowFill = 0.55,
    flickerRate = 1.4,
    vignette = 0.55,
    contrast = 1.2,
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

    const pal = new Float32Array(
      palette.flatMap((hex) => {
        const c = new THREE.Color(hex);
        return [c.r, c.g, c.b];
      })
    );

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_bg: { value: new THREE.Color(bg) },
      u_cols: { value: cols },
      u_rows: { value: rows },
      u_towerJitter: { value: towerJitter },
      u_towerSmooth: { value: towerSmooth },
      u_windowFill: { value: windowFill },
      u_flickerRate: { value: flickerRate },
      u_vignette: { value: vignette },
      u_contrast: { value: contrast },
      u_grain: { value: grain },
      u_pal: { value: pal },
      u_palCount: { value: palette.length },
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
      uniform vec3 u_bg;
      uniform float u_cols, u_rows;
      uniform float u_towerJitter, u_towerSmooth;
      uniform float u_windowFill, u_flickerRate;
      uniform float u_vignette, u_contrast, u_grain;
      uniform float u_palCount;
      uniform float u_pal[48]; // up to 16 colors * 3 (fits common palettes)

      float hash(float n){ return fract(sin(n)*43758.5453123); }
      float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }

      vec3 palColor(float idx){
        int i = int(mod(idx, u_palCount));
        int j = i * 3;
        return vec3(u_pal[j], u_pal[j+1], u_pal[j+2]);
      }

      // smooth 1D noise from grid
      float snoise1(float x){
        float i = floor(x);
        float f = fract(x);
        float a = hash(i);
        float b = hash(i + 1.0);
        float u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u);
      }

      void main(){
        vec2 uv = vUv;
        float aspect = u_resolution.x / max(1.0, u_resolution.y);

        // city mask via tower heights (smoothed random per column)
        float x = uv.x * u_cols;
        float col = floor(x);
        float xf = fract(x);

        float jitter = u_towerJitter * (snoise1(col * 0.63) - 0.5);
        float baseHeight = 0.15 + 0.75 * snoise1(col * u_towerSmooth + 17.3);
        float height = clamp(baseHeight + jitter, 0.05, 0.98);
        float tower = step(uv.y, height);

        // window grid snap
        vec2 grid = vec2(u_cols, u_rows);
        vec2 cell = floor(uv * grid);
        vec2 f = fract(uv * grid);
        float margin = 0.18;
        float win = step(margin, f.x) * step(margin, f.y) *
                    step(margin, 1.0 - f.x) * step(margin, 1.0 - f.y);

        // per-cell flicker + occupancy
        float tick = floor(u_time * u_flickerRate);
        float r = hash(dot(cell, vec2(37.1, 91.7)) + tick * 13.7);
        float on = step(1.0 - u_windowFill, r);

        // color from palette index
        float palIdx = floor(mod(cell.x + 3.0 * cell.y, u_palCount));
        vec3 c = palColor(palIdx);

        float lights = win * on * tower;

        // vignette and contrast
        float vig = smoothstep(1.25, u_vignette, distance(uv, vec2(0.5)));
        lights *= vig;
        lights = pow(lights, u_contrast);

        float g = (hash2(uv * (u_resolution.xy + u_time)) - 0.5) * u_grain;
        vec3 color = mix(u_bg, c, lights) + g;
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
  }, [bg, palette, cols, rows, towerJitter, towerSmooth, windowFill, flickerRate, vignette, contrast, grain]);

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


