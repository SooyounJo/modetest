import HeartCanvas from "@/components/HeartCanvas";

export default function A6() {
  return (
    <HeartCanvas
      colorA="#ff9a9e"
      colorB="#fad0c4"
      heartbeatSpeed={1.2}
      rippleStrength={0.1}
      grainAmount={0.03}
      bgGradient="radial-gradient(1200px 600px at 50% 30%, rgba(255, 154, 158, 0.08), rgba(12,10,10,1) 60%)"
    />
  );
}


