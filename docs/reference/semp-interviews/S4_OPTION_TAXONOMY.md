# PKM Wizard Option-Taxonomy Tracker (S4, running)

**Purpose:** Tracks the accumulating generalized multiple-choice option sets offered during interview-mode questions in `S4_INTERVIEW_TRANSCRIPT.md` — the menus themselves are PKM-safe candidate content (non-CUI), distinct from which option a given program selects (PDKM instance data, recorded in the transcript, not here). Grows by evidence only.

**Placement note:** Same as the transcript this tracks — PDKM-adjacent, private-repo-only, per Design chat's HANDOFF (2026-08-05). The option menus themselves are candidate PKM-safe content and may eventually move to `udm-exchange` once formalized there; this file is a working tracker, not the canonical destination.

**Convention per question:** Union type (`closed`/`open`), scale tag (guidance only, not a filter), evidence source (`seeded` vs. `evidenced`).

## §2.1 Requirements Development
*(Retrofit candidate — §2.1 used free-text Q&A. Not yet retrofitted; flagged as future cleanup.)*
- Q6 tool_category (open union): spreadsheet/document-based; dedicated RM platform; MBSE/architecture tool. Evidenced.

## §2.2 Architectures and Interface Control

**Q1 — architecture ownership** (closed): Named Architect (seeded) / Chief Engineer (seeded) / Board-IPT (seeded, scale: larger programs) / **Lead Systems Engineer (evidenced)**.

**Q2 — interface ownership vs. architecture ownership** (closed): **Same role (evidenced)** / Separate ICWG (seeded, scale: larger/multi-contractor) / Separate named role (seeded).

**Q3 — architecture method/framework** (closed category; open within "named framework"): Named framework (seeded) / **MBSE methodology (evidenced)** / Document-based, structured, non-MBSE (seeded, corrected from original "ad hoc" framing — not lesser-rigor, scale: smaller programs or no MBSE investment) / Ad hoc, no defined method (seeded, kept as genuinely separate, lower-rigor, not endorsed).

**Q4 — internal vs. external interface tracking** (closed): **Scope tag/attribute in one model (evidenced)** / Separate registers (seeded) / Not distinguished (seeded).

**Q5 — ICD formalization trigger** (closed): **At preliminary design/architecture baseline (evidenced)** / When two parties need agreement (seeded) / Only for external interfaces (seeded).

**Q6 — architecture tooling pattern** (closed for pattern; open for tool names): **Same tool as requirements, e.g. Cameo (evidenced)** / Separate dedicated tool (seeded) / Multiple tools by discipline (seeded, scale: larger/multi-discipline). Design note: suggests `tool_category` needs an `entity_scope` field.

**Q7 — interface data tracking** (closed for tracking method; ICD is the common convergent output, not a parallel option — menu shape corrected from evidence): **Depends on DBx/MBx, both converge to ICD (evidenced)**. Original three-option menu (embedded-in-model / separate-register / standalone-ICD) restructured — DBx/MBx are the real choice axis, ICD is the shared destination.

**Q8/Q9:** free-text, not multiple-choice — no taxonomy entries.

*(Tracker continues as interview proceeds.)*
