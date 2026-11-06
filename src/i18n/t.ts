import { vi } from './vi';

type MessageNode = string | { readonly [key: string]: MessageNode };

const dictionaries: Record<string, MessageNode> = {
  vi,
};

let locale = 'vi';

export function getLocale(): string {
  return locale;
}

export function setLocale(next: string): void {
  locale = next in dictionaries ? next : 'vi';
}

export function t(key: string): string {
  const source = dictionaries[locale] ?? vi;
  const parts = key.split('.');
  let current: MessageNode = source;
  for (const part of parts) {
    if (typeof current === 'string' || !(part in current)) {
      return key;
    }
    current = current[part]!;
  }
  return typeof current === 'string' ? current : key;
}
