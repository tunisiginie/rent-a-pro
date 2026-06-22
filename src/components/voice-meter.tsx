"use client";

import { useEffect, useRef, useState } from "react";

const BARS = 5;

/**
 * Live microphone level meter shown while the orb is listening, so the user can
 * see their voice is being picked up. Opens a parallel Web Audio analyser on a
 * getUserMedia stream and drives the bar heights directly (no per-frame React
 * re-render). Falls back to a gentle CSS pulse when there is no mic / permission
 * is denied, so it never throws or blocks the voice flow.
 */
export function VoiceMeter({ active }: { active: boolean }) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!active) return;

    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;

    async function start() {
      const md = typeof navigator !== "undefined" ? navigator.mediaDevices : null;
      const AC =
        typeof window !== "undefined"
          ? window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext
          : null;
      if (!md?.getUserMedia || !AC) {
        setFallback(true);
        return;
      }
      try {
        stream = await md.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        ctx = new AC();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const loop = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length); // 0..~1
          const level = Math.min(1, rms * 3.2);
          for (let i = 0; i < BARS; i++) {
            const bar = barsRef.current[i];
            if (!bar) continue;
            // Per-bar variation so it reads as an equalizer, not a single block.
            const weight = 0.55 + 0.45 * Math.sin((i / BARS) * Math.PI);
            const h = 18 + level * weight * 82;
            bar.style.height = `${h}%`;
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        setFallback(true);
      }
    }

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="flex h-8 items-center justify-center gap-1"
      aria-hidden="true"
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className={`w-1.5 rounded-full bg-primary ${fallback ? "meter-pulse" : ""}`}
          style={{ height: "18%", animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}
