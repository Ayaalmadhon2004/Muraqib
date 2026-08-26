// this file is just for standard schema and that is it ? it is like put the settings to this standard ? and the result if it is good or bad ?
// so issue , success or what , where i can have these results and how ?
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": StandardSchemaV1.Props<Input, Output>; 
}

export declare namespace StandardSchemaV1 {
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
  export interface Props<Input = unknown, Output = Input> {
    readonly version: 1;     
    readonly vendor: string;   
    readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
    readonly types?: Types<Input, Output> | undefined;
  }
// muraqib-ignore-dead: intentionally preserved (auto-suppress)

  export type Result<Output> = SuccessResult<Output> | FailureResult;
  export interface SuccessResult<Output> {
    readonly value: Output;       
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
    readonly issues?: undefined;  
  }
  export interface FailureResult {
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
    readonly issues: ReadonlyArray<Issue>; 
  }

  export interface Issue {
    readonly message: string;
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }

// muraqib-ignore-dead: intentionally preserved (auto-suppress)
  // why we are using pathSegment ?
  export interface PathSegment {
    readonly key: PropertyKey; 
  }

// muraqib-ignore-dead: intentionally preserved (auto-suppress)
  export interface Types<Input = unknown, Output = Input> {
    readonly input: Input;
    readonly output: Output;
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
  }

  // why we are using infer input , output?
  export type InferInput<Schema extends StandardSchemaV1> = NonNullable<
    Schema["~standard"]["types"]
  >["input"];

  export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
    Schema["~standard"]["types"]
  >["output"];
}

// what is the dictionary and why we use itand difference between type and namespace and difference of them
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
export type StandardSchemaDictionary<
  Input = Record<string, unknown>,
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
  Output extends Record<keyof Input, unknown> = Input,
> = {
  [K in keyof Input]-?: StandardSchemaV1<Input[K], Output[K]>;
};

export namespace StandardSchemaDictionary {
  export type InferInput<T extends StandardSchemaDictionary> = {
    [K in keyof T]: StandardSchemaV1.InferInput<T[K]>;
  };
  export type InferOutput<T extends StandardSchemaDictionary> = {
    [K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
  };
}