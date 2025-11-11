import dynamic from "next/dynamic";

const LinesOnlyCanvas = dynamic(
  () => import("@/components/LinesOnlyCanvas"),
  { ssr: false }
);

export default function A4() {
  return (
    <LinesOnlyCanvas
      topColor="#eef1f4"
      midColor="#d9e1ea"
      bottomColor="#0f1a27"
      groundColor="#102031"
      lineColor="#e7eef7"
      widthPxPerCluster={12}
      linesPerClusterMin={2}
      linesPerClusterMax={4}
      lineWidth={1}
      groundBase={0.62}
      groundAmplitude={0.15}
      lineHeightMin={0.12}
      lineHeightMax={0.4}
      seed={11}
    />
  );
}


