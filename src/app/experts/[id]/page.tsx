import { notFound } from "next/navigation";
import { Briefcase, CalendarClock } from "lucide-react";
import { getExpertDetail } from "@/lib/queries";
import { DAY_NAMES } from "@/lib/labels";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RatingStars } from "@/components/rating-stars";
import { ServiceCard } from "@/components/service-card";
import { IntroVideo } from "@/components/intro-video";

export default async function ExpertProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getExpertDetail(id);
  if (!detail) notFound();
  const { expert, services, availability, reviews } = detail;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar className="size-20">
          {expert.photo_url ? <AvatarImage src={expert.photo_url} alt="" /> : null}
          <AvatarFallback className="text-xl">
            {expert.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{expert.display_name}</h1>
          {expert.headline ? (
            <p className="text-muted-foreground">{expert.headline}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <RatingStars rating={expert.rating_avg} count={expert.rating_count} />
            {expert.years_experience ? (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Briefcase className="size-3.5" />
                {expert.years_experience}+ years
              </span>
            ) : null}
            {expert.available_now ? (
              <Badge className="bg-success/15 text-success">Available now</Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* Intro video */}
      {expert.intro_video_url ? (
        <div className="mt-6">
          <IntroVideo src={expert.intro_video_url} name={expert.display_name} />
        </div>
      ) : null}

      {/* Services */}
      <h2 className="mt-8 mb-3 text-lg font-semibold">Services</h2>
      {services.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} expertId={expert.id} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This pro hasn&rsquo;t listed any services yet.
        </p>
      )}

      {/* Bio + specialties */}
      {expert.bio ? <p className="mt-8 text-sm leading-relaxed">{expert.bio}</p> : null}
      {expert.specialties.length > 0 ? (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Specialties
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {expert.specialties.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {/* Availability */}
      {availability.length > 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4" /> Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            {availability.map((a) => (
              <div key={a.id} className="flex justify-between">
                <span>{DAY_NAMES[a.day_of_week]}</span>
                <span className="text-muted-foreground">
                  {a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Reviews */}
      {reviews.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
          <div className="grid gap-3">
            {reviews.map((r) => (
              <Card key={r.id} data-size="sm">
                <CardContent className="px-4">
                  <div className="flex items-center justify-between">
                    {r.rating ? <RatingStars rating={r.rating} /> : null}
                    {r.did_answer !== null ? (
                      <Badge variant="outline" className="text-xs">
                        {r.did_answer ? "Answered" : "Didn't answer"}
                      </Badge>
                    ) : null}
                  </div>
                  {r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
