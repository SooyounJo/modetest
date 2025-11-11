'use client';
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function BlurryCityCanvas(props) {
  const {
    fg = "#ffffff",
    bg = "#000000",
    colsNear = 120,
    colsMid = 80,
    colsFar = 48,
    speedNear = 0.22,
    speedMid = 0.16,
    speedFar = 0.1,
    blurNear = 2.6,
    blurMid = 3.6,
    blurFar = 5.0,
    baseMin = 0.25,
    baseMax = 0.92,
    ampMin = 0.08,
    ampMax = 0.34,
    squeeze = 0.18,   // 높아질 때 가늘어지는 정도
    overshoot = 0.28, // 오버슈트
    contrast = 1.2,
    grain = 0.03,
    exposure = 1.7,
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
      u_blurNear: { value: blurNear },
      u_blurMid: { value: blurMid },
      u_blurFar: { value: blurFar },
      u_baseMin: { value: baseMin },
      u_baseMax: { value: baseMax },
      u_ampMin: { value: ampMin },
      u_ampMax: { value: ampMax },
      u_squeeze: { value: squeeze },
      u_overshoot: { value: overshoot },
      u_contrast: { value: contrast },
      u_grain: { value: grain },
      u_exposure: { value: exposure },
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
      uniform float u_colsNear, u_colsMid, u_colsFar;
      uniform float u_speedNear, u_speedMid, u_speedFar;
      uniform float u_blurNear, u_blurMid, u_blurFar;
      uniform float u_baseMin, u_baseMax, u_ampMin, u_ampMax;
      uniform float u_squeeze, u_overshoot;
      uniform float u_contrast, u_grain;
      uniform float u_exposure;

      float hash(float n){ return fract(sin(n)*43758.5453123); }
      float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }

      // single skyline coverage without blur for a given column grid
      float skyline(vec2 uv, float cols, float speed, float seed){
        float x = uv.x * cols;
        float col = floor(x);
        float xf = fract(x) - 0.5;

        float r1 = hash(col * 13.17 + seed * 19.73);
        float r2 = hash(col * 31.7 + seed * 7.1);
        float baseH = mix(u_baseMin, u_baseMax, r1);
        float amp = mix(u_ampMin, u_ampMax, r2);
        float phase = hash(col * 17.7 + seed * 9.1) * 6.2831;
        float arg = u_time * speed + phase;
        float s = sin(arg);
        float h = baseH + amp * (s + u_overshoot * sin(2.3*arg) * exp(-abs(s)*0.55));
        h = clamp(h, 0.04, 0.99);

        // squash & stretch on width
        float half = 0.5 * (1.0 - 0.65 * u_squeeze * cos(arg));
        float edge = half - abs(xf);
        float bodyX = smoothstep(0.0, 0.02, edge);

        float top = h - uv.y;
        float bodyY = smoothstep(0.0, 0.015, top);

        // subtle inner shading
        float shade = 0.65 + 0.35 * smoothstep(0.0, 1.0, uv.y / max(h, 1e-4));
        return bodyX * bodyY * shade;
      }

      float skylineBlur(vec2 uv, float cols, float speed, float blur, float seed){
        float px = 1.0 / u_resolution.y;
        float r = blur * px;
        // 7-tap vertical blur
        float w0 = 0.28;
        float w1 = 0.22;
        float w2 = 0.12;
        float acc = 0.0;
        acc += w2 * skyline(vec2(uv.x, uv.y - 4.0*r), cols, speed, seed);
        acc += w1 * skyline(vec2(uv.x, uv.y - 2.0*r), cols, speed, seed);
        acc += w0 * skyline(vec2(uv.x, uv.y - 1.0*r), cols, speed, seed);
        acc += 0.34 * skyline(uv, cols, speed, seed);
        acc += w0 * skyline(vec2(uv.x, uv.y + 1.0*r), cols, speed, seed);
        acc += w1 * skyline(vec2(uv.x, uv.y + 2.0*r), cols, speed, seed);
        acc += w2 * skyline(vec2(uv.x, uv.y + 4.0*r), cols, speed, seed);
        return acc;
      }

      void main(){
        vec2 uv = vUv;

        float nearL = skylineBlur(uv, u_colsNear, u_speedNear, u_blurNear, 1.0);
        float midL  = skylineBlur(uv, u_colsMid,  u_speedMid,  u_blurMid,  2.0);
        float farL  = skylineBlur(uv, u_colsFar,  u_speedFar,  u_blurFar,  3.0);

        // parallax weighting and soft clamp
        float lights = nearL * 1.15 + midL * 0.8 + farL * 0.55;
        // add tiny base gradient to avoid total black
        lights += smoothstep(0.0, 0.6, uv.y) * 0.02;
        lights = 1.0 - exp(-u_exposure * max(lights, 0.0));
        lights = pow(clamp(lights, 0.0, 1.0), u_contrast);

        // film grain-esque noise
        float g = (hash2(uv * (u_resolution.xy + u_time)) - 0.5) * u_grain;

        vec3 col = mix(u_bg, u_fg, lights) + g;
        gl_FragColor = vec4(col, 1.0);
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
  }, [fg, bg, colsNear, colsMid, colsFar, speedNear, speedMid, speedFar, blurNear, blurMid, blurFar, baseMin, baseMax, ampMin, ampMax, squeeze, overshoot, contrast, grain]);

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


