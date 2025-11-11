import HeartCanvas from "@/components/HeartCanvas";

export default function A4() {
  return (
    <HeartCanvas
      colorA="#00ff87"
      colorB="#00ffa3"
      heartbeatSpeed={1.5}
      rippleStrength={0.22}
      grainAmount={0.04}
      bgGradient="radial-gradient(1200px 600px at 50% 30%, rgba(0, 255, 135, 0.08), rgba(5,10,8,1) 60%)"
    />
  );
}


