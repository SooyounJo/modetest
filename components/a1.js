import dynamic from "next/dynamic";

const CityBarsCanvas = dynamic(() => import("@/components/CityBarsCanvas"), {
  ssr: false,
});

export default function A1() {
  return (
    <CityBarsCanvas
      fg="#ffffff"
      bg="#000000"
      colsNear={90}
      colsMid={60}
      colsFar={36}
      speedNear={0.22}
      speedMid={0.14}
      speedFar={0.08}
      rows={56}
      gapX={0.035}
      gapY={0.06}
      segMin={8}
      segMax={20}
      contrast={1.4}
      grain={0.04}
    />
  );
}


