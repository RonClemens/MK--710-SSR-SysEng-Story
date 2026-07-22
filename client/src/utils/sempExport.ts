import { SEMP_APPENDIX_NOTE, SEMP_MAPPING_DISCLAIMER, SEMP_SECTIONS } from "../data/sempGuidance";
import { CDRL_CATALOG, HAZARD_CATEGORY_META, SAFETY_DELIVERABLES_INTRO } from "../data/safetyGuidance";
import { PLANNING_DELIVERABLES_INTRO } from "../data/planningGuidance";
import { SETR_EVENTS, SETR_FRAMEWORK_INTRO, SETR_GUIDANCE } from "../data/setrGuidance";
import {
  CM_FUNCTIONAL_AREAS,
  FCA_PCA_NOTE,
  SOFTWARE_LIFECYCLE_GROUPS,
  SOFTWARE_LIFECYCLE_INTRO,
  TDP_CONTENT_ELEMENTS,
  TDP_FRAMEWORK_INTRO,
  TDP_MATURITY_LEVELS,
  TDP_MATURITY_META,
} from "../data/tdpGuidance";
import type {
  AbCompatibilityRow,
  Attachment,
  ConfigurationItem,
  CotsRecord,
  DeltaMatrixRow,
  InterfaceRecord,
  LogicalSubsystem,
  ProgramPlanningDeliverable,
  Recommendation,
  SafetyDeliverable,
  Specification,
  SpecLevel,
} from "../types";

export interface SempExportData {
  logicalSubsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  deltaMatrix: DeltaMatrixRow[];
  abCompatibility: AbCompatibilityRow[];
  cotsRecords: CotsRecord[];
  recommendations: Recommendation[];
  interfaces: InterfaceRecord[];
  specifications: Specification[];
  safetyDeliverables: SafetyDeliverable[];
  planningDeliverables: ProgramPlanningDeliverable[];
}

type GetValue = (key: string, defaultValue: string) => string;

function mdTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return "_No records._\n";
  const esc = (s: string) => (s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(esc).join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}\n`;
}

function attachmentsToLine(attachments: Attachment[]): string {
  if (!attachments || attachments.length === 0) return "—";
  return attachments.map((a) => `[${a.label}](${a.url})`).join("; ");
}

export function buildSempMigrationMarkdown(data: SempExportData, getValue: GetValue): string {
  const subsystemName = (id: string | null) =>
    id ? data.logicalSubsystems.find((s) => s.id === id)?.name ?? id : "—";
  const ciName = (id: string | null) => (id ? data.cis.find((c) => c.id === id)?.name ?? id : "—");
  const elementName = (scope: "subsystem" | "ci", id: string) =>
    scope === "subsystem" ? subsystemName(id) : ciName(id);

  const sectionByI = new Map(SEMP_SECTIONS.map((s) => [s.id, s]));
  const heading = (id: string) => {
    const s = sectionByI.get(id)!;
    const number = getValue(`semp.section.${id}.number`, s.defaultNumber);
    const title = getValue(`semp.section.${id}.title`, s.defaultTitle);
    const source = getValue(`semp.section.${id}.sourceDescription`, s.defaultSourceDescription);
    return `## ${number}. ${title}\n\n_Source in this app: ${source}_\n`;
  };

  const lines: string[] = [];
  lines.push("# Systems Engineering Management Plan — Migration Package");
  lines.push("");
  lines.push(`_Generated ${new Date().toISOString()} from the PDR Reconciliation & Baseline Alignment Workbench._`);
  lines.push("");
  lines.push("> " + SEMP_MAPPING_DISCLAIMER.replace(/\n/g, "\n> "));
  lines.push("");
  lines.push(
    "> This file contains no CUI by construction (it mirrors only what's already in this app's illustrative " +
      "workbench data). Review its contents before pasting into any CUI-marked document, and apply your own " +
      "authorized transfer process to move this file to your CUI-side tool.",
  );
  lines.push("");

  // 1. Scope
  lines.push(heading("scope"));
  lines.push("_Not auto-generated — carry over program/system identification from the destination SEMP._");
  lines.push("");

  // 2. Applicable Documents
  lines.push(heading("applicableDocuments"));
  lines.push("_Not auto-generated — see the consolidated Attachments appendix at the end of this file._");
  lines.push("");

  // 3. SE Integration
  lines.push(heading("seIntegration"));
  lines.push(getValue("setr.frameworkIntro", SETR_FRAMEWORK_INTRO));
  lines.push("");
  lines.push(
    mdTable(
      ["Event", "Name", "Summary", "Decomposition", "Safety Planning", "Software Planning", "Spec Generation", "TDP Maturity (MIL-STD-31000)"],
      SETR_EVENTS.map((event) => [
        event,
        SETR_GUIDANCE[event].name,
        getValue(`setr.${event}.summary`, SETR_GUIDANCE[event].summary),
        getValue(`setr.${event}.decomposition`, SETR_GUIDANCE[event].decomposition),
        getValue(`setr.${event}.safetyPlanning`, SETR_GUIDANCE[event].safetyPlanning),
        getValue(`setr.${event}.softwarePlanning`, SETR_GUIDANCE[event].softwarePlanning),
        getValue(`setr.${event}.specGeneration`, SETR_GUIDANCE[event].specGeneration),
        getValue(`setr.${event}.tdpMaturity`, SETR_GUIDANCE[event].tdpMaturity),
      ]),
    ),
  );
  lines.push(getValue("tdp.fcaPcaNote", FCA_PCA_NOTE));
  lines.push("");

  // 4. Requirements Management
  lines.push(heading("requirementsManagement"));
  lines.push(
    mdTable(
      ["CI", "SFR Allocation", "Actual Decomposition", "Delta", "Delta Source", "Disposition", "Rationale"],
      data.deltaMatrix.map((r) => [
        ciName(r.ciId),
        r.sfrAllocation,
        r.actualDecomposition,
        r.delta,
        r.deltaSource,
        r.disposition,
        r.rationale,
      ]),
    ),
  );
  lines.push("");

  // 5. Architecture and Decomposition
  lines.push(heading("architectureDecomposition"));
  for (const baseline of ["Baseline A", "Baseline B"] as const) {
    lines.push(`### ${baseline}`);
    lines.push("");
    lines.push("**Logical Subsystems**");
    lines.push("");
    lines.push(
      mdTable(
        ["Name", "Source", "Description"],
        data.logicalSubsystems.filter((s) => s.baseline === baseline).map((s) => [s.name, s.source, s.description]),
      ),
    );
    lines.push("");
    lines.push("**Configuration Items**");
    lines.push("");
    lines.push(
      mdTable(
        ["Name", "Type", "Tier", "Subsystems", "Over-Decomposition Flagged", "Status", "Consolidation Notes"],
        data.cis
          .filter((c) => c.baseline === baseline)
          .map((c) => [
            c.name,
            c.type,
            c.tier,
            c.subsystemIds.map((id) => subsystemName(id)).join(", ") || "—",
            c.overDecompositionFlag ? "Yes" : "No",
            c.status,
            c.consolidationNotes || "—",
          ]),
      ),
    );
    lines.push("");
  }

  // 6. Interface Management
  lines.push(heading("interfaceManagement"));
  for (const scope of ["subsystem", "ci"] as const) {
    lines.push(`**${scope === "subsystem" ? "Subsystem-to-Subsystem" : "CI-to-CI"} Interfaces**`);
    lines.push("");
    lines.push(
      mdTable(
        ["Element A", "Element B", "Description"],
        data.interfaces
          .filter((i) => i.scope === scope)
          .map((i) => [elementName(scope, i.aId), elementName(scope, i.bId), i.description]),
      ),
    );
    lines.push("");
  }

  // 7. Configuration Management
  lines.push(heading("configurationManagement"));
  lines.push(
    mdTable(
      ["Title", "Level", "Applicability", "Baseline", "Status", "Description"],
      data.planningDeliverables
        .filter((p) => /CMP|Configuration Management/i.test(p.cdrlType) || /Configuration Management/i.test(p.title))
        .map((p) => [p.title, p.level, p.applicability, p.baseline, p.status, p.cdrlDescription]),
    ),
  );
  lines.push(
    "_Delta Matrix (Requirements Management, above) and A/B Compatibility (Baseline Management, below) are the " +
      "underlying CM-relevant baseline records this plan governs._",
  );
  lines.push("");
  lines.push("**EIA-649 Configuration Management Functional Areas**");
  lines.push("");
  lines.push(
    mdTable(
      ["Functional Area", "Description", "Implemented In This App As"],
      CM_FUNCTIONAL_AREAS.map((area) => [
        area.name,
        getValue(`cm.area.${area.id}.description`, area.description),
        getValue(`cm.area.${area.id}.appMapping`, area.appMapping),
      ]),
    ),
  );
  lines.push("");

  // 8. Technical Risk Management
  lines.push(heading("technicalRiskManagement"));
  lines.push("**Recommendations**");
  lines.push("");
  lines.push(
    mdTable(
      ["Text", "Category", "Status", "Owner", "Related CI"],
      data.recommendations.map((r) => [r.text, r.category, r.status, r.owner || "—", ciName(r.relatedCiId)]),
    ),
  );
  lines.push("");
  lines.push("**A/B Compatibility Risk Notes**");
  lines.push("");
  lines.push(
    mdTable(
      ["CI", "Compatibility Status", "Risk Note", "Last Reviewed"],
      data.abCompatibility
        .filter((r) => r.riskNote)
        .map((r) => [ciName(r.ciId), r.compatibilityStatus, r.riskNote, r.lastReviewedDate]),
    ),
  );
  lines.push("");
  lines.push(
    "_This app does not maintain a formal risk register — treat this section as a partial feed, not a complete " +
      "one._",
  );
  lines.push("");

  // 9. Technical Reviews (SETR)
  lines.push(heading("technicalReviews"));
  lines.push(
    "_Full event-by-event guidance is reproduced under Systems Engineering Integration, above — this section is " +
      "the canonical SEMP location for it; SE Integration keeps its own copy for narrative flow._",
  );
  lines.push("");

  // 10. Technical Data Package (TDP) Management
  lines.push(heading("technicalDataPackage"));
  lines.push(getValue("tdp.frameworkIntro", TDP_FRAMEWORK_INTRO));
  lines.push("");
  lines.push(
    mdTable(
      ["TDP Maturity Level", "Description", "Spec-Type Correlation", "SETR Range"],
      TDP_MATURITY_LEVELS.map((level) => [
        TDP_MATURITY_META[level].name,
        getValue(`tdp.maturity.${level}.description`, TDP_MATURITY_META[level].description),
        getValue(`tdp.maturity.${level}.specTypeCorrelation`, TDP_MATURITY_META[level].specTypeCorrelation),
        TDP_MATURITY_META[level].setrRange,
      ]),
    ),
  );
  lines.push(getValue("tdp.fcaPcaNote", FCA_PCA_NOTE));
  lines.push("");
  lines.push("**TDP Content Elements**");
  lines.push("");
  lines.push(
    mdTable(
      ["Content Element", "Description", "In This App"],
      TDP_CONTENT_ELEMENTS.map((el) => [
        el.name,
        el.description,
        getValue(`tdp.content.${el.id}.appMapping`, el.appMapping),
      ]),
    ),
  );
  lines.push("");

  // 11. Verification and Validation
  lines.push(heading("verificationValidation"));
  lines.push("**Specification Verification Provisions**");
  lines.push("");
  lines.push(
    mdTable(
      ["Specification", "Level", "Domain", "Baseline", "Verification Provisions"],
      data.specifications.map((s) => [s.title, s.level, s.domain, s.baseline, s.sections.verificationProvisions || "—"]),
    ),
  );
  lines.push("");
  lines.push("**COTS Verification**");
  lines.push("");
  lines.push(
    mdTable(
      ["CI", "Verification Method", "Rationale"],
      data.cotsRecords.map((c) => [ciName(c.ciId), c.verificationMethod, c.rationale]),
    ),
  );
  lines.push("");

  // 12. System Safety Engineering
  lines.push(heading("systemSafetyEngineering"));
  lines.push(getValue("safety.deliverablesIntro", SAFETY_DELIVERABLES_INTRO));
  lines.push("");
  for (const level of ["System", "Subsystem", "CI"] as SpecLevel[]) {
    const meta = Object.values(HAZARD_CATEGORY_META).find((m) => m.level === level);
    if (meta) {
      const categoryKey = Object.keys(HAZARD_CATEGORY_META).find(
        (k) => HAZARD_CATEGORY_META[k as keyof typeof HAZARD_CATEGORY_META].level === level,
      )!;
      lines.push(`**${level} — CDRL Catalog**`);
      lines.push("");
      lines.push(getValue(`safety.hazardCategory.${categoryKey}.description`, meta.description));
      lines.push("");
    }
    lines.push(
      mdTable(
        ["CDRL", "Applicability", "Description"],
        CDRL_CATALOG[level].map((c, i) => [
          c.name,
          c.applicability,
          getValue(`safety.cdrl.${level}.${i}.description`, c.description),
        ]),
      ),
    );
    lines.push("");
  }
  lines.push("**Safety Deliverable Records**");
  lines.push("");
  lines.push(
    mdTable(
      ["Title", "Level", "CDRL Type", "Applicability", "Baseline", "Status", "Delivery Milestone"],
      data.safetyDeliverables.map((sd) => [
        sd.title,
        sd.level,
        sd.cdrlType,
        sd.applicability,
        sd.baseline,
        sd.status,
        sd.deliveryMilestone,
      ]),
    ),
  );
  lines.push("");

  // 13. Software Engineering
  lines.push(heading("softwareEngineering"));
  lines.push(getValue("planning.deliverablesIntro", PLANNING_DELIVERABLES_INTRO));
  lines.push("");
  const softwarePlanningDeliverables = data.planningDeliverables.filter((p) =>
    /SDP|STP|SDD|STD|VDD|Software/i.test(p.cdrlType) || /Software/i.test(p.title),
  );
  lines.push(
    mdTable(
      ["Title", "Level", "Applicability", "Baseline", "Status", "Description"],
      softwarePlanningDeliverables.map((p) => [p.title, p.level, p.applicability, p.baseline, p.status, p.cdrlDescription]),
    ),
  );
  lines.push("");
  lines.push("**Software-Domain Specifications**");
  lines.push("");
  lines.push(
    mdTable(
      ["Title", "Level", "Baseline", "Status"],
      data.specifications.filter((s) => s.domain === "Software").map((s) => [s.title, s.level, s.baseline, s.status]),
    ),
  );
  lines.push("");
  lines.push("**IEEE 12207 Software Life Cycle Process Alignment**");
  lines.push("");
  lines.push(getValue("softwareLifecycle.intro", SOFTWARE_LIFECYCLE_INTRO));
  lines.push("");
  lines.push(
    mdTable(
      ["Process Group", "Description", "SETR Range", "Planning CDRL(s)"],
      SOFTWARE_LIFECYCLE_GROUPS.map((g) => [
        g.name,
        getValue(`softwareLifecycle.${g.id}.description`, g.description),
        g.setrRange,
        getValue(`softwareLifecycle.${g.id}.planningCdrls`, g.planningCdrls),
      ]),
    ),
  );
  lines.push("");

  // 14. Baseline Management
  lines.push(heading("baselineManagement"));
  for (const baseline of ["Baseline A", "Baseline B"] as const) {
    const subCount = data.logicalSubsystems.filter((s) => s.baseline === baseline).length;
    const ciCount = data.cis.filter((c) => c.baseline === baseline).length;
    lines.push(`- **${baseline}**: ${subCount} subsystem(s), ${ciCount} CI(s)`);
  }
  lines.push("");
  lines.push("**A/B Compatibility**");
  lines.push("");
  lines.push(
    mdTable(
      ["CI", "Baseline A State", "Baseline B Intent", "Compatibility Status", "Last Reviewed"],
      data.abCompatibility.map((r) => [
        ciName(r.ciId),
        r.baselineAState,
        r.baselineBIntent,
        r.compatibilityStatus,
        r.lastReviewedDate,
      ]),
    ),
  );
  lines.push("");

  // 15. COTS and Parts Management
  lines.push(heading("cotsPartsManagement"));
  lines.push(
    mdTable(
      ["CI", "Functional Requirement", "Interface Requirement", "Form/Fit Constraints", "Qualified Alternates", "Obsolescence Monitoring"],
      data.cotsRecords.map((c) => [
        ciName(c.ciId),
        c.functionalRequirement,
        c.interfaceRequirement,
        c.formFitConstraints,
        c.qualifiedAlternates.map((q) => `${q.makeModelPartNumber} (${q.lifecycleStatus})`).join("; ") || "—",
        c.obsolescenceMonitoringNotes,
      ]),
    ),
  );
  lines.push("");

  // Appendices
  lines.push("---");
  lines.push("");
  lines.push("## Appendix A: CI Inventory");
  lines.push("");
  lines.push(SEMP_APPENDIX_NOTE);
  lines.push("");
  lines.push(
    mdTable(
      ["Name", "Type", "Tier", "Baseline", "Subsystems", "Status", "Links"],
      data.cis.map((c) => [
        c.name,
        c.type,
        c.tier,
        c.baseline,
        c.subsystemIds.map((id) => subsystemName(id)).join(", ") || "—",
        c.status,
        attachmentsToLine(c.attachments),
      ]),
    ),
  );
  lines.push("");

  lines.push("## Appendix B: Consolidated Attachments Index");
  lines.push("");
  const attachmentRows: string[][] = [];
  const collect = (sourceType: string, id: string, name: string, attachments: Attachment[]) => {
    for (const a of attachments ?? []) {
      attachmentRows.push([sourceType, name, id, a.label, a.url]);
    }
  };
  data.cis.forEach((c) => collect("CI", c.id, c.name, c.attachments));
  data.cotsRecords.forEach((c) => collect("COTS Record", c.id, ciName(c.ciId), c.attachments));
  data.specifications.forEach((s) => collect("Specification", s.id, s.title, s.attachments));
  data.safetyDeliverables.forEach((sd) => collect("Safety Deliverable", sd.id, sd.title, sd.attachments));
  data.planningDeliverables.forEach((p) => collect("Planning Deliverable", p.id, p.title, p.attachments));
  lines.push(mdTable(["Source Type", "Record", "Record ID", "Label", "URL"], attachmentRows));
  lines.push("");

  return lines.join("\n");
}
