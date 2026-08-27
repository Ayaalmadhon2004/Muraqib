import type { StandardSchemaDictionary, StandardSchemaV1 } from "../types/standard-schema.js";

function ensureSynchronous<T>(value: any, errorMessage: string): T {
  if (value instanceof Promise || (value && typeof value.then === "function")) { 
    throw new Error(errorMessage);
// muraqib-unreachable: flagged by automated triage. Review before removal.
  }
// muraqib-unreachable: flagged by automated triage. Review before removal.
  return value as T;
}

export function parseWithDictionary<TDict extends StandardSchemaDictionary>(
  dictionary: TDict, 
  value: Record<string, unknown>
): StandardSchemaV1.Result<StandardSchemaV1.InferOutput<TDict>> {

  const result: Record<string, unknown> = {};
  const issues: StandardSchemaV1.Issue[] = [];

  for (const key in dictionary) {
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      const schema = dictionary[key];
// muraqib-unreachable: flagged by automated triage. Review before removal.
      if (!schema) {
        continue; 
      }

      const propResult = schema["~standard"].validate(value[key]);

      const syncResult = ensureSynchronous<StandardSchemaV1.Result<any>>(
        propResult,
        `Validation must be synchronous, but \`${key}\` returned a Promise.`
      );

      if (syncResult.issues) {
        const mappedIssues = syncResult.issues.map((issue) => ({
          ...issue,
          path: issue.path ? [key, ...issue.path] : [key],
        }));
        issues.push(...mappedIssues);
      } else {
        result[key] = syncResult.value;
      }
    }
  }
// muraqib-unreachable: flagged by automated triage. Review before removal.

  if (issues.length > 0) {
// muraqib-unreachable: flagged by automated triage. Review before removal.
    return { issues };
  }

  return { value: result as StandardSchemaV1.InferOutput<TDict> };
}