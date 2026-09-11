import { FixtureInput } from './fixture-input.interface';

export function initialFixtureValue(member: FixtureInput): unknown {
  const raw = member.defaultValue;
  if (raw !== undefined) {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
    if (/^['"`]/.test(raw)) return raw.slice(1, -1);
    if (raw === '[]') return [];
    if (raw === '{}') return {};
  }
  const options = member.options?.length
    ? member.options
    : [...member.type.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
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
  return member.required ? 'Fixture value' : '';
}
