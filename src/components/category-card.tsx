import Link from "next/link";
import {
  Car,
  Flame,
  Cpu,
  Hammer,
  Wrench,
  Laptop,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/types";
import { Card } from "@/components/ui/card";

const ICONS: Record<string, LucideIcon> = {
  Car,
  Flame,
  Cpu,
  Hammer,
  Wrench,
  Laptop,
};

export function CategoryCard({ category }: { category: Category }) {
  const Icon = (category.icon && ICONS[category.icon]) || HelpCircle;
  return (
    <Link href={`/search?category=${category.slug}`} className="block">
      <Card className="items-center justify-center gap-2 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30">
        <Icon className="size-7 text-primary" />
        <span className="font-medium">{category.name}</span>
      </Card>
    </Link>
  );
}
