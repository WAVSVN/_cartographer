type Props = {
  open: boolean;
  onClose: () => void;
};

const BINDINGS = [
  { keys: "↑ / ↓", action: "Move selection in priority queue" },
  { keys: "j / k", action: "Same — down / up in queue (vim-style)" },
  { keys: "[ / ]", action: "Cycle queue filter (all → exception → …)" },
  { keys: "← / →", action: "Cycle screen (shift · capacity · deadlines · about)" },
  { keys: "Enter", action: "Focus site detail, or run summary when focused" },
  { keys: "Ctrl+K / ⌘K", action: "Jump to site or quick ask" },
  { keys: "/", action: "Focus what-if question box" },
  { keys: "?", action: "This overlay" },
  { keys: "Escape", action: "Close palette or shortcuts" },
];

export default function ShortcutsHelp({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ops-bg/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={onClose}
    >
      <div
        className="ops-panel w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="shortcuts-title" className="text-sm font-semibold">
            Keyboard shortcuts
          </h2>
          <button type="button" onClick={onClose} className="ops-btn-ghost text-[10px]">
            Close
          </button>
        </div>
        <ul className="space-y-2">
          {BINDINGS.map((b) => (
            <li key={b.keys} className="flex items-center justify-between gap-4 text-sm">
              <kbd className="border border-ops-line bg-black/60 px-2 py-0.5 font-mono text-[11px] text-ops-teal-hover">
                {b.keys}
              </kbd>
              <span className="text-right text-xs text-ops-muted">{b.action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
