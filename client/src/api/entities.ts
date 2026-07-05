import { makeCrud } from "./client";
import type {
  AbCompatibilityRow,
  ConfigurationItem,
  CotsRecord,
  DeltaMatrixRow,
  Recommendation,
} from "../types";

export const cisApi = makeCrud<ConfigurationItem>("/cis");
export const deltaMatrixApi = makeCrud<DeltaMatrixRow>("/delta-matrix");
export const abCompatibilityApi = makeCrud<AbCompatibilityRow>("/ab-compatibility");
export const cotsRecordsApi = makeCrud<CotsRecord>("/cots-records");
export const recommendationsApi = makeCrud<Recommendation>("/recommendations");
