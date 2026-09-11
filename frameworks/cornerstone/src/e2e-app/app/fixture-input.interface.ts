export interface FixtureInput {
  readonly type: string;
  readonly defaultValue?: string;
  readonly options?: readonly string[];
  readonly required?: boolean;
}
