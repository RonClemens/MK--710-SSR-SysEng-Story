import { makeCrud, type Crud } from "./client";
import { makeLocalCrud } from "./localStore";
import { IS_STATIC_MODE } from "./deployMode";
import type {
  AbCompatibilityRow,
  Baseline,
  ChecklistItem,
  ConfigurationItem,
  CotsRecord,
  DeltaMatrixRow,
  Gap,
  InterfaceRecord,
  LogicalSubsystem,
  Milestone,
  Program,
  ProgramPlanningDeliverable,
  Project,
  Recommendation,
  ReconciliationEvent,
  Requirement,
  RiskItem,
  Role,
  SafetyDeliverable,
  Specification,
  VerificationEvent,
} from "../types";

function entity<T extends { id: string }>(path: string, collection: Parameters<typeof makeLocalCrud>[0]): Crud<T> {
  return IS_STATIC_MODE ? makeLocalCrud<T>(collection) : makeCrud<T>(path);
}

export const programsApi = entity<Program>("/programs", "programs");
export const projectsApi = entity<Project>("/projects", "projects");
export const baselinesApi = entity<Baseline>("/baselines", "baselines");
export const reconciliationEventsApi = entity<ReconciliationEvent>("/reconciliation-events", "reconciliationEvents");
export const milestonesApi = entity<Milestone>("/milestones", "milestones");
export const requirementsApi = entity<Requirement>("/requirements", "requirements");
export const verificationEventsApi = entity<VerificationEvent>("/verification-events", "verificationEvents");
export const checklistItemsApi = entity<ChecklistItem>("/checklist-items", "checklistItems");
export const gapsApi = entity<Gap>("/gaps", "gaps");
export const logicalSubsystemsApi = entity<LogicalSubsystem>("/subsystems", "logicalSubsystems");
export const interfacesApi = entity<InterfaceRecord>("/interfaces", "interfaces");
export const specificationsApi = entity<Specification>("/specifications", "specifications");
export const safetyDeliverablesApi = entity<SafetyDeliverable>("/safety-deliverables", "safetyDeliverables");
export const programPlanningDeliverablesApi = entity<ProgramPlanningDeliverable>(
  "/program-planning-deliverables",
  "programPlanningDeliverables"
);
export const cisApi = entity<ConfigurationItem>("/cis", "cis");
export const deltaMatrixApi = entity<DeltaMatrixRow>("/delta-matrix", "deltaMatrix");
export const abCompatibilityApi = entity<AbCompatibilityRow>("/ab-compatibility", "abCompatibility");
export const cotsRecordsApi = entity<CotsRecord>("/cots-records", "cotsRecords");
export const rolesApi = entity<Role>("/roles", "roles");
export const recommendationsApi = entity<Recommendation>("/recommendations", "recommendations");
export const riskItemsApi = entity<RiskItem>("/risk-items", "riskItems");
