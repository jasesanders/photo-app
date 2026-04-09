import { useState } from "react";

interface Pin {
  name: string;
  lat: string;
  lng: string;
  type: string;
  tags: string;
  notes: string;
  date: string;
}

const PIN_TYPES = [
  { id: "visited", name: "Visited" },
  { id: "work-trip", name: "Work Trip" },
  { id: "roller-derby", name: "Roller Derby" },
];

export default function MapPinEditor() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [newPin, setNewPin] = useState<Pin>({
    name: "",
    lat: "",
    lng: "",
    type: "visited",
    tags: "",
    notes: "",
    date: "",
  });

  const addPin = () => {
    if (!newPin.name || !newPin.lat || !newPin.lng) return;
    setPins((prev) => [...prev, { ...newPin }]);
    setNewPin({
      name: "",
      lat: "",
      lng: "",
      type: "visited",
      tags: "",
      notes: "",
      date: "",
    });
  };

  const removePin = (index: number) => {
    setPins((prev) => prev.filter((_, i) => i !== index));
  };

  const generateYaml = () => {
    let yaml = "places:\n";
    for (const pin of pins) {
      yaml += `  - name: "${pin.name}"\n`;
      yaml += `    lat: ${pin.lat}\n`;
      yaml += `    lng: ${pin.lng}\n`;
      yaml += `    type: "${pin.type}"\n`;
      if (pin.tags) {
        const tags = pin.tags.split(",").map((t) => t.trim()).filter(Boolean);
        yaml += `    tags: ${JSON.stringify(tags)}\n`;
      }
      if (pin.notes) yaml += `    notes: "${pin.notes}"\n`;
      if (pin.date) yaml += `    date: ${pin.date}\n`;
    }
    return yaml;
  };

  const handleExport = () => {
    const yaml = generateYaml();
    navigator.clipboard.writeText(yaml).then(() => {
      alert("YAML copied! Paste into src/content/pins/places.yaml");
    });
  };

  return (
    <div>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Map Pins</h2>
        {pins.length > 0 && (
          <button onClick={handleExport} style={exportBtnStyle}>
            Copy YAML
          </button>
        )}
      </div>

      <div style={infoStyle}>
        <p>
          Add places you've visited that don't have photo albums. Album locations
          are automatically added to the map from album frontmatter.
        </p>
      </div>

      {/* New pin form */}
      <div style={formStyle}>
        <h3 style={sectionLabelStyle}>Add Pin</h3>
        <div style={formGridStyle}>
          <InputField label="Name" value={newPin.name} onChange={(v) => setNewPin({ ...newPin, name: v })} placeholder="Berlin" />
          <InputField label="Latitude" value={newPin.lat} onChange={(v) => setNewPin({ ...newPin, lat: v })} placeholder="52.5200" />
          <InputField label="Longitude" value={newPin.lng} onChange={(v) => setNewPin({ ...newPin, lng: v })} placeholder="13.4050" />
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>Type</span>
            <select
              value={newPin.type}
              onChange={(e) => setNewPin({ ...newPin, type: e.target.value })}
              style={inputStyle}
            >
              {PIN_TYPES.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name}
                </option>
              ))}
            </select>
          </label>
          <InputField label="Tags" value={newPin.tags} onChange={(v) => setNewPin({ ...newPin, tags: v })} placeholder="travel, food" />
          <InputField label="Date" value={newPin.date} onChange={(v) => setNewPin({ ...newPin, date: v })} type="date" />
          <InputField label="Notes" value={newPin.notes} onChange={(v) => setNewPin({ ...newPin, notes: v })} placeholder="Short description" />
        </div>
        <button onClick={addPin} style={addBtnStyle} disabled={!newPin.name || !newPin.lat || !newPin.lng}>
          Add Pin
        </button>
      </div>

      {/* Pin list */}
      {pins.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3 style={sectionLabelStyle}>Pins ({pins.length})</h3>
          {pins.map((pin, i) => (
            <div key={i} style={pinRowStyle}>
              <div>
                <strong style={{ fontFamily: "var(--font-serif)" }}>{pin.name}</strong>
                <span style={pinMetaStyle}>
                  {pin.type} · {pin.lat}, {pin.lng}
                </span>
              </div>
              <button onClick={() => removePin(i)} style={removeBtnStyle}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* YAML preview */}
      {pins.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={sectionLabelStyle}>Generated YAML</h3>
          <pre style={previewStyle}>{generateYaml()}</pre>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1.5rem",
};

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "1.25rem",
  fontWeight: 500,
};

const exportBtnStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.8rem",
  padding: "0.5rem 1rem",
  background: "var(--color-accent)",
  color: "var(--color-bg)",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const infoStyle: React.CSSProperties = {
  padding: "1rem",
  background: "var(--color-bg-surface)",
  borderRadius: "8px",
  fontSize: "0.85rem",
  color: "var(--color-text-muted)",
  marginBottom: "1.5rem",
};

const formStyle: React.CSSProperties = {
  padding: "1.5rem",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "0.75rem",
  marginBottom: "1rem",
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--color-text-faint)",
  marginBottom: "0.75rem",
  fontWeight: 600,
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const fieldLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.65rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--color-text-faint)",
};

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.8rem",
  padding: "0.4rem 0.5rem",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  background: "var(--color-bg)",
  color: "var(--color-text)",
  outline: "none",
};

const addBtnStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.8rem",
  padding: "0.5rem 1rem",
  background: "var(--color-accent)",
  color: "var(--color-bg)",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const pinRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.75rem",
  borderBottom: "1px solid var(--color-border)",
};

const pinMetaStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  color: "var(--color-text-faint)",
  marginLeft: "0.75rem",
};

const removeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#A85B5B",
  cursor: "pointer",
  fontSize: "1.25rem",
  fontFamily: "var(--font-mono)",
};

const previewStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  background: "var(--color-bg-surface)",
  padding: "1rem",
  borderRadius: "8px",
  overflow: "auto",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  color: "var(--color-text-muted)",
};
