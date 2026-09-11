export interface ApiEntry {
  readonly name: string;
  readonly kind: string;
  readonly sourcePath: string;
  readonly category: string;
  readonly description: string;
  readonly declaration?: string;
  readonly members?: readonly {
    readonly name: string;
    readonly bindingName?: string;
    readonly role: 'input' | 'model' | 'output' | 'property' | 'method';
    readonly type: string;
    readonly required?: boolean;
    readonly defaultValue?: string;
    readonly description: string;
    readonly options?: readonly string[];
    readonly structured?: boolean;
    readonly parameters?: readonly {
      readonly name: string;
      readonly type: string;
      readonly optional: boolean;
    }[];
  }[];
  readonly component?: boolean;
  readonly selector?: string;
  readonly slug?: string;
  readonly label?: string;
  readonly tokens?: readonly string[];
  readonly relatedSymbols?: readonly string[];
  readonly relatedEntries?: readonly ApiEntry[];
}
