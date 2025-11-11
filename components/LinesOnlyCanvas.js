'use client';
import { useEffect, useRef } from "react";

export default function LinesOnlyCanvas(props) {
  const {
    topColor = "#eef1f4",
    midColor = "#cfd8e1",
    bottomColor = "#0f1a27",
    groundColor = "#0f1a27",
    lineColor = "#e7eef7",
    widthPxPerCluster = 10,   // 클러스터 간격(px)
    linesPerClusterMin = 2,
    linesPerClusterMax = 4,
    lineWidth = 1,
    groundBase = 0.62,        // 바닥 비율(캔버스 높이 대비)
    groundAmplitude = 0.14,   // 바닥 실루엣 변동
    lineHeightMin = 0.08,     // 바닥 위로 최소 라인 높이 비율
    lineHeightMax = 0.35,     // 바닥 위로 최대 라인 높이 비율
    seed = 7,
    // 움직임 제어
    motionSpeed = 1.0,        // 초당 회전수(대략)
    motionAmplitude = 0.45,   // 각 클러스터 기본높이 대비 진폭 비율(0~1)
  } = props || {};

  const canvasRef = useRef(null);
  const layoutRef = useRef(null); // 클러스터/위상/기본높이 레이아웃

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const buildLayout = () => {
      const { clientWidth, clientHeight } = canvas.parentElement || canvas;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      canvas.style.width = clientWidth + "px";
      canvas.style.height = clientHeight + "px";

      const w = canvas.width;
      const h = canvas.height;

      // 클러스터 메타데이터 생성
      const clusters = [];
      for (let x = 0; x < w; x += widthPxPerCluster * dpr) {
        clusters.push({ cx: x });
      }
      // 각 클러스터 구성 (라인 수, 라인 위치, 기본높이, 위상)
      const rand = (n) => {
        const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
        return x - Math.floor(x);
      };
      const cntRange = linesPerClusterMax - linesPerClusterMin + 1;
      for (let k = 0; k < clusters.length; k++) {
        const cx = clusters[k].cx;
        const cnt =
          linesPerClusterMin + Math.floor(rand(cx) * Math.max(1, cntRange));
        const localStep =
          (widthPxPerCluster * 0.45 * dpr) / Math.max(1, cnt - 1);
        const startX = cx - ((cnt - 1) * localStep) / 2;
        const lineXs = [];
        for (let i = 0; i < cnt; i++) lineXs.push(startX + i * localStep);

        const baseH =
          h *
          (lineHeightMin +
            (lineHeightMax - lineHeightMin) * rand(cx + seed * 113.1));
        const phase = rand(cx + seed * 917.3) * Math.PI * 2;

        clusters[k] = { cx, lineXs, baseH, phase };
      }

      layoutRef.current = { w, h, dpr, clusters };
    };

    // simple pseudo-noise
    const rand = (n) => {
      const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    const noise1D = (x) => {
      // multi-sine noise
      return (
        0.55 * Math.sin(x * 0.004 + seed) +
        0.3 * Math.sin(x * 0.009 + seed * 1.7) +
        0.15 * Math.sin(x * 0.016 - seed * 0.8)
      );
    };

    const draw = (tSec) => {
      if (!layoutRef.current) return;
      const { w, h, clusters } = layoutRef.current;
      ctx.clearRect(0, 0, w, h);

      // background gradient (top→bottom)
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, topColor);
      g.addColorStop(0.5, midColor);
      g.addColorStop(1, bottomColor);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // ground silhouette
      const groundPath = new Path2D();
      groundPath.moveTo(0, h);
      for (let x = 0; x <= w; x += 3) {
        const n = noise1D(x);
        const gy =
          h *
          (groundBase +
            groundAmplitude * ((n + 1) * 0.5)); // map noise -1..1 -> 0..1
        groundPath.lineTo(x, gy);
      }
      groundPath.lineTo(w, h);
      groundPath.closePath();
      ctx.fillStyle = groundColor;
      ctx.fill(groundPath);

      // draw vertical line clusters
      ctx.lineWidth = lineWidth * dpr;
      ctx.strokeStyle = lineColor;

      // 애니메이션 각속도(라디안/초)
      const omega = Math.PI * 2 * Math.max(0, motionSpeed);

      for (let k = 0; k < clusters.length; k++) {
        const { cx, lineXs, baseH, phase } = clusters[k];
        // ground y at cluster center
        const n = noise1D(cx);
        const gy =
          h *
          (groundBase +
            groundAmplitude * ((n + 1) * 0.5));

        // 클러스터 전체가 동일한 높이로 상하 진동 (라인박스 느낌)
        const ampPx = baseH * Math.max(0, Math.min(1, motionAmplitude));
        const osc = Math.sin(phase + omega * tSec);
        const curH = Math.max(2, baseH + ampPx * osc);

        for (let i = 0; i < lineXs.length; i++) {
          const xx = lineXs[i];
          ctx.beginPath();
          ctx.moveTo(xx, gy - curH);
          ctx.lineTo(xx, gy);
          ctx.stroke();
        }
      }
    };

    const onResize = () => {
      buildLayout();
    };

    buildLayout();

    let rafId = 0;
    const loop = (tMs) => {
      draw(tMs * 0.001);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    topColor,
    midColor,
    bottomColor,
    groundColor,
    lineColor,
    widthPxPerCluster,
    linesPerClusterMin,
    linesPerClusterMax,
    lineWidth,
    groundBase,
    groundAmplitude,
    lineHeightMin,
    lineHeightMax,
    seed,
    motionSpeed,
    motionAmplitude,
  ]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}


