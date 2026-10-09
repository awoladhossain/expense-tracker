import {
  Bus,
  Clapperboard,
  Ellipsis,
  HeartPulse,
  Receipt,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

const ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Bus,
  Receipt,
  ShoppingBag,
  HeartPulse,
  Clapperboard,
  Ellipsis,
  MoreHorizontal: Ellipsis,
};

export function CategoryIcon({
  name,
  color,
  size = 20,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  const Icon = ICONS[name] ?? Ellipsis;
  return <Icon color={color} size={size} strokeWidth={2.2} />;
}
