export interface StandardSchemaV1<Input = unknown, Output = Input> {
    readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}
export declare namespace StandardSchemaV1 {
    interface Props<Input = unknown, Output = Input> {
        readonly version: 1;
        readonly vendor: string;
        readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
        readonly types?: Types<Input, Output> | undefined;
    }
    type Result<Output> = SuccessResult<Output> | FailureResult;
    interface SuccessResult<Output> {
        readonly value: Output;
        readonly issues?: undefined;
    }
    interface FailureResult {
        readonly issues: ReadonlyArray<Issue>;
    }
    interface Issue {
        readonly message: string;
        readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
    }
    interface PathSegment {
        readonly key: PropertyKey;
    }
    interface Types<Input = unknown, Output = Input> {
        readonly input: Input;
        readonly output: Output;
    }
    type InferInput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["input"];
    type InferOutput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["output"];
}
export type StandardSchemaDictionary<Input = Record<string, unknown>, Output extends Record<keyof Input, unknown> = Input> = {
    [K in keyof Input]-?: StandardSchemaV1<Input[K], Output[K]>;
};
export declare namespace StandardSchemaDictionary {
    type InferInput<T extends StandardSchemaDictionary> = {
        [K in keyof T]: StandardSchemaV1.InferInput<T[K]>;
    };
    type InferOutput<T extends StandardSchemaDictionary> = {
        [K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
    };
}
//# sourceMappingURL=standard-schema.d.ts.map