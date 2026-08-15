import type { CdrlPathModel, CdrlPathNode, CdrlPathWorkflowOverlay } from "../types/cdrlPath";
import { maturityStatesForLevel } from "./cdrlPathMaturityMarkers";
import { computeReadiness, readinessReasonText } from "./cdrlPathReadiness";

// Exportable instructional material discipline leads (and eventually the whole team, including
// the customer) can use for training/onboarding — per the Subway Design chat's 2026-08-15
// spec, consolidated from their two prototype documents (Discipline Guide, using Safety &
// Reliability as the worked example; All-Stakeholder Orientation Guide). Both read live model
// state directly — no export/sync step, no periodically-mirrored copy — so regenerating a guide
// after any reference-model or readiness change just means re-clicking the export button (see
// CdrlPathGuideExport.tsx). Markdown + Mermaid, matching the prototypes' format; not PDF/PPTX.
//
// Two kinds of content this module deliberately does NOT invent:
// 1. Non-exact timing (recurring ranges, contract-day/board markers) is never force-placed into
//    the Mermaid gantt — same "precise index, not best-effort placement" principle
//    generateStationSummaryBySetrEvent and buildCdrlMaturityMatrix already established. It's
//    listed separately instead.
// 2. Plain-language "what does this discipline contribute" prose isn't derivable from CDRL
//    titles — it's institutional framing, not structured data. Per Ron's 2026-08-15 call
//    (placeholder now, decide authorship later), both the Discipline Guide's role-framing
//    paragraph and the Orientation Guide's per-domain contribution blurbs render a clearly
//    marked placeholder rather than invented copy.
// 3. `notes` (internal model-curation history — "added node," "was mislabeled," commentary
//    referencing Ron/earlier drafts) is never shown here — per the design chat's 2026-08-15
//    content-review finding, it was leaking into exported guides with no context an external
//    reader would have. Special Considerations reads only `team_facing_note`, a separate field
//    (see its doc comment in cdrlPath.ts) that's undefined until a hand-curation pass populates
//    it — same placeholder-now-author-later treatment as #2, just silent rather than a marker.

function domainBlurbPlaceholder(kind: "role-framing" | "contribution"): string {
  return kind === "role-framing"
    ? "[PLACEHOLDER — this discipline's role-framing paragraph hasn't been authored yet. See docs/cdrl-path/DECISIONS.md: placeholder now, authorship sequenced separately.]"
    : "[PLACEHOLDER — plain-language description of what this discipline contributes hasn't been authored yet.]";
}

// Standard DoD acquisition-phase meanings (MSA/TMRR/EMD/P&D/O&S) — public, well-established
// terminology, not org-specific institutional knowledge, so unlike the domain-contribution
// blurbs above these are safe to author directly rather than placeholder. Flag to Ron/the
// design chat if any read wrong for this program's actual phase tailoring.
//
// EMD's label was "Building & Testing" until the design chat flagged it (2026-08-15): PDR and
// CDR both fall inside EMD in this model's own lifecycle_lanes, so that label undersold the
// design-maturation work happening there and risked implying design was already finished.
const PHASE_PLAIN_LABELS: Record<string, string> = {
  MSA: "Early Planning",
  TMRR: "Requirements & Design Approach",
  EMD: "Detailed Design & Build",
  "P&D": "Production & Fielding",
  "O&S": "In Service & Sustained",
};

function domainShortLabel(label: string): string {
  return label.replace(/ CDRLs$/, "");
}

/** Every CDRL belonging to this domain, in reference-model order. */
function nodesInDomain(model: CdrlPathModel, domainId: string): CdrlPathNode[] {
  return model.nodes.filter((n) => n.domains.includes(domainId));
}

function cdrlTableSection(domainNodes: CdrlPathNode[]): string[] {
  const cell = (node: CdrlPathNode, stateName: string): string => {
    const match = maturityStatesForLevel(node, "SYSTEM").find((s) => s.state.toUpperCase() === stateName);
    if (!match) return "—";
    return match.recurring ? `${match.at_event} (recurring)` : match.at_event;
  };
  const rows = domainNodes.map(
    (node) => `| ${node.title} | ${node.did ?? "—"} | ${cell(node, "DRAFT")} | ${cell(node, "FINAL")} | ${cell(node, "UPDATE")} |`,
  );
  return ["| CDRL | DID | Draft | Final | Update |", "|---|---|---|---|---|", ...rows];
}

interface Milestone {
  label: string;
  eventId: string;
  phase: string;
}

function timelineSection(model: CdrlPathModel, domainNodes: CdrlPathNode[], shortLabel: string): string[] {
  const events = model.lifecycle_lanes.setr_events;
  const eventIndex = new Map(events.map((e, i) => [e.id, i]));
  const milestones: Milestone[] = [];
  const unresolved: string[] = [];

  domainNodes.forEach((node) => {
    maturityStatesForLevel(node, "SYSTEM").forEach((state) => {
      const atEvent = state.at_event.trim();
      const event = events.find((e) => e.id === atEvent);
      if (!event) {
        unresolved.push(`${node.title} (${state.state}) — ${state.at_event}${state.recurring ? ", recurring" : ""}`);
        return;
      }
      milestones.push({
        label: `${node.id} ${state.state}${state.recurring ? " (recurring)" : ""} (${event.id})`,
        eventId: event.id,
        phase: event.phase,
      });
    });
  });
  milestones.sort((a, b) => eventIndex.get(a.eventId)! - eventIndex.get(b.eventId)!);

  const byPhase = new Map<string, Milestone[]>();
  model.lifecycle_lanes.phases.forEach((p) => byPhase.set(p, []));
  milestones.forEach((m) => byPhase.get(m.phase)?.push(m));

  const out = ["```mermaid", "gantt", `    title ${shortLabel} CDRL Timeline`, "    dateFormat X", "    axisFormat %s"];
  let counter = 0;
  byPhase.forEach((ms, phase) => {
    if (ms.length === 0) return;
    out.push(`    section ${phase}`);
    ms.forEach((m) => out.push(`    ${m.label} :milestone, m${counter++}, ${eventIndex.get(m.eventId)}, 0d`));
  });
  out.push("```");
  out.push("*(Simplified sequence, not calendar-scaled — see the CDRL Path matrix for exact SETR-event alignment.)*");
  if (unresolved.length > 0) {
    out.push("");
    out.push(
      "**Not tied to a single SETR event** (recurring cadences, contract-day/board markers — real timing, just not chart-shaped):",
    );
    unresolved.forEach((u) => out.push(`- ${u}`));
  }
  return out;
}

interface CrossDomainRelation {
  external: CdrlPathNode;
  localNodes: CdrlPathNode[];
}

function addRelation(map: Map<string, CrossDomainRelation>, external: CdrlPathNode, local: CdrlPathNode) {
  const existing = map.get(external.id);
  if (existing) {
    if (!existing.localNodes.includes(local)) existing.localNodes.push(local);
  } else {
    map.set(external.id, { external, localNodes: [local] });
  }
}

function sortedRelations(map: Map<string, CrossDomainRelation>): CrossDomainRelation[] {
  return Array.from(map.values()).sort((a, b) => a.external.title.localeCompare(b.external.title));
}

interface CrossDomainSections {
  /** derived_from-sourced — the same edges cdrlPathReadiness.ts gates on, so this list and the
   * live risk flags below always agree on what's actually blocking/volatile. */
  direct: CrossDomainRelation[];
  /** influenced_by/influences-sourced, MINUS any pair already counted in `direct` — real
   * relationship content this domain should be aware of, but doesn't gate readiness. derived_from
   * is a curated subset of influenced_by (see confirmed_patterns.developmental_flow_down_pattern
   * in the JSON), so most pairs land in `direct`; a handful of nodes (e.g. ICD, SVD) have a
   * genuinely broader influenced_by than derived_from, which is exactly what this list surfaces. */
  broader: CrossDomainRelation[];
}

function pairKey(externalId: string, localId: string): string {
  return `${externalId}::${localId}`;
}

function pairKeysOf(relations: CrossDomainRelation[]): Set<string> {
  const keys = new Set<string>();
  relations.forEach((r) => r.localNodes.forEach((l) => keys.add(pairKey(r.external.id, l.id))));
  return keys;
}

/** "What you need from others before you can start" — split into direct developmental
 * dependencies (derived_from) and broader influences (influenced_by only). Per the design
 * chat's 2026-08-15 content-review finding: these two edge sources can genuinely diverge
 * (confirmed for ICD and SVD elsewhere in the model), and a single merged list left readers
 * unable to tell why this section's count might not match the live risk flags below, which
 * only ever gate on derived_from. */
function crossDomainUpstream(model: CdrlPathModel, domainId: string, domainNodes: CdrlPathNode[]): CrossDomainSections {
  const nodeById = new Map(model.nodes.map((n) => [n.id, n]));
  const directMap = new Map<string, CrossDomainRelation>();
  domainNodes.forEach((local) => {
    (local.derived_from ?? []).forEach((edge) => {
      const parent = nodeById.get(edge.parent);
      if (parent && !parent.domains.includes(domainId)) addRelation(directMap, parent, local);
    });
  });
  const direct = sortedRelations(directMap);
  const directPairs = pairKeysOf(direct);

  const broaderMap = new Map<string, CrossDomainRelation>();
  domainNodes.forEach((local) => {
    (local.influenced_by ?? []).forEach((id) => {
      if (id === "ALL") return;
      const target = nodeById.get(id);
      if (!target || target.domains.includes(domainId)) return;
      if (directPairs.has(pairKey(target.id, local.id))) return;
      addRelation(broaderMap, target, local);
    });
  });
  return { direct, broader: sortedRelations(broaderMap) };
}

/** The reverse — "who's counting on your output," same direct/broader split (derived_from
 * children vs. influences-only). */
function crossDomainDownstream(model: CdrlPathModel, domainId: string, domainNodes: CdrlPathNode[]): CrossDomainSections {
  const localIds = new Set(domainNodes.map((n) => n.id));
  const localById = new Map(domainNodes.map((n) => [n.id, n]));
  const directMap = new Map<string, CrossDomainRelation>();
  model.nodes.forEach((other) => {
    if (localIds.has(other.id) || other.domains.includes(domainId)) return;
    (other.derived_from ?? []).forEach((edge) => {
      const local = localById.get(edge.parent);
      if (local) addRelation(directMap, other, local);
    });
  });
  const direct = sortedRelations(directMap);
  const directPairs = pairKeysOf(direct);

  const broaderMap = new Map<string, CrossDomainRelation>();
  domainNodes.forEach((local) => {
    (local.influences ?? []).forEach((id) => {
      if (id === "ALL") return;
      const external = model.nodes.find((n) => n.id === id);
      if (!external || external.domains.includes(domainId)) return;
      if (directPairs.has(pairKey(external.id, local.id))) return;
      addRelation(broaderMap, external, local);
    });
  });
  return { direct, broader: sortedRelations(broaderMap) };
}

function relationBullets(model: CdrlPathModel, relations: CrossDomainRelation[], direction: "upstream" | "downstream"): string[] {
  if (relations.length === 0) return ["- None on file."];
  return relations.map(({ external, localNodes }) => {
    const otherDomains = external.domains.map((d) => domainShortLabel(model.lines.find((l) => l.id === d)?.label ?? d)).join("/");
    const localList = localNodes.map((n) => n.title).join(", ");
    const clause =
      direction === "upstream"
        ? `${localList} depend${localNodes.length === 1 ? "s" : ""} on this.`
        : `depends on ${localList}.`;
    return `- **${external.title}** (${external.id}, ${otherDomains}) — ${clause}`;
  });
}

function relationSectionLines(model: CdrlPathModel, sections: CrossDomainSections, direction: "upstream" | "downstream"): string[] {
  return [
    "**Direct developmental dependencies** (drives the readiness status above):",
    ...relationBullets(model, sections.direct, direction),
    "",
    "**Broader influences** (informs the work, doesn't gate readiness):",
    ...relationBullets(model, sections.broader, direction),
  ];
}

/** Mermaid graph of every derived_from/influences edge touching this domain — this domain's own
 * nodes highlighted, cross-domain parents/children shown gray, per the design chat's spec. */
function dependencyGraphSection(model: CdrlPathModel, domainNodes: CdrlPathNode[], shortLabel: string): string[] {
  const localIds = new Set(domainNodes.map((n) => n.id));
  const edgeKeys = new Set<string>();
  const edges: [string, string][] = [];
  const involved = new Set<string>(localIds);

  function addEdge(from: string, to: string) {
    const key = `${from}->${to}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push([from, to]);
  }

  model.nodes.forEach((n) => {
    (n.derived_from ?? []).forEach((edge) => {
      if (!localIds.has(n.id) && !localIds.has(edge.parent)) return;
      addEdge(edge.parent, n.id);
      involved.add(edge.parent);
      involved.add(n.id);
    });
    (n.influences ?? []).forEach((targetId) => {
      if (targetId === "ALL") return;
      if (!localIds.has(n.id) && !localIds.has(targetId)) return;
      addEdge(n.id, targetId);
      involved.add(n.id);
      involved.add(targetId);
    });
  });

  if (edges.length === 0) return ["No cross-discipline relationship edges on file for this domain."];

  const nodeById = new Map(model.nodes.map((n) => [n.id, n]));
  const out = ["```mermaid", "graph LR"];
  involved.forEach((id) => {
    const n = nodeById.get(id);
    if (!n) return;
    const label = n.domains.map((d) => domainShortLabel(model.lines.find((l) => l.id === d)?.label ?? d)).join("/");
    out.push(`    ${id}[${id}<br/>${label}]`);
  });
  edges.forEach(([a, b]) => out.push(`    ${a} --> ${b}`));
  domainNodes.forEach((n) => out.push(`    style ${n.id} fill:#fbe9dd`));
  involved.forEach((id) => {
    if (!localIds.has(id)) out.push(`    style ${id} fill:#eee,stroke:#999,color:#666`);
  });
  out.push("```");
  out.push(`*(Amber = ${shortLabel}'s own CDRLs. Gray = other disciplines' inputs/outputs it touches.)*`);
  return out;
}

function specialConsiderationsSection(model: CdrlPathModel, domainNodes: CdrlPathNode[], overlay: CdrlPathWorkflowOverlay): string[] {
  const out: string[] = [];
  domainNodes.forEach((node) => {
    maturityStatesForLevel(node, "SYSTEM").forEach((state) => {
      if (state.note) out.push(`- **${node.title} (${state.state})** — ${state.note}`);
    });
    // team_facing_note, never `notes` — see that field's doc comment in cdrlPath.ts. Silently
    // omitted (not a placeholder) when absent, since most nodes legitimately have nothing to
    // flag here and a placeholder per node would just be noise.
    if (node.team_facing_note) out.push(`- **${node.title}** — ${node.team_facing_note}`);
  });
  const flagged = domainNodes
    .map((node) => ({ node, readiness: computeReadiness(node, model, overlay) }))
    .filter(({ readiness }) => readiness === "BLOCKED" || readiness === "READY_VOLATILE");
  if (flagged.length > 0) {
    out.push("");
    out.push("**Live risk flags** (current per-baseline workflow status, not static reference timing):");
    flagged.forEach(({ node, readiness }) => {
      const icon = readiness === "BLOCKED" ? "🔒" : "⚠️";
      const reason = readinessReasonText(node, model, overlay) ?? "";
      out.push(`- **${node.title} is currently ${icon} ${readiness.replace("_", " ")}** — ${reason}`);
    });
  }
  if (out.length === 0) return ["None on file for this domain."];
  out.push("");
  out.push("*Live risk flags reflect the workflow overlay at generation time — regenerate this guide to pick up changes.*");
  return out;
}

export function generateDisciplineGuide(model: CdrlPathModel, domainId: string, overlay: CdrlPathWorkflowOverlay): string {
  const line = model.lines.find((l) => l.id === domainId);
  if (!line) throw new Error(`Unknown domain "${domainId}"`);
  const domainNodes = nodesInDomain(model, domainId);
  const shortLabel = domainShortLabel(line.label);

  return [
    `# ${shortLabel} — Discipline Guide`,
    "",
    `*Generated from the CDRL Path reference model (${domainNodes.length} CDRL${domainNodes.length === 1 ? "" : "s"}).*`,
    "",
    "## Your role in the System Development Lifecycle",
    "",
    domainBlurbPlaceholder("role-framing"),
    "",
    "## Your CDRLs at a glance",
    "",
    ...cdrlTableSection(domainNodes),
    "",
    "## Your timeline",
    "",
    ...timelineSection(model, domainNodes, shortLabel),
    "",
    "## What you need from others before you can start",
    "",
    ...relationSectionLines(model, crossDomainUpstream(model, domainId, domainNodes), "upstream"),
    "",
    "## Who's counting on your output",
    "",
    ...relationSectionLines(model, crossDomainDownstream(model, domainId, domainNodes), "downstream"),
    "",
    "## Cross-discipline dependency map",
    "",
    ...dependencyGraphSection(model, domainNodes, shortLabel),
    "",
    "## Special considerations for your discipline",
    "",
    ...specialConsiderationsSection(model, domainNodes, overlay),
    "",
    "---",
    "*First-pass, unconfirmed content where noted — see cdrl-path-project-brief.md before treating relationships or domain assignments as settled. Regenerate this guide after any reference-model or workflow update to stay current.*",
  ].join("\n");
}

export function generateOrientationGuide(model: CdrlPathModel): string {
  const phases = model.lifecycle_lanes.phases;

  const flowchart = ["```mermaid", "flowchart LR"];
  phases.forEach((p, i) => flowchart.push(`    P${i}[${PHASE_PLAIN_LABELS[p] ?? `[PLACEHOLDER — plain-language label for ${p}]`}]`));
  for (let i = 0; i < phases.length - 1; i++) flowchart.push(`    P${i} --> P${i + 1}`);
  flowchart.push("```");

  const contributionRows = model.lines.map(
    (line) => `| **${domainShortLabel(line.label)}** | ${domainBlurbPlaceholder("contribution")} |`,
  );

  return [
    "# Understanding Our System's Journey — A Guide for Everyone Involved",
    "",
    "*Whether you're an engineer, a program manager, a logistics planner, a contracting officer, or the customer receiving this system — you have a role in how it gets built, delivered, and kept running. This guide explains that journey in plain language.*",
    "",
    "## Why this matters",
    "",
    "No single person or team builds a system alone. Every discipline — engineering, software, hardware, testing, safety, logistics, and program management — produces work that other people depend on to do their own job. When one team's work changes after someone else has already started building on it, that ripple costs time and money for everyone downstream. The more everyone understands how the pieces connect, the fewer surprises there are, and the better the whole team performs against cost, schedule, and technical goals — including for you, the customer, who ultimately receives and depends on what gets delivered.",
    "",
    "## The big picture: how a system gets built",
    "",
    "Think of the program as moving through a series of checkpoints — formal reviews where the team pauses to confirm the system is ready to move to the next stage of maturity. You don't need to memorize their technical names, but here's the general shape:",
    "",
    ...flowchart,
    "",
    "At each checkpoint, specific documents and analyses have to be ready. They're not paperwork for its own sake; each one represents a real decision or a real piece of knowledge the team needs before it's safe or sensible to move forward.",
    "",
    "## Who contributes what",
    "",
    "| Discipline | What they bring to the team |",
    "|---|---|",
    ...contributionRows,
    "",
    "Every one of these disciplines produces outputs that other disciplines need — and every one of them depends on outputs from someone else. Nobody's work happens in isolation.",
    "",
    "## Why \"is it finished yet?\" is a real question, not just paperwork",
    "",
    "Here's something that trips up a lot of programs: an engineer on one team starts building their piece of the system based on another team's document — but that document isn't finished yet. It's still being written, still being reviewed, still likely to change. If the first team keeps changing it while the second team is already building on it, the second team has to keep redoing their work to keep up. That's wasted effort, wasted time, and wasted money — and it's one of the most common, most avoidable sources of program cost and schedule growth.",
    "",
    "This is exactly why we track not just *whether* something exists, but *how stable* it is. A document that's \"in progress\" is a different situation than one that's been formally reviewed and approved — and everyone downstream benefits from knowing which situation they're actually in before they commit to building on it.",
    "",
    "## What this means for you",
    "",
    "- **If you're an engineer or discipline lead:** know which other disciplines depend on your work, and know which of your own dependencies are still unstable before you build on them.",
    "- **If you're a program manager:** the connections between disciplines are where schedule risk actually lives — a delay in one team's foundational document doesn't stay contained to that team.",
    "- **If you're the customer or another external stakeholder:** this same visibility is available to you. Understanding roughly where the program stands — what's stable, what's still in motion — helps set realistic expectations and supports better-informed decisions on your end too.",
    "",
    "## Where to go deeper",
    "",
    "Each discipline has its own detailed guide covering their specific CDRLs, timing, and dependencies — use the Export Discipline Guide option for the area you're most involved with.",
    "",
    "---",
    "*This is a simplified orientation document, generated from the CDRL Path reference model. It intentionally omits DID numbers, exact SETR event names, and technical detail found in discipline-specific guides — those are available separately for anyone who wants the full technical picture.*",
  ].join("\n");
}
