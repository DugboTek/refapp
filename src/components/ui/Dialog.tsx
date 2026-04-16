import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Rendered next to the title (e.g. a status chip). */
  headerAside?: ReactNode;
  /** Optional small line under the title. */
  subtitle?: ReactNode;
  children: ReactNode;
  labelId?: string;
}

/**
 * Real accessible dialog built on the native <dialog> element.
 *  - Native focus trap (Chromium/FF/Safari 15.4+).
 *  - ESC to close (native, via `cancel` event).
 *  - Focus returned to the triggering element on close.
 *  - role=dialog + aria-modal provided by the UA.
 */
export function Dialog({
  open,
  onClose,
  title,
  headerAside,
  subtitle,
  children,
  labelId = "dialog-title",
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      try {
        el.showModal();
      } catch {
        // In case the dialog is already open, ignore.
      }
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const handleClose = () => onClose();
    el.addEventListener("cancel", handleCancel);
    el.addEventListener("close", handleClose);
    return () => {
      el.removeEventListener("cancel", handleCancel);
      el.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  // Click on backdrop (outside the inner panel) closes.
  const onMouseDown = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelId}
      className="items-start justify-center p-0 m-0 w-screen h-screen fixed inset-0"
      onMouseDown={onMouseDown}
    >
      <div
        className="bg-white border border-ink-200 max-w-2xl w-[calc(100vw-2rem)] mx-auto mt-[8vh] shadow-[0_20px_60px_-20px_rgba(19,17,12,0.25)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5 border-b border-ink-100 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            {subtitle ? (
              <div className="eyebrow mb-2">{subtitle}</div>
            ) : null}
            <div
              id={labelId}
              className="font-display text-2xl leading-[1.1] tracking-tight text-ink-900"
              style={{ fontVariationSettings: '"opsz" 72' }}
            >
              {title}
            </div>
          </div>
          <div className="flex items-start gap-2 shrink-0">
            {headerAside}
            <button
              type="button"
              className="icon-btn -mr-2 -mt-2"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </dialog>
  );
}
