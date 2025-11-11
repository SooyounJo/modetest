import HeartCanvas from "@/components/HeartCanvas";

export default function A8() {
  return (
    <HeartCanvas
      colorA="#f7971e"
      colorB="#ffd200"
      heartbeatSpeed={2.0}
      rippleStrength={0.17}
      grainAmount={0.045}
      bgGradient="radial-gradient(1200px 600px at 50% 30%, rgba(247, 151, 30, 0.08), rgba(14,10,7,1) 60%)"
    />
  );
}


