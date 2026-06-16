"use client";

import { useState } from "react";
import type { Category, ExpertProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUpload } from "@/components/media-upload";

export function ExpertProfileForm({
  categories,
  expert,
  action,
  submitLabel,
}: {
  categories: Category[];
  expert?: ExpertProfile | null;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await action(fd);
        } finally {
          setPending(false);
        }
      }}
      className="space-y-5"
    >
      <div className="flex flex-wrap gap-6">
        <MediaUpload
          bucket="avatars"
          accept="image/*"
          label="Profile photo"
          name="photo_url"
          defaultValue={expert?.photo_url ?? ""}
          kind="image"
        />
        <MediaUpload
          bucket="expert-videos"
          accept="video/*"
          label="Intro video"
          name="intro_video_url"
          defaultValue={expert?.intro_video_url ?? ""}
          kind="video"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          required
          defaultValue={expert?.display_name ?? ""}
          placeholder="Joe BMW"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={expert?.headline ?? ""}
          placeholder="Certified BMW Mechanic"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="years_experience">Years of experience</Label>
        <Input
          id="years_experience"
          name="years_experience"
          type="number"
          min={0}
          defaultValue={expert?.years_experience ?? ""}
          placeholder="20"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={expert?.bio ?? ""}
          placeholder="Tell customers about your background and how you can help."
          className="w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="specialties">Specialties (comma-separated)</Label>
        <Input
          id="specialties"
          name="specialties"
          defaultValue={expert?.specialties.join(", ") ?? ""}
          placeholder="Engine repair, Electronics, BMW 2000-2022"
        />
      </div>

      <fieldset className="space-y-2">
        <Label>Categories</Label>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="categories"
                value={c.slug}
                defaultChecked={expert?.category_slugs.includes(c.slug)}
                className="size-4 accent-primary"
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
