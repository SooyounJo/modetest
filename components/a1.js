import dynamic from "next/dynamic";

const CityBarsCanvas = dynamic(() => import("@/components/CityBarsCanvas"), {
  ssr: false,
});

export default function A1() {
  return (
    <CityBarsCanvas
      fg="#ffffff"
      bg="#000000"
      colsNear={70}
      colsMid={46}
      colsFar={28}
      speedNear={0.28}
      speedMid={0.18}
      speedFar={0.12}
      rows={40}
      gapX={0.028}
      gapY={0.08}
      segMin={14}
      segMax={28}
      squeeze={0.22}
      bend={0.03}
      wobble={1.2}
      elasticity={0.4}
      overshoot={0.32}
      warpAmp={0.03}
      warpFreq={1.3}
      contrast={1.4}
      grain={0.04}
    />
  );
}


