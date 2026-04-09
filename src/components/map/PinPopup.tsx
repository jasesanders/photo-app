import { useEffect } from "react";
import type { MapPin } from "./InteractiveMap";

interface Props {
  pin: MapPin;
}

export default function PinPopup({ pin }: Props) {
  useEffect(() => {
    // Render into the popup container created by MapLibre
    const container = document.getElementById("popup-content");
    if (!container) return;

    container.innerHTML = `
      <div style="font-family: var(--font-serif); padding: 0.25rem;">
        <div style="font-size: 1rem; font-weight: 500; margin-bottom: 0.25rem; color: var(--color-text);">
          ${pin.name}
        </div>
        ${
          pin.date
            ? `<div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">
                ${new Date(pin.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>`
            : ""
        }
        ${
          pin.notes
            ? `<div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.5rem; line-height: 1.4;">
                ${pin.notes}
              </div>`
            : ""
        }
        ${
          pin.tags.length > 0
            ? `<div style="display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.5rem;">
                ${pin.tags.map((t) => `<span style="font-family: var(--font-mono); font-size: 0.65rem; background: var(--color-bg-surface); padding: 0.1rem 0.4rem; border-radius: 2px; color: var(--color-text-muted);">${t}</span>`).join("")}
              </div>`
            : ""
        }
        ${
          pin.albumSlug
            ? `<a href="/albums/${pin.albumSlug}" style="display: inline-block; font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-accent); text-decoration: none; margin-top: 0.25rem;">
                View Album &rarr;
              </a>`
            : ""
        }
      </div>
    `;
  }, [pin]);

  return null;
}
