import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getProfile, getMyExpertProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

export async function SiteHeader() {
  const [profile, expert] = await Promise.all([
    getProfile(),
    getMyExpertProfile(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-5 text-primary" />
          <span>Rent a Pro</span>
        </Link>

        <nav className="flex items-center gap-2">
          {profile ? (
            <UserMenu
              email={profile.email}
              fullName={profile.full_name}
              photoUrl={profile.photo_url}
              isExpert={Boolean(expert)}
              isAdmin={profile.is_admin}
            />
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Log in
              </Button>
              <Button size="sm" render={<Link href="/signup" />}>
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
