import { type FormEvent, type ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { t } from '@/i18n/t';
import { ApiError } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!USERNAME_PATTERN.test(username.trim())) {
      setError(t('auth.usernameHint'));
      return;
    }
    if (!displayName.trim() || !email.trim() || password.length < 8) {
      setError(password.length < 8 ? t('auth.passwordHint') : t('auth.required'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register({
        username: username.trim(),
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });
      navigate('/profile', { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t('auth.genericError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-4xl">{t('auth.registerTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">{t('auth.registerSubtitle')}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-100" role="alert">
            {error}
          </p>
        ) : null}
        <Field label={t('auth.username')} hint={t('auth.usernameHint')}>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            className={inputClass}
          />
        </Field>
        <Field label={t('auth.displayName')}>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={inputClass} />
        </Field>
        <Field label={t('auth.email')}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className={inputClass}
          />
        </Field>
        <Field label={t('auth.password')} hint={t('auth.passwordHint')}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <Field label={t('auth.confirmPassword')}>
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {t('auth.submitRegister')}
        </Button>
      </form>
      <p className="text-sm text-stone-500">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-brand hover:underline">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  );
}

const inputClass =
  'mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none ring-brand focus:ring-2 dark:border-stone-600 dark:bg-stone-950';

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
      {hint ? <span className="mt-1 block text-xs font-normal text-stone-500">{hint}</span> : null}
    </label>
  );
}
