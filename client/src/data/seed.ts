import type { Database } from "../types";

// ILLUSTRATIVE SAMPLE DATA ONLY (MHC/MCC/IPS Test Set example) — mirrors
// server/data/seed.json for the static (GitHub Pages) build, which has no
// backend to serve it from. Not real program data.
export const SEED_DATA: Database = {
  logicalSubsystems: [
    {
      id: "sub-001",
      name: "UUT Stimulus/Response",
      description:
        "Generates and captures electrical stimulus/response signals exchanged with the Unit Under Test during automated test sequences.",
      source: "Validated",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "sub-002",
      name: "Diagnostic Messaging",
      description:
        "Formats and transports diagnostic status/health messages between the Test Set and UUT test scripts.",
      source: "Validated",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "sub-003",
      name: "Power Conditioning & Distribution",
      description:
        "Regulates and distributes DC power to Test Set sub-assemblies. Hypothesis based on IPS's apparent role; not yet confirmed against design-engineer knowledge.",
      source: "Proposed",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "sub-004",
      name: "Rack 3 Assembly (legacy grouping)",
      description:
        "Pulled directly from the existing physical/rack-organized SSDD as a placeholder grouping. Captures which enclosure a CI physically sits in, not a functional boundary — not yet independently validated as a true logical subsystem.",
      source: "Inherited from SSDD structure — unverified",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
  ],
  cis: [
    {
      id: "ci-001",
      name: "Test Set (MHC/MCC/IPS Assembly)",
      type: "developmental",
      tier: "Tier 1",
      subsystemIds: ["sub-001", "sub-002", "sub-003"],
      overDecompositionFlag: false,
      consolidationNotes: "",
      status: "In reconciliation",
      notes:
        "Primary UUT test interface assembly; consolidation target for over-decomposed COTS sub-items below.",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "ci-002",
      name: "MHC (Multi-Head Controller)",
      type: "developmental",
      tier: "Tier 1",
      subsystemIds: ["sub-001", "sub-002"],
      overDecompositionFlag: false,
      consolidationNotes: "",
      status: "In reconciliation",
      notes: "UUT-facing controller module within the Test Set.",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "ci-003",
      name: "MCC (Module Control Card)",
      type: "COTS",
      tier: "Tier 1",
      subsystemIds: ["sub-001"],
      overDecompositionFlag: true,
      consolidationNotes:
        "Should be absorbed into Test Set CI; currently tracked as a standalone CI despite being a COTS sub-assembly with no independent verification path.",
      status: "Flagged for consolidation",
      notes: "Vendor COTS card, no unique program requirements beyond the Test Set's allocation.",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "ci-004",
      name: "IPS (Interface Power Supply)",
      type: "COTS",
      tier: "Tier 1",
      subsystemIds: ["sub-003"],
      overDecompositionFlag: true,
      consolidationNotes:
        "Candidate for reclassification as a COTS item record under the Test Set CI rather than a standalone CI.",
      status: "Flagged for consolidation",
      notes: "Commercial power supply module.",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "ci-005",
      name: "Legacy Diagnostic Bus Adapter",
      type: "developmental",
      tier: "Tier 3",
      subsystemIds: ["sub-004"],
      overDecompositionFlag: false,
      consolidationNotes: "",
      status: "Slated for replacement",
      notes: "Not UUT-facing; scheduled to be retired in a future increment.",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
  ],
  deltaMatrix: [
    {
      id: "delta-001",
      ciId: "ci-001",
      sfrAllocation: "Test Set shall provide UUT stimulus/response interface per SFR-4.2.1.",
      actualDecomposition:
        "As-built Test Set decomposes stimulus/response function across MHC + MCC + IPS sub-modules.",
      delta: "As-built decomposition is finer-grained than the SFR-agreed single-CI allocation.",
      deltaSource: "Design reality vs. model",
      rationale:
        "Sub-modules were introduced during detailed design for vendor sourcing reasons, not reflected back into the requirements model.",
      disposition: "ECP required",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "delta-002",
      ciId: "ci-003",
      sfrAllocation: "No independent SFR allocation exists for MCC; it is implicitly part of Test Set allocation.",
      actualDecomposition:
        "MCC currently tracked as standalone CI in the CM tool with its own (empty) requirements shell.",
      delta: "Standalone CI record has no corresponding validated requirement; over-decomposition artifact.",
      deltaSource: "Model unvalidated vs. design",
      rationale:
        "CI record was created early for CM tracking convenience and never reconciled against actual requirements allocation.",
      disposition: "Accept as-is",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
  ],
  abCompatibility: [
    {
      id: "ab-001",
      ciId: "ci-002",
      baselineAState: "MHC exposes a proprietary serial diagnostic protocol to UUT test scripts.",
      baselineBIntent:
        "Baseline B design intends to standardize on Ethernet-based diagnostic messaging for the equivalent interface.",
      compatibilityStatus: "Diverging",
      riskNote:
        "UUT scripts written against Baseline A's serial protocol will require an adapter layer or rewrite before Baseline B TRR.",
      lastReviewedDate: "2026-06-15",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z",
    },
    {
      id: "ab-002",
      ciId: "ci-004",
      baselineAState: "IPS provides fixed 28VDC output to the UUT test fixture.",
      baselineBIntent: "Baseline B design retains the same 28VDC interface for backward compatibility.",
      compatibilityStatus: "Aligned",
      riskNote: "No action needed; confirm at next Baseline B PDR checkpoint.",
      lastReviewedDate: "2026-05-01",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z",
    },
  ],
  cotsRecords: [
    {
      id: "cots-001",
      ciId: "ci-003",
      functionalRequirement:
        "Shall provide module-level control signaling sufficient to support Test Set stimulus/response timing per SFR-4.2.1 (capability-based; no vendor-specific behavior required).",
      interfaceRequirement: "Per ICD-TS-014, Section 3 (referenced, not restated).",
      formFitConstraints: "Must fit existing Test Set card cage slot 3; conduction-cooled per chassis spec.",
      verificationMethod: "inspection of vendor data sheet",
      rationale:
        "Capability is bounded by the Test Set's overall stimulus/response requirement; no need for a standalone CI-level requirement set.",
      partsListEntry: "Acme Corp MCC-200, Rev C",
      qualifiedAlternates: [
        { makeModelPartNumber: "Acme Corp MCC-200R (ruggedized variant)", lifecycleStatus: "Active" },
      ],
      obsolescenceMonitoringNotes:
        "Vendor has not announced end-of-life; monitor annually via vendor product change notice (PCN) subscription.",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "cots-002",
      ciId: "ci-004",
      functionalRequirement:
        "Shall provide regulated 28VDC output at up to 15A to support UUT test fixture power needs (capability-based).",
      interfaceRequirement: "Per ICD-TS-014, Section 5 (referenced, not restated).",
      formFitConstraints: "1U rack-mount form factor; existing chassis cutout.",
      verificationMethod: "inspection of vendor data sheet",
      rationale:
        "Commercial power supply meeting a bounded capability; verification by vendor data sheet is sufficient per program COTS policy.",
      partsListEntry: "Volt Dynamics IPS-28-15, Rev A",
      qualifiedAlternates: [],
      obsolescenceMonitoringNotes: "Vendor lifecycle status last checked 2026-05-01; no obsolescence notice on file.",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
  ],
  recommendations: [
    {
      id: "rec-001",
      text: "Consolidate MCC and IPS as COTS item records under the Test Set CI rather than standalone CIs; retire their independent CI records after CCB approval.",
      category: "CI structure",
      status: "open",
      owner: "",
      relatedCiId: "ci-001",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "rec-002",
      text: "Submit ECP to reconcile SFR-4.2.1 allocation with as-built Test Set sub-module decomposition.",
      category: "delta matrix",
      status: "open",
      owner: "",
      relatedCiId: "ci-001",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "rec-003",
      text: "Stand up an adapter layer (or plan a UUT script rewrite) to bridge MHC's serial diagnostic protocol to Baseline B's Ethernet-based messaging before Baseline B System TRR.",
      category: "A-B alignment",
      status: "in progress",
      owner: "",
      relatedCiId: "ci-002",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z",
    },
  ],
  interfaces: [
    {
      id: "iface-001",
      scope: "subsystem",
      aId: "sub-001",
      bId: "sub-002",
      description:
        "MHC correlates captured stimulus/response signal state into the diagnostic message stream in real time; documented interface, not just an artifact of sharing the MHC CI.",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
    {
      id: "iface-002",
      scope: "ci",
      aId: "ci-002",
      bId: "ci-003",
      description: "MHC issues module-level control commands to MCC over the internal Test Set backplane.",
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
  ],
  specifications: [
    {
      id: "spec-001",
      title: "System Requirements Specification — Baseline A",
      level: "System",
      domain: "Hardware",
      specType: "Development",
      baseline: "Baseline A",
      status: "Approved",
      linkedSubsystemId: null,
      linkedCiId: null,
      sections: {
        scope:
          "Establishes top-level operational and performance requirements for Baseline A as a whole, independent of physical decomposition into CIs.",
        applicableDocuments: "Capability Development Document (CDD); program ConOps; SFR-agreed requirements baseline.",
        functionalPerformance:
          "Shall provide automated stimulus/response testing of the UUT across the defined operational envelope; shall report diagnostic status within program-specified latency bounds.",
        interfaces:
          "External interfaces to the UUT and to organic support equipment; internal decomposition is intentionally left to subsystem/CI-level specs, not restated here.",
        environmental:
          "Per program environmental design reference mission profile (temperature, vibration, EMI) — inherited by all subsystem/CI specs unless a tailored exception is documented at that level.",
        designConstraints:
          "None prescribed at this level by design — system spec intentionally avoids design-solution language to preserve subsystem/CI trade space.",
        safety: "System shall fail to a safe state on loss of UUT communication.",
        security: "N/A for this illustrative dataset.",
        humanFactors: "Test operator workload shall not exceed program-defined thresholds during nominal test sequences.",
        logistics: "Deferred to CI-level specs; not meaningfully allocable at system level.",
        verificationProvisions:
          "System-level requirements verified via integrated DT&E; subsystem/CI-level verification methods are specified in those respective specs.",
        notes: "Illustrative/demo content only — not real program data.",
      },
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "spec-002",
      title: "Test Set (MHC/MCC/IPS Assembly) — CI Development Specification",
      level: "CI",
      domain: "Hardware",
      specType: "Development",
      baseline: "Baseline A",
      status: "In Review",
      linkedSubsystemId: null,
      linkedCiId: "ci-001",
      sections: {
        scope:
          "Development specification for the Test Set CI, covering the MHC/MCC/IPS assembly as currently decomposed pending the CI-structure consolidation recommendation.",
        applicableDocuments: "System Requirements Specification (spec-001); ICD-TS-014.",
        functionalPerformance:
          "Shall generate and capture UUT stimulus/response signals per SFR-4.2.1; shall format diagnostic messages for transport to test scripts.",
        interfaces: "Per ICD-TS-014; internal sub-module interfaces tracked in the CI x CI N² diagram (see MHC ↔ MCC).",
        environmental:
          "Conduction-cooled per chassis spec; see Delta Matrix for as-built vs. SFR-agreed allocation discrepancy on sub-module decomposition.",
        designConstraints:
          "Must fit existing Test Set card cage; COTS sub-assemblies (MCC, IPS) tracked as separate COTS item records pending consolidation.",
        safety: "No hazardous voltages exposed at UUT interface under single-fault conditions.",
        security: "N/A for this illustrative dataset.",
        humanFactors: "N/A beyond system-level allocation.",
        logistics: "MCC and IPS obsolescence monitored via their COTS item records, not restated here.",
        verificationProvisions:
          "Stimulus/response timing verified by test; COTS sub-assembly capability verified by inspection of vendor data sheet (see COTS Records).",
        notes:
          "This CI is flagged for over-decomposition consolidation — see CI Inventory and rec-001. Keep this spec's scope tight to avoid re-litigating requirements already captured in COTS item records once consolidation happens.",
      },
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-06-10T00:00:00.000Z",
    },
    {
      id: "spec-003",
      title: "System Requirements Specification — Baseline B (early draft)",
      level: "System",
      domain: "Hardware",
      specType: "Development",
      baseline: "Baseline B",
      status: "Draft",
      linkedSubsystemId: null,
      linkedCiId: null,
      sections: {
        scope:
          "Early-draft top-level requirements for Baseline B. Content is intentionally sparse — Baseline B is still in concept/early design and should not be treated as stable.",
        applicableDocuments: "TBD pending Baseline B CDD update.",
        functionalPerformance:
          "TBD — see A/B Compatibility Matrix for the specific UUT-relevant interfaces already being tracked ahead of full requirements definition.",
        interfaces:
          "Baseline B intends to standardize on Ethernet-based diagnostic messaging where Baseline A uses a proprietary serial protocol (see ab-001) — this is the leading edge of what this spec will need to formalize.",
        environmental: "TBD.",
        designConstraints: "TBD.",
        safety: "TBD.",
        security: "TBD.",
        humanFactors: "TBD.",
        logistics: "TBD.",
        verificationProvisions: "TBD.",
        notes:
          "Illustrative/demo content only. This spec should mature roughly in step with Baseline A's transition from Development to Production specs — track that relationship via the A/B Compatibility Matrix, not by duplicating content here.",
      },
      createdAt: "2026-01-06T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
  ],
  content: [],
};
