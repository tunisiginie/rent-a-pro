"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MediaUploadProps {
  bucket: "avatars" | "expert-videos" | "problem-uploads";
  accept: string;
  label: string;
  /** Hidden input name so the URL/path is submitted with a parent <form>. */
  name: string;
  defaultValue?: string;
  kind?: "image" | "video";
  /**
   * For private buckets (problem-uploads): store the object PATH instead of a
   * public URL. Authorized viewers get a signed URL server-side. No media
   * preview is shown since the object isn't publicly readable.
   */
  privateBucket?: boolean;
}

/** Uploads a file to Supabase Storage under <uid>/… and exposes its URL via a hidden input. */
export function MediaUpload({
  bucket,
  accept,
  label,
  name,
  defaultValue = "",
  kind = "image",
  privateBucket = false,
}: MediaUploadProps) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupabaseConfigured()) {
      toast.error("Supabase isn't configured yet.");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });
      if (error) throw error;

      if (privateBucket) {
        // Store the path; authorized viewers get a signed URL server-side.
        setUrl(path);
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        setUrl(data.publicUrl);
      }
      toast.success(`${label} uploaded.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={url} readOnly />
      {url && privateBucket ? (
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <span className="text-success">✓ Uploaded</span>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={() => setUrl("")}
          >
            <X />
          </Button>
        </div>
      ) : url ? (
        <div className="relative w-fit">
          {kind === "video" ? (
            <video src={url} className="h-32 rounded-lg border border-border" controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="size-24 rounded-lg border border-border object-cover" />
          )}
          <Button
            type="button"
            size="icon-xs"
            variant="secondary"
            className="absolute -top-2 -right-2"
            onClick={() => setUrl("")}
          >
            <X />
          </Button>
        </div>
      ) : (
        <label className="flex h-24 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/30">
          <Upload className="size-4" />
          {uploading ? "Uploading…" : `Upload ${label.toLowerCase()}`}
          <input type="file" accept={accept} className="sr-only" onChange={onFile} disabled={uploading} />
        </label>
      )}
    </div>
  );
}
