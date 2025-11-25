'use client';
import { useEffect, useRef } from "react";

// A4용: 5번(FallingParticlesCityCanvas)의 콘셉트를 라인(선) 기반으로 표현
export default function FallingParticlesLinesCanvas(props) {
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
    growSpeed = 0.9, // 열마다 위상이 다른 성장 속도
    lineWidth = 1,   // 그리는 선 두께(px)
    contrast = 1.18, // 선 밝기 보정(단순 사용)
    seed = 7,
  } = props || {};

  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const layoutRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 해시/노이즈 유틸
    const hash = (n) => {
      const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    const smoothNoise1D = (x) => {
      const i = Math.floor(x);
      const f = x - i;
      const a = hash(i);
      const b = hash(i + 1);
      const u = f * f * (3 - 2 * f);
      return a * (1 - u) + b * u;
    };

    const buildLayout = () => {
      const parent = canvas.parentElement || canvas;
      const wCss = parent.clientWidth;
      const hCss = parent.clientHeight;
      canvas.width = Math.floor(wCss * dpr);
      canvas.height = Math.floor(hCss * dpr);
      canvas.style.width = wCss + "px";
      canvas.style.height = hCss + "px";

      const w = canvas.width;
      const h = canvas.height;

      // 각 열의 기본 높이와 위상 계산
      const colWidth = w / cols;
      const phases = new Float32Array(cols);
      const heights = new Float32Array(cols);
      for (let c = 0; c < cols; c++) {
        const hBase =
          baseMin +
          (baseMax - baseMin) *
            Math.pow(smoothNoise1D(c * heightSmooth + 8.3), 1.2);
        const hJit = (smoothNoise1D(c * 0.71) - 0.5) * heightJitter;
        const hNorm = Math.max(0.05, Math.min(0.99, hBase + hJit));
        heights[c] = h * hNorm;
        phases[c] = hash(c * 13.7 + 5.1) * Math.PI * 2;
      }

      layoutRef.current = { w, h, colWidth, phases, heights, dpr };
    };

    const draw = (tSec) => {
      if (!layoutRef.current) return;
      const { w, h, colWidth, phases, heights, dpr } = layoutRef.current;
      ctx.clearRect(0, 0, w, h);

      // 배경
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // 선 스타일
      ctx.strokeStyle = fg;
      ctx.lineWidth = Math.max(1, lineWidth * dpr);
      ctx.lineCap = "butt";

      // 그리드 셀 크기
      const cellH = h / rows;
      const innerMargin = Math.max(0, Math.min(0.45, margin));

      // 각 열 처리
      for (let c = 0; c < cols; c++) {
        const xLeft = c * colWidth;
        const xCenter = xLeft + colWidth * 0.5;
        // 성장 팩터 0..1
        const m = 0.5 + 0.5 * Math.sin(tSec * growSpeed + phases[c]);
        const colHeight = heights[c] * m;

        // 윈도우 그리드에서 on/off 샘플 (라인화: 각 활성 셀의 중앙에 수직선 그리기)
        const maxRowIndex = Math.min(rows - 1, Math.floor(colHeight / cellH));
        for (let r = 0; r <= maxRowIndex; r++) {
          // 셀 내부 여백(margin)을 고려해 위아래를 조금 비워 수직선 길이 축소
          const y0 = h - (r + 1 - innerMargin) * cellH;
          const y1 = h - (r + innerMargin) * cellH;
          // on 확률
          const occ =
            hash(c * 37.1 + r * 91.7 + seed * 13.3) >= 1.0 - windowFill;
          if (!occ) continue;
          ctx.beginPath();
          ctx.moveTo(xCenter, y0);
          ctx.lineTo(xCenter, y1);
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
    bg,
    fg,
    cols,
    rows,
    heightSmooth,
    heightJitter,
    baseMin,
    baseMax,
    margin,
    windowFill,
    growSpeed,
    lineWidth,
    contrast,
    seed,
  ]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: bg,
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}



