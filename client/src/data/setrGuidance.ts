// SETR (Systems Engineering Technical Review) milestone expectations, tying
// together the three tabs this app already models (Specifications, Safety
// Deliverables, Program Planning) into a single before/after picture of what
// should exist by each review. Working assumption on SSR's name — not
// confirmed against the program's own SETR nomenclature, so flagged here
// rather than asserted as settled: this app treats it as "System
// Specification Review," the point where System/Subsystem-level Development
// specs are expected to close out, immediately before CI-level decomposition
// starts at PDR.
export type SetrEvent = "SRR" | "SFR" | "SSR";

export const SETR_EVENTS: SetrEvent[] = ["SRR", "SFR", "SSR"];

export interface SetrEventGuidance {
  name: string;
  summary: string;
  decomposition: string;
  safetyPlanning: string;
  softwarePlanning: string;
  specGeneration: string;
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
  },
  SSR: {
    name: "System Specification Review",
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
  },
};

export const SETR_FRAMEWORK_INTRO =
  "SRR, SFR, and SSR aren't independent checklists — each one gates what the next is allowed to assume. SFR can't " +
  "meaningfully baseline a functional architecture if SRR left the requirements baseline unsettled; SSR can't " +
  "meaningfully close out Subsystem-level specs against a functional architecture SFR never actually validated. " +
  "The same logic applies across System Decomposition, System Safety Planning, and System Software Planning at " +
  "each event: they mature together, not independently, and a spec or CDRL that's more mature than the review " +
  "gate it's supposed to follow is usually a sign something got skipped, not that the team is ahead of schedule.";
