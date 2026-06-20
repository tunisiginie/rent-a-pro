"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

/** Intro video with a large centered play-button overlay (revealed controls on play). */
export function IntroVideo({ src, name }: { src: string; name: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function play() {
    ref.current?.play();
    setPlaying(true);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
      <video
        ref={ref}
        src={src}
        controls={playing}
        playsInline
        className="aspect-video w-full"
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      {!playing ? (
        <button
          type="button"
          onClick={play}
          aria-label={`Play ${name}'s intro video`}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/20"
        >
          <span className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Play className="size-9 translate-x-0.5 fill-current" />
          </span>
        </button>
      ) : null}
    </div>
  );
}
