import dynamic from "next/dynamic";

const FallingParticlesLinesCanvas = dynamic(
  () => import("@/components/FallingParticlesLinesCanvas"),
  { ssr: false }
);

export default function A4() {
  return (
    <FallingParticlesLinesCanvas
      bg="#030507"
      fg="#e8f0ff"
      cols={120}
      rows={84}
      heightSmooth={0.26}
      heightJitter={0.12}
      baseMin={0.28}
      baseMax={0.95}
      margin={0.18}
      windowFill={0.62}
      growSpeed={1.1}
      lineWidth={1}
      contrast={1.2}
      seed={11}
    />
  );
}


