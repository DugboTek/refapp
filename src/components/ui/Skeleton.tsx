import clsx from "clsx";

interface Props {
  className?: string;
  /** Accessible label announced to assistive tech. */
  label?: string;
}

export function Skeleton({ className, label = "Loading" }: Props) {
  return (
    <div
      role="status"
      aria-label={label}
      className={clsx(
        "relative overflow-hidden bg-ink-100 rounded",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        "before:animate-[shimmer_1.6s_infinite]",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Tailwind doesn't know about the shimmer keyframe — inject it once at module load.
const css = `@keyframes shimmer { 100% { transform: translateX(100%); } }`;
if (typeof document !== "undefined" && !document.getElementById("shimmer-kf")) {
  const style = document.createElement("style");
  style.id = "shimmer-kf";
  style.textContent = css;
  document.head.appendChild(style);
}
