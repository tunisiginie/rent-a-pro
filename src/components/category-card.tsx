import Link from "next/link";
import {
  Car,
  Flame,
  Cpu,
  Hammer,
  Wrench,
  Laptop,
  GraduationCap,
  Briefcase,
  Dumbbell,
  Salad,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  Car,
  Flame,
  Cpu,
  Hammer,
  Wrench,
  Laptop,
  GraduationCap,
  Briefcase,
  Dumbbell,
  Salad,
};

export function CategoryCard({ category }: { category: Category }) {
  const Icon = (category.icon && ICONS[category.icon]) || HelpCircle;
  return (
    <Link href={`/search?category=${category.slug}`} className="block">
      <div className="group flex min-h-40 flex-col justify-between rounded-2xl bg-card p-5 transition-colors hover:bg-secondary">
        <Icon className="size-9 text-primary" />
        <span className="text-lg font-semibold">{category.name}</span>
      </div>
    </Link>
  );
}
