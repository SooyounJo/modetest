import HeartCanvas from "@/components/HeartCanvas";

export default function A3() {
  return (
    <HeartCanvas
      colorA="#7f00ff"
      colorB="#e100ff"
      heartbeatSpeed={2.8}
      rippleStrength={0.2}
      grainAmount={0.05}
      bgGradient="radial-gradient(1200px 600px at 50% 30%, rgba(113, 0, 255, 0.08), rgba(9,9,14,1) 60%)"
    />
  );
}


