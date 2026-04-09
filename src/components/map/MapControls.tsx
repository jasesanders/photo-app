interface PinTypeConfig {
  id: string;
  name: string;
  color: string;
}

interface Props {
  pinTypes: PinTypeConfig[];
  activeFilters: Set<string>;
  onToggle: (typeId: string) => void;
}

export default function MapControls({
  pinTypes,
  activeFilters,
  onToggle,
}: Props) {
  return (
    <div
      style={{
        position: "absolute",
        top: "1rem",
        left: "1rem",
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 10,
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        minWidth: "160px",
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--color-text-faint)",
          fontWeight: 600,
          marginBottom: "0.25rem",
        }}
      >
        Pin Types
      </div>
      {pinTypes.map((pt) => (
        <label
          key={pt.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            color: activeFilters.has(pt.id)
              ? "var(--color-text)"
              : "var(--color-text-faint)",
            transition: "color 0.15s ease",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: activeFilters.has(pt.id) ? pt.color : "var(--color-border)",
              transition: "background 0.15s ease",
              flexShrink: 0,
            }}
          />
          <input
            type="checkbox"
            checked={activeFilters.has(pt.id)}
            onChange={() => onToggle(pt.id)}
            style={{ display: "none" }}
          />
          {pt.name}
        </label>
      ))}
    </div>
  );
}
