import HeartCanvas from "@/components/HeartCanvas";

export default function A7() {
  return (
    <HeartCanvas
      colorA="#00f5d4"
      colorB="#00bbf9"
      heartbeatSpeed={2.6}
      rippleStrength={0.28}
      grainAmount={0.05}
      bgGradient="radial-gradient(1200px 600px at 50% 30%, rgba(0, 245, 212, 0.08), rgba(7,12,14,1) 60%)"
    />
  );
}


