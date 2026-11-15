import {
  ShoppingBasket,
  House,
  ReceiptText,
  CarFront,
  HeartPulse,
  BookOpen,
  Coffee,
  Plane,
  BriefcaseBusiness,
  Gift,
  Wallet,
  PawPrint,
  type LucideIcon,
} from "lucide-react";
export const categoryIcons: Record<string, LucideIcon> = {
  shopping: ShoppingBasket,
  home: House,
  receipt: ReceiptText,
  car: CarFront,
  heart: HeartPulse,
  book: BookOpen,
  coffee: Coffee,
  plane: Plane,
  briefcase: BriefcaseBusiness,
  gift: Gift,
  wallet: Wallet,
  paw: PawPrint,
};
export const iconNames: Record<string, string> = {
  shopping: "Market",
  home: "Ev",
  receipt: "Fatura",
  car: "Araç",
  heart: "Sağlık",
  book: "Kitap",
  coffee: "Kahve",
  plane: "Seyahat",
  briefcase: "İş",
  gift: "Hediye",
  wallet: "Cüzdan",
  paw: "Evcil hayvan",
};
export function CategoryIcon({
  icon = "wallet",
  color = "#648a54",
  size = 19,
}: {
  icon?: string;
  color?: string;
  size?: number;
}) {
  const Icon = categoryIcons[icon] ?? Wallet;
  return (
    <span
      className="category-icon"
      style={{ color, backgroundColor: `${color}17` }}
    >
      <Icon size={size} />
    </span>
  );
}
