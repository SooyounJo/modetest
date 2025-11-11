import Head from "next/head";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

const A1 = dynamic(() => import("@/components/a1"), { ssr: false });
const A2 = dynamic(() => import("@/components/a2"), { ssr: false });
const A3 = dynamic(() => import("@/components/a3"), { ssr: false });
const A4 = dynamic(() => import("@/components/a4"), { ssr: false });
const A5 = dynamic(() => import("@/components/a5"), { ssr: false });
const A6 = dynamic(() => import("@/components/a6"), { ssr: false });
const A7 = dynamic(() => import("@/components/a7"), { ssr: false });
const A8 = dynamic(() => import("@/components/a8"), { ssr: false });

export default function Home() {
  const [scene, setScene] = useState(1);
  const SceneComp = useMemo(() => {
    switch (scene) {
      case 2:
        return A2;
      case 3:
        return A3;
      case 4:
        return A4;
      case 5:
        return A5;
      case 6:
        return A6;
      case 7:
        return A7;
      case 8:
        return A8;
      case 1:
      default:
        return A1;
    }
  }, [scene]);

  return (
    <>
      <Head>
        <title>Interactive Heart Gallery</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          gap: "8px",
          padding: "10px 12px",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 100%)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const n = i + 1;
          const active = scene === n;
          return (
            <button
              key={n}
              onClick={() => setScene(n)}
              style={{
                appearance: "none",
                cursor: "pointer",
                border: "1px solid " + (active ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)"),
                background: active
                  ? "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                color: "white",
                padding: "8px 12px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.02em",
                boxShadow: active
                  ? "0 6px 18px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.08)"
                  : "0 3px 10px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.04)",
                transition: "all 160ms ease",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div style={{ height: "100vh" }}>
        <SceneComp />
      </div>
    </>
  );
}
