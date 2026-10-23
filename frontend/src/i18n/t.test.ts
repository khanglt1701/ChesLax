import { describe, expect, it } from 'vitest';
import { t } from './t';

describe('i18n', () => {
  it('resolves nested Vietnamese keys', () => {
    expect(t('brand.name')).toBe('Cheslax');
    expect(t('nav.login')).toBe('Đăng nhập');
    expect(t('auth.passwordHint')).toContain('8');
    expect(t('play.casualTag')).toContain('No Elo');
  });

  it('returns the key when missing so English can be added later', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
  });
});
