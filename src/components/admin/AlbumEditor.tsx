import { useState, useCallback } from "react";

interface Block {
  id: string;
  type: string;
  props: Record<string, any>;
}

interface AlbumMeta {
  title: string;
  date: string;
  locationName: string;
  lat: string;
  lng: string;
  region: string;
  tags: string;
  cover: string;
  description: string;
}

interface Props {
  albumSlug: string | null;
  onBack: () => void;
}

const BLOCK_TYPES = [
  {
    type: "SingleFeature",
    label: "Hero Image",
    icon: "▭",
    description: "Full-width featured image with caption",
  },
  {
    type: "TextBlock",
    label: "Text",
    icon: "¶",
    description: "Prose paragraph section",
  },
  {
    type: "PhotoGrid",
    label: "Photo Grid",
    icon: "▦",
    description: "Grid of images (2-4 columns)",
  },
  {
    type: "PhotoPair",
    label: "Photo Pair",
    icon: "▥",
    description: "Two images side by side",
  },
  {
    type: "PhotoEssay",
    label: "Photo + Text",
    icon: "◨",
    description: "Image alongside text content",
  },
  {
    type: "PhotoStrip",
    label: "Photo Strip",
    icon: "▤",
    description: "Horizontal scrolling image strip",
  },
  {
    type: "PullQuote",
    label: "Pull Quote",
    icon: "\"",
    description: "Large typographic quote",
  },
];

let blockCounter = 0;
function newBlockId() {
  return `block-${++blockCounter}`;
}

export default function AlbumEditor({ albumSlug, onBack }: Props) {
  const [meta, setMeta] = useState<AlbumMeta>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    locationName: "",
    lat: "",
    lng: "",
    region: "",
    tags: "",
    cover: "001",
    description: "",
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const addBlock = useCallback((type: string) => {
    const defaultProps: Record<string, any> = {};
    switch (type) {
      case "SingleFeature":
        defaultProps.id = "001";
        defaultProps.caption = "";
        break;
      case "TextBlock":
        defaultProps.text = "";
        break;
      case "PhotoGrid":
        defaultProps.ids = "001, 002, 003";
        defaultProps.columns = 3;
        break;
      case "PhotoPair":
        defaultProps.leftId = "001";
        defaultProps.leftCaption = "";
        defaultProps.rightId = "002";
        defaultProps.rightCaption = "";
        break;
      case "PhotoEssay":
        defaultProps.imageId = "001";
        defaultProps.position = "left";
        defaultProps.text = "";
        break;
      case "PhotoStrip":
        defaultProps.ids = "001, 002, 003, 004";
        break;
      case "PullQuote":
        defaultProps.text = "";
        defaultProps.attribution = "";
        break;
    }
    setBlocks((prev) => [
      ...prev,
      { id: newBlockId(), type, props: defaultProps },
    ]);
  }, []);

  const updateBlock = useCallback(
    (index: number, props: Record<string, any>) => {
      setBlocks((prev) =>
        prev.map((b, i) => (i === index ? { ...b, props: { ...b.props, ...props } } : b))
      );
    },
    []
  );

  const removeBlock = useCallback((index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveBlock = useCallback((from: number, to: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const generateMdx = useCallback(() => {
    const slug =
      albumSlug ||
      `${meta.date.split("-")[0]}/${meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

    let mdx = `---\ntitle: "${meta.title}"\ndate: ${meta.date}\n`;
    if (meta.lat && meta.lng) {
      mdx += `location:\n  lat: ${meta.lat}\n  lng: ${meta.lng}\n  name: "${meta.locationName}"\n`;
    }
    if (meta.region) mdx += `region: "${meta.region}"\n`;
    if (meta.tags) {
      const tags = meta.tags.split(",").map((t) => t.trim()).filter(Boolean);
      mdx += `tags: ${JSON.stringify(tags)}\n`;
    }
    mdx += `cover: "${meta.cover}"\n`;
    if (meta.description) mdx += `description: "${meta.description}"\n`;
    mdx += `---\n\n`;

    // Imports
    const usedTypes = new Set(blocks.map((b) => b.type));
    const depth = slug.split("/").length + 1;
    const prefix = "../".repeat(depth + 1);
    for (const type of usedTypes) {
      mdx += `import ${type} from "${prefix}components/blocks/${type}.astro";\n`;
    }
    mdx += "\n";

    // Blocks
    for (const block of blocks) {
      mdx += blockToMdx(block, slug) + "\n\n";
    }

    return mdx;
  }, [meta, blocks, albumSlug]);

  const handleExport = () => {
    const mdx = generateMdx();
    navigator.clipboard.writeText(mdx).then(() => {
      alert("MDX copied to clipboard! Paste it into your album's index.mdx file.");
    });
  };

  return (
    <div>
      <div style={editorHeaderStyle}>
        <button onClick={onBack} style={backBtnStyle}>
          &larr; Back
        </button>
        <h2 style={editorTitleStyle}>
          {albumSlug ? `Editing: ${albumSlug}` : "New Album"}
        </h2>
        <button onClick={handleExport} style={exportBtnStyle}>
          Copy MDX
        </button>
      </div>

      {/* Metadata form */}
      <div style={metaSectionStyle}>
        <h3 style={sectionLabelStyle}>Album Details</h3>
        <div style={metaGridStyle}>
          <Field label="Title" value={meta.title} onChange={(v) => setMeta({ ...meta, title: v })} />
          <Field label="Date" value={meta.date} onChange={(v) => setMeta({ ...meta, date: v })} type="date" />
          <Field label="Location" value={meta.locationName} onChange={(v) => setMeta({ ...meta, locationName: v })} placeholder="e.g., Tokyo, Japan" />
          <Field label="Latitude" value={meta.lat} onChange={(v) => setMeta({ ...meta, lat: v })} placeholder="35.6762" />
          <Field label="Longitude" value={meta.lng} onChange={(v) => setMeta({ ...meta, lng: v })} placeholder="139.6503" />
          <Field label="Region" value={meta.region} onChange={(v) => setMeta({ ...meta, region: v })} placeholder="asia, europe, north-america..." />
          <Field label="Tags" value={meta.tags} onChange={(v) => setMeta({ ...meta, tags: v })} placeholder="travel, street, food" />
          <Field label="Cover Image ID" value={meta.cover} onChange={(v) => setMeta({ ...meta, cover: v })} placeholder="001" />
          <Field label="Description" value={meta.description} onChange={(v) => setMeta({ ...meta, description: v })} placeholder="Short description" fullWidth />
        </div>
      </div>

      {/* Block palette + editor */}
      <div style={editorLayoutStyle}>
        <div style={paletteStyle}>
          <h3 style={sectionLabelStyle}>Blocks</h3>
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => addBlock(bt.type)}
              style={paletteItemStyle}
              title={bt.description}
            >
              <span style={paletteIconStyle}>{bt.icon}</span>
              <span>{bt.label}</span>
            </button>
          ))}
        </div>

        <div style={canvasStyle}>
          <h3 style={sectionLabelStyle}>Layout</h3>
          {blocks.length === 0 ? (
            <div style={emptyStyle}>
              Click a block type on the left to start building your album layout.
            </div>
          ) : (
            blocks.map((block, i) => (
              <BlockEditor
                key={block.id}
                block={block}
                index={i}
                total={blocks.length}
                onUpdate={(props) => updateBlock(i, props)}
                onRemove={() => removeBlock(i)}
                onMoveUp={() => i > 0 && moveBlock(i, i - 1)}
                onMoveDown={() => i < blocks.length - 1 && moveBlock(i, i + 1)}
              />
            ))
          )}
        </div>
      </div>

      {/* MDX Preview */}
      {blocks.length > 0 && (
        <div style={previewSectionStyle}>
          <h3 style={sectionLabelStyle}>Generated MDX</h3>
          <pre style={previewCodeStyle}>{generateMdx()}</pre>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  fullWidth,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  fullWidth?: boolean;
}) {
  return (
    <label style={{ ...fieldStyle, ...(fullWidth ? { gridColumn: "1 / -1" } : {}) }}>
      <span style={fieldLabelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={fieldInputStyle}
      />
    </label>
  );
}

function BlockEditor({
  block,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: Block;
  index: number;
  total: number;
  onUpdate: (props: Record<string, any>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const blockType = BLOCK_TYPES.find((bt) => bt.type === block.type);

  return (
    <div style={blockEditorStyle}>
      <div style={blockHeaderStyle}>
        <span style={blockTypeStyle}>
          {blockType?.icon} {blockType?.label}
        </span>
        <div style={blockActionsStyle}>
          {index > 0 && (
            <button onClick={onMoveUp} style={smallBtnStyle} title="Move up">
              ↑
            </button>
          )}
          {index < total - 1 && (
            <button onClick={onMoveDown} style={smallBtnStyle} title="Move down">
              ↓
            </button>
          )}
          <button onClick={onRemove} style={{ ...smallBtnStyle, color: "#A85B5B" }} title="Remove">
            ×
          </button>
        </div>
      </div>
      <div style={blockFieldsStyle}>
        {renderBlockFields(block, onUpdate)}
      </div>
    </div>
  );
}

function renderBlockFields(
  block: Block,
  onUpdate: (props: Record<string, any>) => void
) {
  const p = block.props;

  switch (block.type) {
    case "SingleFeature":
      return (
        <>
          <Field label="Image ID" value={p.id} onChange={(v) => onUpdate({ id: v })} placeholder="001" />
          <Field label="Caption" value={p.caption} onChange={(v) => onUpdate({ caption: v })} />
        </>
      );
    case "TextBlock":
      return (
        <label style={fieldStyle}>
          <span style={fieldLabelStyle}>Text</span>
          <textarea
            value={p.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            style={{ ...fieldInputStyle, minHeight: "80px", resize: "vertical" }}
          />
        </label>
      );
    case "PhotoGrid":
      return (
        <>
          <Field label="Image IDs (comma-separated)" value={p.ids} onChange={(v) => onUpdate({ ids: v })} placeholder="001, 002, 003" />
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>Columns</span>
            <select
              value={p.columns}
              onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
              style={fieldInputStyle}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
        </>
      );
    case "PhotoPair":
      return (
        <>
          <Field label="Left Image ID" value={p.leftId} onChange={(v) => onUpdate({ leftId: v })} />
          <Field label="Left Caption" value={p.leftCaption} onChange={(v) => onUpdate({ leftCaption: v })} />
          <Field label="Right Image ID" value={p.rightId} onChange={(v) => onUpdate({ rightId: v })} />
          <Field label="Right Caption" value={p.rightCaption} onChange={(v) => onUpdate({ rightCaption: v })} />
        </>
      );
    case "PhotoEssay":
      return (
        <>
          <Field label="Image ID" value={p.imageId} onChange={(v) => onUpdate({ imageId: v })} />
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>Image Position</span>
            <select
              value={p.position}
              onChange={(e) => onUpdate({ position: e.target.value })}
              style={fieldInputStyle}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
            <span style={fieldLabelStyle}>Text</span>
            <textarea
              value={p.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              style={{ ...fieldInputStyle, minHeight: "80px", resize: "vertical" }}
            />
          </label>
        </>
      );
    case "PhotoStrip":
      return (
        <Field label="Image IDs (comma-separated)" value={p.ids} onChange={(v) => onUpdate({ ids: v })} placeholder="001, 002, 003, 004" fullWidth />
      );
    case "PullQuote":
      return (
        <>
          <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
            <span style={fieldLabelStyle}>Quote</span>
            <textarea
              value={p.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              style={{ ...fieldInputStyle, minHeight: "60px", resize: "vertical" }}
            />
          </label>
          <Field label="Attribution" value={p.attribution} onChange={(v) => onUpdate({ attribution: v })} placeholder="Optional author" />
        </>
      );
    default:
      return null;
  }
}

function blockToMdx(block: Block, albumSlug: string): string {
  const p = block.props;

  switch (block.type) {
    case "SingleFeature":
      return `<SingleFeature albumSlug="${albumSlug}" id="${p.id}"${p.caption ? ` caption="${p.caption}"` : ""} />`;
    case "TextBlock":
      return `<TextBlock>\n${p.text}\n</TextBlock>`;
    case "PhotoGrid": {
      const ids = p.ids
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      return `<PhotoGrid albumSlug="${albumSlug}" ids={${JSON.stringify(ids)}} columns={${p.columns}} />`;
    }
    case "PhotoPair":
      return `<PhotoPair\n  albumSlug="${albumSlug}"\n  left={{ id: "${p.leftId}"${p.leftCaption ? `, caption: "${p.leftCaption}"` : ""} }}\n  right={{ id: "${p.rightId}"${p.rightCaption ? `, caption: "${p.rightCaption}"` : ""} }}\n/>`;
    case "PhotoEssay":
      return `<PhotoEssay albumSlug="${albumSlug}" imageId="${p.imageId}" imagePosition="${p.position}">\n${p.text}\n</PhotoEssay>`;
    case "PhotoStrip": {
      const ids = p.ids
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      return `<PhotoStrip albumSlug="${albumSlug}" ids={${JSON.stringify(ids)}} />`;
    }
    case "PullQuote":
      return `<PullQuote${p.attribution ? ` attribution="${p.attribution}"` : ""}>${p.text}</PullQuote>`;
    default:
      return "";
  }
}

// Styles
const editorHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "2rem",
};

const backBtnStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.8rem",
  padding: "0.4rem 0.8rem",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  background: "none",
  color: "var(--color-text-muted)",
  cursor: "pointer",
};

const editorTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: "1.25rem",
  fontWeight: 500,
  flex: 1,
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

const metaSectionStyle: React.CSSProperties = {
  marginBottom: "2rem",
  padding: "1.5rem",
  background: "var(--color-bg-surface)",
  borderRadius: "8px",
};

const metaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "0.75rem",
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

const editorLayoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "200px 1fr",
  gap: "1.5rem",
  marginBottom: "2rem",
};

const paletteStyle: React.CSSProperties = {
  position: "sticky",
  top: "5rem",
  alignSelf: "start",
};

const paletteItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  width: "100%",
  padding: "0.5rem",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  background: "none",
  color: "var(--color-text-muted)",
  cursor: "pointer",
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  marginBottom: "0.4rem",
  transition: "border-color 0.15s, color 0.15s",
  textAlign: "left",
};

const paletteIconStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  width: "1.5rem",
  textAlign: "center",
};

const canvasStyle: React.CSSProperties = {
  minHeight: "300px",
};

const emptyStyle: React.CSSProperties = {
  padding: "3rem",
  textAlign: "center",
  border: "2px dashed var(--color-border)",
  borderRadius: "8px",
  color: "var(--color-text-faint)",
  fontFamily: "var(--font-serif)",
  fontSize: "0.9rem",
};

const blockEditorStyle: React.CSSProperties = {
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  marginBottom: "0.75rem",
  overflow: "hidden",
};

const blockHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.5rem 0.75rem",
  background: "var(--color-bg-surface)",
  borderBottom: "1px solid var(--color-border)",
};

const blockTypeStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--color-text-muted)",
};

const blockActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.25rem",
};

const smallBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "0.2rem 0.4rem",
  fontSize: "0.85rem",
  color: "var(--color-text-muted)",
  fontFamily: "var(--font-mono)",
};

const blockFieldsStyle: React.CSSProperties = {
  padding: "0.75rem",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.5rem",
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

const fieldInputStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.8rem",
  padding: "0.4rem 0.5rem",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  background: "var(--color-bg)",
  color: "var(--color-text)",
  outline: "none",
  width: "100%",
};

const previewSectionStyle: React.CSSProperties = {
  marginTop: "2rem",
  paddingTop: "2rem",
  borderTop: "1px solid var(--color-border)",
};

const previewCodeStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  background: "var(--color-bg-surface)",
  padding: "1.5rem",
  borderRadius: "8px",
  overflow: "auto",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  color: "var(--color-text-muted)",
};
