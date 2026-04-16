import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { derived } from "../../lib/derivedData";
import { fmtDate } from "../../lib/format";

const TITLES: Record<string, string> = {
  "/": "Overview",
  "/plays": "Plays Explorer",
  "/officials": "Officials",
  "/games": "Games",
  "/insights": "Insights",
  "/whistlestop": "Whistle Stop Integration",
};

interface Props {
  onOpenNav: () => void;
}

export default function Topbar({ onOpenNav }: Props) {
  const loc = useLocation();
  let title = TITLES[loc.pathname] || "";
  if (!title) {
    if (loc.pathname.startsWith("/officials/")) title = "Official";
    else if (loc.pathname.startsWith("/games/")) title = "Game";
  }
  return (
    <header className="border-b border-ink-200 bg-ink-50 sticky top-0 z-20">
      <div className="px-5 md:px-10 h-16 flex items-center justify-between max-w-[1600px] w-full mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="icon-btn lg:hidden -ml-2"
            onClick={onOpenNav}
            aria-label="Open navigation"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <h1 className="text-sm font-semibold text-ink-800 tracking-tight truncate">
            {title || "Referee Portal"}
          </h1>
          <span className="hidden md:inline text-[11px] text-ink-500 tracking-wide">
            · updated {fmtDate(derived.generatedAt.slice(0, 10))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip-quiet">
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full bg-correct"
            />
            {derived.playCount.toLocaleString()} plays
          </span>
        </div>
      </div>
    </header>
  );
}
