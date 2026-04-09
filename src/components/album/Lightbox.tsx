import { useState, useEffect, useCallback } from "react";

interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface Props {
  images: LightboxImage[];
}

export default function Lightbox({ images }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const open = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "";
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          close();
          break;
        case "ArrowRight":
          next();
          break;
        case "ArrowLeft":
          prev();
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, close, next, prev]);

  // Listen for custom events from album images
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.index === "number") {
        open(detail.index);
      }
    };
    window.addEventListener("lightbox:open", handler);
    return () => window.removeEventListener("lightbox:open", handler);
  }, [open]);

  if (!isOpen) return null;

  const image = images[currentIndex];

  return (
    <div style={overlayStyle} onClick={close}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <img
          src={image.src}
          alt={image.alt}
          style={imgStyle}
        />
        {image.caption && (
          <div style={captionStyle}>{image.caption}</div>
        )}
        <div style={counterStyle}>
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{ ...navBtnStyle, left: "1rem" }}
            aria-label="Previous image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{ ...navBtnStyle, right: "1rem" }}
            aria-label="Next image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      <button
        onClick={close}
        style={closeBtnStyle}
        aria-label="Close lightbox"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  background: "rgba(10, 10, 10, 0.95)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const contentStyle: React.CSSProperties = {
  position: "relative",
  maxWidth: "90vw",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  cursor: "default",
};

const imgStyle: React.CSSProperties = {
  maxWidth: "100%",
  maxHeight: "85vh",
  objectFit: "contain",
};

const captionStyle: React.CSSProperties = {
  color: "#E8E4DF",
  fontFamily: "var(--font-serif)",
  fontSize: "0.9rem",
  fontStyle: "italic",
  marginTop: "1rem",
  textAlign: "center",
};

const counterStyle: React.CSSProperties = {
  color: "#706A64",
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  marginTop: "0.5rem",
};

const navBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "#E8E4DF",
  cursor: "pointer",
  padding: "1rem",
  opacity: 0.7,
  transition: "opacity 0.2s",
  zIndex: 101,
};

const closeBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: "1rem",
  right: "1rem",
  background: "none",
  border: "none",
  color: "#E8E4DF",
  cursor: "pointer",
  padding: "0.5rem",
  opacity: 0.7,
  zIndex: 101,
};
