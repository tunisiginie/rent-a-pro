import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveExpert, rejectExpert } from "@/lib/actions/admin";
import type { ExpertProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminPage() {
  await requireAdmin();

  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  let pending: ExpertProfile[] = [];
  if (hasServiceRole) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("expert_profiles")
      .select("*")
      .eq("status", "pending")
      .order("created_at");
    pending = (data as ExpertProfile[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Pending experts</h1>

      {!hasServiceRole ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
          Set <code>SUPABASE_SERVICE_ROLE_KEY</code> in your environment to review
          pending experts.
        </p>
      ) : pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to review. 🎉</p>
      ) : (
        <div className="space-y-3">
          {pending.map((e) => (
            <Card key={e.id}>
              <CardContent className="space-y-3 px-4">
                <div className="flex gap-3">
                  <Avatar className="size-12">
                    {e.photo_url ? <AvatarImage src={e.photo_url} alt="" /> : null}
                    <AvatarFallback>
                      {e.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{e.display_name}</p>
                    {e.headline ? (
                      <p className="text-sm text-muted-foreground">{e.headline}</p>
                    ) : null}
                    {e.bio ? <p className="mt-1 text-sm">{e.bio}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {e.specialties.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={approveExpert}>
                    <input type="hidden" name="expert_id" value={e.id} />
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                  <form action={rejectExpert}>
                    <input type="hidden" name="expert_id" value={e.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Reject
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
