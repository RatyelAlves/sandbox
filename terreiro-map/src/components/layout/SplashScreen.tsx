"use client";

import { Logo } from "@/components/ui/Logo";

type OrbitConfig = {
  tiltX: number;
  tiltY: number;
  radius: number;
  durationSec: number;
  count: number;
  reverse?: boolean;
  dotSize: number;
};

const ORBITS: OrbitConfig[] = [
  { tiltX: 72, tiltY: 0, radius: 182, durationSec: 22, count: 36, dotSize: 3.5 },
  { tiltX: 72, tiltY: 60, radius: 182, durationSec: 26, count: 36, reverse: true, dotSize: 3.5 },
  { tiltX: 72, tiltY: 120, radius: 182, durationSec: 24, count: 36, dotSize: 3.5 },
  { tiltX: 18, tiltY: 35, radius: 204, durationSec: 30, count: 40, reverse: true, dotSize: 3 },
  { tiltX: 88, tiltY: 75, radius: 162, durationSec: 19, count: 32, dotSize: 3.5 },
  { tiltX: 42, tiltY: 145, radius: 224, durationSec: 34, count: 44, reverse: true, dotSize: 3 },
];

function OrbitRing3D({
  tiltX,
  tiltY,
  radius,
  durationSec,
  count,
  reverse,
  dotSize,
}: OrbitConfig) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 [transform-style:preserve-3d]"
      style={{
        transform: `translate(-50%, -50%) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      }}
      aria-hidden
    >
      <div
        className={`[transform-style:preserve-3d] ${
          reverse ? "animate-splash-orbit-reverse" : "animate-splash-orbit"
        }`}
        style={{ animationDuration: `${durationSec}s` }}
      >
        {Array.from({ length: count }, (_, i) => {
          const angle = (360 / count) * i;
          const isStreak = i % 4 === 0;
          const isBright = i % 7 === 0;

          if (isStreak) {
            return (
              <span
                key={i}
                className="absolute left-0 top-0 block origin-left rounded-full bg-gradient-to-r from-transparent via-[#ffe8bc] to-[#ffb85c]"
                style={{
                  width: 18,
                  height: 2.5,
                  opacity: isBright ? 0.95 : 0.55,
                  boxShadow: "0 0 10px rgba(255, 190, 100, 0.75)",
                  transform: `rotate(${angle}deg) translateX(${radius}px) rotate(90deg)`,
                }}
              />
            );
          }

          return (
            <span
              key={i}
              className="absolute left-0 top-0 block rounded-full bg-[#fff6e8]"
              style={{
                width: dotSize,
                height: dotSize,
                marginLeft: -dotSize / 2,
                marginTop: -dotSize / 2,
                opacity: isBright ? 1 : 0.45,
                boxShadow: isBright
                  ? "0 0 12px rgba(255, 210, 140, 1), 0 0 4px rgba(255,255,255,0.9)"
                  : "0 0 6px rgba(255, 190, 100, 0.55)",
                transform: `rotate(${angle}deg) translateX(${radius}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Splash fullscreen — logo central com esfera orbital 3D de partículas.
 */
export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center overflow-hidden bg-[#070605]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(214,130,56,0.14)_0%,transparent_55%)]"
        aria-hidden
      />

      <div className="relative [perspective:1400px]">
        <div className="relative flex h-[min(96vw,36rem)] w-[min(96vw,36rem)] items-center justify-center sm:h-[36rem] sm:w-[36rem] [transform-style:preserve-3d]">
          {ORBITS.map((orbit, index) => (
            <OrbitRing3D key={index} {...orbit} />
          ))}

          <div
            className="animate-splash-halo pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,190,90,0.22)_0%,transparent_70%)]"
            aria-hidden
          />

          <div className="animate-splash-logo-in relative z-10 drop-shadow-[0_0_28px_rgba(255,190,100,0.35)] [&_.text-text-brown]:text-white">
            <Logo size="xl" showText />
          </div>
        </div>
      </div>
    </div>
  );
}
