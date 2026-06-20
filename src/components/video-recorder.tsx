"use client";

import { useRef, useState } from "react";
import { Video, Square, RotateCcw, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MediaUpload } from "@/components/media-upload";

type State = "idle" | "recording" | "recorded" | "uploading" | "done";

/**
 * Records a short webcam/mic clip in-browser and uploads it to the private
 * problem-uploads bucket, exposing the stored path via a hidden input so it
 * submits with the parent form. Falls back to file upload when recording
 * isn't available (unsupported browser or denied camera permission).
 */
export function VideoRecorder({ name }: { name: string }) {
  const [supported] = useState(
    () =>
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof window !== "undefined" &&
      "MediaRecorder" in window,
  );
  const [fallback, setFallback] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [path, setPath] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        stopStream();
        if (videoRef.current) videoRef.current.srcObject = null;
        setState("recorded");
      };
      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      toast.error("Couldn't access your camera. Upload a file instead.");
      setFallback(true);
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  function reset() {
    blobRef.current = null;
    setPreviewUrl("");
    setPath("");
    setState("idle");
  }

  async function upload() {
    const blob = blobRef.current;
    if (!blob) return;
    if (!isSupabaseConfigured()) {
      toast.error("Supabase isn't configured yet.");
      return;
    }
    setState("uploading");
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");
      const objectPath = `${user.id}/${crypto.randomUUID()}.webm`;
      const { error } = await supabase.storage
        .from("problem-uploads")
        .upload(objectPath, blob, { upsert: true, contentType: "video/webm" });
      if (error) throw error;
      setPath(objectPath);
      setState("done");
      toast.success("Recording attached.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
      setState("recorded");
    }
  }

  if (!supported || fallback) {
    return (
      <MediaUpload
        bucket="problem-uploads"
        accept="video/*,audio/*,image/*"
        label="Attach a video, audio, or photo"
        name={name}
        kind="video"
        privateBucket
      />
    );
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={path} readOnly />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
        <video
          ref={videoRef}
          src={state === "recorded" ? previewUrl : undefined}
          controls={state === "recorded"}
          playsInline
          className="aspect-video w-full"
        />
        {state === "idle" ? (
          <button
            type="button"
            onClick={start}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white transition-colors hover:bg-black/30"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-destructive">
              <Video className="size-7" />
            </span>
            <span className="text-sm">Record a video of your problem</span>
          </button>
        ) : null}
        {state === "recording" ? (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-white">
            <span className="size-2 animate-pulse rounded-full bg-white" />
            Recording
          </div>
        ) : null}
      </div>

      {state === "recording" ? (
        <Button type="button" variant="destructive" onClick={stop} className="w-full">
          <Square className="size-4" /> Stop recording
        </Button>
      ) : null}

      {state === "recorded" ? (
        <div className="flex gap-2">
          <Button type="button" onClick={upload} className="flex-1">
            <Check className="size-4" /> Use this recording
          </Button>
          <Button type="button" variant="ghost" onClick={reset}>
            <RotateCcw className="size-4" /> Redo
          </Button>
        </div>
      ) : null}

      {state === "uploading" ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Uploading recording...
        </p>
      ) : null}

      {state === "done" ? (
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
          <span className="flex items-center gap-1.5 text-success">
            <Check className="size-4" /> Recording attached
          </span>
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            Redo
          </Button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setFallback(true)}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Or upload a file instead
      </button>
    </div>
  );
}
