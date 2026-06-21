type Props = {
  open: boolean;
  onClose: () => void;
};

const BINDINGS = [
  { keys: "Ctrl+K / ⌘K", action: "Open command palette" },
  { keys: "j / k", action: "Move selection in risk queue" },
  { keys: "Enter", action: "Focus detail panel, or generate brief when focused" },
  { keys: "/", action: "Focus command input" },
  { keys: "?", action: "Toggle this shortcuts overlay" },
  { keys: "Escape", action: "Close palette or shortcuts overlay" },
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
        className="ops-panel w-full max-w-md p-5 shadow-panel"
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
              <kbd className="rounded-ops border border-ops-line bg-ops-bg px-2 py-0.5 font-mono text-[11px] text-ops-amber">
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
