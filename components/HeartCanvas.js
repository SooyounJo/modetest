import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeartCanvas(props) {
  const {
    colorA = "#ff2d55",
    colorB = "#ff8a00",
    bgGradient = "radial-gradient(1200px 600px at 50% 30%, rgba(255, 56, 96, 0.08), rgba(10,10,10,1) 60%)",
    heartbeatSpeed = 2.2,
    rippleStrength = 0.15,
    grainAmount = 0.06,
  } = props || {};
  const containerRef = useRef(null);
  const rafRef = useRef(0);
  const rendererRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const mouse = new THREE.Vector2(0.5, 0.5);
    const uniforms = {
      u_time: { value: 0 },
      u_mouse: { value: mouse.clone() },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_colorA: { value: new THREE.Color(colorA) },
      u_colorB: { value: new THREE.Color(colorB) },
      u_beatSpeed: { value: heartbeatSpeed },
      u_rippleStrength: { value: rippleStrength },
      u_grainAmount: { value: grainAmount },
    };

    const vertexShader = `
      varying vec2 vUv;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_beatSpeed;
      uniform float u_rippleStrength;
      
      void main() {
        vUv = uv;
        vec3 transformed = position;
        // subtle heartbeat displacement
        float beat = 0.08 * (0.5 + 0.5 * sin(u_time * u_beatSpeed));
        transformed.xy *= 1.0 + beat;
        // ripple influenced by UV and time
        transformed.z += u_rippleStrength * sin(10.0 * vUv.y + u_time * 3.0) * (0.5 + 0.5 * sin(u_time));
        // mouse hover breathing near cursor in UV space
        float d = distance(vUv, u_mouse);
        transformed.z += 0.15 * smoothstep(0.35, 0.0, d);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      uniform float u_time;
      uniform vec3 u_colorA;
      uniform vec3 u_colorB;
      uniform vec2 u_mouse;
      uniform float u_beatSpeed;
      uniform float u_grainAmount;

      // simple film grain
      float hash(vec2 p){ 
        p = fract(p*vec2(123.34, 345.45));
        p += dot(p, p+34.345);
        return fract(p.x*p.y);
      }

      void main() {
        float pulse = 0.5 + 0.5 * sin(u_time * u_beatSpeed);
        vec3 base = mix(u_colorA, u_colorB, vUv.y * (0.6 + 0.4 * pulse));
        float vignette = smoothstep(0.95, 0.35, distance(vUv, vec2(0.5)));
        float hover = 1.0 - smoothstep(0.0, 0.3, distance(vUv, u_mouse));
        float grain = (hash(vUv + u_time) - 0.5) * u_grainAmount;
        vec3 color = base * (0.6 + 0.4 * vignette + 0.25 * hover) + grain;
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Create 2D heart shape using parametric curve
    function createHeartShape() {
      const shape = new THREE.Shape();
      const points = [];
      const steps = 400;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2.0;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y =
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t);
        points.push(new THREE.Vector2(x, y));
      }
      // scale down to reasonable size
      const scale = 0.06;
      points.forEach((p) => {
        p.x *= scale;
        p.y *= scale;
      });
      shape.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].y);
      }
      shape.closePath();
      return shape;
    }

    const heartShape = createHeartShape();
    const geometry = new THREE.ShapeGeometry(heartShape, 256);
    geometry.center();

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: false,
    });

    const heartMesh = new THREE.Mesh(geometry, material);
    scene.add(heartMesh);

    // subtle lighting on top of shader for depth cues
    const light = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(light);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(2, 3, 5);
    scene.add(dir);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      uniforms.u_resolution.value.set(w, h);
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouse.set(x, 1.0 - y); // flip Y for UV space
      uniforms.u_mouse.value.copy(mouse);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove);

    const clock = new THREE.Clock();
    const animate = () => {
      uniforms.u_time.value = clock.getElapsedTime();
      heartMesh.rotation.y = Math.sin(uniforms.u_time.value * 0.5) * 0.1;
      heartMesh.rotation.x = Math.cos(uniforms.u_time.value * 0.5) * 0.05;
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      scene.clear();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        background: bgGradient,
      }}
    />
  );
}


