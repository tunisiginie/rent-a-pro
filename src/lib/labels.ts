import type { ServiceChannel } from "@/lib/types";

export const CHANNEL_LABELS: Record<ServiceChannel, string> = {
  phone: "Phone call",
  zoom: "Zoom",
  facetime: "FaceTime",
  email: "Email",
  video_chat: "Video chat",
};

export const CHANNELS: ServiceChannel[] = [
  "video_chat",
  "zoom",
  "facetime",
  "phone",
  "email",
];

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function channelLabel(channel: string | null | undefined): string {
  if (!channel) return "—";
  return CHANNEL_LABELS[channel as ServiceChannel] ?? channel;
}
