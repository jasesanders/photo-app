interface Props {
  onEdit: (slug: string) => void;
  onNew: () => void;
}

export default function AlbumList({ onEdit, onNew }: Props) {
  // In a full implementation, this would fetch from an API route.
  // For now, it shows the static instructions.
  return (
    <div>
      <div style={toolbarStyle}>
        <h2 style={sectionTitleStyle}>Albums</h2>
        <button onClick={onNew} style={btnStyle}>
          + New Album
        </button>
      </div>

      <div style={infoStyle}>
        <p>
          Albums are stored as MDX files in{" "}
          <code style={codeStyle}>src/content/albums/</code>. Each album has:
        </p>
        <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
          <li>
            <code style={codeStyle}>index.mdx</code> — layout and content
          </li>
          <li>
            <code style={codeStyle}>meta.json</code> — image manifest and EXIF
            data
          </li>
        </ul>
        <p style={{ marginTop: "1rem" }}>
          Use the block editor below to compose album layouts visually, or edit
          the MDX files directly.
        </p>
      </div>

      <div style={quickActionsStyle}>
        <h3 style={subHeadingStyle}>Quick Actions</h3>
        <div style={actionGridStyle}>
          <ActionCard
            title="Import from Lightroom"
            description="Import album folders exported from Lightroom Classic"
            command="npx tsx scripts/import-lightroom.ts ~/path/to/export"
          />
          <ActionCard
            title="Process Images"
            description="Generate responsive variants for a folder of images"
            command="npx tsx scripts/process-images.ts ~/photos/folder album-slug"
          />
          <ActionCard
            title="Upload to R2"
            description="Upload processed images to Cloudflare R2"
            command="npx tsx scripts/upload-to-r2.ts [album-slug]"
          />
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  command,
}: {
  title: string;
  description: string;
  command: string;
}) {
  return (
    <div style={cardStyle}>
      <h4 style={cardTitleStyle}>{title}</h4>
      <p style={cardDescStyle}>{description}</p>
      <code style={commandStyle}>{command}</code>
    </div>
  );
}

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1.5rem",
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "1.25rem",
  fontWeight: 500,
};

const btnStyle: React.CSSProperties = {
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
  padding: "1.5rem",
  background: "var(--color-bg-surface)",
  borderRadius: "8px",
  fontSize: "0.9rem",
  lineHeight: 1.6,
  marginBottom: "2rem",
};

const codeStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.8rem",
  background: "var(--color-bg-elevated)",
  padding: "0.15rem 0.4rem",
  borderRadius: "3px",
};

const quickActionsStyle: React.CSSProperties = {
  marginTop: "2rem",
};

const subHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--color-text-faint)",
  marginBottom: "1rem",
};

const actionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "1rem",
};

const cardStyle: React.CSSProperties = {
  padding: "1.25rem",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "1rem",
  fontWeight: 500,
  marginBottom: "0.5rem",
};

const cardDescStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "var(--color-text-muted)",
  marginBottom: "0.75rem",
  lineHeight: 1.5,
};

const commandStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.7rem",
  background: "var(--color-bg-surface)",
  padding: "0.4rem 0.6rem",
  borderRadius: "4px",
  display: "block",
  overflowX: "auto",
  color: "var(--color-text-muted)",
};
