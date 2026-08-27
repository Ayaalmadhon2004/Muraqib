import type { StandardSchemaDictionary, StandardSchemaV1 } from "../types/standard-schema.js";
export declare function parseWithDictionary<TDict extends StandardSchemaDictionary>(dictionary: TDict, value: Record<string, unknown>): StandardSchemaV1.Result<StandardSchemaV1.InferOutput<TDict>>;
//# sourceMappingURL=parser.d.ts.map