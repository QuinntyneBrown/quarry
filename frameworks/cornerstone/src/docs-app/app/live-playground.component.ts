import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { componentRegistry } from '../generated/component-registry.constant';
import { ApiEntry } from './api-entry.interface';
import { PreviewHostDirective } from './preview-host.directive';
import { playgroundFixtures } from './playground-fixtures.constant';

@Component({
  selector: 'cs-docs-live-playground',
  imports: [PreviewHostDirective],
  templateUrl: './live-playground.component.html',
  styleUrl: './live-playground.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LivePlaygroundComponent {
  readonly entry = input.required<ApiEntry>();
  protected readonly view = signal<'preview' | 'source'>('preview');
  protected readonly sourceLanguage = signal<'html' | 'ts' | 'scss'>('html');
  protected readonly source = signal<
    { readonly ts: string; readonly html: string; readonly scss: string } | undefined
  >(undefined);
  protected readonly languages = ['html', 'ts', 'scss'] as const;
  protected readonly events = signal<string[]>([]);
  protected readonly values = signal<Record<string, unknown>>({});
  protected readonly renderError = signal('');
  protected readonly copyLabel = signal('Copy source');
  private readonly host = viewChild(PreviewHostDirective);
  private componentRef?: ComponentRef<unknown>;
  private initializedSlug = '';

  constructor() {
    effect(() => {
      const entry = this.entry();
      const host = this.host();
      if (!host || !entry.slug || this.initializedSlug === entry.slug) return;
      this.initializedSlug = entry.slug;
      this.values.set(this.initialValues(entry));
      queueMicrotask(() => this.render());
    });
  }

  protected inputMembers(): NonNullable<ApiEntry['members']> {
    return (this.entry().members ?? []).filter(
      (member) => member.role === 'input' || member.role === 'model',
    );
  }

  protected value(name: string): unknown {
    return this.values()[name];
  }

  protected jsonValue(name: string): string {
    return JSON.stringify(this.value(name), null, 2);
  }

  protected controlKind(
    member: NonNullable<ApiEntry['members']>[number],
  ): 'boolean' | 'number' | 'select' | 'json' | 'text' {
    if (member.type === 'boolean') return 'boolean';
    if (member.type === 'number') return 'number';
    if (this.options(member).length) return 'select';
    if (
      member.structured ||
      /\[\]|readonly |Record<|\{|View|Data|Config|State|Item|Entry|Option/.test(member.type)
    )
      return 'json';
    return 'text';
  }

  protected options(member: NonNullable<ApiEntry['members']>[number]): readonly string[] {
    return member.options?.length
      ? member.options
      : [...member.type.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
  }

  protected setBoolean(member: NonNullable<ApiEntry['members']>[number], event: Event): void {
    this.update(member, (event.target as HTMLInputElement).checked);
  }

  protected setNumber(member: NonNullable<ApiEntry['members']>[number], event: Event): void {
    this.update(member, Number((event.target as HTMLInputElement).value));
  }

  protected setText(member: NonNullable<ApiEntry['members']>[number], event: Event): void {
    this.update(member, (event.target as HTMLInputElement).value);
  }

  protected setJson(member: NonNullable<ApiEntry['members']>[number], event: Event): void {
    const control = event.target as HTMLTextAreaElement;
    try {
      this.update(member, JSON.parse(control.value));
      control.setCustomValidity('');
    } catch {
      control.setCustomValidity('Enter valid JSON.');
      control.reportValidity();
    }
  }

  protected reset(): void {
    this.values.set(this.initialValues(this.entry()));
    this.events.set([]);
    for (const member of this.inputMembers()) this.applyInput(member);
  }

  protected currentSource(): string {
    const source = this.source();
    return (
      source?.[this.sourceLanguage()] ||
      `No ${this.sourceLanguage().toUpperCase()} source file is required by this component.`
    );
  }

  protected async openSource(): Promise<void> {
    this.view.set('source');
    if (this.source() || !this.entry().slug) return;
    const response = await fetch(`/generated/sources/${this.entry().slug}.json`);
    if (response.ok)
      this.source.set((await response.json()) as { ts: string; html: string; scss: string });
  }

  protected async copySource(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.currentSource());
      this.copyLabel.set('Copied');
      setTimeout(() => this.copyLabel.set('Copy source'), 1600);
    } catch {
      this.copyLabel.set('Select and copy');
    }
  }

  private async render(): Promise<void> {
    const entry = this.entry();
    const host = this.host();
    const loader = entry.slug ? componentRegistry[entry.slug] : undefined;
    if (!host || !loader) return;
    this.renderError.set('');
    host.viewContainer.clear();
    try {
      const type = await loader();
      if (this.entry().slug !== entry.slug) return;
      const projected = document.createTextNode(`${entry.label ?? entry.name} interactive content`);
      this.componentRef = host.viewContainer.createComponent(type, {
        projectableNodes: [[projected]],
      });
      for (const member of this.inputMembers()) {
        this.componentRef.setInput(member.bindingName ?? member.name, this.value(member.name));
      }
      this.subscribeToOutputs();
      this.componentRef.changeDetectorRef.detectChanges();
    } catch (error) {
      this.renderError.set(
        error instanceof Error ? error.message : 'The preview could not be created.',
      );
    }
  }

  private update(member: NonNullable<ApiEntry['members']>[number], value: unknown): void {
    this.values.update((values) => ({ ...values, [member.name]: value }));
    this.applyInput(member);
  }

  private applyInput(member: NonNullable<ApiEntry['members']>[number]): void {
    this.componentRef?.setInput(member.bindingName ?? member.name, this.value(member.name));
    this.componentRef?.changeDetectorRef.detectChanges();
  }

  private subscribeToOutputs(): void {
    const instance = this.componentRef?.instance as Record<string, unknown> | undefined;
    if (!instance) return;
    for (const member of (this.entry().members ?? []).filter(
      (item) => item.role === 'output' || item.role === 'model',
    )) {
      const output = instance[member.name] as
        { subscribe?: (listener: (value: unknown) => void) => unknown } | undefined;
      output?.subscribe?.((value) => {
        if (this.entry().slug === 'review-dialog' && member.name === 'closed') {
          const open = this.inputMembers().find((input) => input.name === 'open');
          if (open) this.update(open, false);
        }
        const rendered = typeof value === 'string' ? value : JSON.stringify(value);
        this.events.update((events) =>
          [`${member.name}: ${rendered ?? String(value)}`, ...events].slice(0, 12),
        );
      });
    }
  }

  private initialValues(entry: ApiEntry): Record<string, unknown> {
    return Object.fromEntries(
      this.inputMembersFor(entry).map((member) => [member.name, this.initialValue(member)]),
    );
  }

  private inputMembersFor(entry: ApiEntry): NonNullable<ApiEntry['members']> {
    return (entry.members ?? []).filter(
      (member) => member.role === 'input' || member.role === 'model',
    );
  }

  private initialValue(member: NonNullable<ApiEntry['members']>[number]): unknown {
    const slug = this.entry().slug;
    const fixture = slug ? playgroundFixtures[slug]?.[member.name] : undefined;
    if (fixture !== undefined) return fixture;
    if (member.defaultValue !== undefined) {
      const raw = member.defaultValue;
      if (raw === 'true') return true;
      if (raw === 'false') return false;
      if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
      if (/^['"`]/.test(raw)) return raw.slice(1, -1);
      if (raw === '[]') return [];
      if (raw === '{}') return {};
    }
    const options = this.options(member);
    if (options.length) return options[0];
    if (member.type === 'boolean') return false;
    if (member.type === 'number') return 1;
    if (/Option/.test(member.type))
      return [
        { label: 'First option', value: 'first' },
        { label: 'Second option', value: 'second' },
      ];
    if (/\[\]|readonly /.test(member.type)) return [];
    if (/Record<|\{|View|Data|Config|State|Item|Entry/.test(member.type)) return {};
    return member.required ? 'Interactive example' : '';
  }
}
