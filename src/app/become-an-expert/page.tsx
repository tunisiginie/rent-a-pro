import { redirect } from "next/navigation";
import { requireUser, getMyExpertProfile } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import { createExpertProfile } from "@/lib/actions/expert";
import { ExpertProfileForm } from "@/components/expert-profile-form";

export default async function BecomeAnExpertPage() {
  await requireUser();
  const existing = await getMyExpertProfile();
  if (existing) redirect("/dashboard");

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Become an expert</h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Build your profile. Once it’s approved and your payouts are connected,
        you’ll appear in search and can take bookings.
      </p>
      <ExpertProfileForm
        categories={categories}
        action={createExpertProfile}
        submitLabel="Create profile"
      />
    </div>
  );
}
