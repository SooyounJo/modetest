'use client';
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function LineExtrudeCityCanvas(props) {
  const {
    bg = "#020408",
    line = "#dfe7f2",
    colsNear = 140,
    colsMid = 96,
    colsFar = 64,
    speedNear = 0.32,
    speedMid = 0.22,
    speedFar = 0.15,
    widthNear = 0.34, // 라인 상대폭(셀 대비)
    widthMid = 0.28,
    widthFar = 0.22,
    overshoot = 0.25,
    squeeze = 0.2,
    contrast = 1.18,
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
      u_line: { value: new THREE.Color(line) },
      u_colsNear: { value: colsNear },
      u_colsMid: { value: colsMid },
      u_colsFar: { value: colsFar },
      u_speedNear: { value: speedNear },
      u_speedMid: { value: speedMid },
      u_speedFar: { value: speedFar },
      u_widthNear: { value: widthNear },
      u_widthMid: { value: widthMid },
      u_widthFar: { value: widthFar },
      u_overshoot: { value: overshoot },
      u_squeeze: { value: squeeze },
      u_contrast: { value: contrast },
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
      uniform vec3 u_bg, u_line;
      uniform float u_colsNear, u_colsMid, u_colsFar;
      uniform float u_speedNear, u_speedMid, u_speedFar;
      uniform float u_widthNear, u_widthMid, u_widthFar;
      uniform float u_overshoot, u_squeeze;
      uniform float u_contrast, u_grain;

      float hash(float n){ return fract(sin(n)*43758.5453123); }
      float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }

      // 단일 레이어: 바닥 고정 세로 라인 익스트루전
      float layerLines(vec2 uv, float cols, float speed, float widthRatio, float seed){
        float x = uv.x * cols;
        float col = floor(x);
        float xf = fract(x) - 0.5;

        // 높이: base + amp*sin + overshoot
        float base = 0.18 + 0.78 * hash(col * 7.1 + seed * 3.0);
        float amp = 0.08 + 0.28 * hash(col * 11.7 + seed * 5.4);
        float phase = hash(col * 13.7 + seed * 9.1) * 6.2831;
        float arg = u_time * speed + phase;
        float s = sin(arg);
        float h = clamp(base + amp * (s + u_overshoot * sin(2.3*arg) * exp(-abs(s)*0.6)), 0.05, 0.99);

        // 라인 폭: 높이 변화 속도에 따라 살짝 스퀴시
        float c = cos(arg);
        float half = 0.5 * widthRatio * (1.0 - u_squeeze * c);
        float edge = half - abs(xf);
        float bodyX = smoothstep(0.0, 0.02, edge);

        // 바닥 고정: uv.y <= h
        float bodyY = smoothstep(0.0, 0.008, h - uv.y);

        // 3D 느낌: 라인 중앙 하이라이트 + 가장자리 음영
        float highlight = exp(-pow(xf / (half + 1e-4), 2.0) * 6.0);
        float shade = 0.75 + 0.25 * highlight;

        return bodyX * bodyY * shade;
      }

      void main(){
        vec2 uv = vUv;
        // 약간의 퍼스펙티브 스큐
        uv.x += (uv.y - 0.5) * 0.06;

        float nearL = layerLines(uv, u_colsNear, u_speedNear, u_widthNear, 1.0);
        float midL  = layerLines(uv, u_colsMid,  u_speedMid,  u_widthMid,  2.0);
        float farL  = layerLines(uv, u_colsFar,  u_speedFar,  u_widthFar,  3.0);

        float lights = nearL * 1.2 + midL * 0.8 + farL * 0.55;
        lights = pow(clamp(lights, 0.0, 1.0), u_contrast);

        float g = (hash2(uv * (u_resolution.xy + u_time)) - 0.5) * u_grain;
        vec3 col = mix(u_bg, u_line, lights) + g;
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
  }, [bg, line, colsNear, colsMid, colsFar, speedNear, speedMid, speedFar, widthNear, widthMid, widthFar, overshoot, squeeze, contrast, grain]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh", overflow: "hidden", background: bg }}
    />
  );
}


