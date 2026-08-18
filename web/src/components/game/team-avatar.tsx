import { Crown, Flame, Ghost, Rocket, Star, Zap } from "lucide-react";

const icons = { crown: Crown, flame: Flame, ghost: Ghost, rocket: Rocket, star: Star, zap: Zap };
export function TeamAvatar({ avatar, color, className = "h-6 w-6" }: { avatar: string; color?: string; className?: string }) {
  const Icon = icons[avatar as keyof typeof icons] ?? Zap;
  return <Icon aria-hidden="true" className={className} style={{ color }} strokeWidth={2.3} />;
}
