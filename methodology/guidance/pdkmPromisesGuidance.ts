// Generic, cross-program guidance for the "PDKM Promises" page pattern --
// any app built per the Reusable SE Webapp Architecture Guidance can adopt
// this same concept. It turns the schema-level `@domain-placeholder` marker
// (see data-schema/DOMAIN_PLACEHOLDER_FIELDS.md) into something a user can
// browse and reason about before any real Product/Domain Knowledge Model
// (PDKM) exists for the program a given deployment actually serves.
export const PDKM_PROMISES_INTRO =
  "Every value in this table is a promise, not a fact. In the spirit of a promissory note, this app commits that " +
  "each of these fields will be updated once a real Product/Domain Knowledge Model (PDKM) exists for the program " +
  "this Workbench actually serves. Until then, every value shown here is synthetic/illustrative demo content " +
  "invented to make the app's structure legible -- not a real program's requirements, hazards, part numbers, or " +
  "schedule commitments.";

export const PDKM_PROMISE_CHANNELS =
  "A PDKM update can arrive two ways: (1) a landing zone upload -- a technical or management source file (a " +
  "requirements export, a hazard tracking log, a CDRL schedule) ingested through this app's import path, or (2) " +
  "direct user data entry through this app's own edit forms. Either way, the promise is the same: once real data " +
  "replaces a synthetic value, every place in the Workbench that reads that field -- tables, detail pages, the " +
  "SEMP Migration export -- reflects the update automatically, because they all read from the same record rather " +
  "than a copy of it.";

export const PDKM_PROMISE_RIPPLE_NOTE =
  "This is a browsing tool, not an edit form. To update a promised field, use that entity's own tab (Subsystems, " +
  "CI Inventory, Specifications, etc.) -- this page exists so a CUI implementation team, or this program's own " +
  "reviewers, can see in one place exactly which fields are still synthetic and confirm nothing here is being " +
  "mistaken for real program data.";
