import dynamic from "next/dynamic";

const LineExtrudeCityCanvas = dynamic(
  () => import("@/components/LineExtrudeCityCanvas"),
  { ssr: false }
);

export default function A8() {
  return (
    <LineExtrudeCityCanvas
      bg="#0a0d12"
      line="#f9e6b3"
      colsNear={140}
      colsMid={96}
      colsFar={64}
      speedNear={0.28}
      speedMid={0.18}
      speedFar={0.12}
      widthNear={0.28}
      widthMid={0.22}
      widthFar={0.18}
      overshoot={0.22}
      squeeze={0.18}
      contrast={1.18}
      grain={0.02}
    />
  );
}


