import pkmVersions from "../../../data-schema/PKM_VERSIONS.json";

// Standard in-app version footer per Architecture Guidance v1.7.0 §8.1: reads the single
// /data-schema/PKM_VERSIONS.json source of truth (bundled at build time via this JSON import,
// this app's own adaptation of §8.1's "fetch, not embedded constants" for a Vite SPA that
// already imports shared repo-root content this way -- see e.g. sempExport.ts's methodology
// imports) rather than a separately hand-maintained TS constant. §8.1 exists precisely because
// the old pattern (two hardcoded constants, no verification mechanism) let this exact footer
// drift two version bumps stale before anyone noticed by hand -- see CHANGELOG.md.
export function ArchitectureFooter() {
  const docPath = `vendor/architecture-guidance-v${pkmVersions.architectureGuidanceVersion}.md`;
  return (
    <footer className="architecture-footer">
      <a href={`https://github.com/RonClemens/MK--710-SSR-SysEng-Story/blob/main/${docPath}`} target="_blank" rel="noreferrer">
        Architecture: v{pkmVersions.architectureGuidanceVersion} ({pkmVersions.architectureGuidanceDate})
      </a>
    </footer>
  );
}
