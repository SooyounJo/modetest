import HeartCanvas from "@/components/HeartCanvas";

export default function A2() {
  return (
    <HeartCanvas
      colorA="#00c6ff"
      colorB="#0072ff"
      heartbeatSpeed={1.8}
      rippleStrength={0.18}
      grainAmount={0.05}
      bgGradient="radial-gradient(1100px 540px at 50% 30%, rgba(0, 114, 255, 0.08), rgba(10,10,16,1) 60%)"
    />
  );
}


