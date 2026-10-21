export function ReaderControls({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="reader-controls-toggle"
      aria-label={visible ? "إخفاء أدوات القراءة" : "إظهار أدوات القراءة"}
      aria-expanded={visible}
      onClick={onToggle}
    >
      {visible ? "قراءة غامرة" : "أدوات القراءة"}
    </button>
  );
}
