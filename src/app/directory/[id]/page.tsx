import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, MapPin, ExternalLink } from "lucide-react";
import { getDirectoryExpert } from "@/lib/queries";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequestToBook } from "@/components/request-to-book";
import { RemoveListingButton } from "@/components/remove-listing-button";

export default async function DirectoryProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expert = await getDirectoryExpert(id);
  if (!expert || expert.status !== "listed") notFound();

  const externalUrl = expert.booking_url || expert.website_url;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar className="size-20 shrink-0 ring-2 ring-border">
          <AvatarFallback className="text-xl">
            {expert.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{expert.display_name}</h1>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Unclaimed
            </Badge>
          </div>
          {expert.headline ? (
            <p className="text-muted-foreground">{expert.headline}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {expert.location ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {expert.location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {expert.blurb ? <p className="mt-6 text-sm leading-relaxed">{expert.blurb}</p> : null}

      {expert.specialties.length > 0 ? (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Specialties</h2>
          <div className="flex flex-wrap gap-1.5">
            {expert.specialties.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {/* Broker CTA */}
      <div className="mt-8">
        <RequestToBook directoryExpertId={expert.id} expertName={expert.display_name} />
      </div>

      {/* Their public link, if any */}
      {externalUrl ? (
        <Button
          variant="outline"
          className="mt-3 w-full"
          render={
            <a href={externalUrl} target="_blank" rel="noopener noreferrer nofollow" />
          }
        >
          <ExternalLink className="size-4" /> Visit their site
        </Button>
      ) : null}

      {/* Provenance + claim/opt-out */}
      <div className="mt-8 space-y-2 rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <Briefcase className="size-3.5" />
          Auto-compiled listing.{" "}
          {expert.source_url ? (
            <a
              href={expert.source_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline-offset-2 hover:underline"
            >
              Source
            </a>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/become-an-expert" className="text-primary underline-offset-2 hover:underline">
            Is this you? Claim this profile
          </Link>
          <RemoveListingButton directoryExpertId={expert.id} />
        </div>
      </div>
    </div>
  );
}
