export default function A6() {
  // 색상 팔레트 (이미지 톤에 맞춤)
  const skyTop = "#000000";
  const skyBottom = "#000000";
  const building = "#b0adb1";
  const buildingDark = "#a9a7ab";
  const white = "#ffffff";
  const blurPx = 3; // 조금 더 선명하게 (블러 감소)

  // 공통 스타일
  const container = {
    position: "relative",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 100%)`,
  };

  const floatAnim = (durationSec, delaySec = 0) =>
    `a6-grow ${durationSec}s ease-in-out ${delaySec}s infinite alternate`;

  const box = (left, bottom, width, height, color, duration = 40, delay = 0) => ({
    position: "absolute",
    left,
    bottom,
    width,
    height,
    background: color,
    filter: `blur(${blurPx}px)`,
    animation: floatAnim(duration, delay),
    willChange: "transform",
    transform: "translateZ(0)",
    transformOrigin: "bottom center",
  });

  const winBar = (left, bottom, width, height, duration = 40, delay = 0) => ({
    position: "absolute",
    left,
    bottom,
    width,
    height,
    background: white,
    filter: `blur(${blurPx}px)`,
    animation: floatAnim(duration, delay),
    willChange: "transform",
    transform: "translateZ(0)",
    transformOrigin: "bottom center",
  });

  return (
    <div style={container}>
      <style>{`
        @keyframes a6-grow {
          0%   { transform: translateZ(0) scaleY(0.82); }
          50%  { transform: translateZ(0) scaleY(1.18); }
          100% { transform: translateZ(0) scaleY(0.82); }
        }
      `}</style>
      {/* 좌측 빌딩 군 */}
      <div style={box("0%", "0%", "30%", "68%", building, 13, 0.2)} />
      {/* 좌측 상단 스텝(오른쪽 낮은 단) */}
      <div style={box("30%", "0%", "12%", "54%", building, 14, 0.8)} />
      {/* 좌측에서 가운데로 이어지는 낮은 단 */}
      <div style={box("42%", "0%", "18%", "42%", buildingDark, 15, 1.1)} />

      {/* 중앙 큰 빌딩 */}
      <div style={box("40%", "0%", "24%", "62%", building, 12, 0.6)} />

      {/* 우측으로 이어지는 낮은 단(수평 띠) */}
      <div style={box("64%", "0%", "36%", "42%", buildingDark, 16, 0.4)} />
      {/* 우측 영역: 간격을 좁힌 슬림 그레이 박스 다수 추가 */}
      <div style={box("66%", "0%", "3%", "22%", building, 13.5, 0.3)} />
      <div style={box("70%", "0%", "3%", "18%", buildingDark, 12.4, 0.7)} />
      <div style={box("74%", "0%", "3%", "24%", building, 14.2, 1.0)} />
      <div style={box("78%", "0%", "3%", "20%", buildingDark, 12.9, 0.5)} />
      <div style={box("82%", "0%", "3%", "26%", building, 15.1, 0.9)} />
      <div style={box("86%", "0%", "3%", "19%", buildingDark, 13.8, 1.3)} />
      <div style={box("90%", "0%", "3%", "23%", building, 14.7, 0.4)} />
      <div style={box("94%", "0%", "3%", "21%", buildingDark, 12.6, 0.8)} />

      {/* 좌측 큰 문 */}
      <div style={winBar("7%", "0%", "5%", "26%", 11.2, 0.3)} />

      {/* 좌측 상단 창 그룹 1 (4x?) */}
      {/* 위쪽 줄 */}
      <div style={winBar("2.4%", "58%", "1.2%", "7%", 10.2, 0.1)} />
      <div style={winBar("4.2%", "58%", "1.2%", "7%", 11.0, 0.5)} />
      <div style={winBar("6.0%", "58%", "1.2%", "7%", 12.1, 0.9)} />
      <div style={winBar("7.8%", "58%", "1.2%", "7%", 10.6, 1.2)} />
      {/* 아래쪽 줄 */}
      <div style={winBar("2.4%", "49%", "1.2%", "7%", 11.4, 0.35)} />
      <div style={winBar("4.2%", "49%", "1.2%", "7%", 12.2, 0.75)} />
      <div style={winBar("6.0%", "49%", "1.2%", "7%", 10.1, 1.05)} />
      <div style={winBar("7.8%", "49%", "1.2%", "7%", 11.0, 1.45)} />

      {/* 좌측 상단 우측의 세로 창 묶음 */}
      <div style={winBar("31.5%", "53%", "1.2%", "7%", 12.6, 0.25)} />
      <div style={winBar("33.3%", "53%", "1.2%", "7%", 11.3, 0.65)} />
      <div style={winBar("35.1%", "53%", "1.2%", "7%", 10.5, 1.05)} />
      {/* 아랫줄 */}
      <div style={winBar("31.5%", "44%", "1.2%", "7%", 10.9, 0.15)} />
      <div style={winBar("33.3%", "44%", "1.2%", "7%", 12.8, 0.55)} />
      <div style={winBar("35.1%", "44%", "1.2%", "7%", 11.6, 1.0)} />

      {/* 중앙 빌딩 좌측의 굵은 창 2개 */}
      <div style={winBar("43%", "49%", "2.4%", "12%", 11.7, 0.4)} />
      <div style={winBar("46.2%", "49%", "2.4%", "12%", 10.6, 0.9)} />
      {/* 중앙 빌딩 우측의 얇은 창 4개 */}
      <div style={winBar("50.6%", "49%", "1%", "12%", 12.4, 0.2)} />
      <div style={winBar("52.2%", "49%", "1%", "12%", 10.9, 0.6)} />
      <div style={winBar("53.8%", "49%", "1%", "12%", 10.2, 1.0)} />
      <div style={winBar("55.4%", "49%", "1%", "12%", 13.1, 1.3)} />

      {/* 추가 작은 화이트 박스들(최소 10개 이상, 더 촘촘히) */}
      <div style={winBar("67%", "50%", "0.8%", "6%", 10.8, 0.15)} />
      <div style={winBar("69%", "52%", "0.8%", "6%", 11.6, 0.35)} />
      <div style={winBar("71%", "48%", "0.8%", "6%", 12.2, 0.65)} />
      <div style={winBar("73%", "55%", "0.8%", "6%", 10.5, 0.95)} />
      <div style={winBar("75%", "51%", "0.8%", "6%", 11.9, 1.15)} />
      <div style={winBar("77%", "53%", "0.8%", "6%", 12.7, 0.25)} />
      <div style={winBar("79%", "49%", "0.8%", "6%", 10.2, 0.55)} />
      <div style={winBar("81%", "56%", "0.8%", "6%", 11.4, 0.85)} />
      <div style={winBar("83%", "50%", "0.8%", "6%", 12.9, 1.05)} />
      <div style={winBar("85%", "52%", "0.8%", "6%", 10.7, 1.25)} />
      <div style={winBar("87%", "54%", "0.8%", "6%", 11.8, 1.4)} />
      <div style={winBar("89%", "49%", "0.8%", "6%", 12.5, 1.6)} />
    </div>
  );
}


