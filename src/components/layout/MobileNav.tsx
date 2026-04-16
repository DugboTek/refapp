import { useEffect } from "react";
import Sidebar from "./Sidebar";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: Props) {
  // Lock background scroll while the drawer is open + ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-ink-900/30"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-[0_0_60px_-10px_rgba(19,17,12,0.3)]">
        <Sidebar inDrawer onNavigate={onClose} />
      </div>
    </div>
  );
}
