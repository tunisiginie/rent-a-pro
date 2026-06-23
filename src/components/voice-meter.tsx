"use client";

import { useEffect, useRef, useState } from "react";

const BARS = 32;
const MIN_PX = 3; // silent baseline -> reads as a straight line
const MAX_PX = 40; // container height

/**
 * Live voice waveform shown while the orb is listening. Opens a parallel Web
 * Audio analyser on a getUserMedia stream and traces the user's voice: the
 * time-domain buffer is sliced into BARS chunks and each bar's height tracks
 * that chunk's RMS, so the row undulates with the sound of the words and sits
 * flat (a straight line) when silent. Heights are written directly via refs
 * (no per-frame React re-render). Falls back to a flat idle line when there is
 * no mic / permission is denied, so it never throws or blocks the voice flow.
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
    const levels = new Float32Array(BARS); // smoothed per-bar amplitude

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
        analyser.fftSize = 1024;
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const chunk = Math.floor(data.length / BARS);

        const loop = () => {
          analyser.getByteTimeDomainData(data);
          for (let i = 0; i < BARS; i++) {
            // RMS of this slice of the waveform.
            let sum = 0;
            const start = i * chunk;
            for (let j = 0; j < chunk; j++) {
              const v = (data[start + j] - 128) / 128;
              sum += v * v;
            }
            const target = Math.min(1, Math.sqrt(sum / chunk) * 3.4);
            // Smooth toward the target so it flows with speech, settles on silence.
            levels[i] += (target - levels[i]) * 0.35;
            const bar = barsRef.current[i];
            if (bar) bar.style.height = `${MIN_PX + levels[i] * (MAX_PX - MIN_PX)}px`;
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
      className="flex items-center justify-center gap-[2px]"
      style={{ height: MAX_PX }}
      aria-hidden="true"
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          className={`w-1 rounded-full bg-primary ${fallback ? "meter-idle" : ""}`}
          style={{ height: MIN_PX, animationDelay: `${i * 0.05}s` }}
        />
      ))}
    </div>
  );
}
