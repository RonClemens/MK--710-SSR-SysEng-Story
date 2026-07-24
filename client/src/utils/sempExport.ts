import { SEMP_APPENDIX_NOTE, SEMP_DID_CITATION, SEMP_MAPPING_DISCLAIMER, SEMP_SECTIONS } from "../data/sempGuidance";
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
import { DBX_MBX_DIMENSIONS, DBX_MBX_INTRO } from "../data/dbxMbxGuidance";
import { POINTER_SPEC_CATALOG, POINTER_SPEC_INTRO, POINTER_SPEC_PRINCIPLES } from "../data/pointerSpecGuidance";
import { INCOSE_FRAMEWORK_INTRO, INCOSE_GROUP_META, INCOSE_PROCESS_GROUPS } from "../data/incoseGuidance";
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
    const s = sectionByI.get(id);
    if (!s) throw new Error(`Unknown SEMP section id: ${id}`);
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
  lines.push("> " + getValue("semp.didCitation", SEMP_DID_CITATION));
  lines.push("");
  lines.push("> " + SEMP_MAPPING_DISCLAIMER.replace(/\n/g, "\n> "));
  lines.push("");
  lines.push(
    "> This file contains no CUI by construction (it mirrors only what's already in this app's illustrative " +
      "workbench data). Review its contents before pasting into any CUI-marked document, and apply your own " +
      "authorized transfer process to move this file to your CUI-side tool.",
  );
  lines.push("");

  // 1. Use/Relationship and Scope
  lines.push(heading("useRelationshipScope"));
  lines.push("_Not auto-generated — carry over program/system identification and scope from the destination SEMP._");
  lines.push("");

  // 2. Reference Documents
  lines.push(heading("referenceDocuments"));
  lines.push("**DID-cited references:** OSD SEP Outline; IEEE 24748-7:2019; IEEE 24748-8:2019.");
  lines.push("");
  lines.push("**Pointer Specifications (industry/military standards this program's design and production comply with):**");
  lines.push("");
  lines.push(
    mdTable(
      ["Designator", "Title", "Domain", "Levels"],
      POINTER_SPEC_CATALOG.map((p) => [p.designator, p.title, p.domain, p.levels.join(", ")]),
    ),
  );
  lines.push("_Full guidance for each, including recommended cite/tailor/flow-down approach, is on the Specifications tab._");
  lines.push("");
  lines.push("**Other referenced frameworks:** MIL-STD-31000 (Technical Data Packages), EIA-649 (Configuration Management), IEEE 12207 (Software Life Cycle Processes), INCOSE Systems Engineering Handbook / ISO-IEC-IEEE 15288 — see the relevant sections below.");
  lines.push("");
  lines.push("_See the consolidated Attachments appendix at the end of this file for every linked document reference captured across all tabs — a useful cross-check against this section's document list, not a substitute for it._");
  lines.push("");

  // 3.1 Planned Engineering Approach
  lines.push(heading("engineeringApproach"));
  lines.push(getValue("setr.frameworkIntro", SETR_FRAMEWORK_INTRO));
  lines.push("");
  lines.push(
    getValue(
      "dbxMbx.programPlanningExecution.thisAppNote",
      DBX_MBX_DIMENSIONS.find((d) => d.id === "programPlanningExecution")!.thisAppNote,
    ),
  );
  lines.push("");

  // 3.2 Operational Plan / Specialty Engineering Discipline Integration
  lines.push(heading("operationalPlanSpecialtyIntegration"));
  lines.push("### System Safety Engineering");
  lines.push("");
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
  lines.push("### Software Engineering");
  lines.push("");
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
  lines.push("### Human Factors Engineering");
  lines.push("");
  const milStd1472 = POINTER_SPEC_CATALOG.find((p) => p.id === "milStd1472")!;
  lines.push(getValue(`pointerSpec.catalog.${milStd1472.id}.whyItMatters`, milStd1472.whyItMatters));
  lines.push("");
  lines.push(getValue(`pointerSpec.catalog.${milStd1472.id}.recommendedApproach`, milStd1472.recommendedApproach));
  lines.push("");

  // 3.3 Mapping Between Contractor and Government SE Processes
  lines.push(heading("processMapping"));
  lines.push(getValue("incose.frameworkIntro", INCOSE_FRAMEWORK_INTRO));
  lines.push("");
  for (const group of INCOSE_PROCESS_GROUPS) {
    lines.push(`**${group}**`);
    lines.push("");
    lines.push(getValue(`incose.group.${group}.description`, INCOSE_GROUP_META[group].description));
    lines.push("");
    lines.push(
      mdTable(
        ["Sub-Process", "Contractor Process In This App"],
        INCOSE_GROUP_META[group].subProcesses.map((sp, i) => [
          sp.name,
          getValue(`incose.group.${group}.subProcess.${i}.appMapping`, sp.appMapping),
        ]),
      ),
    );
    lines.push("");
  }
  lines.push(
    "_Government-side process names and any \"not mapped, not needed\" rationale (DID 3.3) still require your " +
      "program's actual government SE process documentation — not available to this app._",
  );
  lines.push("");

  // 3.4 Alignment of Contractor and Subcontractor SE Processes
  lines.push(heading("subcontractorAlignment"));
  lines.push(
    "_This app's COTS Records tab (qualified alternates, obsolescence monitoring — see 3.8 below for the full " +
      "table) is the nearest existing content to subcontractor/vendor process alignment, but it does not " +
      "document actual subcontractor SE process alignment. Treat this section as a gap to fill from your " +
      "program's real subcontractor management records._",
  );
  lines.push("");

  // 3.5.a Architecture, Documentation, Interfaces
  lines.push(heading("architectureInterfaces"));
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

  // 3.5.b Formal Technical Reviews and Audits
  lines.push(heading("technicalReviewsAudits"));
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

  // 3.5.c Trade Studies
  lines.push(heading("tradeStudies"));
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
    "_This app has no dedicated trade-study entity or formal risk register — treat this section as a partial " +
      "feed, not a complete one._",
  );
  lines.push("");

  // 3.5.d Integration, Verification, and Validation
  lines.push(heading("integrationVerificationValidation"));
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

  // 3.6 Related Planning for Tailored SE Process Application
  lines.push(heading("tailoredProcessPlanning"));
  lines.push(getValue("pointerSpec.frameworkIntro", POINTER_SPEC_INTRO));
  lines.push("");
  lines.push(
    mdTable(
      ["Principle", "Description"],
      POINTER_SPEC_PRINCIPLES.map((p, i) => [p.title, getValue(`pointerSpec.principles.${i}`, p.text)]),
    ),
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
  lines.push(
    "_Supplier/subcontractor and COTS vendor communication details: see 3.4 (Subcontractor Alignment) and 3.8 " +
      "(COTS and Parts Management) below._",
  );
  lines.push("");

  // 3.7 Referenced Lower-Level and Subcontractor Technical Plans
  lines.push(heading("referencedTechnicalPlans"));
  lines.push(
    mdTable(
      ["Title", "Level", "CDRL Type", "Applicability", "Baseline", "Status", "Delivery Milestone", "Description"],
      data.planningDeliverables.map((p) => [
        p.title,
        p.level,
        p.cdrlType,
        p.applicability,
        p.baseline,
        p.status,
        p.deliveryMilestone,
        p.cdrlDescription,
      ]),
    ),
  );
  lines.push("");
  lines.push(
    "_Includes the Configuration Management Plan, Risk Management Plan, Requirements Management Plan, and Data " +
      "Management Plan named explicitly in DID paragraph 3.7, alongside the software-specific CDRLs covered in " +
      "3.2 above._",
  );
  lines.push("");

  // 3.8 Other Areas Necessary to Execute Systems Engineering
  lines.push(heading("otherNecessaryAreas"));
  lines.push("### Baseline Management (Baseline A / Baseline B)");
  lines.push("");
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
  lines.push("**Requirements Traceability (Delta Matrix)**");
  lines.push("");
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
  lines.push("### Technical Data Package (TDP) Management (MIL-STD-31000)");
  lines.push("");
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
  lines.push("### Digital Engineering / MBSE Strategy");
  lines.push("");
  lines.push(getValue("dbxMbx.intro", DBX_MBX_INTRO));
  lines.push("");
  lines.push(
    mdTable(
      ["SE Dimension", "Document-Based (DBx)", "Model-Based (MBx)", "Tradeoff", "In This App"],
      DBX_MBX_DIMENSIONS.map((d) => [
        d.name,
        getValue(`dbxMbx.${d.id}.dbxDescription`, d.dbxDescription),
        getValue(`dbxMbx.${d.id}.mbxDescription`, d.mbxDescription),
        getValue(`dbxMbx.${d.id}.tradeoff`, d.tradeoff),
        getValue(`dbxMbx.${d.id}.thisAppNote`, d.thisAppNote),
      ]),
    ),
  );
  lines.push("");
  lines.push("### COTS and Parts Management");
  lines.push("");
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
