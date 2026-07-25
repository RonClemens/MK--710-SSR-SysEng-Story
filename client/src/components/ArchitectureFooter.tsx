import { ARCHITECTURE_DATE, ARCHITECTURE_DOC_PATH, ARCHITECTURE_VERSION } from "../config/architectureVersion";

// Standard in-app version footer per Architecture Guidance v1.3.0 §8.1, adapted for an
// SPA (see that section's note for framework-based apps) rather than pasted as single-file
// HTML/JS. Update client/src/config/architectureVersion.ts in the same commit as any bump to
// /vendor/architecture-guidance-vX.Y.Z.md.
export function ArchitectureFooter() {
  return (
    <footer className="architecture-footer">
      <a
        href={`https://github.com/RonClemens/MK--710-SSR-SysEng-Story/blob/main/${ARCHITECTURE_DOC_PATH}`}
        target="_blank"
        rel="noreferrer"
      >
        Architecture: v{ARCHITECTURE_VERSION} ({ARCHITECTURE_DATE})
      </a>
    </footer>
  );
}
