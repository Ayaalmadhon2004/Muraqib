// this file is just for standard schema and that is it ? it is like put the settings to this standard ? and the result if it is good or bad ?
// so issue , success or what , where i can have these results and how ?
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": StandardSchemaV1.Props<Input, Output>; 
}

export declare namespace StandardSchemaV1 {
  export interface Props<Input = unknown, Output = Input> { // muraqib-ignore-dead: auto-suppressed by script for Props
    readonly version: 1;     
    readonly vendor: string;   
    readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
    readonly types?: Types<Input, Output> | undefined;
  }

  export type Result<Output> = SuccessResult<Output> | FailureResult; // muraqib-ignore-dead: auto-suppressed by script for Result
  export interface SuccessResult<Output> { // muraqib-ignore-dead: auto-suppressed by script for SuccessResult
    readonly value: Output;       
    readonly issues?: undefined;  
  }
  export interface FailureResult { // muraqib-ignore-dead: auto-suppressed by script for FailureResult
    readonly issues: ReadonlyArray<Issue>; 
  }

  export interface Issue { // muraqib-ignore-dead: auto-suppressed by script for Issue
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }

  // why we are using pathSegment ?
  export interface PathSegment { // muraqib-ignore-dead: auto-suppressed by script for PathSegment
    readonly key: PropertyKey; 
  }

  export interface Types<Input = unknown, Output = Input> { // muraqib-ignore-dead: auto-suppressed by script for Types
    readonly input: Input;
    readonly output: Output;
  }

  // why we are using infer input , output?
  export type InferInput<Schema extends StandardSchemaV1> = NonNullable< // muraqib-ignore-dead: auto-suppressed by script for InferInput
    Schema["~standard"]["types"]
  >["input"];

  export type InferOutput<Schema extends StandardSchemaV1> = NonNullable< // muraqib-ignore-dead: auto-suppressed by script for InferOutput
    Schema["~standard"]["types"]
  >["output"];
}

// what is the dictionary and why we use itand difference between type and namespace and difference of them
export type StandardSchemaDictionary<
  Input = Record<string, unknown>,
  Output extends Record<keyof Input, unknown> = Input,
> = {
  [K in keyof Input]-?: StandardSchemaV1<Input[K], Output[K]>;
};

export namespace StandardSchemaDictionary {
  export type InferInput<T extends StandardSchemaDictionary> = { // muraqib-ignore-dead: auto-suppressed by script for InferInput
    [K in keyof T]: StandardSchemaV1.InferInput<T[K]>;
  };
  export type InferOutput<T extends StandardSchemaDictionary> = { // muraqib-ignore-dead: auto-suppressed by script for InferOutput
    [K in keyof T]: StandardSchemaV1.InferOutput<T[K]>;
  };
}