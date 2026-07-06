import { makeCrud, type Crud } from "./client";
import { makeLocalCrud } from "./localStore";
import { IS_STATIC_MODE } from "./deployMode";
import type {
  AbCompatibilityRow,
  ConfigurationItem,
  CotsRecord,
  DeltaMatrixRow,
  Recommendation,
} from "../types";

function entity<T extends { id: string }>(path: string, collection: Parameters<typeof makeLocalCrud>[0]): Crud<T> {
  return IS_STATIC_MODE ? makeLocalCrud<T>(collection) : makeCrud<T>(path);
}

export const cisApi = entity<ConfigurationItem>("/cis", "cis");
export const deltaMatrixApi = entity<DeltaMatrixRow>("/delta-matrix", "deltaMatrix");
export const abCompatibilityApi = entity<AbCompatibilityRow>("/ab-compatibility", "abCompatibility");
export const cotsRecordsApi = entity<CotsRecord>("/cots-records", "cotsRecords");
export const recommendationsApi = entity<Recommendation>("/recommendations", "recommendations");
