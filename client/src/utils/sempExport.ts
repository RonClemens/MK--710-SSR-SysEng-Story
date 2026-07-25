import { SEMP_APPENDIX_NOTE, SEMP_DID_CITATION, SEMP_MAPPING_DISCLAIMER, SEMP_SECTIONS } from "../../../methodology/guidance/sempGuidance";
import { CDRL_CATALOG, HAZARD_CATEGORY_META, SAFETY_DELIVERABLES_INTRO } from "../../../methodology/guidance/safetyGuidance";
import { PLANNING_DELIVERABLES_INTRO } from "../../../methodology/guidance/planningGuidance";
import {
  RECURRING_TECHNICAL_ACTIVITIES,
  RECURRING_TECHNICAL_ACTIVITIES_INTRO,
  SETR_EVENTS,
  SETR_FRAMEWORK_INTRO,
  SETR_GUIDANCE,
} from "../../../methodology/guidance/setrGuidance";
import {
  RECOVERY_DELTA_CLASSES,
  RECOVERY_DELTA_CLASS_SCOPE_NOTE,
  RECOVERY_DELTA_CLASS_TIER_MAPPING,
  RECOVERY_PROGRAM_INTRO,
} from "../../../methodology/guidance/recoveryProgramGuidance";
import {
  CM_FUNCTIONAL_AREAS,
  FCA_PCA_NOTE,
  SOFTWARE_LIFECYCLE_GROUPS,
  SOFTWARE_LIFECYCLE_INTRO,
  TDP_CONTENT_ELEMENTS,
  TDP_FRAMEWORK_INTRO,
  TDP_MATURITY_LEVELS,
  TDP_MATURITY_META,
} from "../../../methodology/guidance/tdpGuidance";
import {
  DBX_MBX_BASELINE_ASYMMETRY_IMPLICATIONS,
  DBX_MBX_BASELINE_MATURITY_ASYMMETRY,
  DBX_MBX_DIMENSIONS,
  DBX_MBX_INTRO,
  DBX_MBX_SOW_TOOLING_MISMATCH,
  DBX_MBX_TRANSITION_DIMENSIONS,
  DBX_MBX_TRANSITION_INTRO,
  DBX_MBX_TRANSITION_MITIGATIONS,
} from "../../../methodology/guidance/dbxMbxGuidance";
import { POINTER_SPEC_CATALOG } from "../../../methodology/guidance/pointerSpecGuidance";
import { INCOSE_FRAMEWORK_INTRO, INCOSE_GROUP_META, INCOSE_PROCESS_GROUPS } from "../../../methodology/guidance/incoseGuidance";
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

const NOT_MODELED = "_Not modeled by this app — see the SEMP Migration tab's section mapping for what is._\n";

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
    const verified = s.verbatimVerified ? "verbatim-verified" : "title-verified only";
    return `## ${number}. ${title}\n\n_Source in this app (${verified}): ${source}_\n`;
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

  // 1. Introduction
  lines.push(heading("introduction"));
  lines.push("_Program identification, SEP tailoring, and update cadence are not auto-generated — carry over from the destination SEMP's existing front matter._");
  lines.push("");
  lines.push("**INCOSE / ISO-IEC-IEEE 15288 Process Mapping** (supports aligning this contractor SEMP with the PMO's government SEP)");
  lines.push("");
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

  // 2.1 Requirements Development
  lines.push(heading("requirementsDevelopment"));
  lines.push(getValue("setr.frameworkIntro", SETR_FRAMEWORK_INTRO));
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

  // 2.2 Architectures and Interface Control
  lines.push(heading("architecturesInterfaceControl"));
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

  lines.push("**Recovery Program: CI Tier ↔ Delta Classification (Baseline B)**");
  lines.push("");
  lines.push(getValue("recovery.intro", RECOVERY_PROGRAM_INTRO));
  lines.push("");
  lines.push(
    mdTable(
      ["Delta Class", "CI Tier", "Description", "Reconciliation Effort"],
      RECOVERY_DELTA_CLASSES.map((cls) => [
        cls,
        RECOVERY_DELTA_CLASS_TIER_MAPPING[cls].tier,
        getValue(`recovery.class.${cls}.description`, RECOVERY_DELTA_CLASS_TIER_MAPPING[cls].description),
        getValue(`recovery.class.${cls}.workRequired`, RECOVERY_DELTA_CLASS_TIER_MAPPING[cls].workRequired),
      ]),
    ),
  );
  lines.push(getValue("recovery.scopeNote", RECOVERY_DELTA_CLASS_SCOPE_NOTE));
  lines.push("");

  // 2.3 Specialty Engineering
  lines.push(heading("specialtyEngineering"));
  lines.push(
    mdTable(
      ["Discipline", "Covered In This App"],
      [
        ["Human Systems Integration", "3.2.5, below"],
        ["System Safety", "3.2.6, below"],
        ["Reliability and Maintainability Engineering", "3.2.3, below (gap)"],
        ["Manufacturing and Quality Engineering", "3.2.4, below (gap)"],
        ["Software Engineering", "3.2.8, below"],
      ],
    ),
  );
  lines.push("");

  // 2.4 Modeling Strategy
  lines.push(heading("modelingStrategy"));
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
  lines.push("### Caught Between DBx and MBx: The Transition Period");
  lines.push("");
  lines.push(getValue("dbxMbx.transitionIntro", DBX_MBX_TRANSITION_INTRO));
  lines.push("");
  lines.push(
    mdTable(
      ["Dimension", "Challenge", "Extra Work Required While Straddling"],
      DBX_MBX_TRANSITION_DIMENSIONS.map((d) => [
        d.name,
        getValue(`dbxMbx.transition.${d.id}.challenge`, d.challenge),
        getValue(`dbxMbx.transition.${d.id}.duplicationTax`, d.duplicationTax),
      ]),
    ),
  );
  lines.push("");
  lines.push("**This Program's Complicating Factor**");
  lines.push("");
  lines.push(getValue("dbxMbx.baselineMaturityAsymmetry", DBX_MBX_BASELINE_MATURITY_ASYMMETRY));
  lines.push("");
  for (const [i, imp] of DBX_MBX_BASELINE_ASYMMETRY_IMPLICATIONS.entries()) {
    lines.push("- " + getValue(`dbxMbx.baselineMaturityAsymmetry.implication.${i}`, imp.text));
  }
  lines.push("");
  lines.push(getValue("dbxMbx.sowToolingMismatch", DBX_MBX_SOW_TOOLING_MISMATCH));
  lines.push("");
  lines.push("**Managing the transition without it becoming permanent**");
  lines.push("");
  for (const [i, m] of DBX_MBX_TRANSITION_MITIGATIONS.entries()) {
    lines.push("- " + getValue(`dbxMbx.transition.mitigation.${i}`, m.text));
  }
  lines.push("");

  // 2.5 Design Considerations
  lines.push(heading("designConsiderations"));
  lines.push("**COTS and Parts Management / DMSMS**");
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
  lines.push(
    "_CBRN Survivability, Modular Open Systems Approach (MOSA), Digital Ecosystem, System Security Engineering, " +
      "and Intelligence (the SEP Outline's other Design Considerations rows) are not modeled by this app._",
  );
  lines.push("");

  // 2.6 Technical Certifications
  lines.push(heading("technicalCertifications"));
  lines.push(NOT_MODELED);

  // 3.1 Technical Planning
  lines.push(heading("technicalPlanning"));
  lines.push(
    "_Not modeled — this app has no work-breakdown-structure, staffing, or program-office-organization data. " +
      "The SETR event sequence (3.2.13, below) gives schedule anchor points, not a substitute for this section._\n",
  );

  // 3.2.1 Technical Risk, Issue, and Opportunity Management
  lines.push(heading("technicalRiskIssueOpportunity"));
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
  lines.push("_This app has no dedicated trade-study or formal risk-register entity — treat this as a partial feed._");
  lines.push("");

  // 3.2.2 Technical Performance Measures
  lines.push(heading("technicalPerformanceMeasures"));
  lines.push(NOT_MODELED);

  // 3.2.3 Reliability and Maintainability Engineering
  lines.push(heading("reliabilityMaintainability"));
  lines.push(NOT_MODELED);

  // 3.2.4 Manufacturing and Quality Engineering
  lines.push(heading("manufacturingQuality"));
  lines.push(NOT_MODELED);

  // 3.2.5 Human Systems Integration
  lines.push(heading("humanSystemsIntegration"));
  const milStd1472 = POINTER_SPEC_CATALOG.find((p) => p.id === "milStd1472")!;
  lines.push(getValue(`pointerSpec.catalog.${milStd1472.id}.whyItMatters`, milStd1472.whyItMatters));
  lines.push("");
  lines.push(getValue(`pointerSpec.catalog.${milStd1472.id}.recommendedApproach`, milStd1472.recommendedApproach));
  lines.push("");

  // 3.2.6 System Safety
  lines.push(heading("systemSafety"));
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

  // 3.2.7 Corrosion Prevention and Control
  lines.push(heading("corrosionPreventionControl"));
  const milStd28800 = POINTER_SPEC_CATALOG.find((p) => p.id === "milStd28800")!;
  lines.push(
    "_Not modeled directly. Tangentially related: this app's MIL-STD-28800 (equipment ruggedization) pointer-" +
      "spec guidance —_",
  );
  lines.push("");
  lines.push(getValue(`pointerSpec.catalog.${milStd28800.id}.whyItMatters`, milStd28800.whyItMatters));
  lines.push("");

  // 3.2.8 Software Engineering
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

  // 3.2.9 Technology Insertion and Refresh
  lines.push(heading("technologyInsertionRefresh"));
  lines.push(
    "_Not modeled directly. Tangentially related: COTS Records' obsolescence monitoring notes (see 2.5 Design " +
      "Considerations, above)._\n",
  );

  // 3.2.10 Configuration and Change Management
  lines.push(heading("configurationChangeManagement"));
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
  lines.push("**Program Planning Deliverables (Referenced Lower-Level and Subcontractor Technical Plans)**");
  lines.push("");
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
  lines.push(
    "_Includes the Configuration Management Plan, Risk Management Plan, Requirements Management Plan, and Data " +
      "Management Plan named explicitly in DI-SESS-81785B paragraph 3.7, alongside the software-specific CDRLs " +
      "covered in 3.2.8 above._",
  );
  lines.push("");

  // 3.2.11 Technical Data Management
  lines.push(heading("technicalDataManagement"));
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

  // 3.2.12 System Security Engineering
  lines.push(heading("systemSecurityEngineering"));
  lines.push(NOT_MODELED);

  // 3.2.13 Technical Reviews, Audits and Activities
  lines.push(heading("technicalReviewsAuditsActivities"));
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
  lines.push(getValue("recurringTechActivities.intro", RECURRING_TECHNICAL_ACTIVITIES_INTRO));
  lines.push("");
  lines.push(
    mdTable(
      ["Activity", "Cadence", "Purpose", "Distinction from a SETR milestone gate"],
      RECURRING_TECHNICAL_ACTIVITIES.map((activity) => [
        activity.name,
        getValue(`recurringTechActivities.${activity.id}.cadence`, activity.cadence),
        getValue(`recurringTechActivities.${activity.id}.purpose`, activity.purpose),
        getValue(`recurringTechActivities.${activity.id}.distinctionFromSetr`, activity.distinctionFromSetr),
      ]),
    ),
  );
  lines.push("");

  // Appendix B (SEP Outline)
  lines.push(heading("appendixUii"));
  lines.push(NOT_MODELED);

  // Appendix C (SEP Outline)
  lines.push(heading("appendixAgileMetrics"));
  lines.push("_Not modeled — see 3.2.8 Software Engineering, above, for this app's software-side coverage._\n");

  // Appendix D (SEP Outline)
  lines.push(heading("appendixConOps"));
  lines.push("_Not auto-generated — carry over from the destination SEMP's existing ConOps material._\n");

  // Appendix E (SEP Outline)
  lines.push(heading("appendixDigitalEngineering"));
  lines.push(
    "_See 2.4 Modeling Strategy (the Document-Based vs Model-Based table) and 3.2.11 Technical Data Management " +
      "(TDP maturity/content elements), above — not duplicated here._\n",
  );

  // References
  lines.push(heading("referenceDocuments"));
  lines.push("**DID-cited references:** OSD SEP Outline v4.1; IEEE 24748-7:2019; IEEE 24748-8:2019.");
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
  lines.push(
    "**Other referenced frameworks:** MIL-STD-31000 (Technical Data Packages), EIA-649 (Configuration " +
      "Management), IEEE 12207 (Software Life Cycle Processes), INCOSE Systems Engineering Handbook / " +
      "ISO-IEC-IEEE 15288 — see the relevant sections above.",
  );
  lines.push("");
  lines.push(
    "_See the Consolidated Attachments Index at the end of this file for every linked document reference " +
      "captured across all tabs — a useful cross-check against this section's document list, not a substitute " +
      "for it._",
  );
  lines.push("");

  // Workbench data appendices (this app's own — distinct from the SEP Outline's Appendix A-E above)
  lines.push("---");
  lines.push("");
  lines.push("## Appendix F: CI Inventory (Workbench Data)");
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

  lines.push("## Appendix G: Consolidated Attachments Index (Workbench Data)");
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
