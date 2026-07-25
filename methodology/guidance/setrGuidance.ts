// SETR (Systems Engineering Technical Review) milestone expectations, tying
// together the three tabs this app already models (Specifications, Safety
// Deliverables, Program Planning) into a single before/after picture of what
// should exist by each review. SSR's name is confirmed by this program's
// Lead Systems Engineer: "Software Specification Review" — earlier revisions
// of this app hedged this as an unverified working assumption ("System
// Specification Review"); that hedge is resolved. The event's existing
// guidance below (closing out System/Subsystem-level Development specs
// before CI-level decomposition starts at PDR) is retained as-is pending a
// deeper pass against this program's actual SSR entry/exit criteria — see
// the RonClemens/IPPDTraining reference material for the program-specific
// artifact-maturity detail (SCIRS draft state, etc.) not yet folded in here.
export type SetrEvent = "SRR" | "SFR" | "SSR" | "PDR" | "CDR" | "TRR" | "SVR" | "PRR";

export const SETR_EVENTS: SetrEvent[] = ["SRR", "SFR", "SSR", "PDR", "CDR", "TRR", "SVR", "PRR"];

export interface SetrEventGuidance {
  name: string;
  summary: string;
  decomposition: string;
  safetyPlanning: string;
  softwarePlanning: string;
  specGeneration: string;
  // MIL-STD-31000 Technical Data Package maturity this event's exit
  // criteria should produce — see ../data/tdpGuidance.ts for the full
  // Conceptual/Developmental/Product level definitions and the FCA/PCA
  // (EIA-649 Configuration Verification and Audit) notes this references.
  tdpMaturity: string;
}

export const SETR_GUIDANCE: Record<SetrEvent, SetrEventGuidance> = {
  SRR: {
    name: "System Requirements Review",
    summary:
      "Confirms the system-level requirements baseline is complete, bounded, and traceable to the CDD/ConOps before functional decomposition begins in earnest.",
    decomposition:
      "Candidate logical subsystems may be proposed, but none should be marked Validated yet — SRR confirms requirements, not architecture.",
    safetyPlanning:
      "System Safety Program Plan (SSPP) and a Preliminary Hazard List/Analysis established against the requirements baseline, not yet a functional one.",
    softwarePlanning:
      "Software Development Plan (SDP) and Configuration Management Plan (CMP) drafted, establishing process and methodology — not yet allocated to specific subsystems or CSCIs.",
    specGeneration:
      "Only a System-level Development spec should exist, and it should still be Draft/In Review — no Subsystem or CI-level specs yet.",
    tdpMaturity:
      "Conceptual-level TDP only (MIL-STD-31000) — a System-level requirements baseline, not yet any design data. Nothing produced at this gate should be represented as Developmental or Product TDP content.",
  },
  SFR: {
    name: "System Functional Review",
    summary:
      "Baselines the functional architecture — the logical subsystem decomposition — and confirms it's traceable to system requirements before physical/CI-level decomposition begins.",
    decomposition:
      "Logical subsystems should be Validated (or at minimum Proposed with clear validation criteria) by SFR exit — a subsystem still sourced Inherited/unverified at this point is a real finding, not just a caveat.",
    safetyPlanning:
      "Functional Hazard Analysis performed per validated subsystem; the system-level hazard analysis confirms those safety requirements allocated correctly down to the subsystems.",
    softwarePlanning:
      "The SDP is updated to allocate software functions to candidate CSCIs within the now-validated subsystem structure; a Software Test Plan is drafted per subsystem.",
    specGeneration:
      "Subsystem-level Development specs (Hardware and Software domain) should exist in Draft/In Review for each validated subsystem — still no CI-level specs, since CIs aren't chosen until physical decomposition.",
    tdpMaturity:
      "Still Conceptual-level TDP — the validated functional architecture gives a Developmental TDP something to organize around later, but no subsystem-level design data exists yet to actually call Developmental.",
  },
  SSR: {
    name: "Software Specification Review",
    summary:
      "Confirms the System- and Subsystem-level Development specs are complete and internally consistent before physical/CI-level design starts at PDR.",
    decomposition:
      "Functional decomposition is closed — no further subsystem changes expected without a formal ECP. Physical/CI-level decomposition has not started yet; that's PDR's job, not SSR's.",
    safetyPlanning:
      "The system-level hazard analysis and all subsystem-level Functional Hazard Analyses should be complete and consistent with the baselined specs; CI-level hazard analysis planning begins for the physical decomposition to come.",
    softwarePlanning:
      "The SDP and subsystem-level Software Test Plans should be baselined; CSCI-level planning (design descriptions, detailed test procedures) is explicitly out of scope until PDR/CDR.",
    specGeneration:
      "System- and Subsystem-level Development specs should be Approved or in final review. CI-level specs — and the CIs themselves — are a PDR-era artifact; their absence here isn't a gap, it's the correct state.",
    tdpMaturity:
      "Transitioning Conceptual → Developmental (MIL-STD-31000) — System/Subsystem Development specs nearing Approved is the TDP's first genuinely Developmental-level content, though CI-level design data (the bulk of a Developmental TDP) doesn't exist yet.",
  },
  PDR: {
    name: "Preliminary Design Review",
    summary:
      "Confirms the preliminary physical/CI-level design satisfies the baselined Subsystem specs and is stable enough to proceed to detailed design. This is where CI-level decomposition legitimately starts.",
    decomposition:
      "CI-level physical decomposition begins here — allocating Subsystem-level requirements to specific hardware/software configuration items. Over-decomposition (see CI Inventory: MCC, IPS) is a PDR-era failure mode specifically — a CI created for CM convenience rather than a genuine independent-verification need should be caught and dispositioned here, not discovered years later during PDR reconciliation, which is exactly what happened on this program.",
    safetyPlanning:
      "CI-level Subsystem Hazard Analysis begins, since CI designs are the first input it actually needs. The Preliminary/Functional Hazard Analyses from SRR/SFR should already be feeding CI-level safety requirements into these new CI specs, not restated from scratch.",
    softwarePlanning:
      "CSCI-level planning begins: a Software Design Description drafted per CSCI, and a Software Test Description drafted from the subsystem-level Software Test Plan. This is the first point where a specific piece of software has a specific design, not just a functional allocation.",
    specGeneration:
      "CI-level Development specs (Hardware and Software domain) should now exist — this is exactly where this program's over-decomposition problem shows up as spurious or duplicate CI specs (see spec-002's own notes flagging its consolidation issue).",
    tdpMaturity:
      "Developmental-level TDP begins in earnest — CI-level Development specs and preliminary drawings are exactly what MIL-STD-31000 calls Developmental Design TDP content; over-decomposed CIs produce spurious Developmental TDP content that would need correcting before it's worth carrying forward.",
  },
  CDR: {
    name: "Critical Design Review",
    summary:
      "Confirms the detailed, build-to/code-to design is complete and stable — the last major gate before hardware is fabricated and software is written for keeps.",
    decomposition:
      "Physical decomposition is closed — any further CI restructuring (like this program's MCC/IPS consolidation recommendation, rec-001) should happen via a formal ECP, not informally. A CDR that closes over an unresolved over-decomposition finding just locks in the technical debt for the rest of the program.",
    safetyPlanning:
      "CI-level Subsystem Hazard Analysis should be complete for each CI's detailed design, feeding CDR-exit safety requirement verification. A Health Hazard Assessment is initiated for any material/design choices finalized at CDR.",
    softwarePlanning:
      "The Software Design Description is finalized per CSCI; detailed Software Test Descriptions are ready to execute; Version Description Document planning begins for what a qualified software baseline will need to record.",
    specGeneration:
      "CI-level Development specs should be Approved, not just In Review — build-to/code-to detail complete. This is roughly where a spec should start being evaluated for the eventual Development → Production transition, though it shouldn't flip yet.",
    tdpMaturity:
      "Developmental-level TDP should be complete and stable — build-to/code-to detail is the ceiling of what a Developmental TDP contains. Nothing here should be represented as Product-level yet; the Functional Configuration Audit that authorizes that transition hasn't happened (it's SVR, below).",
  },
  TRR: {
    name: "Test Readiness Review",
    summary:
      "Confirms test procedures, test items, instrumentation, and resources are actually ready to execute formal qualification/verification testing.",
    decomposition:
      "No decomposition activity expected at this gate — TRR is about test readiness, not architecture. A CI boundary still being renegotiated at TRR is a sign the program skipped disposition at PDR/CDR, not a normal TRR finding.",
    safetyPlanning:
      "CI-level System Hazard Analysis (verifying integrated CI designs don't introduce new interface hazards) and Operating & Support Hazard Analysis should be underway or nearing completion, since both need CI designs mature enough to integrate and procedures stable enough to analyze.",
    softwarePlanning:
      "Software Test Descriptions are executed, not just drafted; any CSCI defects found get dispositioned before formal test starts, not folded silently into \"known issues\" for the eventual Version Description Document.",
    specGeneration:
      "This is the transition point: Development specs that have passed their qualification testing should begin flipping to Production type — one CI/subsystem at a time as its qualification evidence closes out, not all at once on a calendar date.",
    tdpMaturity:
      "Still Developmental-level TDP formally, even though qualification testing is executing — the Functional Configuration Audit (SVR, below) is the EIA-649 event that actually authorizes calling a given item's TDP content Product-level, not the start of testing.",
  },
  SVR: {
    name: "System Verification Review (Functional Configuration Audit)",
    summary:
      "Verifies, based on test results, that the system actually meets its requirements — the Functional Configuration Audit formally confirms each requirement's verification method and result against the baselined spec.",
    decomposition: "Not applicable — decomposition was closed at CDR; this gate audits against it, it doesn't revisit it.",
    safetyPlanning:
      "All hazard analyses, from the system-level Preliminary/Requirements Hazard Analysis through CI-level System/Operating & Support/Health Hazard analyses, should be closed or carry a documented open-hazard risk acceptance in the Hazard Tracking Log. The Safety Assessment Report is finalized, summarizing residual risk.",
    softwarePlanning:
      "The Version Description Document is finalized, recording the as-built/as-qualified software baseline that was actually verified — not a snapshot carried over from CDR.",
    specGeneration:
      "Specs at every level should show Approved status with verification results traceable to their Verification Provisions section. A spec still Draft/In Review at SVR means its requirements were never actually confirmed against the as-built system.",
    tdpMaturity:
      "This is the Developmental → Product TDP transition (MIL-STD-31000), item by item, gated by the FCA this event represents — matching exactly the Development → Production spec-type transition guidance above. A spec/CI whose FCA hasn't closed shouldn't have its TDP content represented as Product-level yet, regardless of test progress.",
  },
  PRR: {
    name: "Production Readiness Review",
    summary:
      "Confirms production processes, tooling, and supplier readiness — not just the design — are ready to produce the system at the needed rate and quality. The last gate before committing to production.",
    decomposition:
      "Not applicable — architecture and design are fixed by now; PRR is about manufacturing/production readiness, not the technical baseline.",
    safetyPlanning:
      "Safety CDRLs should have transitioned fully to their Production-relevant form; a CDRL still carrying Development applicability at PRR should be a flagged exception with a documented reason, not the default state.",
    softwarePlanning:
      "Software configuration is fully baselined for production/fielding — no further Software Development Plan or Test Plan activity expected; only sustainment-phase planning follows, which is outside this app's SRR–PRR scope.",
    specGeneration:
      "All Development specs relevant to the fielded configuration should have transitioned to Production type (see the Development-vs-Production guidance above). A spec still Development at PRR means the production baseline isn't actually locked — which is exactly the reconciliation problem this whole app was built to catch, just caught one gate later than it should have been.",
    tdpMaturity:
      "Product-level TDP should be at or near complete for the fielded configuration. The Physical Configuration Audit — performed at or shortly after PRR, not at SVR/FCA — is the EIA-649 event that actually closes out Product-level TDP maturity by confirming the as-built article and drawing package match the Production spec; see the FCA/PCA note in the TDP Alignment guidance above.",
  },
};

export const SETR_FRAMEWORK_INTRO =
  "SRR through PRR aren't independent checklists — each one gates what the next is allowed to assume. SFR can't " +
  "meaningfully baseline a functional architecture if SRR left the requirements baseline unsettled; PDR can't " +
  "meaningfully start CI-level decomposition against a functional architecture SFR/SSR never actually validated; " +
  "PRR can't meaningfully certify production readiness for specs that never finished transitioning from " +
  "Development to Production. The same logic applies across System Decomposition, System Safety Planning, and " +
  "System Software Planning at each event: they mature together, not independently, and a spec or CDRL that's " +
  "more mature than the review gate it's supposed to follow is usually a sign something got skipped, not that the " +
  "team is ahead of schedule. This program's own Baseline A reconciliation effort — the reason this app exists — " +
  "is a case in point: CI-level over-decomposition that PDR should have caught wasn't caught until the program was " +
  "already approaching System TRR.";

// The eight SRR-PRR events above are the formal, customer-attended
// milestone gates — but per this program's LSE, the SEP Outline's own
// "Technical Reviews, Audits and Activities" section title covers more than
// just those eight named events. These four recurring activities fill the
// space between milestone gates and are tracked here as a distinct,
// simpler catalog rather than forced into the SetrEventGuidance shape,
// since they don't carry the same per-event decomposition/safety/software/
// spec-generation/TDP-maturity dimensions a milestone gate does.
export const RECURRING_TECHNICAL_ACTIVITIES_INTRO =
  "The eight SRR → PRR events above are the formal, customer-attended milestone gates — but they're not the " +
  "only structured technical activity a program runs. Internal Technical Interchange Meetings, external TIMs, " +
  "Design Reviews, and the Change (Control) Review Board fill the space between milestone gates, and \"Technical " +
  "Reviews, Audits and Activities\" — the SEP Outline's own section title — is meant to cover all of them, not " +
  "just the eight named events.";

export interface RecurringTechnicalActivity {
  id: string;
  name: string;
  cadence: string;
  purpose: string;
  distinctionFromSetr: string;
}

export const RECURRING_TECHNICAL_ACTIVITIES: RecurringTechnicalActivity[] = [
  {
    id: "internalTim",
    name: "Internal Technical Interchange Meeting",
    cadence: "As needed, between formal milestone gates",
    purpose:
      "Program-internal, cross-discipline working session (SE, safety, software, hardware) to resolve a " +
      "specific open technical issue before it can block progress toward the next SETR gate — no customer or " +
      "government attendance.",
    distinctionFromSetr:
      "Not one of the eight SRR–PRR milestone events above — those are formal, customer-attended gates with " +
      "entry/exit criteria; this is an internal working session with no such criteria, held whenever a specific " +
      "issue needs cross-discipline resolution.",
  },
  {
    id: "externalTim",
    name: "External Technical Interchange Meeting (TIM)",
    cadence: "As needed, government/customer-attended",
    purpose:
      "Formal technical exchange with the customer on a specific topic (an interface definition, a trade study " +
      "result, a waiver request) outside the full milestone-review process — often the venue where a risk " +
      "surfaces to the customer before it becomes a formal finding at the next SETR gate.",
    distinctionFromSetr:
      "Narrower in scope than a milestone review (one topic, not a full design/requirements maturity " +
      "assessment) but still customer-facing and often formally minuted — treat outcomes with the same rigor as " +
      "a review action item, not an informal conversation.",
  },
  {
    id: "designReview",
    name: "Design Review",
    cadence: "Program-defined, typically subsystem- or CI-level, between milestone gates",
    purpose:
      "Internal, peer-level review of a specific design (a subsystem architecture, a CI's detailed design) to " +
      "catch issues before they reach a formal milestone gate — the informal counterpart to PDR/CDR, not a " +
      "substitute for them.",
    distinctionFromSetr:
      "Scoped to one design artifact rather than the whole program baseline, and doesn't carry the formal " +
      "entry/exit criteria or customer attendance a milestone gate does — findings here should be closed " +
      "before, not carried into, the next formal SETR event.",
  },
  {
    id: "ccb",
    name: "Change (Control) Review Board (CCB)",
    cadence: "Recurring, per program CM process",
    purpose:
      "The formal body that dispositions Engineering Change Proposals (ECPs) and change requests against the " +
      "configuration baseline — the actual mechanism behind this app's Delta Matrix \"ECP required\" " +
      "disposition and the EIA-649 Configuration Change Management functional area.",
    distinctionFromSetr:
      "Not a design-maturity gate at all — it's the configuration-management governance activity that formally " +
      "authorizes any change to an already-baselined artifact, whether or not a SETR event is imminent.",
  },
];
