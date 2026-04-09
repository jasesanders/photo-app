import { useState } from "react";
import AlbumEditor from "./AlbumEditor";
import AlbumList from "./AlbumList";
import MapPinEditor from "./MapPinEditor";

type View = "albums" | "editor" | "pins";

export default function AdminApp() {
  const [view, setView] = useState<View>("albums");
  const [editingAlbum, setEditingAlbum] = useState<string | null>(null);

  const handleEditAlbum = (slug: string) => {
    setEditingAlbum(slug);
    setView("editor");
  };

  const handleNewAlbum = () => {
    setEditingAlbum(null);
    setView("editor");
  };

  const handleBack = () => {
    setView("albums");
    setEditingAlbum(null);
  };

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Admin</h1>
        <nav style={navStyle}>
          <button
            onClick={() => setView("albums")}
            style={view === "albums" || view === "editor" ? activeTabStyle : tabStyle}
          >
            Albums
          </button>
          <button
            onClick={() => setView("pins")}
            style={view === "pins" ? activeTabStyle : tabStyle}
          >
            Map Pins
          </button>
        </nav>
      </div>

      {view === "albums" && (
        <AlbumList onEdit={handleEditAlbum} onNew={handleNewAlbum} />
      )}
      {view === "editor" && (
        <AlbumEditor albumSlug={editingAlbum} onBack={handleBack} />
      )}
      {view === "pins" && <MapPinEditor />}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "2rem",
  paddingBottom: "1rem",
  borderBottom: "1px solid var(--color-border)",
};

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "1.5rem",
  fontWeight: 500,
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
};

const tabStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.8rem",
  padding: "0.4rem 0.8rem",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  background: "none",
  color: "var(--color-text-muted)",
  cursor: "pointer",
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  background: "var(--color-bg-surface)",
  color: "var(--color-text)",
};
