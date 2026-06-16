import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getExpertDetail } from "@/lib/queries";
import { computeFees, formatUsd } from "@/lib/fees";
import { channelLabel } from "@/lib/labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProblemForm } from "@/components/problem-form";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { service: serviceId } = await searchParams;

  const detail = await getExpertDetail(id);
  if (!detail) notFound();

  const service =
    detail.services.find((s) => s.id === serviceId) ?? detail.services[0];
  if (!service) redirect(`/experts/${id}`);

  const fees = computeFees(service.price_cents);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">What is your problem?</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Tell {detail.expert.display_name} what you need. They have 1.5 minutes to
        respond once you submit.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{service.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {channelLabel(service.channel)}
              {service.duration_minutes ? ` · ${service.duration_minutes} min` : ""}
            </span>
            <span>{formatUsd(fees.servicePriceCents)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Service fee</span>
            <span>{formatUsd(fees.customerFeeCents)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-border pt-1 font-medium">
            <span>Total</span>
            <span className="text-primary">{formatUsd(fees.amountCents)}</span>
          </div>
        </CardContent>
      </Card>

      <ProblemForm
        expertId={id}
        serviceId={service.id}
        payLabel={`Submit & pay ${formatUsd(fees.amountCents)}`}
      />
    </div>
  );
}
