# /data-schema

Per [Architecture Guidance](/vendor/architecture-guidance-v1.8.0.md) §2, `/data-schema` is meant to hold the
**shape** of program data (field definitions), not actual content — the part of the app that says "a
Configuration Item has these fields" without asserting what any real CI is named.

## Where this actually lives in this app

This app's data-schema content is **not physically relocated to this directory**. It stays at
`client/src/types/index.ts`, which already satisfies the guidance's shape-only requirement — it defines every
entity (`ConfigurationItem`, `LogicalSubsystem`, `Specification`, `SafetyDeliverable`,
`ProgramPlanningDeliverable`, `InterfaceRecord`, etc.) as TypeScript interfaces with no embedded program content.

The pragmatic reason for keeping it in place rather than moving it here: `client/src/types/index.ts` is imported
by nearly every page and component in the client app. A physical relocation would be pure import-path churn with
no content change and no functional benefit, unlike `/methodology/guidance` (which benefited from relocation since
it's the target of the future content-split work). This directory exists so `/data-schema` is a real, documented
address in this app's tree — even though the file living at the far end of that address hasn't moved — consistent
with the Architecture Guidance's own precedent of documenting a pragmatic adaptation rather than silently deviating
from the literal directory convention (see `/methodology/README.md`'s note on `/ui`).

If a future version of this app (or a sibling app in the same family) finds it valuable to physically consolidate
schema definitions here — e.g., to vendor `/data-schema` independently of the rest of the client app — that's a
reasonable future step, not required by the current guidance version.

## §9 UDM forward-compatibility check (2026-07-25)

Checked `client/src/types/index.ts` and `/mock-data/seed.json` against the three cheap conventions in the
guidance's §9 (non-blocking, but cheap to apply while already touching this area):

1. **Stable external IDs** — already compliant. Every entity uses a meaningful, stable `id: string` (`ci-001`,
   `spec-003`, `safety-009`, `sub-b-002`, etc.), not a raw database auto-increment integer.
2. **Shape-only, minimal `/data-schema` definitions** — already compliant, per the note above.
3. **Explicit reference fields, not denormalized text** — already compliant. Relationships are modeled as typed ID
   fields throughout: `DeltaMatrixRow.ciId`, `Recommendation.relatedCiId`, `Specification.linkedSubsystemId` /
   `linkedCiId`, `InterfaceRecord.aId` / `bId`, `ConfigurationItem.subsystemIds`, `SafetyDeliverable.linkedCiId` /
   `linkedSubsystemId`. No relationship in this app's schema is currently expressed as a prose sentence inside a
   description field.

No changes were needed as a result of this check.

## `PKM_VERSIONS.json` (Architecture Guidance §8.1)

`PKM_VERSIONS.json` in this directory is the single source of truth for the vendored Architecture
Guidance and PKM Entity Model versions/dates this app currently conforms to — read by the in-app
footer (`client/src/components/ArchitectureFooter.tsx`) and included as a `meta` block in this
app's data exports (Export JSON, SEMP Migration package), per §8.1. Update this one file whenever
`/vendor/architecture-guidance-vX.Y.Z.md` is re-vendored — nowhere else needs a matching manual
edit, which is the entire point: the prior approach (separate hardcoded `ARCHITECTURE_VERSION`/
`ARCHITECTURE_DATE` TS constants) let the footer drift two version bumps stale before anyone
noticed, per §8.1's own account of that failure.
