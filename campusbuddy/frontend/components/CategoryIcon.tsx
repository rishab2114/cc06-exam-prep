import {
  Sparkles,
  Shirt,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Luggage,
  GraduationCap,
  Moon,
  Printer,
  Users,
  Bed,
  type LucideIcon,
} from 'lucide-react';

/**
 * One place that turns a category into a real SVG icon.
 *
 * Emoji were being used as icons, which renders differently on every platform,
 * can't inherit colour or stroke weight, and is read aloud by screen readers as
 * its literal name ("broom"). Lucide gives one consistent, tintable set — and
 * the label always travels with it for assistive tech.
 */
const BY_CATEGORY: Record<string, LucideIcon> = {
  'Hostel Services': Sparkles,
  Laundry: Shirt,
  Convenience: Package,
  Food: UtensilsCrossed,
  Moving: Luggage,
  'Study help': GraduationCap,
};

/** Legacy emoji still arriving from seeded/older rows map to the same set. */
const BY_EMOJI: Record<string, LucideIcon> = {
  '🧹': Sparkles,
  '🛏️': Bed,
  '🧺': Shirt,
  '🛒': ShoppingCart,
  '🍜': UtensilsCrossed,
  '🍱': UtensilsCrossed,
  '📦': Package,
  '🧍': Users,
  '🖨️': Printer,
  '🧳': Luggage,
  '📚': GraduationCap,
  '🌙': Moon,
};

export function categoryIcon(category?: string, emoji?: string): LucideIcon {
  return (category && BY_CATEGORY[category]) || (emoji && BY_EMOJI[emoji]) || Package;
}

/**
 * Icon in a soft tinted tile. `label` names the category for screen readers —
 * the glyph itself stays aria-hidden so it's never announced twice.
 */
export function CategoryIcon({
  category,
  emoji,
  label,
  size = 'md',
}: {
  category?: string;
  emoji?: string;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const Icon = categoryIcon(category, emoji);
  const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const glyph = size === 'sm' ? 16 : 19;
  return (
    <span
      className={`${box} flex shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand`}
    >
      <Icon size={glyph} strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">{label ?? category ?? 'Task'}</span>
    </span>
  );
}
