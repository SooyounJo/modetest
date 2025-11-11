import HeartCanvas from "@/components/HeartCanvas";

export default function A5() {
  return (
    <HeartCanvas
      colorA="#ff1744"
      colorB="#ff5252"
      heartbeatSpeed={3.2}
      rippleStrength={0.12}
      grainAmount={0.08}
      bgGradient="radial-gradient(1200px 600px at 50% 30%, rgba(255, 23, 68, 0.08), rgba(16,8,8,1) 60%)"
    />
  );
}


