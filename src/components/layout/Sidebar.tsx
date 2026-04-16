import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  Table,
  Users,
  Gamepad2,
  Sparkles,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
}

const nav: NavItem[] = [
  { to: "/", label: "Overview", Icon: LayoutDashboard, end: true },
  { to: "/plays", label: "Plays", Icon: Table },
  { to: "/officials", label: "Officials", Icon: Users },
  { to: "/games", label: "Games", Icon: Gamepad2 },
  { to: "/insights", label: "Insights", Icon: Sparkles },
  { to: "/whistlestop", label: "Whistle Stop", Icon: Timer },
];

interface Props {
  /** When true, renders in a slimmer mobile drawer style. */
  inDrawer?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ inDrawer = false, onNavigate }: Props) {
  return (
    <aside
      className={clsx(
        "flex shrink-0 flex-col bg-ink-50 border-r border-ink-200",
        inDrawer ? "w-72 h-full" : "hidden lg:flex w-60",
      )}
      aria-label="Primary navigation"
    >
      <div className="px-6 py-7 border-b border-ink-200">
        <div className="flex items-baseline gap-2.5">
          <span
            className="font-display text-[28px] leading-none tracking-tight text-ink-900"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1' }}
          >
            Referee
          </span>
          <span className="text-[10px] tracking-[0.18em] uppercase text-brand-600 font-semibold">
            Portal
          </span>
        </div>
        <div className="text-[11px] text-ink-500 mt-1.5 tracking-wide">
          Evaluations & Whistle Stop · 2024–26
        </div>
      </div>
      <nav className="p-3 flex flex-col gap-0.5">
        {nav.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx("nav-link", isActive && "nav-link-active")
            }
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-5 text-[11px] text-ink-500 leading-relaxed border-t border-ink-200">
        <div className="font-display text-ink-800 text-base leading-tight mb-1">
          10,000+
        </div>
        plays evaluated across 262 games
        <br />
        Big 12 · WCC · BWC Men's Basketball
        <br />
        + Whistle Stop live data
      </div>
    </aside>
  );
}
