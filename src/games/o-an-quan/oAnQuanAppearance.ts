import { readStorage, writeStorage } from '@/utils/storage';

export type OAnQuanThemeId = 'wood' | 'stone' | 'modern';

const STORAGE_KEY = 'cheslax.oanquan.appearance';

export const OAQ_THEMES: { id: OAnQuanThemeId; label: string; description: string }[] = [
  { id: 'wood', label: 'Gỗ truyền thống', description: 'Bàn gỗ, hố tối, sỏi dân và quan' },
  { id: 'stone', label: 'Đá tự nhiên', description: 'Mặt đá xám, hố đá sâu' },
  { id: 'modern', label: 'Tối giản hiện đại', description: 'Nền phẳng, hố teal, quân tương phản' },
];

export const DEFAULT_OAQ_THEME: OAnQuanThemeId = 'wood';

export function parseOAnQuanTheme(value: unknown): OAnQuanThemeId {
  if (typeof value === 'string' && OAQ_THEMES.some((theme) => theme.id === value)) {
    return value as OAnQuanThemeId;
  }
  if (value && typeof value === 'object' && 'theme' in value) {
    return parseOAnQuanTheme((value as { theme: unknown }).theme);
  }
  return DEFAULT_OAQ_THEME;
}

export function loadOAnQuanTheme(): OAnQuanThemeId {
  return parseOAnQuanTheme(readStorage<unknown>(STORAGE_KEY, null));
}

export function saveOAnQuanTheme(theme: OAnQuanThemeId): void {
  writeStorage(STORAGE_KEY, parseOAnQuanTheme(theme));
}
