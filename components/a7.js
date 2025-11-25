'use client';
import { useEffect, useRef } from "react";

// 7번 씬: 레이어드된 격자 타워 + 하단 블록 실루엣
export default function A7() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const parent = canvas.parentElement || canvas;
      const w = Math.floor(parent.clientWidth * dpr);
      const h = Math.floor(parent.clientHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = parent.clientWidth + "px";
      canvas.style.height = parent.clientHeight + "px";
      draw(w, h);
    };

    const drawGridTower = (x, y, width, height, cell, color, line, alpha = 1) => {
      // 배경 박스 (반투명)
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);
      // 격자 라인
      ctx.strokeStyle = line;
      ctx.lineWidth = Math.max(1, Math.floor(cell * 0.06));
      for (let yy = y; yy <= y + height + 0.5; yy += cell) {
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + width, yy);
        ctx.stroke();
      }
      for (let xx = x; xx <= x + width + 0.5; xx += cell) {
        ctx.beginPath();
        ctx.moveTo(xx, y);
        ctx.lineTo(xx, y + height);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawBottomBlocks = (h) => {
      // 하단 실루엣: 작은 검은 박스들이 층층이 쌓인 느낌
      const w = canvas.width;
      const baseY = Math.floor(h * 0.72);
      const minH = Math.floor(h * 0.04);
      const maxH = Math.floor(h * 0.22);
      const colW = Math.max(6, Math.floor(w * 0.01)); // 좁은 폭

      const rng = (seed) => {
        const x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
      };

      for (let x = 0, i = 0; x < w; ) {
        const r = rng(i + 1);
        const width = colW + Math.floor(r * colW * 1.2);
        const height = minH + Math.floor(rng(i + 7) * (maxH - minH));
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(x, baseY - height, width, height);

        // 창 격자 느낌의 작은 디테일
        const cell = Math.max(6, Math.floor(width * 0.35));
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        for (let yy = baseY - height + cell; yy < baseY; yy += cell) {
          ctx.beginPath();
          ctx.moveTo(x, yy);
          ctx.lineTo(x + width, yy);
          ctx.stroke();
        }
        for (let xx = x + cell; xx < x + width; xx += cell) {
          ctx.beginPath();
          ctx.moveTo(xx, baseY - height);
          ctx.lineTo(xx, baseY);
          ctx.stroke();
        }
        x += width + Math.floor(rng(i + 11) * 3); // 좁은 간격
        i++;
      }
    };

    const draw = (w, h) => {
      // 배경
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // 비율 기준 좌표 계산
      const px = (p) => Math.floor((w * p) / 100);
      const py = (p) => Math.floor((h * p) / 100);

      // 뒤쪽 큰 그리드 타워들 (연한 핑크/그레이) - 셀 간격 축소
      drawGridTower(px(77), py(12), px(14), py(66), px(0.6), "#ffd7e3", "rgba(0,0,0,0.08)", 0.55);
      drawGridTower(px(84), py(18), px(10), py(60), px(0.6), "#cdd0d6", "rgba(0,0,0,0.08)", 0.55);

      drawGridTower(px(10), py(16), px(16), py(64), px(0.6), "#c9d6de", "rgba(0,0,0,0.08)", 0.9);
      drawGridTower(px(22), py(36), px(8), py(40), px(0.6), "#a9c0cc", "rgba(0,0,0,0.08)", 0.9);

      // 중간층 핑크 격자 타워
      drawGridTower(px(37), py(28), px(14), py(46), px(0.7), "#ffb3c6", "rgba(0,0,0,0.10)", 0.75);
      // 중앙 회색 격자 타워 (앞쪽)
      drawGridTower(px(44), py(22), px(16), py(54), px(0.7), "#aeb7c1", "rgba(0,0,0,0.10)", 0.9);
      // 그 앞에 핑크 격자
      drawGridTower(px(52), py(36), px(12), py(36), px(0.7), "#ff9fb4", "rgba(0,0,0,0.10)", 0.8);

      // 하단 검은 실루엣
      drawBottomBlocks(h);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#ffffff",
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}


