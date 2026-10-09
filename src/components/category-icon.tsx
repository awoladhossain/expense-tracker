import {
  Banknote,
  Briefcase,
  Building2,
  Bus,
  Clapperboard,
  Coins,
  Ellipsis,
  Gift,
  HeartPulse,
  Laptop,
  Receipt,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
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
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Gift,
  Wallet,
  Banknote,
  Coins,
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
