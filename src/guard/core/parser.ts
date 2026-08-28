import type { StandardSchemaDictionary, StandardSchemaV1 } from "../types/standard-schema.js";

function ensureSynchronous<T>(value: any, errorMessage: string): T {
  if (value instanceof Promise || (value && typeof value.then === "function")) { 
    throw new Error(errorMessage);
  }
  return value as T;
}

export function parseWithDictionary<TDict extends StandardSchemaDictionary>(
  dictionary: TDict, 
  value: Record<string, unknown>
): StandardSchemaV1.Result<StandardSchemaDictionary.InferOutput<TDict>> {

  const result: Record<string, unknown> = {};
  const issues: StandardSchemaV1.Issue[] = [];

  for (const key in dictionary) {
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      const schema = dictionary[key];
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

  if (issues.length > 0) {
    return { issues };
  }

  return { value: result as StandardSchemaDictionary.InferOutput<TDict> };
}