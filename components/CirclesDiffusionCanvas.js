import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function CirclesDiffusionCanvas(props) {
  const {
    bg = "#070b12",
    cols = 48,
    rows = 48,
    radius = 0.42,      // 기본 반지름(셀 대비)
    softness = 0.08,    // 가장자리 소프트
    diffusionSpeed = 0.9,
    verticalWave = 1.2,
    hueA = 0.58,        // 상단 하늘 톤
    hueB = 0.04,        // 하단 따뜻한 톤
    sat = 0.75,
    lightA = 0.65,
    lightB = 0.55,
    contrast = 1.12,
    exposure = 1.4,
    grain = 0.02,
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
      u_cols: { value: cols },
      u_rows: { value: rows },
      u_radius: { value: radius },
      u_soft: { value: softness },
      u_speed: { value: diffusionSpeed },
      u_vwave: { value: verticalWave },
      u_hueA: { value: hueA },
      u_hueB: { value: hueB },
      u_sat: { value: sat },
      u_lightA: { value: lightA },
      u_lightB: { value: lightB },
      u_contrast: { value: contrast },
      u_exposure: { value: exposure },
      u_bg: { value: new THREE.Color(bg) },
      u_grain: { value: grain },
    };

    const vertexShader = `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_cols, u_rows, u_radius, u_soft, u_speed, u_vwave;
      uniform float u_hueA, u_hueB, u_sat, u_lightA, u_lightB;
      uniform float u_contrast, u_exposure, u_grain;
      uniform vec3 u_bg;

      float hash(float n){ return fract(sin(n)*43758.5453123); }
      float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }

      vec3 hsl2rgb(vec3 hsl){
        vec3 rgb = clamp( abs(mod(hsl.x*6.0+vec3(0,4,2),6.0)-3.0)-1.0, 0.0, 1.0 );
        return hsl.z + hsl.y*(rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
      }

      void main(){
        vec2 uv = vUv;
        // grid
        vec2 grid = vec2(u_cols, u_rows);
        vec2 gid = floor(uv * grid);
        vec2 f = fract(uv * grid) - 0.5;

        // city-like luminance by vertical wave + cell noise
        float ny = gid.y / max(1.0, (grid.y-1.0));
        float l = 0.55 + 0.45 * smoothstep(0.0, 1.0, ny);
        l *= 0.7 + 0.3 * sin(u_time * u_speed + ny * 6.2831 * u_vwave + gid.x * 0.03);

        // color gradient from A(top) to B(bottom)
        float h = mix(u_hueA, u_hueB, ny);
        float lt = mix(u_lightA, u_lightB, ny);
        vec3 base = hsl2rgb(vec3(h, u_sat, lt));

        // circle with soft edge; radius animated by diffusion
        float r = u_radius * (0.9 + 0.2 * sin(u_time * u_speed + ny*7.0 + gid.x*0.15));
        float d = length(f);
        float circle = smoothstep(r, r - u_soft, 0.5 - d);

        float lights = circle * l;
        lights = 1.0 - exp(-u_exposure * max(lights, 0.0));
        lights = pow(clamp(lights, 0.0, 1.0), u_contrast);

        float g = (hash2(uv * (u_resolution.xy + u_time)) - 0.5) * u_grain;
        vec3 col = mix(u_bg, base, lights) + vec3(g);
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms, vertexShader, fragmentShader
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
  }, [bg, cols, rows, radius, softness, diffusionSpeed, verticalWave, hueA, hueB, sat, lightA, lightB, contrast, exposure, grain]);

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


